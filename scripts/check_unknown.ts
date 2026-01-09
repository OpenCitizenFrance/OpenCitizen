import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const unknown = await prisma.legislativeDossier.findMany({
        where: { title: 'Inconnu' },
        take: 10,
        select: { uid: true, title: true }
    });
    console.log(`Dossiers with "Inconnu" title (sample):`);
    console.log(unknown);

    // Check if these UIDs follow a pattern
    console.log('\nUID patterns:', unknown.map(d => d.uid));
}
main().finally(() => prisma.$disconnect());
