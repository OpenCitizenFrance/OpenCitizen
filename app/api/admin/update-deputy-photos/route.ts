import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
    try {
        // Update all deputies with photo URLs in a single query
        const result = await prisma.$executeRaw`
            UPDATE "Deputy" 
            SET "imageUrl" = CONCAT('https://www.assemblee-nationale.fr/dyn/deputes/', uid, '/image')
        `;

        return NextResponse.json({
            success: true,
            message: `Updated ${result} deputies with photo URLs`
        });
    } catch (error) {
        console.error('Error updating deputy photos:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
