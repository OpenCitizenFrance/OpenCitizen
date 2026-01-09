
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

async function main() {
    console.log('📦 Starting targeted Organ ingestion...');
    const amoZipPath = path.join(TEMP_DIR, 'amo.zip');

    if (!fs.existsSync(amoZipPath)) {
        console.error('AMO zip not found at', amoZipPath);
        return;
    }

    const amoZip = new AdmZip(amoZipPath);
    const amoEntries = amoZip.getEntries();
    const groups: any[] = [];

    console.log('🔍 Collecting all organs (Commissions, Groups, etc.)...');
    for (const entry of amoEntries) {
        if (entry.entryName.includes('organe/PO') && entry.name.endsWith('.json')) {
            try {
                const org = JSON.parse(entry.getData().toString('utf8')).organe;

                // Map codeType to GroupType enum
                let groupType = 'AUTRE';
                if (org.codeType === 'GP') groupType = 'GP';
                else if (org.codeType === 'COMPER') groupType = 'COMPER';
                else if (org.codeType === 'CNPS') groupType = 'CNPS';

                groups.push({
                    uid: org.uid,
                    name: org.libelle,
                    acronym: org.libelleAbrege || null,
                    colorCode: org.couleurAssociee || null,
                    type: groupType,
                    codeType: org.codeType
                });
            } catch (e) { }
        }
    }

    console.log(`💾 Persisting ${groups.length} organs to database...`);
    // Batch process to avoid large payload issues
    const BATCH_SIZE = 1000;
    for (let i = 0; i < groups.length; i += BATCH_SIZE) {
        const batch = groups.slice(i, i + BATCH_SIZE);
        await prisma.group.createMany({
            data: batch,
            skipDuplicates: true
        });
        console.log(`  Progress: ${Math.min(i + BATCH_SIZE, groups.length)} / ${groups.length}`);
    }

    console.log('✅ Organ ingestion completed.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
