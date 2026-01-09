import { PrismaClient, DossierType, DossierStatus, StageType, Chamber } from '@prisma/client';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// const DOSSIERS_URL = 'http://data.assemblee-nationale.fr/static/openData/repository/16/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip';
const DOSSIERS_URL = 'http://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip';

const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

async function downloadFile(url: string, dest: string) {
    console.log(`Downloading from ${url}...`);
    const res = await fetch(url);
    if (!res.body) throw new Error(`Failed to download ${url}`);

    // Check if redirect or error
    if (res.status !== 200) {
        throw new Error(`Failed to download: Status ${res.status}`);
    }

    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
}

async function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
}

async function cleanTempDir() {
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
}

// Map AN codes to our Enums
function mapDossierType(code: string): DossierType {
    if (code.includes('PROJET_LOI_FINANCES')) return 'PROJET_LOI_FIN';
    if (code.includes('PROJET_LOI_ORGANIQUE')) return 'PROJET_LOI_ORG';
    if (code.startsWith('PROJET_LOI')) return 'PROJET_LOI';
    return 'PROPOSITION_LOI'; // Default
}

function mapStageType(code: string): StageType {
    // This mapping needs to be refined based on actual data codes
    if (code.includes('DEPOT')) return 'DEPOT';
    if (code.includes('COM_FOND')) return 'COMMISSION_FOND';
    if (code.includes('COM_AVIS')) return 'COMMISSION_AVIS';
    if (code.includes('SEANCE')) return 'SEANCE_PUBLIQUE';
    if (code.includes('CMP')) return 'CMP';
    if (code.includes('LECTURE_DEF')) return 'LECTURE_DEFINITIVE';
    if (code.includes('CONSTIT')) return 'CONSEIL_CONSTIT';
    if (code.includes('PROMULGATION')) return 'PROMULGATION';
    return 'SEANCE_PUBLIQUE'; // Fallback
}

