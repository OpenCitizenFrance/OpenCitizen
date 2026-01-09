import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const dossiers = await prisma.legislativeDossier.findMany({
            where: {
                title: {
                    contains: query,
                    mode: "insensitive"
                }
            },
            select: {
                uid: true,
                title: true,
                type: true,
                status: true
            },
            take: Math.min(limit, 20),
            orderBy: { title: "asc" }
        });

        return NextResponse.json(dossiers);
    } catch (error) {
        console.error("Error searching dossiers:", error);
        return NextResponse.json(
            { error: "Erreur lors de la recherche" },
            { status: 500 }
        );
    }
}
