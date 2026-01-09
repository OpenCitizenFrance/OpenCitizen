import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const comper = await prisma.group.findMany({
        where: { type: 'COMPER' },
        include: {
            _count: {
                select: { mandates: { where: { endDate: null } } }
            }
        }
    });
    console.log('COMPER Organs in DB:');
    console.table(comper.map(c => ({
        uid: c.uid,
        name: c.name,
        activeMandates: c._count.mandates
    })));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
