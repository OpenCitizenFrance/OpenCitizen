import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const AMO_URL = 'http://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip';
const TEMP_DIR = path.join(process.cwd(), 'temp_seed_fast');

async function downloadFile(url: string, dest: string) {
    const res = await fetch(url);
    if (!res.body) throw new Error(`Failed to download ${url}`);
    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
}

async function main() {
    console.log('🚀 Starting Fast Seed (Active Only)...');
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

    try {
        console.log('⬇️ Downloading AMO data...');
        const zipPath = path.join(TEMP_DIR, 'amo.zip');
        await downloadFile(AMO_URL, zipPath);

        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries();
        console.log(`Found ${entries.length} entries.`);

        const groups = new Map<string, any>();
        const deputies = new Map<string, any>();
        const mandates: any[] = [];

        console.log('📂 Parsing files...');

        // Pass 1: Collect Groups
        for (const entry of entries) {
            if (entry.entryName.includes('organe/PO') && entry.name.endsWith('.json')) {
                try {
                    const content = JSON.parse(entry.getData().toString('utf8'));
                    const org = content.organe;
                    if (org.codeType === 'GP') {
                        groups.set(org.uid, {
                            uid: org.uid,
                            name: org.libelle,
                            acronym: org.libelleAbrege,
                            colorCode: org.couleurAssociee
                        });
                    }
                } catch (e) { }
            }
        }
        console.log(`ℹ️ Identified ${groups.size} groups.`);

        // Pass 2: Collect Active Deputies & Mandates
        for (const entry of entries) {
            if (entry.entryName.includes('acteur/PA') && entry.name.endsWith('.json')) {
                try {
                    const content = JSON.parse(entry.getData().toString('utf8'));
                    const actor = content.acteur;
                    const uid = actor.uid?.['#text'] || actor.uid;
                    if (!uid) continue;

                    const mList = actor.mandats?.mandat;
                    if (!mList) continue;
                    const mArray = Array.isArray(mList) ? mList : [mList];

                    // Filter for active mandates or mandates in 17th legislature (implied by latest data often, but dateFin null is safer for 'current')
                    // We specifically want 'GP' mandates that are active.
                    // Also want the 'Mandat Parlementaire' to show they are a deputy.

                    const activeMandates = mArray.filter((m: any) => !m.dateFin);

                    if (activeMandates.length > 0) {
                        // This actor is active!
                        const ident = actor.etatCivil?.ident || actor.etatCivil?.identite;
                        if (!ident) continue;

                        const firstName = ident.prenom || 'Inconnu';
                        const lastName = ident.nom || 'Inconnu';
                        const slug = `${firstName}-${lastName}`.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '-' + uid;

                        deputies.set(uid, {
                            uid,
                            firstName,
                            lastName,
                            slug,
                            imageUrl: `https://www.assemblee-nationale.fr/dyn/deputes/${uid}/image`
                        });

                        // Add their active mandates
                        for (const m of activeMandates) {
                            // Only care about GP or COMPER or PAR
                            if (['GP', 'COMPER', 'PAR'].includes(m.typeOrgane)) {
                                const organId = m.organes?.organeRef || m.organeRef;
                                mandates.push({
                                    uid: m.uid,
                                    startDate: new Date(m.dateDebut),
                                    endDate: null,
                                    deputyId: uid,
                                    organId: organId,
                                    // Pre-calculate groupId if possible
                                    groupId: (m.typeOrgane === 'GP' && groups.has(organId)) ? organId : null
                                });
                            }
                        }
                    }
                } catch (e) { }
            }
        }
        console.log(`ℹ️ Identified ${deputies.size} active deputies and ${mandates.length} active mandates.`);

        // DB Operations
        console.log('💾 Writing to Database...');

        // 1. Groups
        console.log(`- Upserting ${groups.size} groups...`);
        for (const g of groups.values()) {
            await prisma.group.upsert({
                where: { uid: g.uid },
                update: g,
                create: g
            });
        }

        // 2. Deputies (Batch createMany)
        console.log(`- Creating ${deputies.size} deputies...`);
        // chunking
        const deputyValues = Array.from(deputies.values());
        const CHUNK_SIZE = 100;
        for (let i = 0; i < deputyValues.length; i += CHUNK_SIZE) {
            const chunk = deputyValues.slice(i, i + CHUNK_SIZE);
            await prisma.deputy.createMany({
                data: chunk,
                skipDuplicates: true
            });
        }

        // 3. Mandates (Batch createMany)
        console.log(`- Creating ${mandates.length} mandates...`);
        for (let i = 0; i < mandates.length; i += CHUNK_SIZE) {
            const chunk = mandates.slice(i, i + CHUNK_SIZE);
            await prisma.mandate.createMany({
                data: chunk,
                skipDuplicates: true
            });
        }

        // 4. Update relations just in case (though we pre-calc groupId)
        // With createMany, we already set groupId if valid.

        console.log('✅ Fast seed completed!');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
}

main();
