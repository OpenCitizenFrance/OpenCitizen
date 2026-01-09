
import AdmZip from 'adm-zip';
import path from 'path';

async function main() {
    const zipPath = path.join(process.cwd(), 'temp_seed', 'amo.zip');
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const codeTypes = new Set<string>();
    const samples: Record<string, any> = {};

    console.log('Inspecting organs...');
    for (const entry of entries) {
        if (entry.entryName.includes('organe/PO') && entry.name.endsWith('.json')) {
            try {
                const org = JSON.parse(entry.getData().toString('utf8')).organe;
                codeTypes.add(org.codeType);
                if (!samples[org.codeType]) {
                    samples[org.codeType] = {
                        uid: org.uid,
                        libelle: org.libelle,
                        codeType: org.codeType
                    };
                }
            } catch (e) { }
        }
    }

    console.log('Found CodeTypes:', Array.from(codeTypes));
    console.log('Samples:', JSON.stringify(samples, null, 2));
}

main();
