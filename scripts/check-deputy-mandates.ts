import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const deputy = await prisma.deputy.findFirst({
        where: { lastName: 'Coquerel' },
        include: {
            mandates: {
                where: { endDate: null }
            }
        }
    });

    if (deputy) {
        console.log(`Deputy: ${deputy.firstName} ${deputy.lastName}`);
        console.table(deputy.mandates.map(m => ({
            uid: m.uid,
            organId: m.organId,
            groupId: m.groupId,
            startDate: m.startDate,
            endDate: m.endDate
        })));
    } else {
        console.log('Deputy not found');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
