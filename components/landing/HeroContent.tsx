"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroContent() {
    return (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
            {/* Glass card container */}
            <div className="glass rounded-3xl p-8 md:p-12 max-w-3xl mx-auto backdrop-blur-xl">
                <Badge className="mb-6 px-4 py-1.5 text-sm gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Plateforme citoyenne open source
                </Badge>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                    Suivez l'activité de
                    <span className="block gradient-text mt-2">l'Assemblée Nationale</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                    Analysez les votes, suivez vos députés, et rejoignez des causes citoyennes
                    pour influencer la fabrique de la loi.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/signup">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto gap-2 text-lg px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all"
                        >
                            Créer un compte gratuit
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/auth/signin">
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto gap-2 text-lg px-8 py-6 bg-background/50 backdrop-blur-sm"
                        >
                            Se connecter
                        </Button>
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground mt-6">
                    Déjà <span className="font-semibold text-foreground">2,500+</span> citoyens actifs
                </p>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
                    <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}
