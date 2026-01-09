import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

function getText(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val['#text']) return val['#text'];
    return String(val);
}

async function main() {
    console.log('🌍 Updating deputies with geographic data...');

    const amoZipPath = path.join(TEMP_DIR, 'amo.zip');
    if (!fs.existsSync(amoZipPath)) {
        console.log('❌ AMO zip not found. Run seed first.');
        process.exit(1);
    }

    const amoZip = new AdmZip(amoZipPath);
    const amoEntries = amoZip.getEntries();

    const updates: { uid: string; regionName: string | null; departmentName: string | null; departmentCode: string | null }[] = [];

    console.log('📦 Extracting geographic data from AMO...');
    for (const entry of amoEntries) {
        if (entry.entryName.includes('acteur/PA') && entry.name.endsWith('.json')) {
            try {
                const actor = JSON.parse(entry.getData().toString('utf8')).acteur;
                const uid = typeof actor.uid === 'object' ? actor.uid['#text'] : actor.uid;
                if (!uid?.startsWith('PA')) continue;

                const mandats = actor.mandats?.mandat;
                const mandatArray = Array.isArray(mandats) ? mandats : (mandats ? [mandats] : []);

                // Find ASSEMBLEE mandate with election.lieu
                for (const m of mandatArray) {
                    if (m.typeOrgane === 'ASSEMBLEE' && m.election?.lieu) {
                        const lieu = m.election.lieu;
                        updates.push({
                            uid,
                            regionName: getText(lieu.region),
                            departmentName: getText(lieu.departement),
                            departmentCode: getText(lieu.numDepartement)
                        });
                        break; // Only need one ASSEMBLEE mandate per deputy
                    }
                }
            } catch (e) { }
        }
    }

    console.log(`📊 Found ${updates.length} deputies with geographic data.`);

    // Update in batches
    let updated = 0;
    for (const data of updates) {
        try {
            await prisma.deputy.update({
                where: { uid: data.uid },
                data: {
                    regionName: data.regionName,
                    departmentName: data.departmentName,
                    departmentCode: data.departmentCode
                }
            });
            updated++;
        } catch (e) {
            // Deputy might not exist
        }
        if (updated % 100 === 0 && updated > 0) {
            console.log(`  Updated ${updated} deputies...`);
        }
    }

    console.log(`✅ Updated ${updated} deputies with geographic data.`);

    // Verify
    const withRegion = await prisma.deputy.count({ where: { regionName: { not: null } } });
    const total = await prisma.deputy.count();
    console.log(`📈 Deputies with region: ${withRegion} / ${total}`);
}

main().finally(() => prisma.$disconnect());
