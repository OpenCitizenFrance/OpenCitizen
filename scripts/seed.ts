import { PrismaClient, DossierType, DossierStatus } from '@prisma/client';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// URLs for the 17th Legislature
const URLS = {
    AMO: 'http://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip',
    SCRUTINS: 'http://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip',
    AMENDEMENTS: 'http://data.assemblee-nationale.fr/static/openData/repository/17/loi/amendements_div_legis/Amendements.json.zip'
};

const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

async function downloadFile(url: string, dest: string) {
    if (fs.existsSync(dest)) {
        console.log(`Using existing file ${dest}`);
        return;
    }
    console.log(`Downloading from ${url}...`);
    const res = await fetch(url);
    if (!res.body) throw new Error(`Failed to download ${url}`);
    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
}

function cleanHtml(html: string | null | undefined): string {
    if (!html) return "";
    let text = html.replace(/<[^>]*>/g, " ");
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
        try { return String.fromCharCode(parseInt(hex, 16)); } catch (e) { return ""; }
    });
    text = text.replace(/&#([0-9]+);/g, (_, dec) => {
        try { return String.fromCharCode(parseInt(dec, 10)); } catch (e) { return ""; }
    });
    const entities: Record<string, string> = {
        "&nbsp;": " ", "&#160;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
        "&quot;": '"', "&apos;": "'", "&laquo;": "«", "&raquo;": "»"
    };
    Object.entries(entities).forEach(([entity, char]) => { text = text.replaceAll(entity, char); });
    return text.replace(/\s+/g, " ").trim();
}

function getText(val: any): string | null {
    if (!val) return null;
    let text = "";
    if (typeof val === 'string') text = val;
    else if (typeof val === 'object') {
        if (val['#text']) text = val['#text'];
        else if (val.libelle) text = getText(val.libelle) || "";
        else text = JSON.stringify(val);
    } else {
        text = String(val);
    }
    return cleanHtml(text);
}

