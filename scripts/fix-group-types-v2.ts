import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Refining group types for active organs...');

    // 1. Reset all groups to AUTRE
    await prisma.group.updateMany({ data: { type: 'AUTRE' } });

    // 2. Identify Political Groups (GP)
    // These typically have mandates where typeOrgane was 'GP' or they are in the known list
    const politicalGroupAcronyms = [
        'RN', 'LFI-NFP', 'EPR', 'Dem', 'Soc', 'EcoS', 'DR', 'HOR', 'LIOT', 'UDR', 'NI',
        'GDR', 'LFI', 'RE', 'MoDem', 'LR', 'SOC', 'ECO', 'LT', 'UDI', 'Agir'
    ];

    await prisma.group.updateMany({
        where: {
            OR: [
                { acronym: { in: politicalGroupAcronyms } },
                { name: { contains: 'Groupe' } }
            ]
        },
        data: { type: 'GP' }
    });

    // 3. Identify Commissions (COMPER)
    // These typically have mandates where typeOrgane was 'COMPER'
    // Permanent commissions names in France:
    const commissionKeywords = [
        'Commission des affaires culturelles',
        'Commission des affaires économiques',
        'Commission des affaires étrangères',
        'Commission des affaires sociales',
        'Commission de la défense',
        'Commission du développement durable',
        'Commission des finances',
        'Commission des lois'
    ];

    for (const kw of commissionKeywords) {
        await prisma.group.updateMany({
            where: { name: { contains: kw } },
            data: { type: 'COMPER' }
        });
    }

    // 4. Special fix for LIOT and GDR if they were missed
    await prisma.group.updateMany({
        where: {
            name: {
                in: [
                    'Libertés, Indépendants, Outre-mer et Territoires',
                    'Gauche Démocrate et Républicaine'
                ]
            }
        },
        data: { type: 'GP' }
    });

    console.log('✅ Group types refined.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
