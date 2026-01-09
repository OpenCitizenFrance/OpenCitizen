"use client";

/**
 * AI Summary Card - Résumé ELI5 d'une loi
 * Affiche un résumé vulgarisé généré par l'IA
 */

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle, Lightbulb, TrendingUp, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AISummary {
    titre_simple: string;
    points_cles: string[];
    categorie: string;
    niveau_impact: 'faible' | 'moyen' | 'fort';
}

interface AISummaryCardProps {
    lawTitle: string;
    exposeText?: string;
    className?: string;
}

const IMPACT_STYLES = {
    faible: { bg: 'bg-green-100', text: 'text-green-700', label: 'Impact faible' },
    moyen: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Impact moyen' },
    fort: { bg: 'bg-red-100', text: 'text-red-700', label: 'Impact fort' }
};

export function AISummaryCard({ lawTitle, exposeText, className = '' }: AISummaryCardProps) {
    const [summary, setSummary] = useState<AISummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    const fetchSummary = async () => {
        if (summary) {
            setIsExpanded(!isExpanded);
            return;
        }

        if (!exposeText) {
            setError("Pas de texte disponible pour l'analyse");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/vulgariser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: exposeText, lawTitle })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération');
            }

            setSummary(data.summary);
            setIsDemo(data.demo || false);
            setIsExpanded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setIsLoading(false);
        }
    };

    const impactStyle = summary ? IMPACT_STYLES[summary.niveau_impact] : null;

    return (
        <Card className={`overflow-hidden ${className}`}>
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Résumé IA
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchSummary}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Analyse...
                            </>
                        ) : summary ? (
                            <>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {isExpanded ? 'Réduire' : 'Afficher'}
                            </>
                        ) : (
                            <>
                                <Lightbulb className="h-4 w-4" />
                                Expliquez-moi
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            {error && (
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                </CardContent>
            )}

            {summary && isExpanded && (
                <CardContent className="pt-4 space-y-4 animate-fade-in">
                    {isDemo && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            Mode démo - Configurez MISTRAL_API_KEY
                        </Badge>
                    )}

                    {/* Simple title */}
                    <div>
                        <h3 className="font-semibold text-lg text-foreground">
                            {summary.titre_simple}
                        </h3>
                    </div>

                    {/* Key points */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Ce qu'il faut retenir
                        </h4>
                        <ul className="space-y-2">
                            {summary.points_cles.map((point, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50"
                                >
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Category and impact */}
                    <div className="flex items-center gap-3 pt-2 border-t">
                        <Badge variant="secondary" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {summary.categorie}
                        </Badge>
                        {impactStyle && (
                            <Badge className={`gap-1 ${impactStyle.bg} ${impactStyle.text}`}>
                                <TrendingUp className="h-3 w-3" />
                                {impactStyle.label}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            )}

            {!summary && !error && !isLoading && (
                <CardContent className="pt-3 pb-4">
                    <p className="text-sm text-muted-foreground">
                        Cliquez sur "Expliquez-moi" pour obtenir un résumé simplifié de cette loi.
                    </p>
                </CardContent>
            )}
        </Card>
    );
}

export default AISummaryCard;
