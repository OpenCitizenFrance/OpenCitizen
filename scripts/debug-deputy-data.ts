import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Groups ---');
    const groups = await prisma.group.findMany({
        take: 20,
        select: { uid: true, name: true, acronym: true }
    });
    console.table(groups);

    console.log('\n--- Sample Mandates for a Deputy ---');
    // Let's pick a deputy
    const deputy = await prisma.deputy.findFirst({
        include: {
            mandates: {
                include: { group: true }
            }
        }
    });
    if (deputy) {
        console.log(`Deputy: ${deputy.firstName} ${deputy.lastName} (${deputy.uid})`);
        console.table(deputy.mandates.map(m => ({
            uid: m.uid,
            groupId: m.groupId,
            groupAcronym: m.group?.acronym,
            organId: m.organId,
            startDate: m.startDate,
            endDate: m.endDate
        })));
    }

    console.log('\n--- Any non-group organs in Mandates? ---');
    const organMandates = await prisma.mandate.findMany({
        where: { organId: { not: null } },
        take: 10,
        select: { organId: true }
    });
    console.table(organMandates);

    console.log('\n--- Count by OrganId? ---');
    const organCounts = await prisma.mandate.groupBy({
        by: ['organId'],
        where: { organId: { not: null } },
        _count: { organId: true },
        orderBy: { _count: { organId: 'desc' } },
        take: 10
    });
    console.table(organCounts);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
