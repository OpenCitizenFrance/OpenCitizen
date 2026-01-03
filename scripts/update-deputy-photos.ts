import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📸 Updating deputy photos...');

    // Use a single raw SQL query for maximum efficiency
    const result = await prisma.$executeRaw`
        UPDATE "Deputy" 
        SET "imageUrl" = CONCAT('https://www.assemblee-nationale.fr/dyn/deputes/', uid, '/image')
        WHERE "imageUrl" IS NULL OR "imageUrl" = ''
    `;

    console.log(`✅ Updated ${result} deputies with photo URLs!`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
