/**
 * API: Vulgariser une loi (ELI5)
 * POST /api/ai/vulgariser
 */

import { NextRequest, NextResponse } from 'next/server';
import { vulgariserLoi } from '@/lib/ai/agents/vulgarisateur';

export async function POST(request: NextRequest) {
    try {
        const { text, lawTitle } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Le texte est requis' },
                { status: 400 }
            );
        }

        // Check if Mistral API key is configured
        if (!process.env.MISTRAL_API_KEY) {
            // Return mock data for demo
            return NextResponse.json({
                success: true,
                demo: true,
                summary: {
                    titre_simple: lawTitle || "Résumé de la loi",
                    points_cles: [
                        "🏛️ Cette loi vise à améliorer le fonctionnement des institutions",
                        "👥 Elle concerne directement les citoyens dans leur quotidien",
                        "💶 Des implications économiques sont à prévoir"
                    ],
                    categorie: "Institutions",
                    niveau_impact: "moyen" as const
                },
                message: "Mode démo - Configurez MISTRAL_API_KEY pour l'IA réelle"
            });
        }

        const summary = await vulgariserLoi(text);

        return NextResponse.json({
            success: true,
            summary
        });

    } catch (error) {
        console.error('[API/vulgariser] Error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la vulgarisation' },
            { status: 500 }
        );
    }
}