async function main() {
    console.log('🌱 Starting Optimized Seed...');
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    try {
        // 1. AMO
        console.log('⬇️ Processing AMO data...');
        const amoZipPath = path.join(TEMP_DIR, 'amo.zip');
        await downloadFile(URLS.AMO, amoZipPath);
        const amoZip = new AdmZip(amoZipPath);
        const amoEntries = amoZip.getEntries();

        const groups: any[] = [];
        const deputies: any[] = [];
        const mandates: any[] = [];

        console.log('📦 Collecting Groups...');
        for (const entry of amoEntries) {
            if (entry.entryName.includes('organe/PO') && entry.name.endsWith('.json')) {
                try {
                    const org = JSON.parse(entry.getData().toString('utf8')).organe;
                    // Ingest all organs, not just groups, to have their names available
                    if (['GP', 'COMPER'].includes(org.codeType)) {
                        groups.push({
                            uid: org.uid,
                            name: org.libelle,
                            acronym: org.libelleAbrege || null,
                            colorCode: org.couleurAssociee || null,
                            type: org.codeType === 'GP' ? 'GP' : 'COMPER'
                        });
                    }
                } catch (e) { }
            }
        }
        await prisma.group.createMany({ data: groups, skipDuplicates: true });

        console.log('📦 Collecting Deputies & Mandates...');
        for (const entry of amoEntries) {
            if (entry.entryName.includes('acteur/PA') && entry.name.endsWith('.json')) {
                try {
                    const actor = JSON.parse(entry.getData().toString('utf8')).acteur;
                    const uid = typeof actor.uid === 'object' ? actor.uid['#text'] : actor.uid;
                    if (!uid?.startsWith('PA')) continue;

                    const mandats = actor.mandats?.mandat;
                    const mandatArray = Array.isArray(mandats) ? mandats : (mandats ? [mandats] : []);
                    if (!mandatArray.some((m: any) => m.legislature === '17')) continue;

                    const identite = actor.etatCivil.ident || actor.etatCivil.identite;
                    const firstName = identite.prenom || '';
                    const lastName = identite.nom || '';
                    const slug = `${firstName}-${lastName}`.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '-' + uid;

                    // US-DB-001: Extract identity fields
                    const etatCivil = actor.etatCivil;
                    const civilite = etatCivil?.ident?.civ || etatCivil?.identite?.civ || null;
                    const dateNaissanceStr = etatCivil?.infoNaissance?.dateNais;
                    const dateNaissance = dateNaissanceStr ? new Date(dateNaissanceStr) : null;
                    const villeNaissance = getText(etatCivil?.infoNaissance?.villeNais) || null;

                    // Extract email from adresses
                    let email = null;
                    const adresses = actor.adresses?.adresse;
                    const adresseArray = Array.isArray(adresses) ? adresses : (adresses ? [adresses] : []);
                    for (const addr of adresseArray) {
                        if (addr.typeLibelle === 'Mél' || addr.type === 'Mél') {
                            const valElec = addr.valElec || addr.adresseElectronique;
                            if (valElec?.includes('@assemblee-nationale.fr')) {
                                email = valElec;
                                break;
                            } else if (!email && valElec) {
                                email = valElec;
                            }
                        }
                    }

                    let regionName = null;
                    let departmentName = null;
                    let departmentCode = null;
                    let circonscription = null;

                    for (const m of mandatArray) {
                        if (m.typeOrgane === 'ASSEMBLEE' && m.election?.lieu) {
                            const lieu = m.election.lieu;
                            regionName = getText(lieu.region);
                            departmentName = getText(lieu.departement);
                            departmentCode = getText(lieu.numDepartement || lieu.departementCode);
                            // Build circonscription label
                            const numCirco = getText(lieu.numCirco);
                            if (departmentName && numCirco) {
                                circonscription = `${departmentName} (${numCirco}${numCirco === '1' ? 'ère' : 'e'})`;
                            }
                        }

                        if (['GP', 'COMPER'].includes(m.typeOrgane)) {
                            const organId = m.organes?.organeRef || m.organeRef;
                            mandates.push({
                                uid: m.uid,
                                startDate: new Date(m.dateDebut),
                                endDate: m.dateFin ? new Date(m.dateFin) : null,
                                deputyId: uid,
                                groupId: m.typeOrgane === 'GP' ? organId : null,
                                organId
                            });
                        }
                    }

                    deputies.push({
                        uid,
                        firstName,
                        lastName,
                        slug,
                        imageUrl: `https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre/${uid.substring(2)}.jpg`,
                        // US-DB-001: Identity fields
                        civilite,
                        dateNaissance,
                        villeNaissance,
                        email,
                        // Geographic fields
                        regionName,
                        departmentName,
                        departmentCode,
                        circonscription
                    });
                } catch (e) { }
            }
        }
        const deputyUids = new Set(deputies.map(d => d.uid));
        await prisma.deputy.createMany({ data: deputies, skipDuplicates: true });
        await prisma.mandate.createMany({ data: mandates, skipDuplicates: true });
        console.log(`✅ Processed ${deputies.length} deputies.`);

        // 2. Scrutins
        console.log('⬇️ Processing Scrutins data...');
        const votesZipPath = path.join(TEMP_DIR, 'scrutins.zip');
        await downloadFile(URLS.SCRUTINS, votesZipPath);
        const votesZip = new AdmZip(votesZipPath);
        const voteEntries = votesZip.getEntries();
        const votes: any[] = [];
        for (const entry of voteEntries) {
            if (entry.name.endsWith('.json')) {
                try {
                    const s = JSON.parse(entry.getData().toString('utf8')).scrutin;
                    votes.push({
                        uid: s.uid,
                        date: new Date(s.dateScrutin),
                        title: s.titre,
                        voteType: s.typeVote.codeTypeVote,
                        result: s.sort.code,
                        totalPour: parseInt(s.syntheseVote.decompte.pour),
                        totalContre: parseInt(s.syntheseVote.decompte.contre),
                        totalAbst: parseInt(s.syntheseVote.decompte.abstentions)
                    });
                } catch (e) { }
            }
        }
        await prisma.vote.createMany({ data: votes, skipDuplicates: true });
        console.log(`✅ Processed ${votes.length} votes.`);

        // 3. Amendments
        console.log('⬇️ Processing Amendments data...');
        const amdtZipPath = path.join(TEMP_DIR, 'amendements.zip');
        await downloadFile(URLS.AMENDEMENTS, amdtZipPath);
        const amdtZip = new AdmZip(amdtZipPath);
        const amdtEntries = amdtZip.getEntries();
        console.log(`Found ${amdtEntries.length} entries in Amendments zip.`);

        const dossierMap = new Map<string, any>();
        const amendments: any[] = [];
        const BATCH_SIZE = 100;

        for (let i = 0; i < amdtEntries.length; i++) {
            const entry = amdtEntries[i];
            if (!entry.name.endsWith('.json')) continue;
            try {
                const a = JSON.parse(entry.getData().toString('utf8')).amendement;
                if (!a?.uid) continue;

                let authorId = a.signataires?.auteur?.acteurRef;
                if (!authorId) {
                    const cos = a.signataires?.cosignataires?.acteurRef;
                    authorId = Array.isArray(cos) ? cos[0] : cos;
                }
                if (!authorId?.startsWith('PA') || !deputyUids.has(authorId)) continue;

                const lawId = typeof a.texteLegislatifRef === 'string' ? a.texteLegislatifRef : a.texteLegislatifRef?.uid;
                if (!lawId) continue;

                if (!dossierMap.has(lawId)) {
                    dossierMap.set(lawId, { uid: lawId, title: a.texteLegislatifRef?.titre || "Inconnu", status: 'EN_COURS' });
                }

                amendments.push({
                    uid: a.uid,
                    content: getText(a.corps?.contenuAuteur?.dispositif) || "Pas de contenu",
                    expose: getText(a.corps?.contenuAuteur?.exposeSommaire),
                    status: getText(a.cycleDeVie?.sort || a.sort?.sortEnSeance) || 'En traitement',
                    lawId: lawId,
                    authorId: authorId
                });

                if (amendments.length >= BATCH_SIZE) {
                    try {
                        // Upsert dossiers first
                        for (const d of dossierMap.values()) {
                            await prisma.legislativeDossier.upsert({ where: { uid: d.uid }, update: {}, create: d });
                        }
                        dossierMap.clear();

                        const res = await prisma.amendment.createMany({ data: amendments, skipDuplicates: true });
                        console.log(`\nInserted ${res.count} amendments (Batch at ${i + 1})`);
                        amendments.length = 0;
                    } catch (e: any) {
                        console.error(`\n❌ Batch failed: ${e.message}`);
                        amendments.length = 0;
                    }
                }
            } catch (e) { }
        }

        // Final batch
        if (dossierMap.size > 0) {
            for (const d of dossierMap.values()) {
                await prisma.legislativeDossier.upsert({ where: { uid: d.uid }, update: {}, create: d });
            }
        }
        if (amendments.length > 0) {
            await prisma.amendment.createMany({ data: amendments, skipDuplicates: true });
        }
        console.log('\n✅ All amendments processed.');

    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await prisma.$disconnect();
        console.log('🏁 Seed completed.');
    }
}

main();
