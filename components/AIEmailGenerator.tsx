"use client";

/**
 * AI Email Generator - Générateur d'emails de lobbying citoyen
 * Génère un email personnalisé pour contacter un député
 */

import { useState } from 'react';
import { Mail, Sparkles, Loader2, Copy, ExternalLink, CheckCircle2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface GeneratedEmail {
    sujet: string;
    salutation: string;
    corps: string;
    formule_politesse: string;
    arguments_cles: string[];
}

interface AIEmailGeneratorProps {
    deputyId: string;
    deputyName: string;
    lawTitle: string;
    causeTitle?: string;
    className?: string;
    onEmailGenerated?: (email: GeneratedEmail, mailtoUrl: string) => void;
}

export function AIEmailGenerator({
    deputyId,
    deputyName,
    lawTitle,
    causeTitle,
    className = '',
    onEmailGenerated
}: AIEmailGeneratorProps) {
    const [email, setEmail] = useState<GeneratedEmail | null>(null);
    const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [position, setPosition] = useState<'soutenir' | 'opposer'>('soutenir');
    const [isDemo, setIsDemo] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateEmail = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deputyId,
                    lawTitle,
                    userPosition: position,
                    causeTitle
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération');
            }

            setEmail(data.email);
            setMailtoUrl(data.mailtoUrl || null);
            setIsDemo(data.demo || false);

            if (onEmailGenerated && data.email) {
                const mailto = data.mailtoUrl ||
                    `mailto:${data.deputyEmail}?subject=${encodeURIComponent(data.email.sujet)}&body=${encodeURIComponent(
                        `${data.email.salutation},\n\n${data.email.corps}\n\n${data.email.formule_politesse}`
                    )}`;
                onEmailGenerated(data.email, mailto);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!email) return;

        const fullText = `${email.salutation},\n\n${email.corps}\n\n${email.formule_politesse}`;
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openMailto = () => {
        if (!email) return;

        const mailto = mailtoUrl ||
            `mailto:?subject=${encodeURIComponent(email.sujet)}&body=${encodeURIComponent(
                `${email.salutation},\n\n${email.corps}\n\n${email.formule_politesse}`
            )}`;

        window.open(mailto, '_blank');
    };

    return (
        <Card className={`overflow-hidden ${className}`}>
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Contacter {deputyName}
                </CardTitle>
                <CardDescription>
                    Générez un email personnalisé avec l'aide de l'IA
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {!email ? (
                    <>
                        {/* Position selector */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Votre position</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant={position === 'soutenir' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPosition('soutenir')}
                                    className="flex-1"
                                >
                                    ✅ Soutenir
                                </Button>
                                <Button
                                    variant={position === 'opposer' ? 'destructive' : 'outline'}
                                    size="sm"
                                    onClick={() => setPosition('opposer')}
                                    className="flex-1"
                                >
                                    ❌ S'opposer
                                </Button>
                            </div>
                        </div>

                        {/* Context */}
                        <div className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium mb-1">Concernant :</p>
                            <p className="text-muted-foreground">{lawTitle}</p>
                            {causeTitle && (
                                <div className="mt-2 pt-2 border-t">
                                    <Badge variant="outline" className="text-xs">
                                        Cause : {causeTitle}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        <Button
                            onClick={generateEmail}
                            disabled={isLoading}
                            className="w-full gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Génération en cours...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Générer un email
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        {isDemo && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                Mode démo - Configurez MISTRAL_API_KEY
                            </Badge>
                        )}

                        {/* Subject */}
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase">Objet</Label>
                            <p className="font-medium">{email.sujet}</p>
                        </div>

                        {/* Email preview */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Aperçu</Label>
                            <div className="p-4 rounded-lg border bg-white dark:bg-gray-950 text-sm space-y-3 max-h-64 overflow-y-auto">
                                <p className="font-medium">{email.salutation},</p>
                                <p className="whitespace-pre-line">{email.corps}</p>
                                <p className="italic">{email.formule_politesse}</p>
                            </div>
                        </div>

                        {/* Key arguments */}
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase">Arguments clés</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {email.arguments_cles.map((arg, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                        {arg}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                            <Button onClick={openMailto} className="flex-1 gap-2">
                                <Mail className="h-4 w-4" />
                                Ouvrir dans ma messagerie
                            </Button>
                            <Button
                                variant="outline"
                                onClick={copyToClipboard}
                                className="gap-2"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        Copié !
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copier
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Reset */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEmail(null)}
                            className="w-full text-muted-foreground"
                        >
                            Régénérer avec d'autres options
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default AIEmailGenerator;
