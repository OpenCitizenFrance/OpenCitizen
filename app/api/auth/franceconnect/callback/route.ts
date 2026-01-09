/**
 * US-UX-001: FranceConnect Callback Handler
 * 
 * Handles the OAuth callback from FranceConnect
 * - Exchanges code for tokens
 * - Fetches user info
 * - Creates/updates user in database
 * - Sets verified=true flag
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const FC_CONFIG = {
    tokenEndpoint: process.env.FRANCECONNECT_TOKEN_URL ||
        'https://fcp.integ01.dev-franceconnect.fr/api/v1/token',
    userInfoEndpoint: process.env.FRANCECONNECT_USERINFO_URL ||
        'https://fcp.integ01.dev-franceconnect.fr/api/v1/userinfo',
    clientId: process.env.FRANCECONNECT_CLIENT_ID || '',
    clientSecret: process.env.FRANCECONNECT_CLIENT_SECRET || '',
    redirectUri: process.env.FRANCECONNECT_REDIRECT_URI ||
        'http://localhost:3000/api/auth/franceconnect/callback'
};

interface FranceConnectUserInfo {
    sub: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    birthdate?: string;
    birthplace?: string;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle errors from FranceConnect
    if (error) {
        console.error('[FranceConnect] Auth error:', error);
        return NextResponse.redirect(
            new URL(`/auth/signin?error=FranceConnectError&message=${error}`, request.url)
        );
    }

    // Validate state
    const storedState = request.cookies.get('fc_state')?.value;
    if (!state || state !== storedState) {
        console.error('[FranceConnect] State mismatch');
        return NextResponse.redirect(
            new URL('/auth/signin?error=StateMismatch', request.url)
        );
    }

    if (!code) {
        console.error('[FranceConnect] No code received');
        return NextResponse.redirect(
            new URL('/auth/signin?error=NoCode', request.url)
        );
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch(FC_CONFIG.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: FC_CONFIG.redirectUri,
                client_id: FC_CONFIG.clientId,
                client_secret: FC_CONFIG.clientSecret
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('[FranceConnect] Token exchange failed:', errorData);
            throw new Error('Token exchange failed');
        }

        const tokens = await tokenResponse.json();
        const accessToken = tokens.access_token;

        // Fetch user info
        const userInfoResponse = await fetch(FC_CONFIG.userInfoEndpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo: FranceConnectUserInfo = await userInfoResponse.json();

        // Create hash of sub for storage (privacy)
        const subHash = crypto.createHash('sha256').update(userInfo.sub).digest('hex');

        // Find or create user
        let user = await prisma.user.findFirst({
            where: {
                accounts: {
                    some: {
                        provider: 'franceconnect',
                        providerAccountId: subHash
                    }
                }
            }
        });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    name: `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'Citoyen',
                    email: userInfo.email,
                    emailVerified: new Date(), // FranceConnect verifies identity
                    accounts: {
                        create: {
                            type: 'oidc',
                            provider: 'franceconnect',
                            providerAccountId: subHash,
                            access_token: accessToken,
                            id_token: tokens.id_token
                        }
                    }
                }
            });

            console.log('[FranceConnect] Created new user:', user.id);
        } else {
            // Update existing user
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: new Date(),
                    name: `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || user.name
                }
            });

            console.log('[FranceConnect] Updated existing user:', user.id);
        }

        // Create session (simplified - in production use NextAuth session)
        const sessionToken = crypto.randomBytes(32).toString('hex');
        await prisma.session.create({
            data: {
                sessionToken,
                userId: user.id,
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // Clear FC cookies and set session
        const response = NextResponse.redirect(new URL('/actions', request.url));

        response.cookies.delete('fc_state');
        response.cookies.delete('fc_nonce');

        response.cookies.set('authjs.session-token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 // 30 days
        });

        return response;

    } catch (error) {
        console.error('[FranceConnect] Callback error:', error);
        return NextResponse.redirect(
            new URL('/auth/signin?error=CallbackError', request.url)
        );
    } finally {
        await prisma.$disconnect();
    }
}
