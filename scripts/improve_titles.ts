import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

async function fetchFullTitle(uid: string): Promise<string | null> {
    try {
        // PIONANR5L17B0104 -> text B0104 in legislature 17
        const match = uid.match(/PIONANR5L(\d+)B(\d+)/);
        if (!match) return null;

        const legislature = match[1];
        const textNum = match[2];

        // Try the proposition-loi page - look for the actual title in page content
        const url = `https://www.assemblee-nationale.fr/dyn/${legislature}/textes/l${legislature}b${textNum}_proposition-loi`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // The actual title is usually in the subtitle or in the content
        // Look for patterns like "visant à...", "relative à...", "tendant à..."
        let title = '';

        // Try to get the subtitle which often contains the real title
        const subtitle = $('p.sous-titre, .sous-titre, h2.sous-titre').first().text().trim();
        if (subtitle && subtitle.length > 10) {
            title = subtitle;
        }

        // If no subtitle, look in the main content for the law's purpose
        if (!title) {
            const articlePremier = $('article, .article, #article-premier').first().text();
            const purposeMatch = articlePremier.match(/(visant à|relative à|tendant à|portant)[^.]{10,150}/i);
            if (purposeMatch) {
                title = purposeMatch[0].trim();
            }
        }

        // If still no title, use the h1 but try to extract the meaningful part
        if (!title) {
            const h1 = $('h1').first().text().trim();
            // Extract what comes after "Proposition de loi" or similar
            const meaningfulPart = h1.replace(/^N°\s*\d+\s*-?\s*/i, '')
                .replace(/^Proposition de loi,?\s*/i, '')
                .replace(/^Projet de loi,?\s*/i, '')
                .trim();
            if (meaningfulPart && meaningfulPart.length > 5) {
                title = meaningfulPart;
            }
        }

        // Clean up
        if (title) {
            title = title.replace(/\s+/g, ' ').trim();
            // Capitalize first letter
            title = title.charAt(0).toUpperCase() + title.slice(1);
        }

        return title || null;
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('🔍 Improving titles with actual content...');

    // Get dossiers that still have generic titles
    const genericDossiers = await prisma.legislativeDossier.findMany({
        where: {
            OR: [
                { title: { startsWith: 'Proposition de loi, n°' } },
                { title: 'Inconnu' }
            ]
        },
        select: { uid: true, title: true },
        take: 10
    });

    console.log(`Found ${genericDossiers.length} dossiers with generic titles.\n`);

    let improved = 0;
    for (const dossier of genericDossiers) {
        console.log(`Processing ${dossier.uid} (current: ${dossier.title?.slice(0, 30)}...)...`);
        const title = await fetchFullTitle(dossier.uid);

        if (title && title.length > 10 && !title.startsWith('Proposition de loi')) {
            await prisma.legislativeDossier.update({
                where: { uid: dossier.uid },
                data: { title }
            });
            console.log(`  ✅ ${title.slice(0, 70)}...`);
            improved++;
        } else {
            console.log(`  ⏭️ No better title found`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 800));
    }

    console.log(`\n✅ Improved ${improved} dossier titles.`);
}

main().finally(() => prisma.$disconnect());
