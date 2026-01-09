import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const organs = await prisma.group.findMany({
        where: { name: { contains: 'Commission' } },
        select: { uid: true, name: true }
    });
    console.table(organs);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
