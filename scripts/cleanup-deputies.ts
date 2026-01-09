import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up deputies not active in 17th Legislature...');

    // 17th Leg start approx June/July 2024
    const DATE_CUTOFF = new Date('2024-06-01');

    const deputies = await prisma.deputy.findMany({
        include: { mandates: true }
    });

    console.log(`Found ${deputies.length} total deputies.`);

    if (deputies.length === 0) {
        console.log('No deputies found.');
        return;
    }

    const toDeleteIds: string[] = [];
    const keepIds: string[] = [];

    for (const d of deputies) {
        const is17th = d.mandates.some(m => m.startDate >= DATE_CUTOFF);
        if (!is17th) {
            toDeleteIds.push(d.uid);
        } else {
            keepIds.push(d.uid);
        }
    }

    console.log(`Identified ${toDeleteIds.length} deputies to delete.`);
    console.log(`Keeping ${keepIds.length} deputies.`);

    if (toDeleteIds.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < toDeleteIds.length; i += batchSize) {
            const batch = toDeleteIds.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(toDeleteIds.length / batchSize)}...`);

            // 1. Mandates
            await prisma.mandate.deleteMany({ where: { deputyId: { in: batch } } });

            // 2. Vote Details
            await prisma.voteDetail.deleteMany({ where: { deputyId: { in: batch } } });

            // 3. Comments
            // Check if comment exists in prisma model (it was in the list)
            if ((prisma as any).comment) {
                await prisma.comment.deleteMany({ where: { deputyId: { in: batch } } });
            }

            // 4. Cause Relations
            await prisma.causeDeputy.deleteMany({ where: { deputyId: { in: batch } } });

            // 5. Amendments & Cosignatories
            // Workaround for missing AmendmentCosigner model in client
            const idsList = batch.map(id => `'${id}'`).join(',');

            try {
                // Delete cosigners where deputy is the cosigner
                await prisma.$executeRawUnsafe(`DELETE FROM "AmendmentCosigner" WHERE "deputyId" IN (${idsList})`);
            } catch (e) {
                console.warn('Failed to delete AmendmentCosigner (deputy as cosigner):', e);
            }

            // Delete amendments authored by them
            // Find amendments first
            const amdts = await prisma.amendment.findMany({
                where: { authorId: { in: batch } },
                select: { uid: true }
            });

            if (amdts.length > 0) {
                const amdtIds = amdts.map(a => `'${a.uid}'`).join(',');

                // Delete cosigners for these amendments
                if (amdtIds.length > 0) {
                    try {
                        await prisma.$executeRawUnsafe(`DELETE FROM "AmendmentCosigner" WHERE "amendmentId" IN (${amdtIds})`);
                    } catch (e) {
                        console.warn('Failed to delete AmendmentCosigner (amendment targets):', e);
                    }
                }

                // Delete the amendments
                await prisma.amendment.deleteMany({ where: { uid: { in: amdts.map(a => a.uid) } } });
            }

            // 6. Deputies
            await prisma.deputy.deleteMany({
                where: { uid: { in: batch } }
            });
        }
        console.log('✅ Cleanup complete.');
    } else {
        console.log('✨ No deputies to delete.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
