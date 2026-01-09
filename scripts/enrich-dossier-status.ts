import { PrismaClient, DossierStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const DOSSIERS_DIR = path.join(process.cwd(), 'Documents/json/dossierParlementaire');

interface ActeLegislatif {
    codeActe?: string;
    libelleActe?: {
        nomCanonique?: string;
    };
    dateActe?: string;
    actesLegislatifs?: {
        acteLegislatif?: ActeLegislatif | ActeLegislatif[];
    };
}

// Recursively extract all codeActe values from the dossier structure
function extractAllCodeActes(obj: any): string[] {
    const codes: string[] = [];

    function traverse(node: any) {
        if (!node || typeof node !== 'object') return;

        if (node.codeActe) {
            codes.push(node.codeActe);
        }

        // Traverse nested actesLegislatifs
        if (node.actesLegislatifs?.acteLegislatif) {
            const actes = node.actesLegislatifs.acteLegislatif;
            if (Array.isArray(actes)) {
                actes.forEach(traverse);
            } else {
                traverse(actes);
            }
        }

        // Also check direct acteLegislatif property
        if (node.acteLegislatif) {
            const actes = node.acteLegislatif;
            if (Array.isArray(actes)) {
                actes.forEach(traverse);
            } else {
                traverse(actes);
            }
        }
    }

    traverse(obj);
    return codes;
}

// Determine status based on the codes present
function determineStatus(codes: string[]): DossierStatus {
    // PROMULGUE: Law has been promulgated
    if (codes.includes('PROM-PUB') || codes.includes('PROM')) {
        return 'PROMULGUE';
    }

    // ADOPTE: Passed both chambers, awaiting promulgation
    // This is harder to detect without PROM, we'll leave as EN_COURS for now

    // REJETE: Would need to analyze votes/decision content
    // For now, we can't reliably detect this from codeActe alone

    // Default
    return 'EN_COURS';
}

async function main() {
    console.log('🔧 Enriching dossier statuses...\n');

    // Get all dossier JSON files for 17th legislature
    const files = fs.readdirSync(DOSSIERS_DIR)
        .filter(f => f.startsWith('DLR5L17') && f.endsWith('.json'));

    console.log(`Found ${files.length} dossier files to process.\n`);

    const statusCounts: Record<DossierStatus, number> = {
        EN_COURS: 0,
        ADOPTE: 0,
        REJETE: 0,
        PROMULGUE: 0,
        RETIRE: 0
    };

    let updated = 0;
    let skippedNotInDb = 0;
    let errors = 0;

    for (const file of files) {
        try {
            const filePath = path.join(DOSSIERS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            const dp = data.dossierParlementaire;

            const uid = dp.uid;

            // Extract all codeActe values
            const codes = extractAllCodeActes(dp);

            // Determine status
            const status = determineStatus(codes);
            statusCounts[status]++;

            // Check if dossier exists in database
            const existing = await prisma.legislativeDossier.findUnique({
                where: { uid },
                select: { uid: true, status: true }
            });

            if (!existing) {
                skippedNotInDb++;
                continue;
            }

            // Update only if status changed
            if (existing.status !== status) {
                await prisma.legislativeDossier.update({
                    where: { uid },
                    data: { status }
                });
                updated++;

                if (status === 'PROMULGUE') {
                    console.log(`  ✓ ${uid} → PROMULGUE`);
                }
            }

        } catch (e) {
            errors++;
            console.error(`Error processing ${file}:`, e);
        }
    }

    console.log('\n✅ Status enrichment complete!');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (not in DB): ${skippedNotInDb}`);
    console.log(`   Errors: ${errors}`);

    console.log('\n📊 Status distribution in JSON files:');
    for (const [status, count] of Object.entries(statusCounts)) {
        if (count > 0) {
            console.log(`   ${status}: ${count}`);
        }
    }

    // Show final DB stats
    const dbStats = await prisma.legislativeDossier.groupBy({
        by: ['status'],
        where: { uid: { startsWith: 'DLR5L17' } },
        _count: true
    });

    console.log('\n📊 Final DB status distribution (17th legislature):');
    for (const stat of dbStats) {
        console.log(`   ${stat.status}: ${stat._count}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
