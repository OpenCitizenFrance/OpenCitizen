import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

async function main() {
    console.log('🔍 Investigating UID formats...');

    // Get sample UIDs from database
    const dbDossiers = await prisma.legislativeDossier.findMany({
        where: { title: 'Inconnu' },
        take: 5,
        select: { uid: true }
    });
    console.log('Database UIDs (Inconnu):', dbDossiers.map(d => d.uid));

    // Check source data UIDs
    const zipPath = path.join(TEMP_DIR, 'dossiers.zip');
    if (!fs.existsSync(zipPath)) {
        console.log('Dossiers zip not found');
        return;
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const sampleUids: string[] = [];
    let count = 0;

    for (const entry of entries) {
        if (!entry.name.endsWith('.json') || count >= 10) continue;
        try {
            const data = JSON.parse(entry.getData().toString('utf8'));
            const dossier = data.dossierParlementaire || data.document?.dossierParlementaire;
            if (dossier?.uid) {
                sampleUids.push(dossier.uid);
                count++;
            }
        } catch (e) { }
    }

    console.log('Source data UIDs:', sampleUids);

    // Check amendments data for the texteLegislatifRef format
    const amoPath = path.join(TEMP_DIR, 'amendements.zip');
    if (fs.existsSync(amoPath)) {
        const amoZip = new AdmZip(amoPath);
        const amoEntries = amoZip.getEntries();

        const textRefSamples: any[] = [];
        let amoCount = 0;

        for (const entry of amoEntries) {
            if (!entry.name.endsWith('.json') || amoCount >= 5) continue;
            try {
                const data = JSON.parse(entry.getData().toString('utf8'));
                const a = data.amendement;
                if (a?.texteLegislatifRef) {
                    textRefSamples.push({
                        uid: typeof a.texteLegislatifRef === 'string' ? a.texteLegislatifRef : a.texteLegislatifRef,
                        titre: a.texteLegislatifRef?.titre
                    });
                    amoCount++;
                }
            } catch (e) { }
        }

        console.log('Amendment texteLegislatifRef samples:', textRefSamples);
    }
}

main().finally(() => prisma.$disconnect());
