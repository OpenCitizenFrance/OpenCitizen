import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const AMO_URL = 'http://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip';
const TEMP_DIR = path.join(process.cwd(), 'temp_groups_fix');

async function downloadFile(url: string, dest: string) {
    const res = await fetch(url);
    if (!res.body) throw new Error(`Failed to download ${url}`);
    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
}

async function main() {
    console.log('🔧 Starting Groups fix...');
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

    try {
        console.log('⬇️ Downloading AMO data...');
        const zipPath = path.join(TEMP_DIR, 'amo.zip');
        await downloadFile(AMO_URL, zipPath);

        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries();
        console.log(`Found ${entries.length} entries.`);

        let groupCount = 0;
        const groupsFound: any[] = [];

        // 1. Upsert Groups
        console.log('🏛️  Scanning for Groups...');
        for (const entry of entries) {
            // Look for organs
            if (entry.entryName.includes('organe/PO') && entry.name.endsWith('.json')) {
                const content = JSON.parse(entry.getData().toString('utf8'));
                const org = content.organe;

                if (org.codeType === 'GP') {
                    // console.log(`Found Group: ${org.libelle} (${org.uid})`);
                    groupsFound.push(org);

                    await prisma.group.upsert({
                        where: { uid: org.uid },
                        update: {
                            name: org.libelle,
                            acronym: org.libelleAbrege,
                            colorCode: org.couleurAssociee
                        },
                        create: {
                            uid: org.uid,
                            name: org.libelle,
                            acronym: org.libelleAbrege,
                            colorCode: org.couleurAssociee
                        }
                    });
                    groupCount++;
                }
            }
        }
        console.log(`✅ Upserted ${groupCount} groups.`);

        // 2. Fix Mandates
        // Since mandates already exist, we just need to ensure they have groupId set if they correspond to a group.
        // The original seed might have failed to set groupId if groups didn't exist? (No, standard FK would fail or allow null).
        // Let's iterate mandates in the DB and try to link them?
        // No, we need the source data to know which mandate links to which organ.
        // We can iterate the Actors again to find active mandates or just check Mandate table.
        // The Mandate table has `organId`. If `organId` matches a Group UID, we should set `groupId` to that UID.

        console.log('🔗 Linking Mandates to Groups...');
        // Fetch all group UIDs
        const allGroupUids = groupsFound.map(g => g.uid);

        // Update Mandates where organId is in our group list
        const updateResult = await prisma.mandate.updateMany({
            where: {
                organId: { in: allGroupUids }
            },
            data: {
                // We can't set groupId = organId in updateMany directly with a field reference in Prisma easily in one go
                // unless we use raw query or identical values. 
                // Luckily here, groupId SHOULD be equal to organId if it's a group mandate.
                // Wait, updateMany accepts static values. We can't say `groupId: organId`.
            }
        });

        // Since we can't do column-to-column update in Prisma updateMany, we might need a raw query or loop.
        // Raw query is fastest for Postgres.

        const updatedCount = await prisma.$executeRaw`
            UPDATE "Mandate"
            SET "groupId" = "organId"
            WHERE "organId" IN (${prisma.join(allGroupUids)})
        `;

        console.log(`✅ Linked ${updatedCount} mandates to groups.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
}

main();
