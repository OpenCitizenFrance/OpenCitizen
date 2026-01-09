import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔗 Linking Mandates to Groups...');

    // 1. Get all groups
    const groups = await prisma.group.findMany({ select: { uid: true } });
    console.log(`Found ${groups.length} groups in DB.`);

    let linkedCount = 0;

    // 2. Update mandates
    for (const group of groups) {
        // Find mandates where organId == group.uid and link them
        const result = await prisma.mandate.updateMany({
            where: {
                organId: group.uid,
                // Optional: only update if not already set, or just overwrite to be safe
                // groupId: null 
            },
            data: { groupId: group.uid }
        });
        linkedCount += result.count;
    }

    console.log(`✅ Linked ${linkedCount} mandates to groups.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
