/**
 * API: Targeting Score - Trouver les meilleurs députés à contacter
 * POST /api/ai/targeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopTargets } from '@/lib/ai/targeting-score';

export async function POST(request: NextRequest) {
    try {
        const { keywords, postalCode, limit = 10 } = await request.json();

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return NextResponse.json(
                { error: 'keywords (array) est requis' },
                { status: 400 }
            );
        }

        const targets = await getTopTargets(keywords, postalCode, limit);

        return NextResponse.json({
            success: true,
            targets: targets.map(t => ({
                deputyId: t.deputyId,
                deputyName: t.deputyName,
                groupName: t.groupName,
                circonscription: t.circonscription,
                scores: t.scores,
                reasoning: generateReasoning(t.scores)
            })),
            query: {
                keywords,
                postalCode,
                limit
            }
        });

    } catch (error) {
        console.error('[API/targeting] Error:', error);
        return NextResponse.json(
            { error: 'Erreur lors du calcul des scores' },
            { status: 500 }
        );
    }
}

function generateReasoning(scores: { rebelle: number; local: number; interet: number; total: number }): string[] {
    const reasons: string[] = [];

    if (scores.rebelle > 50) {
        reasons.push("Vote souvent différemment de son groupe");
    } else if (scores.rebelle > 20) {
        reasons.push("Parfois indépendant dans ses votes");
    }

    if (scores.local >= 100) {
        reasons.push("Élu de votre département");
    } else if (scores.local >= 50) {
        reasons.push("Élu de votre région");
    }

    if (scores.interet > 50) {
        reasons.push("Intérêts déclarés liés à votre cause");
    } else if (scores.interet > 20) {
        reasons.push("Potentiellement concerné par le sujet");
    }

    if (reasons.length === 0) {
        reasons.push("Profil général");
    }

    return reasons;
}
