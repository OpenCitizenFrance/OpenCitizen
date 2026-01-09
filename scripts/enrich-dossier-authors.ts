import { PrismaClient, DossierType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const DOSSIERS_DIR = path.join(process.cwd(), 'Documents/json/dossierParlementaire');

interface DossierJson {
    dossierParlementaire: {
        uid: string;
        procedureParlementaire?: {
            code?: string;
            libelle?: string;
        };
        initiateur?: {
            acteurs?: {
                acteur?: { acteurRef?: string; mandatRef?: string } | Array<{ acteurRef?: string; mandatRef?: string }>;
            };
            organes?: {
                organe?: {
                    organeRef?: { uid: string } | string;
                };
            };
        };
    };
}

// Extract the first author ID from initiateur structure
function extractAuthorId(initiateur: DossierJson['dossierParlementaire']['initiateur']): string | null {
    if (!initiateur?.acteurs?.acteur) return null;

    const acteur = initiateur.acteurs.acteur;

    // Handle array case (multiple authors)
    if (Array.isArray(acteur)) {
        // Take the first author
        return acteur[0]?.acteurRef || null;
    }

    // Handle single object case
    return acteur.acteurRef || null;
}

// Determine if it's a government bill (projet de loi) vs proposition de loi
function mapDossierType(procedure: DossierJson['dossierParlementaire']['procedureParlementaire']): DossierType {
    const libelle = procedure?.libelle?.toLowerCase() || '';

    if (libelle.includes('projet de loi de finances')) return 'PROJET_LOI_FIN';
    if (libelle.includes('projet de loi organique')) return 'PROJET_LOI_ORG';
    if (libelle.includes('projet de loi')) return 'PROJET_LOI';

    // Default is proposition de loi (from deputies)
    return 'PROPOSITION_LOI';
}

async function main() {
    console.log('🔧 Enriching dossiers with author data...\n');

    // Get all dossier JSON files
    const files = fs.readdirSync(DOSSIERS_DIR)
        .filter(f => f.startsWith('DLR5L17') && f.endsWith('.json'));

    console.log(`Found ${files.length} dossier files to process.\n`);

    let updated = 0;
    let skippedNoAuthor = 0;
    let skippedNotInDb = 0;
    let skippedDeputyNotFound = 0;
    let errors = 0;

    for (const file of files) {
        try {
            const filePath = path.join(DOSSIERS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const data: DossierJson = JSON.parse(content);
            const dp = data.dossierParlementaire;

            const uid = dp.uid;
            const authorId = extractAuthorId(dp.initiateur);
            const type = mapDossierType(dp.procedureParlementaire);

            if (!authorId) {
                skippedNoAuthor++;
                continue;
            }

            // Check if dossier exists in database
            const existing = await prisma.legislativeDossier.findUnique({
                where: { uid },
                select: { uid: true, authorId: true }
            });

            if (!existing) {
                skippedNotInDb++;
                continue;
            }

            // Check if author (deputy) exists in database
            const deputy = await prisma.deputy.findUnique({
                where: { uid: authorId },
                select: { uid: true, firstName: true, lastName: true }
            });

            if (!deputy) {
                skippedDeputyNotFound++;
                if (skippedDeputyNotFound <= 5) {
                    console.log(`  Deputy not found: ${authorId} for dossier ${uid}`);
                }
                continue;
            }

            // Update the dossier with author and correct type
            await prisma.legislativeDossier.update({
                where: { uid },
                data: {
                    authorId: authorId,
                    type: type
                }
            });

            updated++;

            if (updated % 50 === 0) {
                console.log(`  Updated ${updated} dossiers...`);
            }

        } catch (e) {
            errors++;
            console.error(`Error processing ${file}:`, e);
        }
    }

    console.log('\n✅ Enrichment complete!');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (no author in JSON): ${skippedNoAuthor}`);
    console.log(`   Skipped (dossier not in DB): ${skippedNotInDb}`);
    console.log(`   Skipped (deputy not found): ${skippedDeputyNotFound}`);
    console.log(`   Errors: ${errors}`);

    // Show some stats
    const withAuthors = await prisma.legislativeDossier.count({
        where: {
            uid: { startsWith: 'DLR5L17' },
            authorId: { not: null }
        }
    });

    const total = await prisma.legislativeDossier.count({
        where: { uid: { startsWith: 'DLR5L17' } }
    });

    console.log(`\n📊 Final stats: ${withAuthors}/${total} dossiers now have authors.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
