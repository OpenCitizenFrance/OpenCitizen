import { getDossierByUid } from "@/lib/dossiers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, Vote as VoteIcon, Building2, Gavel } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { FollowButton } from "@/components/FollowButton";
import { CommentSection } from "@/components/CommentSection";
import { TextPreviewButton } from "@/components/TextPreviewButton";
import { formatStageLabel } from "@/lib/legislative-utils";
import { TimelineMetro } from "@/components/TimelineMetro";
import { AISummaryCard } from "@/components/AISummaryCard";

export const dynamic = 'force-dynamic';

export default async function DossierPage({
    params
}: {
    params: { uid: string }
}) {
    const dossier: any = await getDossierByUid(params.uid);

    if (!dossier) {
        notFound();
    }

    const session = await auth();
    const userId = session?.user?.id;
    let isBookmarked = false;
    let comments: any[] = [];

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { bookmarkedLaws: { where: { uid: dossier.uid } } }
        });
        isBookmarked = (user?.bookmarkedLaws.length ?? 0) > 0;
    }

    // Fetch comments
    comments = await prisma.comment.findMany({
        where: { lawId: dossier.uid },
        include: { author: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' }
    });

    const statusColors: Record<string, string> = {
        EN_COURS: 'bg-blue-500',
        ADOPTE: 'bg-green-500',
        REJETE: 'bg-red-500',
        PROMULGUE: 'bg-purple-500',
        RETIRE: 'bg-gray-500'
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Back Button */}
            <Link href="/textes" className="absolute -top-12 left-0 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Dossiers Législatifs
            </Link>

            {/* Header */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <FollowButton
                                targetId={dossier.uid}
                                targetType="dossier"
                                isFollowing={isBookmarked}
                                label={isBookmarked ? "Sauvegardé" : "Sauvegarder"}
                                variant={isBookmarked ? "default" : "outline"}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-sm">
                                {dossier.type.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-mono">
                                {dossier.uid}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight leading-tight">
                            {dossier.title}
                        </h1>
                    </div>
                    <Badge className={`text-base px-4 py-1.5 self-start ${statusColors[dossier.status]}`}>
                        {dossier.status}
                    </Badge>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <FileText className="h-5 w-5 text-primary mb-2" />
                            <div className="text-2xl font-bold">{dossier._count.amendments}</div>
                            <div className="text-xs text-muted-foreground">Amendements</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <VoteIcon className="h-5 w-5 text-primary mb-2" />
                            <div className="text-2xl font-bold">{dossier.votes.length}</div>
                            <div className="text-xs text-muted-foreground">Scrutins récents</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* AI Summary Section */}
            <AISummaryCard
                lawTitle={dossier.title}
                exposeText={
                    dossier.stages?.[0]?.texts?.[0]?.expose ||
                    dossier.stages?.[0]?.texts?.[0]?.fullContent ||
                    `${dossier.title}. Type de dossier: ${dossier.type?.replace(/_/g, ' ') || 'Législatif'}. Statut: ${dossier.status || 'En cours'}.`
                }
            />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Timeline / Stages - Left 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Parcours Législatif
                    </h2>

                    {/* Transform stages for TimelineMetro */}
                    {(() => {
                        const timelineStages = dossier.stages
                            .filter((stage: any) => stage.date || (stage.texts && stage.texts.length > 0))
                            .map((stage: any, idx: number, arr: any[]) => ({
                                id: stage.id,
                                label: formatStageLabel(
                                    stage.stageType,
                                    stage.organName,
                                    stage.chamber,
                                    stage.label
                                ),
                                labelShort: stage.stageType?.replace(/_/g, ' '),
                                date: stage.date,
                                chamber: stage.chamber === 'AN' ? 'ASSEMBLEE_NATIONALE' as const :
                                    stage.chamber === 'SENAT' ? 'SENAT' as const : null,
                                stageType: stage.stageType || 'AUTRE',
                                isCurrent: idx === arr.length - 1,
                                pdfUrl: stage.texts?.[0]?.uid ? `/textes/${stage.texts[0].uid}` : undefined,
                                details: stage.texts?.length ? `${stage.texts.length} texte(s) associé(s)` : undefined
                            }));

                        if (timelineStages.length === 0) {
                            return (
                                <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                                    Ce dossier est en cours d'examen. Les étapes détaillées seront affichées au fur et à mesure de leur avancement.
                                </div>
                            );
                        }

                        return (
                            <>
                                {/* New Metro-style Timeline */}
                                <TimelineMetro
                                    stages={timelineStages}
                                    orientation="auto"
                                    className="mb-6"
                                />

                                {/* Detailed stage cards below for text access */}
                                <div className="space-y-4 mt-8 pt-6 border-t">
                                    <h3 className="text-lg font-medium text-muted-foreground">Textes associés</h3>
                                    {dossier.stages
                                        .filter((stage: any) => stage.texts && stage.texts.length > 0)
                                        .map((stage: any) => (
                                            <Card key={stage.id} className="hover:border-primary/50 transition-colors">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base font-semibold">
                                                        {formatStageLabel(stage.stageType, stage.organName, stage.chamber, stage.label)}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="flex flex-wrap gap-2">
                                                        {stage.texts.map((text: any) => (
                                                            <TextPreviewButton
                                                                key={text.uid}
                                                                text={{
                                                                    uid: text.uid,
                                                                    title: text.title,
                                                                    numTexte: text.numTexte,
                                                                    expose: text.expose,
                                                                    articles: text.articles,
                                                                    fullContent: text.fullContent
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Comments Section */}
                <div className="mt-12 pt-8 border-t">
                    <CommentSection
                        targetId={dossier.uid}
                        targetType="dossier"
                        comments={comments as any}
                        currentUser={session?.user}
                    />
                </div>
            </div>

            {/* Sidebar - Right 1/3 */}
            <div className="space-y-6">
                {/* Analysis Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Gavel className="h-5 w-5" />
                            Analyse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href={`/dossiers/${dossier.uid}/amendements`}>
                            <Button className="w-full justify-between group" variant="secondary">
                                Explorer les amendements
                                <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Button className="w-full justify-between" variant="outline" disabled>
                            Comparer les versions (Bientôt)
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Votes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Derniers Scrutins</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[300px]">
                            <div className="divide-y">
                                {dossier.votes.map((vote: any) => (
                                    <div key={vote.uid} className="p-4 hover:bg-muted/50 transition-colors">
                                        <div className="text-sm font-medium line-clamp-2 mb-2">
                                            {vote.title}
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <Badge variant={vote.result === 'ADOPTE' ? 'default' : 'destructive'}>
                                                {vote.result}
                                            </Badge>
                                            <span className="text-muted-foreground">
                                                {new Date(vote.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {/* Mini bar chart for vote */}
                                        <div className="flex h-1.5 mt-3 rounded-full overflow-hidden bg-muted">
                                            <div style={{ width: `${(vote.totalPour / (vote.totalPour + vote.totalContre + vote.totalAbst)) * 100}%` }} className="bg-green-500" />
                                            <div style={{ width: `${(vote.totalContre / (vote.totalPour + vote.totalContre + vote.totalAbst)) * 100}%` }} className="bg-red-500" />
                                            <div style={{ width: `${(vote.totalAbst / (vote.totalPour + vote.totalContre + vote.totalAbst)) * 100}%` }} className="bg-gray-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
