"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await requestPasswordReset(email);

            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || "Une erreur est survenue.");
            }
        } catch (err) {
            setError("Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold gradient-text">OpenCitizen</span>
                </Link>

                <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
                        <CardDescription>
                            {success
                                ? "Vérifiez votre boîte mail"
                                : "Entrez votre email pour réinitialiser votre mot de passe"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {success ? (
                            <div className="text-center py-4 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium mb-2">Email envoyé !</p>
                                    <p className="text-sm text-muted-foreground">
                                        Si un compte existe avec l'adresse <span className="font-medium text-foreground">{email}</span>,
                                        vous recevrez un lien de réinitialisation.
                                    </p>
                                </div>
                                <Link href="/auth/signin">
                                    <Button variant="outline" className="mt-4">
                                        Retour à la connexion
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Adresse email
                                        </label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="jean@example.com"
                                            className="h-11"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 shadow-lg shadow-primary/25"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/auth/signin"
                                        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-3 w-3" />
                                        Retour à la connexion
                                    </Link>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
