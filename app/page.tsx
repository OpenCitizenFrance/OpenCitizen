import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hemicycle } from "@/components/Hemicycle";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowRight, Users, Vote as VoteIcon, Target, TrendingUp, FileText, Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const [recentVotes, popularCauses, deputyCount, groupStats] = await Promise.all([
    prisma.vote.findMany({
      orderBy: { date: 'desc' },
      take: 5
    }),
    prisma.cause.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { memberCount: 'desc' },
      take: 3
    }),
    prisma.deputy.count(),
    prisma.group.findMany({
      include: {
        mandates: {
          where: { endDate: null }
        }
      }
    })
  ]);

  const hemicycleData = groupStats.flatMap(group =>
    group.mandates.map((mandate) => ({
      id: mandate.uid,
      name: group.acronym || group.name,
      group: group.name,
      color: group.colorCode || '#6b7280'
    }))
  );

  return { recentVotes, popularCauses, deputyCount, hemicycleData, groupCount: groupStats.length };
}

export default async function Home() {
  const { recentVotes, popularCauses, deputyCount, hemicycleData, groupCount } = await getDashboardData();

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 md:p-12">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="relative space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Plateforme citoyenne
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Suivez l'activité de
            <span className="gradient-text"> l'Assemblée Nationale</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Analysez les votes, suivez vos députés, et rejoignez des causes citoyennes pour influencer la fabrique de la loi.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/deputies">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Explorer les députés
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/causes">
              <Button size="lg" variant="outline" className="gap-2">
                <Target className="h-4 w-4" />
                Rejoindre une cause
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{deputyCount}</p>
                <p className="text-sm text-muted-foreground">Députés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold">{groupCount}</p>
                <p className="text-sm text-muted-foreground">Groupes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <VoteIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{recentVotes.length > 0 ? '4.9K+' : '0'}</p>
                <p className="text-sm text-muted-foreground">Scrutins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{popularCauses.length}</p>
                <p className="text-sm text-muted-foreground">Causes actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Hemicycle */}
        <Card className="lg:col-span-4 overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              L'Hémicycle
            </CardTitle>
            <CardDescription>
              Composition de l'Assemblée Nationale
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Hemicycle data={hemicycleData.length > 0 ? hemicycleData : Array.from({ length: 577 }).map((_, i) => ({
              id: `deputy-${i}`,
              name: `Député ${i + 1}`,
              group: "Groupe",
              color: '#6b7280'
            }))} />
          </CardContent>
        </Card>

        {/* Recent Votes */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <VoteIcon className="h-4 w-4 text-green-600" />
              </div>
              Derniers scrutins
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentVotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <VoteIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun vote récent.</p>
                <p className="text-sm">Les données sont en cours de chargement.</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentVotes.map((vote) => (
                  <div key={vote.uid} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm line-clamp-2">{vote.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(vote.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge className={
                        vote.result?.toLowerCase().includes('adopt')
                          ? 'badge-pour'
                          : vote.result?.toLowerCase().includes('rejet')
                            ? 'badge-contre'
                            : 'bg-secondary text-secondary-foreground'
                      }>
                        {vote.result || 'En cours'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 border-t">
              <Link href="/textes">
                <Button variant="ghost" className="w-full gap-2">
                  Voir tous les textes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Causes */}
      {popularCauses.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-semibold">Causes populaires</h2>
            </div>
            <Link href="/causes">
              <Button variant="ghost" className="gap-2">
                Voir toutes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3 stagger-children">
            {popularCauses.map((cause) => (
              <Link key={cause.id} href={`/causes/${cause.slug}`}>
                <Card className="card-hover h-full group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {cause.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {cause.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {cause.memberCount} membre{cause.memberCount > 1 ? 's' : ''}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state for causes */}
      {popularCauses.length === 0 && (
        <section className="text-center py-12 rounded-2xl border-2 border-dashed border-muted">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Aucune cause active</h3>
          <p className="text-muted-foreground mb-4">Soyez le premier à créer une cause citoyenne !</p>
          <Link href="/causes/nouvelle">
            <Button>Créer une cause</Button>
          </Link>
        </section>
      )}
    </div>
  );
}
