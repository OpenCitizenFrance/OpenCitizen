import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ dossiers: [], amendments: [] });
    }

    try {
        // Search across Dossiers and Amendments in parallel
        const [dossiers, amendments] = await Promise.all([
            prisma.legislativeDossier.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { uid: { contains: query, mode: 'insensitive' } },
                        { title_parsed: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 10,
                orderBy: { uid: 'desc' }
            }),
            prisma.amendment.findMany({
                where: {
                    OR: [
                        { content: { contains: query, mode: 'insensitive' } },
                        { expose: { contains: query, mode: 'insensitive' } },
                        { uid: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            imageUrl: true
                        }
                    },
                    law: {
                        select: {
                            title: true
                        }
                    }
                },
                take: 10,
                orderBy: { uid: 'desc' }
            })
        ]);

        const { cleanHtml } = require('@/lib/text-utils');

        const cleanedDossiers = dossiers.map(d => ({
            ...d,
            title: cleanHtml(d.title)
        }));

        const cleanedAmendments = amendments.map(a => ({
            ...a,
            expose: cleanHtml(a.expose),
            law: {
                ...a.law,
                title: cleanHtml(a.law?.title)
            }
        }));

        return NextResponse.json({ dossiers: cleanedDossiers, amendments: cleanedAmendments });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
