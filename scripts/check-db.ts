import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const deputyCount = await prisma.deputy.count();
    const voteCount = await prisma.vote.count();
    const groupCount = await prisma.group.count();

    console.log('--- Database Status ---');
    console.log(`Deputies: ${deputyCount}`);
    console.log(`Groups: ${groupCount}`);
    console.log(`Votes: ${voteCount}`);

    if (deputyCount === 0) {
        console.log('WARNING: No deputies found. Seed likely failed for AMO dataset.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
