import { StageType, Chamber } from "@prisma/client";

// Map common organ IDs to human-readable names
const ORGAN_NAMES: Record<string, string> = {
    // Assemblée nationale
    'PO838901': 'Assemblée nationale',
    // Commissions permanentes AN (17e legislature)
    'PO59047': 'Affaires étrangères',
    'PO419610': 'Affaires économiques',
    'PO419604': 'Affaires culturelles et éducation',
    'PO59051': 'Lois',
    'PO59048': 'Finances',
    'PO59046': 'Défense',
    'PO419865': 'Développement durable',
    'PO420120': 'Affaires sociales',
    'PO415287': 'Affaires européennes',
    // Sénat commissions
    'PO211494': 'Finances (Sénat)',
    'PO211491': 'Affaires étrangères (Sénat)',
    'PO211493': 'Affaires sociales (Sénat)',
    'PO211495': 'Lois (Sénat)',
};

/**
 * Resolves an organ ID to a human-readable name
 */
export function resolveOrganName(organId: string | null): string | null {
    if (!organId) return null;
    return ORGAN_NAMES[organId] || null;
}

/**
 * Formats a legislative stage label for display
 * Prefers native label from AN JSON when available
 * Fallback: generates label from stageType + organName
 */
export function formatStageLabel(
    stageType: StageType,
    organName: string | null,
    chamber: Chamber | null,
    nativeLabel?: string | null  // libelleActe.nomCanonique from AN JSON
): string {
    // Use native label if available (from re-seeded data)
    if (nativeLabel) {
        // Add chamber info if not already present
        if (chamber === "ASSEMBLEE_NATIONALE" && !nativeLabel.includes("AN") && !nativeLabel.includes("Assemblée")) {
            return `${nativeLabel} — AN`;
        } else if (chamber === "SENAT" && !nativeLabel.includes("Sénat")) {
            return `${nativeLabel} — Sénat`;
        }
        return nativeLabel;
    }

    // Fallback to generated label from stageType
    const resolvedOrgan = organName ? (ORGAN_NAMES[organName] || organName) : null;

    let label = "";

    // Stage type label
    switch (stageType) {
        case "DEPOT":
            label = "Dépôt";
            if (resolvedOrgan && resolvedOrgan !== 'Assemblée nationale') {
                label += ` (${resolvedOrgan})`;
            }
            break;
        case "COMMISSION_FOND":
            label = resolvedOrgan ? `Commission (${resolvedOrgan})` : "Commission permanente";
            break;
        case "COMMISSION_AVIS":
            label = resolvedOrgan ? `Commission pour avis (${resolvedOrgan})` : "Commission pour avis";
            break;
        case "SEANCE_PUBLIQUE":
            // Try to add more context based on organ
            if (resolvedOrgan && resolvedOrgan !== 'Assemblée nationale') {
                label = `Examen (${resolvedOrgan})`;
            } else {
                label = "Séance publique";
            }
            break;
        case "CMP":
            label = "Commission mixte paritaire";
            break;
        case "LECTURE_DEFINITIVE":
            label = "Lecture définitive";
            break;
        case "CONSEIL_CONSTIT":
            label = "Conseil constitutionnel";
            break;
        case "PROMULGATION":
            label = "Promulgation";
            break;
        default:
            label = stageType;
    }

    // Add chamber info for clarity
    if (chamber === "ASSEMBLEE_NATIONALE" && !label.includes("Assemblée")) {
        label += " — Assemblée nationale";
    } else if (chamber === "SENAT" && !label.includes("Sénat")) {
        label += " — Sénat";
    }

    return label;
}

/**
 * Formats an amendment title based on article context
 * E.g. "Amendement sur l'article 2" or "Amendement"
 */
export function formatAmendmentTitle(articleNumber?: string | null): string {
    if (!articleNumber) return "Amendement";

    // Clean up article number format
    const cleanedArticle = articleNumber.replace(/^(Article|Art\.?)\s*/i, "").trim();

    if (cleanedArticle) {
        return `Amendement sur l'article ${cleanedArticle}`;
    }

    return "Amendement";
}

/**
 * Extracts article number from amendment content or metadata
 */
export function extractArticleNumber(amendment: {
    content?: string | null;
    expose?: string | null;
}): string | null {
    // Try to find article references in content or expose
    const textToSearch = `${amendment.content || ''} ${amendment.expose || ''}`;

    // Match patterns like "Article 2", "Art. 2", "l'article 2", etc.
    const articleMatch = textToSearch.match(/(?:l')?[Aa]rticle?\s*(\d+[A-Za-z]*)/);

    if (articleMatch && articleMatch[1]) {
        return articleMatch[1];
    }

    return null;
}

/**
 * Formats legislative text display name
 */
export function formatTextDisplayName(
    stageType: StageType,
    chamber: Chamber | null,
    numTexte: string | null
): string {
    const chamberLabel = chamber === "ASSEMBLEE_NATIONALE" ? "AN" : chamber === "SENAT" ? "Sénat" : "";
    const baseLabel = formatStageLabel(stageType, null, null);
    const parts = [baseLabel, chamberLabel, numTexte ? `n°${numTexte}` : ""].filter(Boolean);
    return parts.join(" · ");
}
