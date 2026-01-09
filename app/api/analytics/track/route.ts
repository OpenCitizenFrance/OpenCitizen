/**
 * US-UX-003: Analytics Tracking API
 * 
 * Endpoint pour tracker les actions des utilisateurs
 * (mailto_click, copy_email, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';

interface TrackingEvent {
    action: string;
    deputyEmail?: string;
    causeId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

// In-memory store for demo (replace with database in production)
const eventLog: TrackingEvent[] = [];

export async function POST(request: NextRequest) {
    try {
        const event: TrackingEvent = await request.json();

        // Validate required fields
        if (!event.action) {
            return NextResponse.json(
                { error: 'Action is required' },
                { status: 400 }
            );
        }

        // Add server timestamp
        const enrichedEvent = {
            ...event,
            timestamp: new Date(),
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || 'unknown'
        };

        // Store event (in production, save to database)
        eventLog.push(enrichedEvent);

        console.log('[Analytics] Event tracked:', enrichedEvent);

        // TODO: In production, save to database
        // await prisma.analyticsEvent.create({ data: enrichedEvent });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Analytics] Error tracking event:', error);
        return NextResponse.json(
            { error: 'Failed to track event' },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return recent events (for admin dashboard)
    return NextResponse.json({
        events: eventLog.slice(-100),
        total: eventLog.length
    });
}
