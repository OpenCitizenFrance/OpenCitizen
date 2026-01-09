"use client";

/**
 * US-UX-003: Mailto Button Component
 * 
 * Génération de deeplinks mailto avec:
 * - Encodage URI strict (accents, sauts de ligne)
 * - Tracking analytics avant ouverture
 * - Cross-platform support (iOS Mail, Gmail Android)
 */

import { useState } from 'react';
import { Mail, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';

interface MailtoButtonProps {
    to: string;
    subject: string;
    body: string;
    deputyName?: string;
    causeId?: string;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    showCopyOption?: boolean;
    onTrack?: (event: TrackingEvent) => void;
}

interface TrackingEvent {
    action: 'mailto_click' | 'copy_email' | 'copy_subject' | 'copy_body';
    deputyEmail?: string;
    causeId?: string;
    timestamp: Date;
}

/**
 * Generate properly encoded mailto URL
 */
export function generateMailtoUrl(
    to: string,
    subject: string,
    body: string
): string {
    // Encode all special characters properly for cross-platform compatibility
    const encodedSubject = encodeURIComponent(subject)
        .replace(/%20/g, '+'); // Some email clients prefer + for spaces in subject

    const encodedBody = encodeURIComponent(body);

    return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}

export function MailtoButton({
    to,
    subject,
    body,
    deputyName,
    causeId,
    className = '',
    variant = 'primary',
    showCopyOption = true,
    onTrack
}: MailtoButtonProps) {
    const [copied, setCopied] = useState<string | null>(null);
    const [showOptions, setShowOptions] = useState(false);

    const mailtoUrl = generateMailtoUrl(to, subject, body);

    const track = (action: TrackingEvent['action']) => {
        const event: TrackingEvent = {
            action,
            deputyEmail: to,
            causeId,
            timestamp: new Date()
        };

        console.log('[MailtoButton] Track:', event);

        // Send to analytics API
        if (onTrack) {
            onTrack(event);
        } else {
            // Default tracking - could be replaced with proper analytics
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            }).catch(console.error);
        }
    };

    const handleMailtoClick = () => {
        track('mailto_click');
        // The actual navigation happens via the href
    };

    const copyToClipboard = async (text: string, type: 'email' | 'subject' | 'body') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            track(`copy_${type}` as TrackingEvent['action']);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const variantStyles = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
    };

    return (
        <div className={`mailto-button-container relative ${className}`}>
            {/* Main button */}
            <a
                href={mailtoUrl}
                onClick={handleMailtoClick}
                className={`
                    inline-flex items-center gap-2 px-6 py-3 rounded-lg
                    font-medium transition-all duration-200
                    ${variantStyles[variant]}
                `}
            >
                <Mail className="w-5 h-5" />
                <span>
                    {deputyName ? `Contacter ${deputyName}` : 'Envoyer l\'email'}
                </span>
                <ExternalLink className="w-4 h-4 opacity-60" />
            </a>

            {/* Copy options dropdown */}
            {showCopyOption && (
                <div className="mt-2 relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <Copy className="w-3 h-3" />
                        Copier le contenu
                    </button>

                    {showOptions && (
                        <div className="absolute top-8 left-0 bg-white rounded-lg shadow-lg border p-2 z-10 min-w-[200px]">
                            <button
                                onClick={() => copyToClipboard(to, 'email')}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 rounded"
                            >
                                <span className="text-gray-700">Email</span>
                                {copied === 'email' ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            <button
                                onClick={() => copyToClipboard(subject, 'subject')}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 rounded"
                            >
                                <span className="text-gray-700">Objet</span>
                                {copied === 'subject' ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            <button
                                onClick={() => copyToClipboard(body, 'body')}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 rounded"
                            >
                                <span className="text-gray-700">Corps du mail</span>
                                {copied === 'body' ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* AI Generated indicator */}
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                <Sparkles className="w-3 h-3" />
                Email généré par IA
            </div>
        </div>
    );
}

/**
 * Preview component for the generated email
 */
export function MailPreview({
    to,
    subject,
    body,
    className = ''
}: {
    to: string;
    subject: string;
    body: string;
    className?: string;
}) {
    return (
        <div className={`mail-preview bg-gray-50 rounded-lg p-4 ${className}`}>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        À
                    </label>
                    <div className="text-gray-900 font-medium">{to}</div>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Objet
                    </label>
                    <div className="text-gray-900 font-medium">{subject}</div>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Message
                    </label>
                    <div className="text-gray-700 whitespace-pre-wrap text-sm mt-1 bg-white p-3 rounded border max-h-[300px] overflow-y-auto">
                        {body}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MailtoButton;