async function main() {
    console.log('🌱 Starting Dossiers seed...');

    // Command line args to limit processing
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 1000;

    await ensureTempDir();

    try {
        const zipPath = path.join(TEMP_DIR, 'dossiers.zip');
        await downloadFile(DOSSIERS_URL, zipPath);

        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries();
        console.log(`Found ${entries.length} entries in zip.`);

        let processedCount = 0;

        for (const entry of entries) {
            if (processedCount >= limit) break;

            if (entry.name.endsWith('.json') && entry.entryName.includes('dossier')) {
                const content = JSON.parse(entry.getData().toString('utf8'));
                const d = content.dossierParlementaire;

                // Extract basics
                const uid = d.uid;
                const title = d.titreDossier?.titre || d.titreDossier?.nom || "Dossier sans titre";

                // Determination du statut simplifié
                let status: DossierStatus = 'EN_COURS';
                const procedure = d.procedureParlementaire;
                // Logique simplifiée pour status
                if (procedure.code.includes('ADOPTION')) status = 'ADOPTE';

                // Debug title
                if (!d.titreDossier?.nom) {
                    console.log(`Missing title for ${uid}. Structure:`, JSON.stringify(d.titreDossier, null, 2));
                    // console.log('Full dossier keys:', Object.keys(d));
                }

                // Recursive function to traverse acts
                const acts: any[] = [];
                const traverseActs = (node: any) => {
                    if (Array.isArray(node)) {
                        node.forEach(traverseActs);
                    } else if (typeof node === 'object' && node !== null) {
                        if (node.codeActe) {
                            acts.push(node);
                        }
                        // Check children
                        Object.values(node).forEach(v => traverseActs(v));
                    }
                };

                if (d.actesLegislatifs) {
                    traverseActs(d.actesLegislatifs);
                }

                // Identify primary commission (saisi au fond)
                // We look for acts that handle the referral to a commission
                const refFondAct = acts.find(a => a.codeActe && (a.codeActe.includes('REF-FOND') || a.codeActe.includes('COM-FOND')));
                const commissionId = refFondAct?.organeRef || null;

                // Create Dossier with retry logic for DB limits
                let retryCount = 0;
                while (retryCount < 3) {
                    try {
                        await prisma.legislativeDossier.upsert({
                            where: { uid },
                            update: {
                                title,
                                type: mapDossierType(d.typeDossier?.code || ''),
                                status,
                                commissionId
                            },
                            create: {
                                uid,
                                title,
                                type: mapDossierType(d.typeDossier?.code || ''),
                                status,
                                commissionId
                            }
                        });
                        break;
                    } catch (e: any) {
                        if (e.message.includes('MaxClients') || e.message.includes('pool')) {
                            retryCount++;
                            console.log(`  Retry ${retryCount} for ${uid} due to DB pressure...`);
                            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
                        } else {
                            throw e;
                        }
                    }
                }

                // Small delay between successful operations to keep pool healthy
                await new Promise(resolve => setTimeout(resolve, 50));

                // Filter out dossiers with too few acts (likely irrelevant or just started)
                if (acts.length < 5) {
                    continue;
                }

                // Debug logs
                if (acts.length > 0) {
                    // Log keys of the FIRST act found in the batch to see structure
                    if (processedCount === 0 || acts.length > 5) {
                        console.log(`Dossier ${uid} has ${acts.length} acts.`);
                        console.log('Act Keys:', Object.keys(acts[0]));
                        // Check specifically for text fields
                        const withText = acts.find(a => a.texteAdopte || a.texteAssocie);
                        if (withText) {
                            console.log(`Found Act with text in ${uid}:`, withText.texteAdopte, withText.texteAssocie);
                        }
                    }
                }

                // Filter relevant acts and create stages
                let order = 0;
                for (const act of acts) {
                    const code = act.codeActe || '';

                    // Debug: Check if any act has text ref
                    // if (act.texteAdopte || act.texteAssocie) console.log(`Act ${code} has text:`, act.texteAdopte, act.texteAssocie);

                    // We filter for major steps only to avoid clutter
                    if (code.startsWith('AN') || code.startsWith('SN')) {
                        // Debug first act to find text refs
                        if (order === 0 && processedCount === 0) console.log('Sample Act:', JSON.stringify(act, null, 2));

                        // Try to map
                        const stageType = mapStageType(code);
                        const chamber = code.startsWith('SN') ? 'SENAT' : 'ASSEMBLEE_NATIONALE';

                        const date = act.dateActe ? new Date(act.dateActe) : null;

                        // Extract native labels from libelleActe
                        const label = act.libelleActe?.nomCanonique || null;
                        const labelShort = act.libelleActe?.libelleCourt || null;

                        let stage;
                        let stageRetryCount = 0;
                        while (stageRetryCount < 3) {
                            try {
                                stage = await prisma.legislativeStage.create({
                                    data: {
                                        dossierId: uid,
                                        stageType,
                                        chamber,
                                        stageOrder: order++,
                                        date: date,
                                        organName: act.organeRef,
                                        // Native labels from AN JSON
                                        label,
                                        labelShort,
                                        codeActe: code
                                    }
                                });
                                break;
                            } catch (e: any) {
                                if (e.message.includes('MaxClients') || e.message.includes('pool')) {
                                    stageRetryCount++;
                                    console.log(`  Retry ${stageRetryCount} for stage in ${uid}...`);
                                    await new Promise(resolve => setTimeout(resolve, 500 * stageRetryCount));
                                } else {
                                    throw e;
                                }
                            }
                        }

                        if (!stage) continue;

                        // Extract text references (texteAdopte, texteAssocie)
                        const textRefs = [];
                        if (act.texteAdopte) textRefs.push(act.texteAdopte);
                        if (act.texteAssocie) textRefs.push(act.texteAssocie);

                        // Debug log 
                        if (textRefs.length > 0) console.log(`Found text refs in ${uid}:`, textRefs);

                        for (const ref of textRefs) {
                            // Handle object case (sometimes texteAdopte is NOT a string)
                            let refId = ref;
                            if (typeof ref === 'object' && ref?.id) refId = ref.id;

                            if (refId && typeof refId === 'string') {
                                // Verify if it looks like a text ID (PRJ, PION, TA...)
                                if (refId.match(/^[A-Z]+[A-Z0-9]+$/)) {
                                    // console.log(`Creating text ${refId} for stage ${stage.id}`);
                                    await prisma.legislativeText.create({
                                        data: {
                                            uid: refId,
                                            title: `Texte n°${refId.match(/B(\d+)$/)?.[1] || '?'}`,
                                            numTexte: refId.match(/B(\d+)$/)?.[1],
                                            stageId: stage.id
                                        }
                                    }).catch(e => {
                                        // Ignore duplicates
                                    });
                                } else {
                                    // console.log(`Ignored ref format: ${refId}`);
                                }
                            }
                        }
                    }
                }

                processedCount++;
                console.log(`Processed ${uid}: ${title}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await cleanTempDir();
        await prisma.$disconnect();
    }
}

main();
