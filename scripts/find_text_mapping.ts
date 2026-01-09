import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

function getText(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object' && val['#text']) return val['#text'].trim();
    return null;
}

async function main() {
    console.log('🔍 Building text reference to title map...');

    const zipPath = path.join(TEMP_DIR, 'dossiers.zip');
    if (!fs.existsSync(zipPath)) {
        console.log('Dossiers zip not found');
        return;
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Map: text UID -> { dossierTitle, dossierUid }
    const textToTitle = new Map<string, { title: string, dossierUid: string }>();

    for (const entry of entries) {
        if (!entry.name.endsWith('.json')) continue;
        try {
            const data = JSON.parse(entry.getData().toString('utf8'));
            const dossier = data.dossierParlementaire || data.document?.dossierParlementaire;
            if (!dossier) continue;

            const dossierUid = dossier.uid;
            const titreDossier = getText(dossier.titreDossier?.titre)
                || getText(dossier.titreDossier?.titreChemin)
                || getText(dossier.titre);

            if (!titreDossier) continue;

            // Find all text references in the dossier
            const actes = dossier.actesLegislatifs?.acteLegislatif;
            if (actes) {
                const actesArray = Array.isArray(actes) ? actes : [actes];
                for (const acte of actesArray) {
                    // Check various text reference fields
                    const refs = [
                        acte.texteAssocie?.refTexteLegislatif,
                        acte.texteAdopte?.refTexteLegislatif,
                        acte.texteDeLaLoi?.refTexteLegislatif,
                        acte.texteEtude?.refTexteLegislatif
                    ].filter(Boolean);

                    for (const ref of refs) {
                        if (ref && typeof ref === 'string') {
                            textToTitle.set(ref, { title: titreDossier, dossierUid });
                        }
                    }
                }
            }
        } catch (e) { }
    }

    console.log(`📊 Found ${textToTitle.size} text references with titles.`);

    // Sample of what we found
    const samples = Array.from(textToTitle.entries()).slice(0, 5);
    console.log('Sample text refs:', samples);

    // Check if any match PIONANR pattern
    const pionanrMatches = Array.from(textToTitle.keys()).filter(k => k.startsWith('PIONANR'));
    console.log(`PIONANR matches: ${pionanrMatches.length}`);
    if (pionanrMatches.length > 0) {
        console.log('PIONANR samples:', pionanrMatches.slice(0, 5));
    }

    // Get our unknown UIDs and try to match
    const unknownDossiers = await prisma.legislativeDossier.findMany({
        where: { title: 'Inconnu' },
        select: { uid: true },
        take: 20
    });

    console.log('\nTrying to match database UIDs:');
    for (const d of unknownDossiers) {
        const match = textToTitle.get(d.uid);
        if (match) {
            console.log(`  ✅ ${d.uid} -> ${match.title.slice(0, 50)}...`);
        } else {
            console.log(`  ❌ ${d.uid} - no match`);
        }
    }
}

main().finally(() => prisma.$disconnect());
