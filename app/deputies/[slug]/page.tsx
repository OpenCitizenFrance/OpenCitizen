import { getDeputyBySlug } from "@/lib/deputies";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Vote, FileText, Users, ArrowLeft, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: { slug: string }
}

export default async function DeputyProfilePage({ params }: PageProps) {
    const deputy = await getDeputyBySlug(params.slug);

    if (!deputy) {
        notFound();
    }

    const positionStyles: Record<string, string> = {
        'POUR': 'badge-pour',
        'CONTRE': 'badge-contre',
        'ABSTENTION': 'badge-abstention',
        'NON_VOTANT': 'bg-muted text-muted-foreground',
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back link */}
            <Link href="/deputies" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Retour aux députés
            </Link>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-6 md:p-8">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
                <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-xl">
                        <AvatarImage src={deputy.imageUrl || ""} />
                        <AvatarFallback className="text-3xl md:text-4xl bg-gradient-to-br from-primary to-accent text-white">
                            {deputy.firstName[0]}{deputy.lastName[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-bold">{deputy.firstName} {deputy.lastName}</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                className="text-sm px-3 py-1"
                                style={deputy.currentGroup?.colorCode ? {
                                    backgroundColor: deputy.currentGroup.colorCode,
                                    color: 'white'
                                } : {}}
                            >
                                {deputy.currentGroup?.name || "Non inscrit"}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                {deputy.uid}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Député de la 17ème législature
                        </p>
                        <div className="flex gap-2 pt-2">
                            <Button className="gap-2 shadow-lg shadow-primary/25">
                                <Heart className="h-4 w-4" />
                                Suivre
                            </Button>
                            <Link href={`/deputies/comparer?ids=${deputy.uid}`}>
                                <Button variant="outline" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    Comparer
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{deputy.stats.participationScore}%</p>
                                <p className="text-sm text-muted-foreground">Participation</p>
                            </div>
                        </div>
                        <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${deputy.stats.participationScore}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Award className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{deputy.stats.loyaltyScore}%</p>
                                <p className="text-sm text-muted-foreground">Loyauté</p>
                            </div>
                        </div>
                        <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${deputy.stats.loyaltyScore}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Vote className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{deputy.stats.totalVotes}</p>
                                <p className="text-sm text-muted-foreground">Votes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-accent/10">
                                <FileText className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{deputy.stats.totalAmendments}</p>
                                <p className="text-sm text-muted-foreground">Amendements</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Votes */}
            <Card>
                <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2">
                        <Vote className="h-5 w-5 text-primary" />
                        Derniers votes
                    </CardTitle>
                    <CardDescription>
                        Les 20 derniers scrutins auxquels ce député a participé
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {deputy.votes.length === 0 ? (
                        <div className="p-12 text-center">
                            <Vote className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-muted-foreground">Aucun vote enregistré pour le moment.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {deputy.votes.map((voteDetail, index) => (
                                <div
                                    key={voteDetail.id}
                                    className="p-4 hover:bg-muted/50 transition-colors animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium line-clamp-1">{voteDetail.vote.title}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {new Date(voteDetail.vote.date).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <Badge className={positionStyles[voteDetail.position]}>
                                            {voteDetail.position.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Amendments */}
            {deputy.amendments.length > 0 && (
                <Card>
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-accent" />
                            Amendements récents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 divide-y">
                        {deputy.amendments.map((amendment) => (
                            <div key={amendment.uid} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">Amendement {amendment.uid}</p>
                                        {amendment.law && (
                                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                                                {amendment.law.title}
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant={
                                        amendment.status === 'Adopté' ? 'default' :
                                            amendment.status === 'Rejeté' ? 'destructive' : 'secondary'
                                    }>
                                        {amendment.status || 'En cours'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
