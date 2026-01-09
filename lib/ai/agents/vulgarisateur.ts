/**
 * US-AI-002: Agent Le Vulgarisateur
 * 
 * Résumé 'ELI5' (Explain Like I'm 5) des lois
 * Input: Texte brut 'Exposé des motifs'
 * Output: { titre_simple, points_cles[] }
 * Cache: Checksum du texte en clé pour éviter double appel
 */

import { z } from 'zod';
import { getMistralClient } from '../mistral-client';
import crypto from 'crypto';

// Output schema
const VulgarisationSchema = z.object({
    titre_simple: z.string().describe('Titre court et compréhensible pour un citoyen'),
    points_cles: z.array(z.string()).describe('3 points d\'impact concret pour un citoyen français'),
    categorie: z.enum(['économie', 'social', 'environnement', 'sécurité', 'éducation', 'santé', 'autre']).optional(),
    niveau_impact: z.enum(['faible', 'moyen', 'fort']).optional()
});

export type VulgarisationResult = z.infer<typeof VulgarisationSchema>;

// Simple in-memory cache (can be replaced with Redis/Vercel KV)
const cache = new Map<string, VulgarisationResult>();

/**
 * Generate a hash of the input text for cache key
 */
function generateCacheKey(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

/**
 * Vulgarise un texte de loi pour le rendre accessible au citoyen
 */
export async function vulgariserLoi(
    exposeDesMotifs: string,
    options: {
        skipCache?: boolean;
        titreLoi?: string;
    } = {}
): Promise<VulgarisationResult> {
    const { skipCache = false, titreLoi } = options;

    // Check cache
    const cacheKey = generateCacheKey(exposeDesMotifs);
    if (!skipCache && cache.has(cacheKey)) {
        console.log('[Vulgarisateur] Cache hit for key:', cacheKey);
        return cache.get(cacheKey)!;
    }

    const client = getMistralClient();

    // Truncate very long texts
    const maxLength = 8000;
    let texte = exposeDesMotifs;
    if (texte.length > maxLength) {
        texte = texte.substring(0, maxLength) + '... [texte tronqué]';
    }

    const prompt = `
Tu es un expert en vulgarisation juridique et politique. 
${titreLoi ? `Le texte concerne : "${titreLoi}"` : ''}

Analyse cet exposé des motifs d'une loi française et explique son impact concret pour un citoyen français moyen.

EXPOSÉ DES MOTIFS :
${texte}

Réponds en JSON avec:
- titre_simple: Un titre court (max 10 mots) qui résume l'essence de cette loi de façon accessible
- points_cles: Exactement 3 points expliquant l'impact CONCRET pour un citoyen (vie quotidienne, droits, finances, etc.)
- categorie: La catégorie principale (économie, social, environnement, sécurité, éducation, santé, ou autre)
- niveau_impact: L'impact estimé sur la vie quotidienne (faible, moyen, fort)

Utilise un langage simple, évite le jargon juridique. Chaque point doit commencer par un emoji pertinent.
`;

    try {
        const result = await client.generateJson(prompt, VulgarisationSchema, {
            model: 'mistral-small-latest',
            systemPrompt: 'Tu es un vulgarisateur expert qui rend les lois compréhensibles pour tous. Réponds UNIQUEMENT en JSON valide.'
        });

        // Store in cache
        cache.set(cacheKey, result);
        console.log('[Vulgarisateur] Cached result for key:', cacheKey);

        return result;
    } catch (error) {
        console.error('[Vulgarisateur] Error:', error);
        throw error;
    }
}

/**
 * Clear the vulgarisation cache
 */
export function clearVulgarisationCache(): void {
    cache.clear();
    console.log('[Vulgarisateur] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: cache.size,
        keys: Array.from(cache.keys())
    };
}
