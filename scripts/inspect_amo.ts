import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const TEMP_DIR = path.join(process.cwd(), 'temp_seed');
const amoZipPath = path.join(TEMP_DIR, 'amo.zip');

if (!fs.existsSync(amoZipPath)) {
    console.log('AMO zip not found. Run seed first.');
    process.exit(1);
}

const amoZip = new AdmZip(amoZipPath);
const amoEntries = amoZip.getEntries();

// Find a deputy with mandates
let found = 0;
for (const entry of amoEntries) {
    if (entry.entryName.includes('acteur/PA') && entry.name.endsWith('.json') && found < 3) {
        try {
            const actor = JSON.parse(entry.getData().toString('utf8')).acteur;
            const uid = typeof actor.uid === 'object' ? actor.uid['#text'] : actor.uid;
            if (!uid?.startsWith('PA')) continue;

            const mandats = actor.mandats?.mandat;
            const mandatArray = Array.isArray(mandats) ? mandats : (mandats ? [mandats] : []);
            if (!mandatArray.some((m: any) => m.legislature === '17')) continue;

            console.log('\n=== DEPUTY:', uid, '===');

            for (const m of mandatArray) {
                if (m.typeOrgane === 'ASSEMBLEE') {
                    console.log('Found ASSEMBLEE mandate:');
                    console.log('  Mandate keys:', Object.keys(m));
                    console.log('  election:', JSON.stringify(m.election, null, 2));
                    console.log('  suppleant:', JSON.stringify(m.suppleant, null, 2));
                    console.log('  circonscription:', JSON.stringify(m.circonscription, null, 2));
                    console.log('  Full mandate:', JSON.stringify(m, null, 2).slice(0, 2000));
                    found++;
                    break;
                }
            }
        } catch (e) { }
    }
    if (found >= 3) break;
}

if (found === 0) {
    console.log('No ASSEMBLEE mandates found. Checking first mandate types:');
    let checked = 0;
    for (const entry of amoEntries) {
        if (entry.entryName.includes('acteur/PA') && entry.name.endsWith('.json') && checked < 5) {
            try {
                const actor = JSON.parse(entry.getData().toString('utf8')).acteur;
                const mandats = actor.mandats?.mandat;
                const mandatArray = Array.isArray(mandats) ? mandats : (mandats ? [mandats] : []);
                console.log('Deputy mandates:', mandatArray.map((m: any) => m.typeOrgane));
                checked++;
            } catch (e) { }
        }
    }
}
