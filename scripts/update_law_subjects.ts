import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

function extractSubject(text: string): string | null {
    // Extract the subject from text like:
    // "Proposition de loi, adoptée par le Sénat, relative à l'instauration d'un nombre minimum de soignants par patient hospitalisé, n° 104, déposée le mardi 23 juillet 2024."

    // Try patterns like "relative à...", "visant à...", "tendant à...", "portant..."
    const patterns = [
        /relative à\s+([^,]+(?:,\s+[^,n°]+)?)/i,
        /visant à\s+([^,]+(?:,\s+[^,n°]+)?)/i,
        /tendant à\s+([^,]+(?:,\s+[^,n°]+)?)/i,
        /portant\s+([^,]+(?:,\s+[^,n°]+)?)/i,
        /pour\s+([^,]+(?:,\s+[^,n°]+)?)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            let subject = match[1].trim();
            // Clean up
            subject = subject.replace(/,\s*n°\s*\d+.*$/, '').trim();
            subject = subject.replace(/,\s*déposée?\s+le.*$/, '').trim();
            if (subject.length > 10) {
                // Capitalize
                return subject.charAt(0).toUpperCase() + subject.slice(1);
            }
        }
    }

    return null;
}

async function fetchLawSubject(uid: string): Promise<string | null> {
    try {
        const match = uid.match(/PIONANR5L(\d+)B(\d+)/);
        if (!match) return null;

        const legislature = match[1];
        const textNum = match[2];

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

        // Get the description paragraph
        const descParagraph = $('p._mb-medium').first().text().trim();
        if (descParagraph) {
            const subject = extractSubject(descParagraph);
            if (subject) return subject;
        }

        // Fallback: try to extract from h1
        const h1 = $('h1.h1').first().text().trim();
        const h1Subject = extractSubject(h1);
        if (h1Subject) return h1Subject;

        return null;
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('🔍 Updating dossier titles with law subjects...');

    // Get dossiers with generic titles
    const genericDossiers = await prisma.legislativeDossier.findMany({
        where: {
            OR: [
                { title: { startsWith: 'Proposition de loi, n°' } },
                { title: 'Inconnu' }
            ]
        },
        select: { uid: true, title: true }
    });

    console.log(`Found ${genericDossiers.length} dossiers to update.\n`);

    let updated = 0;
    let failed = 0;

    for (const dossier of genericDossiers) {
        process.stdout.write(`Processing ${dossier.uid}... `);
        const subject = await fetchLawSubject(dossier.uid);

        if (subject && subject.length > 15) {
            await prisma.legislativeDossier.update({
                where: { uid: dossier.uid },
                data: { title: subject }
            });
            console.log(`✅ ${subject.slice(0, 60)}...`);
            updated++;
        } else {
            console.log(`❌ No subject found`);
            failed++;
        }

        // Rate limiting - be nice to the server
        await new Promise(r => setTimeout(r, 400));
    }

    console.log(`\n✅ Updated ${updated} dossiers, ${failed} failed.`);

    // Final count
    const stillBad = await prisma.legislativeDossier.count({
        where: {
            OR: [
                { title: { startsWith: 'Proposition de loi, n°' } },
                { title: 'Inconnu' }
            ]
        }
    });
    const total = await prisma.legislativeDossier.count();
    console.log(`📈 Dossiers with good titles: ${total - stillBad} / ${total}`);
}

main().finally(() => prisma.$disconnect());
