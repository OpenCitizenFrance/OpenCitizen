import { getDeputyBySlug } from "@/lib/deputies";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Vote, FileText, Users, ArrowLeft, TrendingUp, Award, Mail, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { FollowButton } from "@/components/FollowButton";
import { CommentSection } from "@/components/CommentSection";
import { MailtoButton } from "@/components/MailtoButton";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: { slug: string }
}

export default async function DeputyProfilePage({ params }: PageProps) {
    const deputyData = await getDeputyBySlug(params.slug);

    if (!deputyData) {
        notFound();
    }

    // Type cast to access identity fields added to schema
    const deputy = deputyData as typeof deputyData & {
        civilite?: string | null;
        dateNaissance?: Date | null;
        villeNaissance?: string | null;
        email?: string | null;
        circonscription?: string | null;
    };

    const session = await auth();
    const userId = session?.user?.id;
    let isFollowing = false;
    let comments: any[] = [];

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { followedDeputies: { where: { uid: deputy.uid } } }
        });
        isFollowing = (user?.followedDeputies.length ?? 0) > 0;
    }

    // Fetch comments
    comments = await prisma.comment.findMany({
        where: { deputyId: deputy.uid },
        include: { author: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' }
    });

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

                        {/* Identity Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {deputy.circonscription && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {deputy.circonscription}
                                </span>
                            )}
                            {deputy.dateNaissance && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Né(e) le {new Date(deputy.dateNaissance).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                    {deputy.villeNaissance && ` à ${deputy.villeNaissance}`}
                                </span>
                            )}
                        </div>

                        <p className="text-muted-foreground">
                            {deputy.civilite ? `${deputy.civilite} ` : ''}Député de la 17ème législature
                        </p>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <FollowButton
                                targetId={deputy.uid}
                                targetType="deputy"
                                isFollowing={isFollowing}
                                className="shadow-lg shadow-primary/25"
                            />
                            <Link href={`/deputies/comparer?ids=${deputy.uid}`}>
                                <Button variant="outline" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    Comparer
                                </Button>
                            </Link>
                            {deputy.email && (
                                <MailtoButton
                                    to={deputy.email}
                                    subject={`Question citoyenne - ${deputy.firstName} ${deputy.lastName}`}
                                    body={`Madame/Monsieur le Député ${deputy.lastName},\n\nJe me permets de vous écrire en tant que citoyen(ne) de votre circonscription.\n\n[Votre message ici]\n\nCordialement,\n[Votre nom]`}
                                    deputyName={`${deputy.civilite || ''} ${deputy.lastName}`.trim()}
                                    variant="outline"
                                    showCopyOption={false}
                                />
                            )}
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

            {/* Amendments by Dossier */}
            {deputy.amendmentsByDossier && deputy.amendmentsByDossier.length > 0 && (
                <Card>
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-accent" />
                                Amendements par dossier législatif
                            </CardTitle>
                            <div className="flex gap-2 text-sm">
                                <Badge variant="default" className="gap-1">
                                    {deputy.stats.adoptedAmendments} adoptés
                                </Badge>
                                <Badge variant="destructive" className="gap-1">
                                    {deputy.stats.rejectedAmendments} rejetés
                                </Badge>
                            </div>
                        </div>
                        <CardDescription>
                            {deputy.stats.totalAmendments} amendements déposés sur {deputy.amendmentsByDossier.length} dossier{deputy.amendmentsByDossier.length > 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {deputy.amendmentsByDossier.map((dossierGroup, index) => (
                                <details
                                    key={dossierGroup.dossier?.uid || `no-dossier-${index}`}
                                    className="group"
                                    open={index === 0}
                                >
                                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-accent/10 group-open:bg-accent/20 transition-colors">
                                                <FileText className="h-4 w-4 text-accent" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {dossierGroup.dossier?.displayTitle || dossierGroup.dossier?.reference || 'Dossier non identifié'}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{dossierGroup.amendments.length} amendement{dossierGroup.amendments.length > 1 ? 's' : ''}</span>
                                                    {dossierGroup.dossier?.typeLabel && (
                                                        <Badge variant="outline" className="text-xs py-0">
                                                            {dossierGroup.dossier.typeLabel}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Status summary for this dossier */}
                                            {(() => {
                                                const adopted = dossierGroup.amendments.filter(a => a.status === 'Adopté').length;
                                                const rejected = dossierGroup.amendments.filter(a => a.status === 'Rejeté').length;
                                                return (
                                                    <div className="flex gap-1 text-xs">
                                                        {adopted > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                {adopted} ✓
                                                            </span>
                                                        )}
                                                        {rejected > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                {rejected} ✗
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            <svg
                                                className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </summary>
                                    <div className="border-t bg-muted/20">
                                        {dossierGroup.amendments.map((amendment) => (
                                            <div
                                                key={amendment.uid}
                                                className="flex items-center justify-between gap-4 px-4 py-3 pl-14 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">
                                                        Amendement {amendment.shortUid}
                                                    </p>
                                                    {amendment.content && (
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {amendment.content}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant={
                                                        amendment.status === 'Adopté' ? 'default' :
                                                            amendment.status === 'Rejeté' ? 'destructive' : 'secondary'
                                                    }
                                                    className="shrink-0"
                                                >
                                                    {amendment.status || 'En cours'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Comments Section */}
            <div className="mt-12 max-w-3xl">
                <CommentSection
                    targetId={deputy.uid}
                    targetType="deputy"
                    comments={comments as any}
                    currentUser={session?.user}
                />
            </div>

            <div className="h-12"></div>
        </div>
    );
}
