import { getGroupByUid } from "@/lib/groups";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Vote, ArrowLeft, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: { uid: string }
}

export default async function GroupeProfilePage({ params }: PageProps) {
    const group = await getGroupByUid(params.uid);

    if (!group) {
        notFound();
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back link */}
            <Link href="/groupes" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Retour aux groupes
            </Link>

            {/* Header */}
            <div
                className="relative overflow-hidden rounded-2xl p-6 md:p-8"
                style={{
                    background: `linear-gradient(135deg, ${group.colorCode || 'hsl(var(--primary))'}15 0%, ${group.colorCode || 'hsl(var(--primary))'}05 100%)`
                }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: group.colorCode || 'hsl(var(--primary))' }}
                />
                <div className="flex items-center gap-6">
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                        style={{ backgroundColor: group.colorCode || 'hsl(var(--primary))' }}
                    >
                        {group.acronym?.substring(0, 3) || group.name.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{group.name}</h1>
                        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                {group.memberCount} membre{group.memberCount > 1 ? 's' : ''}
                            </span>
                            {group.acronym && (
                                <Badge
                                    variant="outline"
                                    style={{ borderColor: group.colorCode, color: group.colorCode }}
                                >
                                    {group.acronym}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{group.memberCount}</p>
                                <p className="text-sm text-muted-foreground">Membres actifs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{group.cohesionScore}%</p>
                                <p className="text-sm text-muted-foreground">Cohésion de vote</p>
                            </div>
                        </div>
                        <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${group.cohesionScore}%`,
                                    backgroundColor: group.colorCode || 'hsl(var(--primary))'
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-accent/10">
                                <Award className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-lg font-medium">
                                    {group.memberCount > 100 ? 'Majorité' : 'Opposition'}
                                </p>
                                <p className="text-sm text-muted-foreground">Position</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Members List */}
            <Card>
                <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" style={{ color: group.colorCode }} />
                        Membres du groupe
                    </CardTitle>
                    <CardDescription>
                        {group.memberCount} député{group.memberCount > 1 ? 's' : ''} affilié{group.memberCount > 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {group.members.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-muted-foreground">Aucun membre trouvé.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                            {group.members.map((deputy) => (
                                <Link
                                    key={deputy.uid}
                                    href={`/deputies/${deputy.slug}`}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                                >
                                    <Avatar className="h-11 w-11 ring-2 ring-background shadow">
                                        <AvatarImage src={deputy.imageUrl || ""} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                            {deputy.firstName[0]}{deputy.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                                            {deputy.firstName} {deputy.lastName}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Vote className="h-3 w-3" />
                                            {deputy.voteCount} votes
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
