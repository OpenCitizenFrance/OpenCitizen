import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCause } from "@/lib/causes";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Vous devez être connecté pour créer une cause" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, description, targetDeputyIds, targetDossierIds } = body;

        // Validation
        if (!title || title.length < 10 || title.length > 100) {
            return NextResponse.json(
                { error: "Le titre doit contenir entre 10 et 100 caractères" },
                { status: 400 }
            );
        }

        if (!description || description.length < 50 || description.length > 2000) {
            return NextResponse.json(
                { error: "La description doit contenir entre 50 et 2000 caractères" },
                { status: 400 }
            );
        }

        const cause = await createCause({
            title,
            description,
            creatorId: session.user.id,
            targetDeputyIds,
            targetDossierIds,
        });

        return NextResponse.json(cause, { status: 201 });
    } catch (error) {
        console.error("Error creating cause:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création de la cause" },
            { status: 500 }
        );
    }
}
