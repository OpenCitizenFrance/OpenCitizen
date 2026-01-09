
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function cleanHtml(html: string | null | undefined): string {
    if (!html) return "";
    let text = html.replace(/<[^>]*>/g, " ");
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
        try { return String.fromCharCode(parseInt(hex, 16)); } catch (e) { return ""; }
    });
    text = text.replace(/&#([0-9]+);/g, (_, dec) => {
        try { return String.fromCharCode(parseInt(dec, 10)); } catch (e) { return ""; }
    });
    const entities: Record<string, string> = {
        "&nbsp;": " ", "&#160;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
        "&quot;": '"', "&apos;": "'", "&laquo;": "«", "&raquo;": "»"
    };
    Object.entries(entities).forEach(([entity, char]) => { text = text.replaceAll(entity, char); });
    return text.replace(/\s+/g, " ").trim();
}

async function main() {
    console.log('🧼 Starting database cleanup (HTML & Entities)...');

    // 1. Clean Dossiers
    const dossiers = await prisma.legislativeDossier.findMany({
        where: {
            OR: [
                { title: { contains: '&' } },
                { title: { contains: '<' } }
            ]
        }
    });
    console.log(`📂 Found ${dossiers.length} dossiers to clean.`);
    for (const d of dossiers) {
        await prisma.legislativeDossier.update({
            where: { uid: d.uid },
            data: { title: cleanHtml(d.title) }
        });
    }

    // 2. Clean Amendments (Batch processing to avoid memory issues)
    const count = await prisma.amendment.count({
        where: {
            OR: [
                { expose: { contains: '&' } },
                { expose: { contains: '<' } }
            ]
        }
    });
    console.log(`📝 Found ~${count} amendments to clean.`);

    const BATCH_SIZE = 1000;
    let processed = 0;

    while (processed < count) {
        const batch = await prisma.amendment.findMany({
            where: {
                OR: [
                    { expose: { contains: '&' } },
                    { expose: { contains: '<' } }
                ]
            },
            take: BATCH_SIZE
        });

        if (batch.length === 0) break;

        for (const a of batch) {
            await prisma.amendment.update({
                where: { uid: a.uid },
                data: {
                    expose: cleanHtml(a.expose),
                    content: cleanHtml(a.content)
                }
            });
        }
        processed += batch.length;
        process.stdout.write(`\rProgress: ${processed} / ${count}...`);
    }

    console.log('\n✅ Cleanup completed.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
