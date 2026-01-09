
import AdmZip from 'adm-zip';
import path from 'path';

async function main() {
    const zipPath = path.join(process.cwd(), 'temp_seed', 'amendements.zip');
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    for (const entry of entries) {
        if (entry.name.endsWith('.json')) {
            const content = JSON.parse(entry.getData().toString('utf8'));
            const a = content.amendement;
            console.log('Cycle de vie:', JSON.stringify(a.cycleDeVie, null, 2));
            break;
        }
    }
}

main();
