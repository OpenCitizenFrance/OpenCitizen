"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { resetPassword } from "@/lib/auth-actions";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                    <p className="font-medium mb-2">Lien invalide</p>
                    <p className="text-sm text-muted-foreground">
                        Ce lien de réinitialisation est invalide ou a expiré.
                    </p>
                </div>
                <Link href="/auth/forgot-password">
                    <Button variant="outline" className="mt-4">
                        Demander un nouveau lien
                    </Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setIsLoading(false);
            return;
        }

        try {
            const result = await resetPassword(token, password);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/auth/signin?reset=true");
                }, 2000);
            } else {
                setError(result.error || "Une erreur est survenue.");
            }
        } catch (err) {
            setError("Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                    <p className="font-medium mb-2">Mot de passe réinitialisé !</p>
                    <p className="text-sm text-muted-foreground">
                        Redirection vers la page de connexion...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Nouveau mot de passe
                    </label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 8 caractères"
                            className="h-11 pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirmer le mot de passe
                    </label>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retapez votre mot de passe"
                        className="h-11"
                        required
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 shadow-lg shadow-primary/25"
                    disabled={isLoading}
                >
                    {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                </Button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
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
                        <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
                        <CardDescription>
                            Choisissez un nouveau mot de passe sécurisé
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Suspense fallback={<div className="h-48 flex items-center justify-center">Chargement...</div>}>
                            <ResetPasswordForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
