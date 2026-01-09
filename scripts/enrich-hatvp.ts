/**
 * US-ETL-005: HATVP Enrichment Script
 * 
 * Downloads HATVP (Haute Autorité pour la Transparence de la Vie Publique) data
 * and enriches deputy records with financial participation data.
 * 
 * Uses fuzzy matching (Levenshtein distance) to match HATVP declarations
 * with existing deputies in the database.
 */

import { PrismaClient } from '@prisma/client';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const HATVP_URL = 'https://www.hatvp.fr/livraison/merge/declarations.xml';
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');
const HATVP_FILE = path.join(TEMP_DIR, 'hatvp.xml');

// Levenshtein distance calculation
function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Normalize name for matching
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z\s]/g, '')
        .trim();
}

interface HatvpDeclaration {
    nom: string;
    prenom: string;
    mandat?: string;
    participationsFinancieres: {
        denomination: string;
        montant: number;
        type: string;
    }[];
}

async function downloadHatvpData(): Promise<string> {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Check if file exists and is recent (less than 24h old)
    if (fs.existsSync(HATVP_FILE)) {
        const stats = fs.statSync(HATVP_FILE);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        if (ageHours < 24) {
            console.log('📂 Using cached HATVP data (less than 24h old)');
            return fs.readFileSync(HATVP_FILE, 'utf-8');
        }
    }

    console.log('⬇️ Downloading HATVP XML data...');
    try {
        const res = await fetch(HATVP_URL);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const xmlData = await res.text();
        fs.writeFileSync(HATVP_FILE, xmlData);
        console.log('✅ HATVP data downloaded');
        return xmlData;
    } catch (error) {
        console.error('⚠️ Failed to download HATVP data:', error);
        if (fs.existsSync(HATVP_FILE)) {
            console.log('📂 Using existing cached HATVP data');
            return fs.readFileSync(HATVP_FILE, 'utf-8');
        }
        throw error;
    }
}

function parseHatvpXml(xmlData: string): HatvpDeclaration[] {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
    });

    const data = parser.parse(xmlData);
    const declarations: HatvpDeclaration[] = [];

    // Navigate the XML structure - adjust based on actual HATVP format
    const declarationsList = data?.declarations?.declaration || data?.root?.declaration || [];
    const declArray = Array.isArray(declarationsList) ? declarationsList : [declarationsList];

    for (const decl of declArray) {
        try {
            // Check if this is a deputy (Assemblée nationale)
            const mandat = decl.mandat?.intitule || decl.mandat || '';
            if (!mandat.toLowerCase().includes('député') && !mandat.toLowerCase().includes('assemblee')) {
                continue;
            }

            const nom = decl.nom || decl.declarant?.nom || '';
            const prenom = decl.prenom || decl.declarant?.prenom || '';

            if (!nom || !prenom) continue;

            // Extract financial participations > 5000€
            const participations: HatvpDeclaration['participationsFinancieres'] = [];

            const parts = decl.participations?.participation ||
                decl.biens?.participations?.participation ||
                [];
            const partArray = Array.isArray(parts) ? parts : (parts ? [parts] : []);

            for (const part of partArray) {
                const montant = parseFloat(part.valeur || part.montant || part.estimation || '0');
                if (montant >= 5000) {
                    participations.push({
                        denomination: part.denomination || part.nom || 'Non spécifié',
                        montant,
                        type: part.nature || part.type || 'Participation'
                    });
                }
            }

            if (participations.length > 0) {
                declarations.push({
                    nom,
                    prenom,
                    mandat,
                    participationsFinancieres: participations
                });
            }
        } catch (e) {
            // Skip malformed entries
        }
    }

    return declarations;
}

async function main() {
    console.log('🔍 HATVP Enrichment Script (US-ETL-005)');
    console.log('========================================\n');

    try {
        // 1. Download HATVP data
        const xmlData = await downloadHatvpData();

        // 2. Parse declarations
        console.log('📋 Parsing HATVP declarations...');
        const declarations = parseHatvpXml(xmlData);
        console.log(`Found ${declarations.length} deputy declarations with participations > 5000€\n`);

        if (declarations.length === 0) {
            console.log('⚠️ No matching declarations found. The XML structure may have changed.');
            console.log('Checking raw XML structure...');
            const parser = new XMLParser();
            const raw = parser.parse(xmlData);
            console.log('Root keys:', Object.keys(raw || {}));
            return;
        }

        // 3. Load all deputies
        const deputies = await prisma.deputy.findMany({
            select: {
                uid: true,
                firstName: true,
                lastName: true
            }
        });
        console.log(`Loaded ${deputies.length} deputies from database\n`);

        // 4. Match and enrich
        let matched = 0;
        let unmatched = 0;

        for (const decl of declarations) {
            const normalizedDeclName = normalizeName(`${decl.prenom} ${decl.nom}`);
            let bestMatch: typeof deputies[0] | null = null;
            let bestDistance = Infinity;

            for (const deputy of deputies) {
                const normalizedDeputyName = normalizeName(`${deputy.firstName} ${deputy.lastName}`);
                const distance = levenshtein(normalizedDeclName, normalizedDeputyName);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = deputy;
                }

                // Early exit if exact match
                if (distance === 0) break;
            }

            // Accept matches with Levenshtein distance < 3
            if (bestMatch && bestDistance < 3) {
                await prisma.deputy.update({
                    where: { uid: bestMatch.uid },
                    data: {
                        hatvpData: {
                            lastUpdated: new Date().toISOString(),
                            participationsFinancieres: decl.participationsFinancieres
                        }
                    }
                });
                matched++;
                console.log(`✅ Matched: ${decl.prenom} ${decl.nom} → ${bestMatch.firstName} ${bestMatch.lastName} (distance: ${bestDistance})`);
            } else {
                unmatched++;
                console.log(`❌ No match: ${decl.prenom} ${decl.nom} (best distance: ${bestDistance})`);
            }
        }

        console.log(`\n========================================`);
        console.log(`✅ Matched: ${matched} deputies`);
        console.log(`❌ Unmatched: ${unmatched} declarations`);
        console.log(`📊 Match rate: ${((matched / (matched + unmatched)) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ HATVP enrichment failed:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🏁 HATVP enrichment completed.');
    }
}

main();
