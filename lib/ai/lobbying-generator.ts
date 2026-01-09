/**
 * US-AI-005: Générateur d'Arguments de Lobbying
 * 
 * Rédaction d'email persuasive personnalisée
 * - Variables injectées: Bio Député, Texte Loi, Position User
 * - Adaptation du ton: 'Économique' pour Droite, 'Social' pour Gauche
 * - Output: Sujet et Corps du mail formatés
 */

import { z } from 'zod';
import { getMistralClient } from './mistral-client';

// Output schema
const LobbyingEmailSchema = z.object({
    sujet: z.string().describe('Objet de l\'email'),
    corps: z.string().describe('Corps de l\'email complet'),
    salutation: z.string().describe('Formule d\'appel'),
    formule_politesse: z.string().describe('Formule de politesse finale'),
    arguments_cles: z.array(z.string()).describe('Arguments principaux utilisés')
});

export type LobbyingEmail = z.infer<typeof LobbyingEmailSchema>;

// Political orientation mapping
const GROUP_ORIENTATION: Record<string, 'droite' | 'gauche' | 'centre'> = {
    'RN': 'droite',
    'UDR': 'droite',
    'DR': 'droite',
    'EPR': 'centre',
    'HOR': 'centre',
    'Dem': 'centre',
    'LIOT': 'centre',
    'EcoS': 'gauche',
    'SOC': 'gauche',
    'GDR': 'gauche',
    'LFI-NFP': 'gauche',
    'NI': 'centre'
};

interface DeputyProfile {
    firstName: string;
    lastName: string;
    civilite?: string;
    groupAcronym?: string;
    circonscription?: string;
    email?: string;
}

export interface LobbyingContext {
    deputy: DeputyProfile;
    lawTitle: string;
    lawSummary: string;
    userPosition: 'soutenir' | 'combattre';
    userArguments?: string[];
    userName?: string;
    userLocation?: string;
}

/**
 * Get tone guidelines based on political orientation
 */
function getToneGuidelines(orientation: 'droite' | 'gauche' | 'centre'): string {
    switch (orientation) {
        case 'droite':
            return `
Ton: Économique et pragmatique
- Mets en avant l'impact sur l'économie, l'emploi, les entreprises
- Valorise la liberté individuelle et la responsabilité
- Utilise des arguments chiffrés et factuels
- Évite le jargon militant de gauche
`;
        case 'gauche':
            return `
Ton: Social et solidaire
- Mets en avant l'impact sur les personnes vulnérables et les inégalités
- Valorise la solidarité et les droits sociaux
- Utilise des témoignages et l'aspect humain
- Évite le jargon économique libéral
`;
        case 'centre':
            return `
Ton: Équilibré et rationnel
- Présente une approche pragmatique et nuancée
- Valorise le dialogue et le compromis
- Utilise des arguments basés sur l'intérêt général
- Évite les positions trop tranchées
`;
    }
}

/**
 * Generate a personalized lobbying email
 */
export async function generateLobbyingEmail(
    context: LobbyingContext
): Promise<LobbyingEmail & { mailtoUrl: string }> {
    const { deputy, lawTitle, lawSummary, userPosition, userArguments, userName, userLocation } = context;

    const client = getMistralClient();

    // Determine political orientation
    const orientation = GROUP_ORIENTATION[deputy.groupAcronym || ''] || 'centre';
    const toneGuidelines = getToneGuidelines(orientation);

    const positionText = userPosition === 'soutenir'
        ? 'soutenir et voter en faveur de'
        : 's\'opposer et voter contre';

    const prompt = `
Tu es un expert en communication politique et en lobbying citoyen éthique.

PROFIL DU DÉPUTÉ CIBLE:
- Nom: ${deputy.civilite || 'M.'} ${deputy.firstName} ${deputy.lastName}
- Groupe politique: ${deputy.groupAcronym || 'Non inscrit'}
- Circonscription: ${deputy.circonscription || 'Non spécifiée'}

LOI CONCERNÉE:
Titre: ${lawTitle}
Résumé: ${lawSummary}

POSITION DU CITOYEN: ${positionText} cette loi
${userArguments?.length ? `Arguments du citoyen:\n${userArguments.map((a, i) => `${i + 1}. ${a}`).join('\n')}` : ''}

INFORMATIONS SUR L'EXPÉDITEUR:
${userName ? `Nom: ${userName}` : 'Citoyen anonyme'}
${userLocation ? `Localisation: ${userLocation}` : ''}

${toneGuidelines}

Génère un email de lobbying citoyen RESPECTUEUX et PROFESSIONNEL. L'email doit:
1. Être courtois et respecter la fonction élective
2. Expliquer clairement la position du citoyen
3. Utiliser des arguments adaptés à l'orientation politique du député
4. Être concis (max 300 mots pour le corps)
5. Inclure un appel à l'action clair

Réponds en JSON avec:
- sujet: L'objet de l'email (court et impactant)
- corps: Le corps de l'email (sans salutation ni formule de politesse)
- salutation: La formule d'appel appropriée
- formule_politesse: La formule de politesse de fin
- arguments_cles: Liste des 3 arguments principaux utilisés
`;

    try {
        const email = await client.generateJson(prompt, LobbyingEmailSchema, {
            model: 'mistral-large-latest',
            systemPrompt: 'Tu es un rédacteur expert en communication citoyenne. Génère des emails professionnels et persuasifs. Réponds UNIQUEMENT en JSON valide.'
        });

        // Generate mailto URL
        const fullEmail = `${email.salutation}\n\n${email.corps}\n\n${email.formule_politesse}`;
        const mailtoUrl = generateMailtoUrl(
            deputy.email || '',
            email.sujet,
            fullEmail
        );

        return {
            ...email,
            mailtoUrl
        };
    } catch (error) {
        console.error('[LobbyingGenerator] Error:', error);
        throw error;
    }
}

/**
 * Generate a properly encoded mailto URL
 * US-UX-003: Encodage URI strict (accents, sauts de ligne)
 */
export function generateMailtoUrl(
    to: string,
    subject: string,
    body: string
): string {
    // Encode subject and body with proper URI encoding for all special characters
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Generate multiple email variants for A/B testing
 */
export async function generateEmailVariants(
    context: LobbyingContext,
    count: number = 3
): Promise<LobbyingEmail[]> {
    const variants: LobbyingEmail[] = [];

    for (let i = 0; i < count; i++) {
        const email = await generateLobbyingEmail(context);
        variants.push(email);
    }

    return variants;
}
