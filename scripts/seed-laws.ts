import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📚 Creating Laws from Votes...');

    // Get all votes
    const votes = await prisma.vote.findMany({
        take: 100,
        orderBy: { date: 'desc' }
    });

    console.log(`Found ${votes.length} votes to process.`);

    let lawCount = 0;
    const createdLaws = new Set<string>();

    for (const vote of votes) {
        // Extract a "dossier" ID from the vote - create unique law per vote for demo
        // In reality, multiple votes can relate to the same law
        const lawId = `DLR-${vote.uid}`;

        if (createdLaws.has(lawId)) continue;

        // Determine status from vote result
        let status = 'En cours';
        if (vote.result?.toLowerCase().includes('adopt')) {
            status = 'Adopté';
        } else if (vote.result?.toLowerCase().includes('rejet')) {
            status = 'Rejeté';
        }

        try {
            await prisma.law.upsert({
                where: { uid: lawId },
                update: {},
                create: {
                    uid: lawId,
                    title: vote.title || `Texte législatif ${lawId}`,
                    status: status
                }
            });

            // Link vote to law
            await prisma.vote.update({
                where: { uid: vote.uid },
                data: { lawId: lawId }
            });

            createdLaws.add(lawId);
            lawCount++;
        } catch (e) {
            // Skip on error
        }
    }

    console.log(`✅ Created ${lawCount} laws.`);

    // Check final count
    const totalLaws = await prisma.law.count();
    console.log(`📊 Total laws in DB: ${totalLaws}`);
}

main()
    .catch(e => console.error('❌ Error:', e))
    .finally(() => prisma.$disconnect());
