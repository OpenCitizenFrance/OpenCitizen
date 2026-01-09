/**
 * US-AI-003: Agent Analyseur de Différences
 * 
 * Analyse sémantique des amendements
 * - Calcul du diff technique (lignes modifiées)
 * - Classification forme vs fond
 * - Génération de la 'Magic Note' explicative
 */

import { z } from 'zod';
import { getMistralClient } from '../mistral-client';

// Output schema for diff analysis
const DiffAnalysisSchema = z.object({
    type_modification: z.enum(['forme', 'fond', 'mixte']).describe('Type de changement'),
    resume: z.string().describe('Résumé en 1-2 phrases du changement'),
    magic_note: z.string().describe('Explication détaillée et accessible de l\'impact'),
    mots_cles: z.array(z.string()).describe('Mots-clés principaux affectés'),
    importance: z.enum(['mineure', 'moyenne', 'majeure']).describe('Niveau d\'importance du changement'),
    beneficiaires: z.array(z.string()).optional().describe('Qui bénéficie de ce changement'),
    perdants: z.array(z.string()).optional().describe('Qui est défavorisé par ce changement')
});

export type DiffAnalysisResult = z.infer<typeof DiffAnalysisSchema>;

interface DiffLine {
    type: 'add' | 'remove' | 'unchanged';
    content: string;
    lineNumber: number;
}

/**
 * Calculate technical diff between two texts
 * Returns lines with their modification status
 */
export function calculateDiff(original: string, modified: string): {
    lines: DiffLine[];
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
} {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    // Simple line-by-line diff (could be enhanced with proper LCS algorithm)
    const result: DiffLine[] = [];
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    const maxLen = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLen; i++) {
        const origLine = originalLines[i];
        const modLine = modifiedLines[i];

        if (origLine === modLine) {
            if (origLine !== undefined) {
                result.push({ type: 'unchanged', content: origLine, lineNumber: i + 1 });
                unchangedCount++;
            }
        } else {
            if (origLine !== undefined) {
                result.push({ type: 'remove', content: origLine, lineNumber: i + 1 });
                removedCount++;
            }
            if (modLine !== undefined) {
                result.push({ type: 'add', content: modLine, lineNumber: i + 1 });
                addedCount++;
            }
        }
    }

    return { lines: result, addedCount, removedCount, unchangedCount };
}

/**
 * Generate HTML diff markup for display
 */
export function generateDiffHtml(lines: DiffLine[]): string {
    return lines.map(line => {
        switch (line.type) {
            case 'add':
                return `<div class="diff-add" style="background-color: #d4edda; color: #155724;">+ ${escapeHtml(line.content)}</div>`;
            case 'remove':
                return `<div class="diff-remove" style="background-color: #f8d7da; color: #721c24;">- ${escapeHtml(line.content)}</div>`;
            default:
                return `<div class="diff-unchanged">${escapeHtml(line.content)}</div>`;
        }
    }).join('\n');
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Analyze the semantic meaning of changes between two text versions
 */
export async function analyzerDiff(
    textAvant: string,
    textApres: string,
    options: {
        contexte?: string;  // e.g., "Article 3 du projet de loi sur les retraites"
    } = {}
): Promise<DiffAnalysisResult & { diffHtml: string; stats: { added: number; removed: number } }> {
    const { contexte } = options;

    // Calculate technical diff
    const diff = calculateDiff(textAvant, textApres);

    // If no changes, return early
    if (diff.addedCount === 0 && diff.removedCount === 0) {
        return {
            type_modification: 'forme',
            resume: 'Aucune modification détectée.',
            magic_note: 'Le texte n\'a pas été modifié.',
            mots_cles: [],
            importance: 'mineure',
            diffHtml: '',
            stats: { added: 0, removed: 0 }
        };
    }

    const client = getMistralClient();

    // Prepare the diff summary for AI analysis
    const changedLines = diff.lines.filter(l => l.type !== 'unchanged');
    const diffSummary = changedLines.slice(0, 50).map(l =>
        `${l.type === 'add' ? '+' : '-'} ${l.content}`
    ).join('\n');

    const prompt = `
Tu es un expert en analyse législative française.
${contexte ? `Contexte : ${contexte}` : ''}

Voici les modifications apportées à un texte de loi :

SUPPRESSIONS (lignes originales) :
${diff.lines.filter(l => l.type === 'remove').map(l => l.content).join('\n') || 'Aucune'}

AJOUTS (nouvelles lignes) :
${diff.lines.filter(l => l.type === 'add').map(l => l.content).join('\n') || 'Aucun'}

Statistiques : ${diff.addedCount} lignes ajoutées, ${diff.removedCount} lignes supprimées

Analyse ces modifications et réponds en JSON avec :
- type_modification: "forme" (reformulation, clarification, fautes), "fond" (changement de sens, nouvelles obligations/droits), ou "mixte"
- resume: Résumé en 1-2 phrases du changement principal
- magic_note: Explication détaillée et accessible (2-3 paragraphes) de l'IMPACT de ce changement pour les citoyens
- mots_cles: 3-5 mots-clés principaux affectés
- importance: "mineure", "moyenne", ou "majeure"
- beneficiaires: Liste des groupes qui bénéficient de ce changement (si applicable)
- perdants: Liste des groupes défavorisés (si applicable)
`;

    try {
        const analysis = await client.generateJson(prompt, DiffAnalysisSchema, {
            model: 'mistral-large-latest',
            systemPrompt: 'Tu es un analyste législatif expert. Réponds UNIQUEMENT en JSON valide.'
        });

        return {
            ...analysis,
            diffHtml: generateDiffHtml(diff.lines),
            stats: { added: diff.addedCount, removed: diff.removedCount }
        };
    } catch (error) {
        console.error('[DiffAnalyzer] Error:', error);
        throw error;
    }
}

/**
 * Quick classification without full analysis
 */
export async function classifyModification(
    textAvant: string,
    textApres: string
): Promise<'forme' | 'fond' | 'mixte'> {
    const client = getMistralClient();

    const prompt = `
Compare ces deux versions d'un texte de loi et réponds par UN SEUL MOT :
- "forme" si c'est juste une reformulation ou correction
- "fond" si le sens ou les obligations changent
- "mixte" si les deux

AVANT:
${textAvant.substring(0, 1000)}

APRÈS:
${textApres.substring(0, 1000)}
`;

    const response = await client.chat([
        { role: 'user', content: prompt }
    ], { model: 'mistral-small-latest', temperature: 0.1, maxTokens: 10 });

    const word = response.toLowerCase().trim();
    if (word.includes('fond')) return 'fond';
    if (word.includes('mixte')) return 'mixte';
    return 'forme';
}
