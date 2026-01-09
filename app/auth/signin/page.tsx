"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, Github, Eye, EyeOff, Check } from "lucide-react";

function SignInForm() {
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");
    const callbackUrl = searchParams.get("callbackUrl") || "/groupes/dashboard";

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl
            });

            if (result?.error) {
                setError("Email ou mot de passe incorrect.");
            } else if (result?.ok) {
                window.location.href = callbackUrl;
            }
        } catch (err) {
            setError("Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubSignIn = () => {
        signIn("github", { callbackUrl });
    };

    return (
        <>
            {registered && (
                <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2 mb-4">
                    <Check className="h-4 w-4" />
                    Compte créé avec succès ! Connectez-vous.
                </div>
            )}

            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
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

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Mot de passe
                        </label>
                        <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                            Mot de passe oublié ?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Votre mot de passe"
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

                <Button
                    type="submit"
                    className="w-full h-11 shadow-lg shadow-primary/25"
                    disabled={isLoading}
                >
                    {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleGitHubSignIn}
            >
                <Github className="mr-2 h-5 w-5" />
                Continuer avec GitHub
            </Button>
        </>
    );
}

export default function SignInPage() {
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
                        <CardTitle className="text-2xl">Connexion</CardTitle>
                        <CardDescription>
                            Accédez à votre espace citoyen
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Suspense fallback={<div className="h-64 flex items-center justify-center">Chargement...</div>}>
                            <SignInForm />
                        </Suspense>
                    </CardContent>
                </Card>

                {/* Sign up link */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Pas encore de compte ?{" "}
                    <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                        S'inscrire
                    </Link>
                </p>
            </div>
        </div>
    );
}
