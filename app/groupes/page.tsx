import { getGroupsWithStats } from "@/lib/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UsersRound } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getGroupLogoUrl } from "@/lib/groupLogos";

export const dynamic = 'force-dynamic';

export default async function GroupesPage() {
    const groups = await getGroupsWithStats();

    // Sort by member count
    const sortedGroups = groups.sort((a, b) => b.memberCount - a.memberCount);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                    <UsersRound className="h-6 w-6 text-accent" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Groupes Politiques</h1>
                    <p className="text-muted-foreground">
                        Les {groups.length} groupes parlementaires de l'Assemblée
                    </p>
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {sortedGroups.map((group) => {
                    const logoUrl = getGroupLogoUrl(group.acronym);

                    return (
                        <Link key={group.uid} href={`/groupes/${group.uid}`}>
                            <Card
                                className="card-hover h-full group overflow-hidden"
                            >
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: group.colorCode || 'hsl(var(--muted))' }}
                                />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div
                                            className="p-3 rounded-xl flex items-center justify-center min-w-[60px] min-h-[60px]"
                                            style={{
                                                backgroundColor: group.colorCode ? `${group.colorCode}15` : 'hsl(var(--muted))'
                                            }}
                                        >
                                            {logoUrl ? (
                                                <Image
                                                    src={logoUrl}
                                                    alt={`Logo ${group.name}`}
                                                    width={48}
                                                    height={48}
                                                    className="object-contain"
                                                    unoptimized={logoUrl.endsWith('.svg')}
                                                />
                                            ) : (
                                                <span
                                                    className="text-lg font-bold"
                                                    style={{ color: group.colorCode || 'hsl(var(--foreground))' }}
                                                >
                                                    {group.acronym || group.name.substring(0, 2)}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {group.memberCount}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                                        {group.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {group.memberCount} membre{group.memberCount > 1 ? 's' : ''} actif{group.memberCount > 1 ? 's' : ''}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-16">
                    <UsersRound className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium mb-2">Aucun groupe trouvé</h3>
                    <p className="text-muted-foreground">
                        Les données sont en cours de chargement.
                    </p>
                </div>
            )}
        </div>
    );
}
