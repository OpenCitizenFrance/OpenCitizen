import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const groups = await prisma.group.findMany({
        where: { type: 'COMPER' },
        select: { uid: true, acronym: true, name: true }
    });
    console.table(groups);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
