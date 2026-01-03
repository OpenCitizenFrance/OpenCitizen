"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Target, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NouvelleCausePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;

        try {
            const res = await fetch("/api/causes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erreur lors de la création");
            }

            const cause = await res.json();
            router.push(`/causes/${cause.slug}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="space-y-4">
                <Link
                    href="/causes"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux causes
                </Link>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-background p-6 md:p-8">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-sm font-medium">
                            <Target className="h-4 w-4" />
                            Nouvelle cause
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Créer une cause citoyenne</h1>
                        <p className="text-muted-foreground max-w-lg">
                            Mobilisez d'autres citoyens autour d'une cause qui vous tient à cœur. Ensemble, influencez la fabrique de la loi.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-orange-500" />
                        Détails de la cause
                    </CardTitle>
                    <CardDescription>
                        Décrivez votre cause pour attirer des citoyens partageant vos valeurs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Titre de la cause *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Ex: Pour une transparence totale des votes"
                                required
                                minLength={10}
                                maxLength={100}
                                className="h-11"
                            />
                            <p className="text-xs text-muted-foreground">
                                Un titre clair et accrocheur (10-100 caractères)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Décrivez votre cause en détail : pourquoi est-elle importante ? Quels sont les objectifs ? Comment les citoyens peuvent-ils contribuer ?"
                                required
                                minLength={50}
                                maxLength={2000}
                                rows={6}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Une description détaillée (50-2000 caractères)
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="gap-2 shadow-lg shadow-primary/25"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Créer ma cause
                                    </>
                                )}
                            </Button>
                            <Link href="/causes">
                                <Button type="button" variant="ghost">
                                    Annuler
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Info */}
            <div className="text-center text-sm text-muted-foreground">
                En créant une cause, vous en devenez automatiquement le premier membre.
            </div>
        </div>
    );
}
