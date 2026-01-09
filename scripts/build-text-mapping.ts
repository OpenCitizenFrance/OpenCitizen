import * as fs from 'fs';
import * as path from 'path';

const JSON_DIR = '/Users/test/Documents/json/dossierParlementaire';
const OUTPUT_FILE = '/Users/test/lib/text-dossier-mapping.json';

interface DossierInfo {
    uid: string;
    titre: string;
}

// Extract all texteAssocie UIDs from a dossier object (recursive)
function extractTextesAssocies(obj: any): string[] {
    const textes: string[] = [];

    if (typeof obj !== 'object' || obj === null) return textes;

    if (Array.isArray(obj)) {
        for (const item of obj) {
            textes.push(...extractTextesAssocies(item));
        }
        return textes;
    }

    if ('texteAssocie' in obj) {
        const ta = obj.texteAssocie;
        if (typeof ta === 'string') {
            if (ta.startsWith('PRJL') || ta.startsWith('PION')) {
                textes.push(ta);
            }
        } else if (ta && typeof ta === 'object' && 'refTexteAssocie' in ta) {
            const ref = ta.refTexteAssocie;
            if (typeof ref === 'string' && (ref.startsWith('PRJL') || ref.startsWith('PION'))) {
                textes.push(ref);
            }
        }
    }

    for (const value of Object.values(obj)) {
        textes.push(...extractTextesAssocies(value));
    }

    return textes;
}

function main() {
    console.log('🔍 Building Text → Dossier mapping from JSON files...\n');

    const files = fs.readdirSync(JSON_DIR)
        .filter(f => f.startsWith('DLR5L17N') && f.endsWith('.json'));

    console.log(`Found ${files.length} L17 dossier files to process.\n`);

    const mapping: Record<string, DossierInfo> = {};
    let processed = 0;

    for (const file of files) {
        try {
            const filePath = path.join(JSON_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            const dp = data.dossierParlementaire;

            if (!dp || !dp.uid) continue;

            const dossierUid = dp.uid;
            const titre = dp.titreDossier?.titre || 'Sans titre';
            const textes = [...new Set(extractTextesAssocies(dp))];

            for (const textUid of textes) {
                mapping[textUid] = { uid: dossierUid, titre };
            }

            processed++;
            if (processed % 100 === 0) {
                console.log(`  Processed ${processed}/${files.length} files...`);
            }
        } catch (e) {
            // Skip invalid files
        }
    }

    console.log(`\n✅ Built mapping for ${Object.keys(mapping).length} texts.\n`);

    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2));
    console.log(`📝 Saved to ${OUTPUT_FILE}`);

    // Show samples
    console.log('\n📋 Sample mappings:');
    const keys = Object.keys(mapping).slice(0, 5);
    for (const k of keys) {
        console.log(`  ${k} → "${mapping[k].titre.slice(0, 50)}..."`);
    }
}

main();
