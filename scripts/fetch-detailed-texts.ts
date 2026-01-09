import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

// Delay function to avoid rate limiting (429)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchTextContent(textUid: string) {
    const url = `https://www.assemblee-nationale.fr/dyn/opendata/${textUid}.html`;
    console.log(`Fetching ${url}...`);

    try {
        const response = await fetch(url);
        if (response.status === 404) {
            console.log(`❌ Text not found (404): ${textUid}`);
            return null;
        }
        if (response.status === 429) {
            console.log(`⚠️ Rate limit (429). Waiting 10s...`);
            await delay(10000);
            return fetchTextContent(textUid); // Retry once
        }
        if (!response.ok) {
            console.log(`❌ Error ${response.status} fetching ${textUid}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Parsing logic based on analyzed structure
        // 1. Exposé Sommaire / Motifs
        // It can be interleaved or at the top. We'll grab the first large block or look for headers.

        let exposeContent = '';

        // Strategy 1: Look for "Exposé des motifs" header and take following content until next header
        // Simple scraping: finding text between headers
        // For interleaved (PLFSS), we might want to capture them into articles.

        // Global Expose (often at top)
        $('span, p, h1, h2, h3').each((i, el) => {
            const text = $(el).text().trim().toUpperCase();
            if (text === 'EXPOSÉ DES MOTIFS' || text === 'EXPOSÉ SOMMAIRE') {
                // The content usually follows.
                // This is a naive heuristic: take the next few paragraphs until an Article starts
                let next = $(el).parent().next();
                while (next.length && !next.text().includes('Article')) {
                    exposeContent += next.text() + '\n\n';
                    next = next.next();
                }
            }
        });

        // 2. Articles
        const articles: any[] = [];
        $('.assnat9ArticleNum').each((i, el) => {
            const num = $(el).text().trim(); // "Article 1er"

            // Content is usually the next sibling with class .assnatLoiTexte or just <p>
            let content = '';
            let next = $(el).next();
            while (next.length && !next.hasClass('assnat9ArticleNum') && !next.text().includes('Article')) {
                // Determine if this is article content or expose (for interleaved)
                // For now, we dump everything into content, we can refine structure later
                content += next.html() || '';
                next = next.next();
            }

            articles.push({
                number: num,
                content: content.trim()
            });
        });

        return {
            fullContent: html, // Store full HTML just in case
            expose: exposeContent.trim(),
            articles
        };

    } catch (error) {
        console.error(`Error fetching ${textUid}:`, error);
        return null;
    }
}

async function main() {
    console.log('📜 Starting Text Content Fetcher...');

    // Find texts without content
    const textsToUpdate = await prisma.legislativeText.findMany({
        where: {
            fullContent: null
        },
        take: 500 // Increased batch size
    });

    console.log(`Found ${textsToUpdate.length} texts to update.`);

    for (const text of textsToUpdate) {
        // Try to fetch
        const data = await fetchTextContent(text.uid);

        if (data) {
            await prisma.legislativeText.update({
                where: { uid: text.uid },
                data: {
                    expose: data.expose,
                    fullContent: data.fullContent,
                    articles: data.articles
                }
            });
            console.log(`✅ Updated ${text.uid} (${data.articles.length} articles)`);
        }

        // Polite delay
        await delay(500);
    }

    console.log('Done.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
