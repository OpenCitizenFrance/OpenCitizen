import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const JSON_DIR = '/Users/test/Documents/json/dossierParlementaire';

interface DossierData {
    uid: string;
    titre: string;
    textes: string[];
}

// Extract all texteAssocie UIDs from a dossier object (recursive)
function extractTextesAssocies(obj: any): string[] {
    const textes: string[] = [];

    if (typeof obj !== 'object' || obj === null) return textes;

    if (Array.isArray(obj)) {
        for (const item of obj) {
            textes.push(...extractTextesAssocies(item));
        }
        return textes;
    }

    // Check for texteAssocie field
    if ('texteAssocie' in obj) {
        const ta = obj.texteAssocie;
        if (typeof ta === 'string') {
            // Only keep text types that can have amendments (PRJL, PION)
            if (ta.startsWith('PRJL') || ta.startsWith('PION')) {
                textes.push(ta);
            }
        } else if (ta && typeof ta === 'object' && 'refTexteAssocie' in ta) {
            const ref = ta.refTexteAssocie;
            if (typeof ref === 'string' && (ref.startsWith('PRJL') || ref.startsWith('PION'))) {
                textes.push(ref);
            }
        }
    }

    // Recurse into all values
    for (const value of Object.values(obj)) {
        textes.push(...extractTextesAssocies(value));
    }

    return textes;
}

// Parse a single dossier JSON file
function parseDossierFile(filePath: string): DossierData | null {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        const dp = data.dossierParlementaire;

        if (!dp || !dp.uid) return null;

        const uid = dp.uid;
        const titre = dp.titreDossier?.titre || 'Sans titre';
        const textes = [...new Set(extractTextesAssocies(dp))]; // Unique textes

        return { uid, titre, textes };
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('🔍 Building Text → Dossier mapping from JSON files...\n');

    // Get all L17 dossier files
    const files = fs.readdirSync(JSON_DIR)
        .filter(f => f.startsWith('DLR5L17N') && f.endsWith('.json'));

    console.log(`Found ${files.length} L17 dossier files to process.\n`);

    const mappings: { textUid: string; dossierId: string }[] = [];
    const dossierTitles: Map<string, string> = new Map();

    let processed = 0;
    let textCount = 0;

    for (const file of files) {
        const filePath = path.join(JSON_DIR, file);
        const dossier = parseDossierFile(filePath);

        if (dossier && dossier.textes.length > 0) {
            dossierTitles.set(dossier.uid, dossier.titre);

            for (const textUid of dossier.textes) {
                mappings.push({ textUid, dossierId: dossier.uid });
                textCount++;
            }
        }

        processed++;
        if (processed % 100 === 0) {
            console.log(`  Processed ${processed}/${files.length} files...`);
        }
    }

    console.log(`\n📊 Found ${textCount} text mappings across ${dossierTitles.size} dossiers.\n`);

    // First, ensure all dossiers exist in the database
    console.log('📝 Updating dossier titles...');
    let updated = 0;

    for (const [uid, title] of dossierTitles) {
        try {
            await prisma.legislativeDossier.upsert({
                where: { uid },
                update: { title },
                create: {
                    uid,
                    title,
                    type: uid.includes('PJL') ? 'PROJET_LOI' : 'PROPOSITION_LOI'
                }
            });
            updated++;
        } catch (e) {
            // Dossier might not exist, that's OK
        }
    }
    console.log(`  Updated ${updated} dossier titles.\n`);

    // Insert mappings in batches
    console.log('📝 Inserting text → dossier mappings...');

    let inserted = 0;
    let skipped = 0;

    for (const mapping of mappings) {
        try {
            // Check if dossier exists
            const dossier = await prisma.legislativeDossier.findUnique({
                where: { uid: mapping.dossierId }
            });

            if (dossier) {
                await prisma.textDossierMapping.upsert({
                    where: { textUid: mapping.textUid },
                    update: { dossierId: mapping.dossierId },
                    create: mapping
                });
                inserted++;
            } else {
                skipped++;
            }
        } catch (e) {
            skipped++;
        }

        if ((inserted + skipped) % 100 === 0) {
            console.log(`  Progress: ${inserted} inserted, ${skipped} skipped...`);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Inserted: ${inserted} mappings`);
    console.log(`⏭️  Skipped: ${skipped} (dossier not in DB)`);

    // Show sample
    console.log('\n📋 Sample mappings:');
    const samples = await prisma.textDossierMapping.findMany({
        take: 5,
        include: { dossier: { select: { title: true } } }
    });

    for (const s of samples) {
        console.log(`  ${s.textUid} → "${s.dossier.title.slice(0, 50)}..."`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
