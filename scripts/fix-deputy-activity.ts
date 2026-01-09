import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Cleaning up and fixing data...');

    // 1. Fix Group Types
    console.log('Updating Group types...');
    const politicalGroupIds = [
        'PO845401', // RN
        'PO845419', // LFI-NFP
        'PO845427', // DR
        'PO845454', // EPR
        'PO845443', // Soc
        'PO845436', // EcoS
        'PO845470', // Dem
        'PO845407', // HOR
        'PO845413', // LIOT
        'PO845464', // UDR
        'PO793087', // NI
    ];

    await prisma.group.updateMany({
        where: { uid: { in: politicalGroupIds } },
        data: { type: 'GP' }
    });

    const commissionIds = [
        'PO419610', // AE
        'PO419604', // AF
        'PO419865', // DA
        'PO419604', // AF (wait, duplicate?)
        'PO59051',  // FIN
    ];
    // Any organ that is not in the GP list and starts with PO could be a commission
    // Better: if acronym is short (2-5 chars) and it's not NI, it's likely a GP.
    // But let's just mark others as COMPER for now if they look like it.

    await prisma.group.updateMany({
        where: {
            AND: [
                { uid: { notIn: politicalGroupIds } },
                { uid: { startsWith: 'PO' } }
            ]
        },
        data: { type: 'COMPER' }
    });

    // 2. Assign authors to dossiers
    console.log('Assigning authors to dossiers based on amendments...');
    const dossiers = await prisma.legislativeDossier.findMany({
        where: { authorId: null }
    });

    for (const dossier of dossiers) {
        // Find the first amendment (or any amendment) to get a potential author
        const firstAmdt = await prisma.amendment.findFirst({
            where: { lawId: dossier.uid },
            orderBy: { uid: 'asc' }
        });

        if (firstAmdt) {
            await prisma.legislativeDossier.update({
                where: { uid: dossier.uid },
                data: { authorId: firstAmdt.authorId }
            });
        }
    }

    console.log('✅ Data fix completed.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
