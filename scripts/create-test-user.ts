import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'test@opencitizen.fr';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            name: 'Test User',
            email,
            password: hashedPassword,
        }
    });

    console.log('✅ Test user created/updated:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
