import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchTitleFromAN(uid: string): Promise<string | null> {
    try {
        // Parse UID to extract legislature and text number
        // Formats:
        // PIONANR5L17B0419 - Proposition (B + number)
        // PIONANR5L17BTC0475 - Proposition Commission (BTC + number)  
        // PRJLANR5L17B1906 - Projet de loi (B + number)
        // PRJLANR5L17BTC0920 - Projet Commission (BTC + number)
        // PNREANR5L17BTC2205 - Texte adopté

        // More flexible regex - capture legislature and everything after B
        const match = uid.match(/ANR5L(\d+)B(TC)?(\d+)/);
        if (!match) {
            console.log(`  ⚠️ Cannot parse: ${uid}`);
            return null;
        }

        const legislature = match[1];
        const isTC = !!match[2];
        const textNum = match[3];
        const isPION = uid.startsWith('PION');
        const isPRJL = uid.startsWith('PRJL');

        // Build URL list to try
        const urls: string[] = [];

        if (isTC) {
            // Commission texts - try rapport
            urls.push(
                `https://www.assemblee-nationale.fr/dyn/${legislature}/rapports/r${textNum}`,
                `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/l${legislature}btc${textNum}_texte-adopte-commission`
            );
        } else if (isPRJL) {
            // Projets de loi
            urls.push(
                `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/l${legislature}b${textNum}_projet-loi`,
                `https://www.assemblee-nationale.fr/dyn/${legislature}/projets/pl${textNum}`
            );
        } else if (isPION) {
            // Propositions de loi
            urls.push(
                `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/l${legislature}b${textNum}_proposition-loi`,
                `https://www.assemblee-nationale.fr/dyn/${legislature}/propositions/pion${textNum}`
            );
        }

        // Also try the dossier page
        urls.push(`https://www.assemblee-nationale.fr/dyn/docs/${uid.toUpperCase()}.html`);

        for (const url of urls) {
            try {
                const shortUrl = url.split('/').slice(-1)[0];
                console.log(`  → ${shortUrl}`);

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml'
                    },
                    signal: AbortSignal.timeout(10000),
                    redirect: 'follow'
                });

                if (!response.ok) continue;

                const html = await response.text();
                const $ = cheerio.load(html);

                // Try various selectors for the title
                let title = '';

                // Main title selectors
                const selectors = [
                    'h1.titre-principal',
                    'h1.titreDossier',
                    '.titre-texte h1',
                    'article h1',
                    'h1 span.intitule',
                    'h1'
                ];

                for (const sel of selectors) {
                    const text = $(sel).first().text().trim();
                    if (text && text.length > 20 && !text.includes('404') && !text.includes('introuvable')) {
                        title = text;
                        break;
                    }
                }

                // Try meta if no title found
                if (!title) {
                    const ogTitle = $('meta[property="og:title"]').attr('content');
                    const metaTitle = $('meta[name="title"]').attr('content');
                    title = (ogTitle || metaTitle || '').split('|')[0].trim();
                }

                if (title && title.length > 15) {
                    // Clean the title
                    title = title
                        .replace(/^N°\s*\d+\s*[-–—]\s*/i, '')
                        .replace(/\s*\|\s*Assemblée.*$/i, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // Skip if still looks like an error or generic
                    if (title.length < 15 || title.toLowerCase().includes('erreur')) {
                        continue;
                    }

                    // Truncate if too long
                    if (title.length > 250) {
                        title = title.slice(0, 247) + '...';
                    }

                    return title;
                }
            } catch (e) {
                // Continue to next URL
            }
        }

        return null;
    } catch (e) {
        console.log(`  Error: ${e}`);
        return null;
    }
}

async function main() {
    console.log('🔍 Enriching dossier titles from Assemblée Nationale website...\n');

    const unknownDossiers = await prisma.legislativeDossier.findMany({
        where: { title: 'Inconnu' },
        select: { uid: true, type: true },
        orderBy: { uid: 'desc' } // Start with newer ones
    });

    console.log(`Found ${unknownDossiers.length} dossiers to enrich.\n`);

    let updated = 0;
    let failed = 0;

    // Process all remaining dossiers
    const batch = unknownDossiers;

    for (let i = 0; i < batch.length; i++) {
        const dossier = batch[i];
        console.log(`[${i + 1}/${batch.length}] ${dossier.uid}`);

        const title = await fetchTitleFromAN(dossier.uid);

        if (title) {
            await prisma.legislativeDossier.update({
                where: { uid: dossier.uid },
                data: { title }
            });
            console.log(`  ✅ "${title.slice(0, 70)}${title.length > 70 ? '...' : ''}"\n`);
            updated++;
        } else {
            console.log(`  ❌ No title found\n`);
            failed++;
        }

        await delay(600); // Be nice to the servers
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success rate: ${((updated / batch.length) * 100).toFixed(1)}%`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
