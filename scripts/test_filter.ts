import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get groups
    const groups = await prisma.group.findMany({
        take: 3,
        select: { uid: true, acronym: true }
    });
    console.log('Sample groups:', groups);

    // Get count of dossiers with authors
    const withAuthor = await prisma.legislativeDossier.count({
        where: { authorId: { not: null } }
    });
    const total = await prisma.legislativeDossier.count();
    console.log(`Dossiers with author: ${withAuthor} / ${total}`);

    // Test filter
    if (groups[0]) {
        const groupId = groups[0].uid;
        const filtered = await prisma.legislativeDossier.findMany({
            where: {
                author: {
                    mandates: {
                        some: {
                            groupId: { in: [groupId] },
                            endDate: null
                        }
                    }
                }
            },
            take: 3,
            select: {
                uid: true,
                title: true,
                author: { select: { firstName: true, lastName: true } }
            }
        });
        console.log(`\nFiltered by ${groups[0].acronym}:`, filtered.length);
        console.log(filtered);
    }
}

main().finally(() => prisma.$disconnect());
