/**
 * US-UX-001: FranceConnect Integration
 * 
 * OAuth OIDC integration with FranceConnect
 * 
 * Note: This is a template implementation. 
 * FranceConnect requires a developer account and approved application.
 * See: https://partenaires.franceconnect.gouv.fr/
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// FranceConnect configuration
const FC_CONFIG = {
    // Development endpoints (use production for real deployment)
    authorizationEndpoint: process.env.FRANCECONNECT_AUTH_URL ||
        'https://fcp.integ01.dev-franceconnect.fr/api/v1/authorize',
    tokenEndpoint: process.env.FRANCECONNECT_TOKEN_URL ||
        'https://fcp.integ01.dev-franceconnect.fr/api/v1/token',
    userInfoEndpoint: process.env.FRANCECONNECT_USERINFO_URL ||
        'https://fcp.integ01.dev-franceconnect.fr/api/v1/userinfo',
    clientId: process.env.FRANCECONNECT_CLIENT_ID || '',
    clientSecret: process.env.FRANCECONNECT_CLIENT_SECRET || '',
    redirectUri: process.env.FRANCECONNECT_REDIRECT_URI ||
        'http://localhost:3000/api/auth/franceconnect/callback',
    scopes: ['openid', 'given_name', 'family_name', 'email', 'birthdate', 'birthplace']
};

/**
 * Initiate FranceConnect OAuth flow
 */
export async function GET(request: NextRequest) {
    // Check if FranceConnect is configured
    if (!FC_CONFIG.clientId) {
        return NextResponse.json(
            {
                error: 'FranceConnect non configuré',
                message: 'Veuillez configurer FRANCECONNECT_CLIENT_ID dans les variables d\'environnement',
                fallback: '/api/auth/signin'
            },
            { status: 503 }
        );
    }

    // Generate state and nonce for security
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    // Store state in cookie for verification
    const response = NextResponse.redirect(buildAuthorizationUrl(state, nonce));

    response.cookies.set('fc_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600 // 10 minutes
    });

    response.cookies.set('fc_nonce', nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600
    });

    return response;
}

function buildAuthorizationUrl(state: string, nonce: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: FC_CONFIG.clientId,
        redirect_uri: FC_CONFIG.redirectUri,
        scope: FC_CONFIG.scopes.join(' '),
        state,
        nonce,
        acr_values: 'eidas1' // Level of assurance
    });

    return `${FC_CONFIG.authorizationEndpoint}?${params.toString()}`;
}
