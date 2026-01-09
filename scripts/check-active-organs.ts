import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const activeMandates = await prisma.mandate.findMany({
        where: { endDate: null, organId: { not: null, startsWith: 'PO' } },
        select: { organId: true }
    });
    const uniqueOrganIds = [...new Set(activeMandates.map(m => m.organId as string))];

    const organs = await prisma.group.findMany({
        where: { uid: { in: uniqueOrganIds } },
        select: { uid: true, acronym: true, name: true, type: true }
    });

    console.log('Active Organs (from mandates):');
    console.table(organs);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
