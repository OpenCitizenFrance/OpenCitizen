import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const groupMetadata: Record<string, { acronym: string; isMajority: boolean; logoUrl: string }> = {
    'PO845407': {
        acronym: 'EPR',
        isMajority: true,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/epr.png'
    },
    'PO845454': {
        acronym: 'Dem',
        isMajority: true,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/dem.png'
    },
    'PO845470': {
        acronym: 'HOR',
        isMajority: true,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/hor.png'
    },
    'PO845425': {
        acronym: 'DR',
        isMajority: true,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/dr.png'
    },
    'PO845401': {
        acronym: 'RN',
        isMajority: false,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/rn.png'
    },
    'PO845413': {
        acronym: 'LFI-NFP',
        isMajority: false,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/lfi-plus.png'
    },
    'PO845419': {
        acronym: 'SOC',
        isMajority: false,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/soc.png'
    },
    'PO845439': {
        acronym: 'EcoS',
        isMajority: false,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/ecos.png'
    },
    'PO845485': {
        acronym: 'LIOT',
        isMajority: false,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/liot.png'
    },
    'PO845514': {
        acronym: 'GDR',
        isMajority: false,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/gdr.png'
    },
    'PO872880': {
        acronym: 'UDR',
        isMajority: false,
        logoUrl: 'https://www.assemblee-nationale.fr/dyn/static/tribun/17/logos/udr.png'
    },
    'PO840056': {
        acronym: 'NI',
        isMajority: false,
        logoUrl: '' // Non inscrits usually don't have a logo
    },
};

async function main() {
    console.log('🔄 Updating political group metadata...');

    for (const [uid, meta] of Object.entries(groupMetadata)) {
        await prisma.group.update({
            where: { uid },
            data: {
                isMajority: meta.isMajority,
                logoUrl: meta.logoUrl || null,
                acronym: meta.acronym
            }
        }).catch(e => console.warn(`Could not update group ${uid}: ${e.message}`));
    }

    console.log('✅ Group metadata updated.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
