import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

async function fetchDossierTitle(uid: string): Promise<string | null> {
    // Try to fetch from Assemblée Nationale website
    // UIDs like PIONANR5L17B0104 can be looked up
    try {
        // First extract the text number from the UID
        // PIONANR5L17B0104 -> texte B0104 in legislature 17
        const match = uid.match(/PIONANR5L(\d+)B(\d+)/);
        if (!match) return null;

        const legislature = match[1];
        const textNum = match[2];

        // Try the dossier page
        const url = `https://www.assemblee-nationale.fr/dyn/${legislature}/dossiers/alt/${uid}`;
        console.log(`  Trying: ${url}`);

        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpenCitizen/1.0)' },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            // Try alternative URL format
            const altUrl = `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/${uid}`;
            console.log(`  Trying alt: ${altUrl}`);
            const altResponse = await fetch(altUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpenCitizen/1.0)' },
                signal: AbortSignal.timeout(5000)
            });
            if (!altResponse.ok) return null;

            const html = await altResponse.text();
            const $ = cheerio.load(html);
            const title = $('h1').first().text().trim() || $('title').text().split('|')[0].trim();
            return title || null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Try to find the title in the page
        const title = $('h1.titre-principal').text().trim()
            || $('h1').first().text().trim()
            || $('title').text().split('|')[0].trim();

        return title || null;
    } catch (e) {
        console.log(`  Error: ${e}`);
        return null;
    }
}

async function main() {
    console.log('🔍 Fetching titles for dossiers with "Inconnu"...');

    const unknownDossiers = await prisma.legislativeDossier.findMany({
        where: { title: 'Inconnu' },
        select: { uid: true },
        take: 20 // Start with a small batch
    });

    console.log(`Found ${unknownDossiers.length} dossiers to update.`);

    let updated = 0;
    for (const dossier of unknownDossiers) {
        console.log(`Processing ${dossier.uid}...`);
        const title = await fetchDossierTitle(dossier.uid);

        if (title && title !== 'Inconnu' && title.length > 0) {
            await prisma.legislativeDossier.update({
                where: { uid: dossier.uid },
                data: { title }
            });
            console.log(`  ✅ Updated: ${title.slice(0, 60)}...`);
            updated++;
        } else {
            console.log(`  ❌ No title found`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n✅ Updated ${updated} dossiers.`);
}

main().finally(() => prisma.$disconnect());
