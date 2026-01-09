import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const [deputyCount, groupCount, voteCount, amendmentCount, lawCount, mandateCount] = await Promise.all([
            prisma.deputy.count(),
            prisma.group.count(),
            prisma.vote.count(),
            prisma.amendment.count(),
            prisma.legislativeDossier.count(),
            prisma.mandate.count()
        ]);

        return NextResponse.json({
            deputies: deputyCount,
            groups: groupCount,
            votes: voteCount,
            amendments: amendmentCount,
            laws: lawCount,
            mandates: mandateCount
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
