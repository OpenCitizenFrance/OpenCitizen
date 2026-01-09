
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking database completeness for 17th Legislature...');

    // 1. Deputies
    const deputyCount = await prisma.deputy.count();
    console.log(`\n👥 Deputies: ${deputyCount}`);

    // 2. Dossiers (LegislativeDossier)
    const dossierCount = await prisma.legislativeDossier.count();
    const dossiersByStatus = await prisma.legislativeDossier.groupBy({
        by: ['status'],
        _count: { _all: true }
    });
    console.log(`\n📂 Dossiers: ${dossierCount}`);
    console.log('   Status breakdown:', dossiersByStatus.map(s => `${s.status}: ${s._count._all}`).join(', '));

    // Check for recent dossiers
    const recentDossier = await prisma.legislativeDossier.findFirst({
        select: { uid: true, title: true }
    });
    console.log('   Latest created dossier (DB insert):', recentDossier?.title);

    // 3. Texts
    const textCount = await prisma.legislativeText.count();
    const textsWithContent = await prisma.legislativeText.count({
        where: {
            OR: [
                { expose: { not: null } },
                { articles: { not: { not: null } } } // articles is Json, checking if not null is tricky usually, but let's just use expose
            ]
        }
    });

    // Count texts that actually have some content in articles
    const textsWithArticles = await prisma.legislativeText.count({
        where: {
            articles: { not: undefined }
        }
    });

    console.log(`\n📜 Texts: ${textCount}`);
    console.log(`   Texts with content (Expose/Articles): ${textsWithContent} (${Math.round(textCount > 0 ? textsWithContent / textCount * 100 : 0)}%)`);

    // 4. Amendments
    const amendmentCount = await prisma.amendment.count();
    console.log(`\n📝 Amendments: ${amendmentCount}`);

    if (amendmentCount > 0) {
        const firstAmdt = await prisma.amendment.findFirst({ orderBy: { uid: 'asc' } });
        const lastAmdt = await prisma.amendment.findFirst({ orderBy: { uid: 'desc' } });
        console.log(`   Sample: ${firstAmdt?.uid} ... ${lastAmdt?.uid}`);
    }

    // 5. Votes
    const voteCount = await prisma.vote.count();
    console.log(`\n🗳️ Votes: ${voteCount}`);
    if (voteCount > 0) {
        const lastVote = await prisma.vote.findFirst({ orderBy: { date: 'desc' } });
        console.log(`   Latest vote: ${lastVote?.date.toISOString().split('T')[0]} - ${lastVote?.title}`);
    }

}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
