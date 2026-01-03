import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// URLs for the 17th Legislature (hardcoded as per spec)
const URLS = {
    AMO: 'http://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip',
    SCRUTINS: 'http://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip',
    AMENDEMENTS: 'http://data.assemblee-nationale.fr/static/openData/repository/17/loi/amendements_div_legis/Amendements.json.zip'
};

const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

async function downloadFile(url: string, dest: string) {
    const res = await fetch(url);
    if (!res.body) throw new Error(`Failed to download ${url}`);

    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
}

async function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR);
    }
}

async function cleanTempDir() {
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
}

async function main() {
    console.log('🌱 Starting seed...');
    await ensureTempDir();

    try {
        // 1. Process AMO (Acteurs, Mandats, Organes)
        console.log('⬇️ Downloading AMO data...');
        const amoZipPath = path.join(TEMP_DIR, 'amo.zip');
        await downloadFile(URLS.AMO, amoZipPath);

        const amoZip = new AdmZip(amoZipPath);
        const amoEntries = amoZip.getEntries();
        console.log(`Found ${amoEntries.length} entries in AMO zip.`);
        if (amoEntries.length > 0) {
            console.log('Sample entries:', amoEntries.slice(0, 5).map(e => e.entryName));
        }

        console.log('📦 Processing Organs...');
        // Finding Organes file
        // The structure inside zip is complex, usually hierarchical. We iterate all entries.
        for (const entry of amoEntries) {
            if (entry.entryName.includes('organe/PO') && entry.name.endsWith('.json')) {
                const content = JSON.parse(entry.getData().toString('utf8'));
                const org = content.organe;

                // We focus on Groups (GP) and Commissions (COMPER) mainly, but let's ingest Groups first
                if (org.codeType === 'GP') {
                    await prisma.group.upsert({
                        where: { uid: org.uid },
                        update: {
                            name: org.libelle,
                            acronym: org.libelleAbrege,
                            colorCode: org.couleurAssociee
                        },
                        create: {
                            uid: org.uid,
                            name: org.libelle,
                            acronym: org.libelleAbrege,
                            colorCode: org.couleurAssociee
                        }
                    });
                }
            }
        }

        console.log('📦 Processing Actors & Mandates...');
        let deputyCount = 0;
        for (const entry of amoEntries) {
            if (entry.entryName.includes('json/acteur/PA') && entry.name.endsWith('.json')) {
                try {
                    const content = JSON.parse(entry.getData().toString('utf8'));
                    const actor = content.acteur;

                    // Handle different UID formats
                    const uid = typeof actor.uid === 'object' ? actor.uid['#text'] : actor.uid;
                    if (!uid || !uid.startsWith('PA')) continue;

                    const etatCivil = actor.etatCivil;
                    if (!etatCivil) continue;

                    // Try both 'ident' and 'identite' paths
                    const identite = etatCivil.ident || etatCivil.identite;
                    if (!identite) continue;

                    const firstName = identite.prenom || '';
                    const lastName = identite.nom || '';

                    if (!firstName || !lastName) continue;

                    const slug = `${firstName}-${lastName}`.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

                    await prisma.deputy.upsert({
                        where: { uid: uid },
                        update: { firstName, lastName },
                        create: {
                            uid,
                            firstName,
                            lastName,
                            slug: slug + '-' + uid
                        }
                    });
                    deputyCount++;

                    // Process Mandates
                    const mandats = actor.mandats?.mandat;
                    if (mandats) {
                        const mandatArray = Array.isArray(mandats) ? mandats : [mandats];
                        for (const m of mandatArray) {
                            if (m.typeOrgane === 'GP' || m.typeOrgane === 'COMPER') {
                                try {
                                    const organId = m.organes?.organeRef || m.organeRef;
                                    if (!organId) continue;

                                    const startDate = new Date(m.dateDebut);
                                    const endDate = m.dateFin ? new Date(m.dateFin) : null;

                                    await prisma.mandate.upsert({
                                        where: { uid: m.uid },
                                        update: {},
                                        create: {
                                            uid: m.uid,
                                            startDate,
                                            endDate,
                                            deputyId: uid,
                                            groupId: m.typeOrgane === 'GP' ? organId : null,
                                            organId: organId
                                        }
                                    });
                                } catch (e) { /* skip */ }
                            }
                        }
                    }
                } catch (e) { /* skip malformed */ }
            }
        }
        console.log(`✅ Processed ${deputyCount} deputies.`);

        // 2. Process Scrutins (Votes)
        console.log('⬇️ Downloading Scrutins data...');
        const votesZipPath = path.join(TEMP_DIR, 'scrutins.zip');
        await downloadFile(URLS.SCRUTINS, votesZipPath);

        const votesZip = new AdmZip(votesZipPath);
        const voteEntries = votesZip.getEntries();

        console.log('🗳️ Processing Votes...');
        let voteCount = 0;
        for (const entry of voteEntries) {
            if (entry.name.endsWith('.json')) {
                const content = JSON.parse(entry.getData().toString('utf8'));
                const s = content.scrutin;

                // Upsert Vote
                await prisma.vote.upsert({
                    where: { uid: s.uid },
                    update: {},
                    create: {
                        uid: s.uid,
                        date: new Date(s.dateScrutin),
                        title: s.titre,
                        voteType: s.typeVote.codeTypeVote,
                        result: s.sort.code,
                        totalPour: parseInt(s.syntheseVote.decompte.pour),
                        totalContre: parseInt(s.syntheseVote.decompte.contre),
                        totalAbst: parseInt(s.syntheseVote.decompte.abstentions)
                    }
                });

                // Process Details (Ventilation)
                // ventilationVotes -> organe -> groupe -> vote -> decompteVoix
                // This structure can be nested or arrays.

                const ventilation = s.ventilationVotes?.organe;
                if (ventilation) {
                    const groupes = ventilation.groupes?.groupe;
                    if (groupes) {
                        const groupeArray = Array.isArray(groupes) ? groupes : [groupes];

                        for (const g of groupeArray) {
                            const voteBlock = g.vote.decompteVoix;

                            // Helper to process position block
                            const processPosition = async (block: any, position: 'POUR' | 'CONTRE' | 'ABSTENTION' | 'NON_VOTANT') => {
                                if (!block) return;
                                const voteurs = block.votant;
                                if (!voteurs) return;

                                const voteurArray = Array.isArray(voteurs) ? voteurs : [voteurs];
                                for (const v of voteurArray) {
                                    const deputyRef = v.acteurRef;
                                    // Upsert VoteDetail
                                    // We need to make sure deputy exists, but we seeded them.
                                    // Use createMany or individual upserts. 
                                    // Individual for safety now.

                                    try {
                                        await prisma.voteDetail.create({
                                            data: {
                                                voteId: s.uid,
                                                deputyId: deputyRef,
                                                position: position
                                            }
                                        });
                                    } catch (e) {
                                        // Ignore unique constraint violation if re-running
                                    }
                                }
                            };

                            await processPosition(voteBlock.pour, 'POUR');
                            await processPosition(voteBlock.contre, 'CONTRE');
                            await processPosition(voteBlock.abstentions, 'ABSTENTION');
                            await processPosition(voteBlock.nonVotants, 'NON_VOTANT');
                        }
                    }
                }
                voteCount++;
                if (voteCount % 10 === 0) console.log(`Processed ${voteCount} votes...`);
            }
        }

    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await prisma.$disconnect();
        await cleanTempDir();
        console.log('🏁 Seed completed.');
    }
}

main();
