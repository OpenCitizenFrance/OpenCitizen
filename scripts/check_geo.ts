import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const withRegion = await prisma.deputy.count({ where: { regionName: { not: null } } });
    const total = await prisma.deputy.count();
    console.log(`Deputies with region: ${withRegion} / ${total}`);

    const sample = await prisma.deputy.findFirst({ where: { regionName: { not: null } }, select: { firstName: true, lastName: true, regionName: true, departmentName: true, departmentCode: true } });
    console.log('Sample:', sample);

    if (withRegion === 0) {
        const noRegion = await prisma.deputy.findFirst({ select: { firstName: true, lastName: true, regionName: true, departmentName: true, departmentCode: true } });
        console.log('Sample without region:', noRegion);
    }
}
main().finally(() => prisma.$disconnect());
