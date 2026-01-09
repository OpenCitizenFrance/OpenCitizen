import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { finished } from 'stream/promises';
import { Readable } from 'stream';

const prisma = new PrismaClient();
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

const DOSSIERS_URL = 'http://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip';

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

function getText(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object' && val['#text']) return val['#text'].trim();
    return null;
}

async function main() {
    console.log('📥 Downloading legislative dossiers data...');
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    const zipPath = path.join(TEMP_DIR, 'dossiers.zip');
    await downloadFile(DOSSIERS_URL, zipPath);

    console.log('📦 Extracting dossier titles...');
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Build a map of UID -> title from the dossiers data
    const titleMap = new Map<string, string>();

    for (const entry of entries) {
        if (!entry.name.endsWith('.json')) continue;
        try {
            const data = JSON.parse(entry.getData().toString('utf8'));
            const dossier = data.dossierParlementaire || data.document?.dossierParlementaire;
            if (!dossier) continue;

            const uid = dossier.uid;
            const titreDossier = getText(dossier.titreDossier?.titre)
                || getText(dossier.titreDossier?.titreChemin)
                || getText(dossier.titre);

            if (uid && titreDossier) {
                titleMap.set(uid, titreDossier);
            }

            // Also check for text references (actesLegislatifs)
            const actes = dossier.actesLegislatifs?.acteLegislatif;
            if (actes) {
                const actesArray = Array.isArray(actes) ? actes : [actes];
                for (const acte of actesArray) {
                    const texteAssoc = acte.texteAssocie || acte.texteAdopte;
                    if (texteAssoc) {
                        const textUid = texteAssoc.refTexteLegislatif;
                        if (textUid && titreDossier) {
                            titleMap.set(textUid, titreDossier);
                        }
                    }
                }
            }
        } catch (e) { }
    }

    console.log(`📊 Found ${titleMap.size} dossier titles in source data.`);

    // Get all dossiers with "Inconnu" title
    const unknownDossiers = await prisma.legislativeDossier.findMany({
        where: { title: 'Inconnu' },
        select: { uid: true }
    });

    console.log(`📋 Found ${unknownDossiers.length} dossiers with "Inconnu" title.`);

    // Update titles
    let updated = 0;
    for (const dossier of unknownDossiers) {
        const title = titleMap.get(dossier.uid);
        if (title) {
            await prisma.legislativeDossier.update({
                where: { uid: dossier.uid },
                data: { title }
            });
            updated++;
            if (updated % 50 === 0) {
                console.log(`  Updated ${updated} dossiers...`);
            }
        }
    }

    console.log(`✅ Updated ${updated} dossiers with titles.`);

    // Check final state
    const stillUnknown = await prisma.legislativeDossier.count({ where: { title: 'Inconnu' } });
    const total = await prisma.legislativeDossier.count();
    console.log(`📈 Dossiers with known title: ${total - stillUnknown} / ${total}`);
}

main().finally(() => prisma.$disconnect());
