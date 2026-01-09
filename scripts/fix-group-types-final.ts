import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Fixing group types based on active mandates...');

    // 1. Groups (GP)
    const activeGroups = await prisma.mandate.findMany({
        where: { endDate: null, groupId: { not: null } },
        select: { groupId: true }
    });
    const groupIds = [...new Set(activeGroups.map(m => m.groupId as string))];

    await prisma.group.updateMany({
        where: { uid: { in: groupIds } },
        data: { type: 'GP' }
    });
    console.log(`Updated ${groupIds.length} political groups to type GP.`);

    // 2. Commissions (COMPER)
    // In our seed, organId was used for commissions
    const activeCommissions = await prisma.mandate.findMany({
        where: { endDate: null, organId: { not: null, startsWith: 'PO' } },
        select: { organId: true }
    });
    // Filter out political groups from organIds
    const commissionIds = [...new Set(activeCommissions.map(m => m.organId as string))]
        .filter(id => !groupIds.includes(id));

    // We only want the 8 permanent commissions. They usually have shorter names or specific UIDs.
    // Actually, any active organ that is not a group can be shown if it's a commission.

    await prisma.group.updateMany({
        where: { uid: { in: commissionIds } },
        data: { type: 'COMPER' }
    });
    console.log(`Updated ${commissionIds.length} organs to type COMPER.`);

    // 3. Cleanup specific names if needed (e.g. to avoid constituencies if they were in organId)
    // constituencies usually have "circonscription" in the name
    await prisma.group.updateMany({
        where: { name: { contains: 'circonscription' } },
        data: { type: 'AUTRE' }
    });

    console.log('✅ Final refinement completed.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
