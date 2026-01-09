/**
 * API: Générer un email de lobbying
 * POST /api/ai/generate-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateLobbyingEmail } from '@/lib/ai/lobbying-generator';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { deputyId, lawTitle, userPosition, causeTitle, userName } = body;

        if (!deputyId || !lawTitle || !userPosition) {
            return NextResponse.json(
                { error: 'deputyId, lawTitle et userPosition sont requis' },
                { status: 400 }
            );
        }

        // Fetch deputy info
        const deputy = await prisma.deputy.findUnique({
            where: { uid: deputyId },
            include: {
                mandates: {
                    where: { endDate: null, groupId: { not: null } },
                    include: { group: true },
                    take: 1
                }
            }
        });

        if (!deputy) {
            return NextResponse.json(
                { error: 'Député non trouvé' },
                { status: 404 }
            );
        }

        const group = deputy.mandates[0]?.group;
        const deputyData = deputy as typeof deputy & { email?: string | null; circonscription?: string | null };

        // Check if Mistral API key is configured
        if (!process.env.MISTRAL_API_KEY) {
            // Return mock data for demo
            const salutation = deputy.firstName.match(/^[AEIOUY]/i)
                ? `Cher ${deputy.firstName}`
                : `Cher Monsieur ${deputy.lastName}`;

            const positionText = userPosition === 'soutenir' ? 'soutenir' : 'exprimer mes préoccupations concernant';

            return NextResponse.json({
                success: true,
                demo: true,
                email: {
                    sujet: `Citoyen concerné par : ${lawTitle}`,
                    salutation,
                    corps: `Je me permets de vous écrire en tant que citoyen(ne) de votre circonscription concernant le projet de loi "${lawTitle}".\n\nJe souhaite ${positionText} ce texte pour les raisons suivantes :\n\n1. [Votre premier argument]\n2. [Votre deuxième argument]\n3. [Votre troisième argument]\n\nEn tant que représentant(e) du peuple, votre vote sur ce sujet aura un impact direct sur notre quotidien. Je vous serais reconnaissant(e) de prendre en considération l'avis de vos électeurs.\n\nJe reste à votre disposition pour échanger sur ce sujet important.`,
                    formule_politesse: "Je vous prie d'agréer, Monsieur le Député, l'expression de mes salutations distinguées.",
                    arguments_cles: [
                        "Impact sur les citoyens",
                        "Cohérence avec les valeurs républicaines",
                        "Conséquences économiques"
                    ]
                },
                deputyEmail: deputyData.email || `${deputy.firstName.toLowerCase()}.${deputy.lastName.toLowerCase()}@assemblee-nationale.fr`,
                message: "Mode démo - Configurez MISTRAL_API_KEY pour l'IA réelle"
            });
        }

        const result = await generateLobbyingEmail({
            deputy: {
                firstName: deputy.firstName,
                lastName: deputy.lastName,
                groupAcronym: group?.acronym || undefined,
                circonscription: deputyData.circonscription || undefined
            },
            lawTitle,
            lawSummary: `Concernant le projet de loi "${causeTitle || lawTitle}"`,
            userPosition: userPosition === 'soutenir' ? 'soutenir' : 'combattre',
            userName
        });

        return NextResponse.json({
            success: true,
            email: {
                sujet: result.sujet,
                salutation: result.salutation,
                corps: result.corps,
                formule_politesse: result.formule_politesse,
                arguments_cles: result.arguments_cles
            },
            mailtoUrl: result.mailtoUrl,
            deputyEmail: deputyData.email || `${deputy.firstName.toLowerCase()}.${deputy.lastName.toLowerCase()}@assemblee-nationale.fr`
        });

    } catch (error) {
        console.error('[API/generate-email] Error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération de l\'email' },
            { status: 500 }
        );
    }
}
