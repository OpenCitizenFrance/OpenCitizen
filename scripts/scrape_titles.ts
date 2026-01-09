import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

async function fetchTextTitle(uid: string): Promise<string | null> {
    try {
        // PIONANR5L17B0104 -> text B0104 in legislature 17
        // Try: https://www.assemblee-nationale.fr/dyn/17/textes/l17b0104_proposition-loi
        const match = uid.match(/PIONANR5L(\d+)B(\d+)/);
        if (!match) {
            // Try PNREANR format
            const match2 = uid.match(/PNREANR5L(\d+)BTC(\d+)/);
            if (match2) {
                const legislature = match2[1];
                const textNum = match2[2];
                const url = `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/l${legislature}btc${textNum}_texte-adopte-seance`;
                console.log(`  Trying: ${url}`);
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpenCitizen/1.0)' },
                    signal: AbortSignal.timeout(8000)
                });
                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    return $('h1').first().text().trim() || null;
                }
            }
            return null;
        }

        const legislature = match[1];
        const textNum = match[2];

        // Try proposition de loi URL format
        const urls = [
            `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/l${legislature}b${textNum}_proposition-loi`,
            `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/l${legislature}b${textNum}_projet-loi`,
            `https://www.assemblee-nationale.fr/dyn/${legislature}/propositions/pion${textNum}`
        ];

        for (const url of urls) {
            console.log(`  Trying: ${url}`);
            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpenCitizen/1.0)' },
                    signal: AbortSignal.timeout(8000)
                });

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);

                    // Try various selectors
                    let title = $('h1.titre-principal').text().trim();
                    if (!title) title = $('h1.titreDossier').text().trim();
                    if (!title) title = $('h1').first().text().trim();
                    if (!title) {
                        const metaTitle = $('meta[property="og:title"]').attr('content');
                        if (metaTitle) title = metaTitle.split('|')[0].trim();
                    }

                    if (title && title.length > 5 && !title.includes('404') && !title.includes('erreur')) {
                        // Clean up title
                        title = title.replace(/^N°\s*\d+\s*-?\s*/i, '').trim();
                        return title;
                    }
                }
            } catch (e) { }
        }

        return null;
    } catch (e) {
        console.log(`  Error: ${e}`);
        return null;
    }
}

async function main() {
    console.log('🔍 Fetching titles from Assemblée Nationale website...');

    const unknownDossiers = await prisma.legislativeDossier.findMany({
        where: { title: 'Inconnu' },
        select: { uid: true },
        take: 30 // Start with a batch
    });

    console.log(`Found ${unknownDossiers.length} dossiers to update.\n`);

    let updated = 0;
    for (const dossier of unknownDossiers) {
        console.log(`Processing ${dossier.uid}...`);
        const title = await fetchTextTitle(dossier.uid);

        if (title) {
            await prisma.legislativeDossier.update({
                where: { uid: dossier.uid },
                data: { title }
            });
            console.log(`  ✅ ${title.slice(0, 60)}...`);
            updated++;
        } else {
            console.log(`  ❌ No title found`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n✅ Updated ${updated} dossiers with titles.`);
}

main().finally(() => prisma.$disconnect());
