import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma query...');
    try {
        const deputy = await prisma.deputy.findFirst({
            include: {
                _count: {
                    select: {
                        mandates: true,
                        amendments: true,
                        authoredDossiers: true
                    }
                }
            }
        });
        console.log('Query successful!');
        console.log('Deputy:', deputy?.lastName);
        console.log('Counts:', deputy?._count);
    } catch (error) {
        console.error('Query failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
