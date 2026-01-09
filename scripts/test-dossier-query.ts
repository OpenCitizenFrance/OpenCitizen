
import { getDossierByUid } from '../lib/dossiers';

async function main() {
    // Pick a UID from previous logs
    const uid = 'DLR5L16N48714';
    console.log(`Testing query for ${uid}...`);

    try {
        const dossier = await getDossierByUid(uid);
        if (!dossier) {
            console.log('Dossier not found.');
            return;
        }

        console.log(`Dossier: ${dossier.title}`);
        console.log(`Stages: ${dossier.stages.length}`);

        dossier.stages.forEach((stage, i) => {
            console.log(`Stage ${i}: ${stage.stageType} - Texts: ${stage.texts.length}`);
            stage.texts.forEach(t => {
                console.log(` - Text ${t.uid}: ${t.title} (${t.expose ? 'Has expose' : 'No expose'})`);
            });
        });

    } catch (error) {
        console.error('Query failed:', error);
    }
}

main();
