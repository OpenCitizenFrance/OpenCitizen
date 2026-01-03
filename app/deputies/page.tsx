import { getDeputies, getGroups } from "@/lib/deputies";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Filter } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DeputiesPage({
  searchParams
}: {
  searchParams: { q?: string; groupe?: string }
}) {
  const [deputies, groups] = await Promise.all([
    getDeputies({
      search: searchParams.q,
      groupId: searchParams.groupe
    }),
    getGroups()
  ]);

  // Sort groups by member count
  const sortedGroups = groups.sort((a, b) => (b._count?.mandates || 0) - (a._count?.mandates || 0));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Députés</h1>
            <p className="text-muted-foreground">
              Les {deputies.length} élus de la 17ème législature
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <form action="/deputies" method="GET" className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Rechercher par nom..."
            className="pl-10 h-11"
          />
          {searchParams.groupe && (
            <input type="hidden" name="groupe" value={searchParams.groupe} />
          )}
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
            <Filter className="h-4 w-4" />
            Groupes:
          </div>
          <Link href="/deputies">
            <Badge
              variant={!searchParams.groupe ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Tous
            </Badge>
          </Link>
          {sortedGroups.slice(0, 8).map((group) => (
            <Link
              key={group.uid}
              href={`/deputies?groupe=${group.uid}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
            >
              <Badge
                variant={searchParams.groupe === group.uid ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105"
                style={searchParams.groupe === group.uid && group.colorCode ? {
                  backgroundColor: group.colorCode,
                  borderColor: group.colorCode
                } : group.colorCode ? {
                  borderColor: group.colorCode,
                  color: group.colorCode
                } : {}}
              >
                {group.acronym || group.name.substring(0, 15)}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {deputies.map((deputy) => (
          <Link key={deputy.uid} href={`/deputies/${deputy.slug}`}>
            <Card className="card-hover group h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-background shadow-md group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={deputy.imageUrl || ""} alt={`${deputy.firstName} ${deputy.lastName}`} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-lg font-semibold">
                      {deputy.firstName[0]}{deputy.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate group-hover:text-primary transition-colors">
                      {deputy.firstName} {deputy.lastName}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 text-xs"
                      style={deputy.currentGroup?.colorCode ? {
                        backgroundColor: `${deputy.currentGroup.colorCode}20`,
                        color: deputy.currentGroup.colorCode,
                        borderColor: `${deputy.currentGroup.colorCode}40`
                      } : {}}
                    >
                      {deputy.currentGroup?.acronym || deputy.currentGroup?.name || "Non inscrit"}
                    </Badge>
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{deputy.voteCount} votes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {deputies.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium mb-2">Aucun député trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
}
