import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Users,
  Vote as VoteIcon,
  Target,
  FileText,
  Sparkles,
  Eye,
  Bell,
  TrendingUp,
  CheckCircle2,
  Shield,
  Zap
} from "lucide-react";

// Dynamic import for scrollytelling component (client-side only for Framer Motion)
const CitizenScroll = dynamic(
  () => import("@/components/CitizenScroll").then((mod) => mod.CitizenScroll),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-screen w-full flex flex-col items-center justify-center"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <div className="w-24 h-24 rounded-full border-2 border-white/20 animate-pulse" />
        <p className="mt-6 text-white/60 text-sm tracking-widest uppercase">
          Chargement...
        </p>
      </div>
    )
  }
);

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Scrollytelling Experience */}
      <CitizenScroll />

      {/* Stats Bar */}
      <section className="border-y bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">577</p>
              <p className="text-sm text-muted-foreground">Députés suivis</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">12</p>
              <p className="text-sm text-muted-foreground">Groupes politiques</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">4,900+</p>
              <p className="text-sm text-muted-foreground">Scrutins analysés</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground">Données publiques</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Comment ça marche</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Devenez un citoyen éclairé en 3 étapes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              OpenCitizen vous donne les outils pour comprendre et suivre l'activité parlementaire.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative h-full bg-card border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8 pb-6 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-primary mb-2">Étape 1</div>
                  <h3 className="text-xl font-semibold mb-3">Suivez vos députés</h3>
                  <p className="text-muted-foreground">
                    Trouvez les députés de votre circonscription et suivez leur activité en temps réel.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative h-full bg-card border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8 pb-6 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <Eye className="h-8 w-8 text-accent" />
                  </div>
                  <div className="text-sm font-medium text-accent mb-2">Étape 2</div>
                  <h3 className="text-xl font-semibold mb-3">Analysez les votes</h3>
                  <p className="text-muted-foreground">
                    Consultez les scrutins, comparez les positions des groupes politiques sur chaque texte.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative h-full bg-card border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8 pb-6 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="text-sm font-medium text-orange-500 mb-2">Étape 3</div>
                  <h3 className="text-xl font-semibold mb-3">Rejoignez des causes</h3>
                  <p className="text-muted-foreground">
                    Mobilisez-vous avec d'autres citoyens sur les sujets qui vous tiennent à cœur.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Fonctionnalités</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils puissants pour suivre et comprendre l'activité parlementaire.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                    <VoteIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Suivi des scrutins</h3>
                    <p className="text-sm text-muted-foreground">
                      Tous les votes de l'Assemblée en temps réel avec analyse détaillée.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 shrink-0">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Textes de loi</h3>
                    <p className="text-sm text-muted-foreground">
                      Parcourez les projets et propositions de loi avec leur parcours législatif.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10 shrink-0">
                    <Bell className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Alertes personnalisées</h3>
                    <p className="text-sm text-muted-foreground">
                      Soyez notifié dès qu'un député que vous suivez vote.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 shrink-0">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Statistiques</h3>
                    <p className="text-sm text-muted-foreground">
                      Comparez l'activité des groupes et des députés avec des graphiques.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-orange-500/10 shrink-0">
                    <Target className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Causes citoyennes</h3>
                    <p className="text-sm text-muted-foreground">
                      Créez ou rejoignez des mobilisations sur des sujets qui comptent.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10 shrink-0">
                    <Shield className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Open Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Données 100% issues des sources officielles de l'Assemblée.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold">Gratuit</h3>
              <p className="text-sm text-muted-foreground">Accès complet sans frais</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-semibold">Transparent</h3>
              <p className="text-sm text-muted-foreground">Code source ouvert</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <h3 className="font-semibold">Temps réel</h3>
              <p className="text-sm text-muted-foreground">Mises à jour quotidiennes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à devenir un citoyen éclairé ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoignez des milliers de citoyens qui suivent l'activité de leurs représentants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8 py-6 shadow-xl shadow-primary/25">
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/deputies">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-lg px-8 py-6">
                Explorer sans compte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">OpenCitizen</span>
            </div>

            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/deputies" className="hover:text-foreground transition-colors">Députés</Link>
              <Link href="/groupes" className="hover:text-foreground transition-colors">Groupes</Link>
              <Link href="/textes" className="hover:text-foreground transition-colors">Textes de loi</Link>
              <Link href="/causes" className="hover:text-foreground transition-colors">Causes</Link>
            </nav>

            <p className="text-sm text-muted-foreground">
              © 2024 OpenCitizen. Open Source.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
