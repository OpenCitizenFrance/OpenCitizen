import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const total = await prisma.legislativeDossier.count();
    const withTitle = await prisma.legislativeDossier.count({ where: { title: { not: 'Inconnu' } } });
    console.log(`Dossiers: ${withTitle} with title / ${total} total`);

    const samples = await prisma.legislativeDossier.findMany({
        take: 5,
        select: { uid: true, title: true }
    });
    console.log('Sample dossiers:', samples);
}
main().finally(() => prisma.$disconnect());
