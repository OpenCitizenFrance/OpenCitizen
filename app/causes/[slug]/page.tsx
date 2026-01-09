import { getCauseBySlug, isMember as checkIsMember } from "@/lib/causes";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Target, FileText, CheckCircle, Share2, Mail, MessageSquare, Newspaper } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/auth";
import { getFeedPosts, getOrCreateCauseConversation } from "@/app/actions/feed";
import { getConversation } from "@/app/actions/chat";
import { Feed } from "@/components/feed/Feed";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { DeputyContactAction } from "@/components/DeputyContactAction";

export const revalidate = 60;

interface PageProps {
    params: { slug: string }
}

const actionIcons: Record<string, any> = {
    EMAIL_DEPUTY: Mail,
    SOCIAL_SHARE: Share2,
    PETITION_SIGN: CheckCircle,
    ATTEND_EVENT: Users,
    CUSTOM: Target
}

export default async function CauseDetailPage({ params }: PageProps) {
    const session = await auth();
    const cause: any = await getCauseBySlug(params.slug);

    if (!cause) {
        notFound();
    }

    const isMember = session?.user?.id ? await checkIsMember(cause.id, session.user.id) : false;

    // Fetch Social Data
    const feedPosts = await getFeedPosts(cause.id);

    // Fetch Conversation (or create if missing/authorized)
    let causeConversation = null;
    if (session?.user) {
        try {
            const convRef = await getOrCreateCauseConversation(cause.id, cause.title);
            if (convRef) {
                causeConversation = await getConversation(convRef.id);
            }
        } catch (e) {
            console.error("Failed to load conversation", e);
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto container py-6">
            {/* Header */}
            {cause.imageUrl && (
                <div
                    className="h-48 bg-cover bg-center rounded-lg -mx-4 sm:mx-0"
                    style={{ backgroundImage: `url(${cause.imageUrl})` }}
                />
            )}

            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{cause.title}</h1>
                        <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {cause.memberCount} membre{cause.memberCount > 1 ? 's' : ''}
                            </span>
                            <span>•</span>
                            <span>Créé par {cause.creator.name || "Anonyme"}</span>
                        </div>
                    </div>
                    {!isMember && (
                        <Button size="lg">
                            Rejoindre
                        </Button>
                    )}
                    {isMember && (
                        <Button variant="outline" size="lg" disabled>
                            Membre
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="about">À propos</TabsTrigger>
                    <TabsTrigger value="feed" className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4" />
                        Actualités
                    </TabsTrigger>
                    <TabsTrigger value="discussion" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Discussion
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-8 mt-6">
                    <p className="text-lg">{cause.description}</p>

                    {/* Targets */}
                    {(cause.targetDeputies.length > 0 || cause.targetDossiers.length > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Cibles
                                </CardTitle>
                                <CardDescription>
                                    Députés et textes de loi concernés par cette cause
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cause.targetDeputies.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Députés</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {cause.targetDeputies.map(({ deputy }: any) => (
                                                <Link key={deputy.uid} href={`/deputies/${deputy.slug}`}>
                                                    <Badge variant="outline" className="py-1.5 px-3">
                                                        {deputy.firstName} {deputy.lastName}
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {cause.targetDossiers.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Textes de loi</h4>
                                        <div className="space-y-2">
                                            {cause.targetDossiers.map(({ dossier }: any) => (
                                                <Link
                                                    key={dossier.uid}
                                                    href={`/textes/${dossier.uid}`}
                                                    className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50"
                                                >
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate">{dossier.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Deputy Contact */}
                    {cause.targetDeputies.length > 0 && (
                        <DeputyContactAction
                            deputies={cause.targetDeputies.map(({ deputy }: any) => ({
                                uid: deputy.uid,
                                firstName: deputy.firstName,
                                lastName: deputy.lastName,
                                slug: deputy.slug,
                                imageUrl: deputy.imageUrl,
                                group: deputy.currentGroup || null
                            }))}
                            causeTitle={cause.title}
                            lawTitle={cause.targetDossiers?.[0]?.dossier?.title}
                        />
                    )}

                    {/* Actions */}
                    {cause.actions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions suggérées</CardTitle>
                                <CardDescription>
                                    Participez à ces actions pour faire avancer la cause
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {cause.actions.map((action: any) => {
                                    const IconComponent = actionIcons[action.type] || Target
                                    return (
                                        <div
                                            key={action.id}
                                            className="flex items-center justify-between p-4 rounded-lg border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-primary/10">
                                                    <IconComponent className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{action.title}</p>
                                                    {action.description && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {action.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary">
                                                    {action._count.completions} fait{action._count.completions > 1 ? 's' : ''}
                                                </Badge>
                                                <Button size="sm">J'ai fait</Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Membres récents</CardTitle>
                            <CardDescription>
                                Les dernières personnes à avoir rejoint cette cause
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {cause.members.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    Soyez le premier à rejoindre cette cause !
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {cause.members.map(({ user }: any) => (
                                        <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.image || ""} />
                                                <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{user.name || "Anonyme"}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feed" className="mt-6">
                    <Feed
                        causeId={cause.id}
                        posts={feedPosts as any}
                        isMember={isMember}
                        currentUserId={session?.user?.id}
                    />
                </TabsContent>

                <TabsContent value="discussion" className="mt-6">
                    {session?.user ? (
                        <Card className="h-[600px] flex flex-col">
                            {causeConversation ? (
                                <ChatWindow
                                    conversationId={causeConversation.id}
                                    messages={causeConversation.messages as any}
                                    currentUserId={session.user.id!}
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                    Chargement de la discussion...
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <p>Vous devez être connecté et membre pour accéder à la discussion.</p>
                                <Button className="mt-4" asChild>
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
