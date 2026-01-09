import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Heart, FileText, Bell, MapPin, Settings, Sparkles, ArrowRight, Target, UsersRound, Vote, Building2, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { DashboardImpact } from "@/components/DashboardImpact";

export const dynamic = 'force-dynamic';

// Get time-based greeting
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
}

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/api/auth/signin');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            followedDeputies: {
                take: 6,
                include: {
                    mandates: {
                        where: { endDate: null, groupId: { not: null } },
                        include: { group: true },
                        take: 1
                    }
                }
            },
            followedGroups: {
                take: 6
            },
            bookmarkedLaws: {
                take: 5,
                include: {
                    stages: {
                        orderBy: { stageOrder: 'desc' },
                        take: 1
                    }
                }
            },
            joinedCauses: {
                take: 5,
                include: {
                    cause: true
                }
            },
            subscription: true,
            alertPreference: true
        }
    });

    if (!user) {
        redirect('/api/auth/signin');
    }

    const isPremium = user.subscription?.tier === 'PREMIUM';
    const firstName = user.name?.split(' ')[0] || 'Citoyen';
    const greeting = getGreeting();

    // Get recent votes from followed deputies
    const recentVotes = user.followedDeputies.length > 0 ? await prisma.vote.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
            law: {
                select: { uid: true, title: true }
            }
        }
    }) : [];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-background p-8 md:p-10">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Avatar className="h-24 w-24 ring-4 ring-background shadow-2xl">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-white font-bold">
                            {user.name?.[0] || user.email?.[0] || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-lg text-muted-foreground">{greeting},</p>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Bienvenue, {firstName} !
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Vous suivez <span className="font-semibold text-foreground">{user.followedDeputies.length}</span> député{user.followedDeputies.length > 1 ? 's' : ''},
                            {' '}<span className="font-semibold text-foreground">{user.bookmarkedLaws.length}</span> dossier{user.bookmarkedLaws.length > 1 ? 's' : ''} législatif{user.bookmarkedLaws.length > 1 ? 's' : ''}
                            {user.followedGroups.length > 0 && (
                                <> et <span className="font-semibold text-foreground">{user.followedGroups.length}</span> groupe{user.followedGroups.length > 1 ? 's' : ''} politique{user.followedGroups.length > 1 ? 's' : ''}</>
                            )}.
                        </p>
                        <div className="flex items-center gap-2 mt-4">
                            <Badge variant={isPremium ? "default" : "secondary"} className="gap-1">
                                {isPremium && <Sparkles className="h-3 w-3" />}
                                {isPremium ? "Premium" : "Compte gratuit"}
                            </Badge>
                            {user.constituencyCode && (
                                <Badge variant="outline" className="gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {user.constituencyCode}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Link href="/groupes/dashboard/parametres">
                        <Button variant="outline" className="gap-2 shrink-0">
                            <Settings className="h-4 w-4" />
                            Paramètres
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/10">
                                <Heart className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{user.followedDeputies.length}</p>
                                <p className="text-sm text-muted-foreground">Députés suivis</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <FileText className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{user.bookmarkedLaws.length}</p>
                                <p className="text-sm text-muted-foreground">Dossiers suivis</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <UsersRound className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{user.followedGroups.length}</p>
                                <p className="text-sm text-muted-foreground">Groupes suivis</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/10">
                                <Target className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{user.joinedCauses.length}</p>
                                <p className="text-sm text-muted-foreground">Causes soutenues</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gamified Impact Section */}
            <Card className="bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-blue-500/5 border-amber-500/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <CardTitle>Votre impact citoyen</CardTitle>
                    </div>
                    <CardDescription>
                        Chaque action compte. Suivez vos progrès et débloquez des badges !
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DashboardImpact
                        stats={{
                            deputiesContacted: 0, // TODO: Track from analytics
                            causesJoined: user.joinedCauses.length,
                            lawsFollowed: user.bookmarkedLaws.length,
                            actionsCompleted: user.joinedCauses.length + user.bookmarkedLaws.length + user.followedDeputies.length,
                            emailsSent: 0 // TODO: Track from analytics
                        }}
                        activities={[
                            ...user.joinedCauses.slice(0, 3).map(({ cause }) => ({
                                id: `cause-${cause.id}`,
                                type: 'cause_update' as const,
                                title: `Cause rejointe : ${cause.title}`,
                                description: `${cause.memberCount} membres`,
                                timestamp: new Date(),
                                link: `/causes/${cause.slug}`
                            })),
                            ...user.followedDeputies.slice(0, 2).map((deputy) => ({
                                id: `deputy-${deputy.uid}`,
                                type: 'action_complete' as const,
                                title: `Député suivi : ${deputy.firstName} ${deputy.lastName}`,
                                description: deputy.mandates[0]?.group?.name || 'Non inscrit',
                                timestamp: new Date(),
                                link: `/deputies/${deputy.slug}`
                            }))
                        ]}
                        badges={[
                            {
                                id: 'citoyen_engage',
                                name: 'Citoyen Engagé',
                                description: 'Réalisez 5 actions',
                                icon: '🏆',
                                earnedAt: (user.joinedCauses.length + user.bookmarkedLaws.length + user.followedDeputies.length) >= 5 ? new Date() : undefined
                            },
                            {
                                id: 'veilleur',
                                name: 'Veilleur',
                                description: 'Suivez 10 lois',
                                icon: '👁️',
                                earnedAt: user.bookmarkedLaws.length >= 10 ? new Date() : undefined
                            },
                            {
                                id: 'mobilisateur',
                                name: 'Mobilisateur',
                                description: 'Rejoignez 5 causes',
                                icon: '🤝',
                                earnedAt: user.joinedCauses.length >= 5 ? new Date() : undefined
                            },
                            {
                                id: 'voix_portee',
                                name: 'Voix Portée',
                                description: 'Contactez 3 députés',
                                icon: '📢'
                            },
                            {
                                id: 'influent',
                                name: 'Influent',
                                description: 'Suivez 10 députés',
                                icon: '⭐',
                                earnedAt: user.followedDeputies.length >= 10 ? new Date() : undefined
                            }
                        ]}
                        userName={firstName}
                    />
                </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Followed Deputies & Groups */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Followed Deputies */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    <CardTitle>Mes députés suivis</CardTitle>
                                </div>
                                <Link href="/deputies">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        Voir tous <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {user.followedDeputies.length === 0 ? (
                                <div className="text-center py-8">
                                    <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-muted-foreground mb-4">Vous ne suivez aucun député.</p>
                                    <Link href="/deputies">
                                        <Button>Découvrir les députés</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {user.followedDeputies.map((deputy) => (
                                        <Link
                                            key={deputy.uid}
                                            href={`/deputies/${deputy.slug}`}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                                        >
                                            <Avatar className="ring-2 ring-background shadow">
                                                <AvatarImage src={deputy.imageUrl || ""} />
                                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                                    {deputy.firstName[0]}{deputy.lastName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate group-hover:text-primary transition-colors">
                                                    {deputy.firstName} {deputy.lastName}
                                                </p>
                                                <Badge variant="secondary" className="text-xs mt-0.5">
                                                    {deputy.mandates[0]?.group?.acronym || "NI"}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Followed Political Groups */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UsersRound className="h-5 w-5 text-purple-500" />
                                    <CardTitle>Mes groupes politiques</CardTitle>
                                </div>
                                <Link href="/groupes">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        Voir tous <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {user.followedGroups.length === 0 ? (
                                <div className="text-center py-8">
                                    <UsersRound className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-muted-foreground mb-4">Vous ne suivez aucun groupe politique.</p>
                                    <Link href="/groupes">
                                        <Button>Explorer les groupes</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {user.followedGroups.map((group) => (
                                        <Link
                                            key={group.uid}
                                            href={`/groupes/${group.uid}`}
                                            className="flex items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-colors group border"
                                        >
                                            <div
                                                className="w-4 h-12 rounded-full shrink-0"
                                                style={{ backgroundColor: group.colorCode || '#888' }}
                                            />
                                            <div className="min-w-0">
                                                <p className="font-bold text-lg group-hover:text-primary transition-colors">
                                                    {group.acronym || group.name.substring(0, 3)}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {group.name}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bookmarked Dossiers */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <CardTitle>Mes dossiers suivis</CardTitle>
                                </div>
                                <Link href="/textes">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        Explorer <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {user.bookmarkedLaws.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-muted-foreground mb-4">Vous n'avez sauvegardé aucun dossier.</p>
                                    <Link href="/textes">
                                        <Button>Parcourir les textes de loi</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {user.bookmarkedLaws.map((dossier) => (
                                        <Link
                                            key={dossier.uid}
                                            href={`/dossiers/${dossier.uid}`}
                                            className="block p-4 rounded-xl hover:bg-muted/50 transition-colors group border"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                                                        {dossier.title || "Sans titre"}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {dossier.type.replace(/_/g, ' ')}
                                                        </Badge>
                                                        {dossier.stages[0] && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {dossier.stages[0].stageType.replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className={
                                                    dossier.status === 'ADOPTE' ? 'bg-green-500' :
                                                        dossier.status === 'REJETE' ? 'bg-red-500' :
                                                            dossier.status === 'PROMULGUE' ? 'bg-purple-500' :
                                                                'bg-blue-500'
                                                }>
                                                    {dossier.status === 'EN_COURS' ? 'En cours' : dossier.status}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Causes & Activity */}
                <div className="space-y-6">
                    {/* Joined Causes */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-orange-500" />
                                    <CardTitle>Mes causes</CardTitle>
                                </div>
                                <Link href="/causes">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        Explorer <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {user.joinedCauses.length === 0 ? (
                                <div className="text-center py-8">
                                    <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-muted-foreground mb-4">Vous n'avez rejoint aucune cause.</p>
                                    <Link href="/causes">
                                        <Button>Explorer les causes</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {user.joinedCauses.map(({ cause }) => (
                                        <Link
                                            key={cause.id}
                                            href={`/causes/${cause.slug}`}
                                            className="block p-4 rounded-xl hover:bg-muted/50 transition-colors group"
                                        >
                                            <p className="font-medium group-hover:text-primary transition-colors">{cause.title}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {cause.memberCount} membre{cause.memberCount > 1 ? 's' : ''}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity / Votes */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-green-500" />
                                <CardTitle>Activité récente</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {recentVotes.length === 0 ? (
                                <div className="text-center py-6">
                                    <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">
                                        Suivez des députés pour voir leur activité ici.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentVotes.slice(0, 5).map((vote) => (
                                        <div key={vote.uid} className="p-3 rounded-lg bg-muted/30 border">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Vote className="h-4 w-4 text-primary" />
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(vote.date).toLocaleDateString('fr-FR')}
                                                </span>
                                                <Badge variant={vote.result === 'ADOPTE' ? 'default' : 'destructive'} className="text-xs ml-auto">
                                                    {vote.result}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium line-clamp-2">{vote.title}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Alerts Status */}
                    <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <Bell className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">
                                        {user.alertPreference ? "Alertes actives" : "Alertes désactivées"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {user.alertPreference
                                            ? "Vous recevez des notifications"
                                            : "Activez les alertes pour être informé"}
                                    </p>
                                </div>
                                <Link href="/groupes/dashboard/parametres">
                                    <Button variant="outline" size="sm">Gérer</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
