import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Heart, FileText, Bell, MapPin, Settings, Sparkles, ArrowRight, Target } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function MonEspacePage() {
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
            bookmarkedLaws: {
                take: 5
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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                            {user.name?.[0] || user.email?.[0] || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold">{user.name || "Citoyen"}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-3">
                            <Badge variant={isPremium ? "default" : "secondary"} className="gap-1">
                                {isPremium && <Sparkles className="h-3 w-3" />}
                                {isPremium ? "Premium" : "Gratuit"}
                            </Badge>
                            {user.constituencyCode && (
                                <Badge variant="outline" className="gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {user.constituencyCode}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Link href="/mon-espace/parametres">
                        <Button variant="outline" className="gap-2">
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
                                <p className="text-sm text-muted-foreground">Textes sauvés</p>
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
                                <p className="text-sm text-muted-foreground">Causes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Bell className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">
                                    {user.alertPreference ? "Actives" : "Off"}
                                </p>
                                <p className="text-sm text-muted-foreground">Alertes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
        </div>
    );
}
