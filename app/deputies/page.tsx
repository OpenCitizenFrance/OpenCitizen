import { getDeputies, getGroups, getCommissions, getGeoData } from "@/lib/deputies";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Filter, FileText, Layout, SortAsc, TrendingUp, MapPin, Globe } from "lucide-react";
import Link from "next/link";
import { InfiniteDeputiesGrid } from "./InfiniteDeputiesGrid";

const INITIAL_LOAD = 24;

export const dynamic = 'force-dynamic';

export default async function DeputiesPage({
  searchParams
}: {
  searchParams: { q?: string; groupe?: string; commission?: string; sort?: string; statut?: string; region?: string; department?: string }
}) {
  const sortBy = (searchParams.sort || 'alphabetical') as any;
  const activeOnly = searchParams.statut !== 'tous';

  const [{ deputies, total }, groups, commissions, geoData] = await Promise.all([
    getDeputies({
      search: searchParams.q,
      groupId: searchParams.groupe,
      commissionId: searchParams.commission,
      sortBy: sortBy,
      activeOnly: activeOnly,
      region: searchParams.region,
      department: searchParams.department,
      limit: INITIAL_LOAD,
      offset: 0
    }),
    getGroups(),
    getCommissions(),
    getGeoData()
  ]);

  const selectedRegionData = geoData.find(r => r.name === searchParams.region);

  const sortedGroups = (groups as any[]).sort((a, b) => (b._count?.mandates || 0) - (a._count?.mandates || 0));
  const majorityGroups = sortedGroups.filter(g => g.isMajority);
  const oppositionGroups = sortedGroups.filter(g => !g.isMajority);

  const getQueryString = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.groupe) params.set('groupe', searchParams.groupe);
    if (searchParams.commission) params.set('commission', searchParams.commission);
    if (searchParams.sort) params.set('sort', searchParams.sort);
    if (searchParams.statut) params.set('statut', searchParams.statut);
    if (searchParams.region) params.set('region', searchParams.region);
    if (searchParams.department) params.set('department', searchParams.department);

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    return params.toString();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Députés</h1>
              <p className="text-muted-foreground">
                {activeOnly ? `Les ${total} élus en poste` : `Les ${total} députés (actifs et anciens)`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border overflow-x-auto scrollbar-none">
          <Link href={`/deputies?${getQueryString({ sort: 'alphabetical' })}`}>
            <Button variant={sortBy === 'alphabetical' ? "secondary" : "ghost"} size="sm" className="gap-2 shrink-0">
              <SortAsc className="h-4 w-4" /> A-Z
            </Button>
          </Link>
          <Link href={`/deputies?${getQueryString({ sort: 'adopted_amendments' })}`}>
            <Button variant={sortBy === 'adopted_amendments' ? "secondary" : "ghost"} size="sm" className="gap-2 shrink-0">
              <TrendingUp className="h-4 w-4" /> Adoptés
            </Button>
          </Link>
          <Link href={`/deputies?${getQueryString({ sort: 'amendments' })}`}>
            <Button variant={sortBy === 'amendments' ? "secondary" : "ghost"} size="sm" className="gap-2 shrink-0">
              <FileText className="h-4 w-4" /> Total
            </Button>
          </Link>
          <Link href={`/deputies?${getQueryString({ sort: 'propositions' })}`}>
            <Button variant={sortBy === 'propositions' ? "secondary" : "ghost"} size="sm" className="gap-2 shrink-0">
              <Layout className="h-4 w-4" /> PPL
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <form action="/deputies" method="GET" className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Rechercher par nom..."
              className="pl-10 h-11 bg-background"
            />
            {searchParams.groupe && <input type="hidden" name="groupe" value={searchParams.groupe} />}
            {searchParams.commission && <input type="hidden" name="commission" value={searchParams.commission} />}
            {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
            {searchParams.statut && <input type="hidden" name="statut" value={searchParams.statut} />}
          </form>

          <div className="flex items-center gap-2 bg-background p-1 rounded-lg border shrink-0">
            <Link href={`/deputies?${getQueryString({ statut: null })}`}>
              <Button variant={activeOnly ? "secondary" : "ghost"} size="sm" className="px-4">En poste</Button>
            </Link>
            <Link href={`/deputies?${getQueryString({ statut: 'tous' })}`}>
              <Button variant={!activeOnly ? "secondary" : "ghost"} size="sm" className="px-4">Tous</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2 shrink-0">
              <Filter className="h-4 w-4" />
              Groupes:
            </div>
            <Link href={`/deputies?${getQueryString({ groupe: null })}`}>
              <Badge
                variant={!searchParams.groupe ? "default" : "outline"}
                className="cursor-pointer rounded-full px-4 py-1.5 min-h-[36px] flex items-center"
              >
                Tous
              </Badge>
            </Link>
            {sortedGroups.map((group) => (
              <Link
                key={group.uid}
                href={`/deputies?${getQueryString({ groupe: group.uid })}`}
              >
                <Badge
                  variant={searchParams.groupe === group.uid ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105 rounded-full px-4 py-1.5 min-h-[36px] flex items-center font-normal"
                  style={searchParams.groupe === group.uid && group.colorCode ? {
                    backgroundColor: group.colorCode,
                    borderColor: group.colorCode
                  } : group.colorCode ? {
                    borderColor: group.colorCode,
                    color: group.colorCode
                  } : {}}
                >
                  <div className="flex items-center gap-1.5">
                    {group.logoUrl && (
                      <img src={group.logoUrl} alt="" className="h-3 w-3 object-contain"
                        style={searchParams.groupe === group.uid ? { filter: 'brightness(0) invert(1)' } : {}} />
                    )}
                    {group.acronym || group.name}
                  </div>
                </Badge>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2 shrink-0">
              <Globe className="h-4 w-4" />
              Régions:
            </div>
            <Link href={`/deputies?${getQueryString({ region: null, department: null })}`}>
              <Badge
                variant={!searchParams.region ? "default" : "outline"}
                className="cursor-pointer rounded-full px-4 py-1.5 min-h-[36px] flex items-center"
              >
                Toutes
              </Badge>
            </Link>
            {geoData.map((region) => (
              <Link
                key={region.name}
                href={`/deputies?${getQueryString({ region: region.name, department: null })}`}
              >
                <Badge
                  variant={searchParams.region === region.name ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105 rounded-full px-4 py-1.5 min-h-[36px] flex items-center font-normal whitespace-nowrap"
                >
                  {region.name}
                </Badge>
              </Link>
            ))}
          </div>

          {searchParams.region && selectedRegionData && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2 shrink-0">
                <MapPin className="h-4 w-4" />
                Départements:
              </div>
              <Link href={`/deputies?${getQueryString({ department: null })}`}>
                <Badge
                  variant={!searchParams.department ? "default" : "outline"}
                  className="cursor-pointer rounded-full px-4 py-1.5 min-h-[36px] flex items-center"
                >
                  Tous
                </Badge>
              </Link>
              {selectedRegionData.departments.map((dept) => (
                <Link
                  key={dept.name}
                  href={`/deputies?${getQueryString({ department: dept.name })}`}
                >
                  <Badge
                    variant={searchParams.department === dept.name ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105 rounded-full px-4 py-1.5 min-h-[36px] flex items-center font-normal whitespace-nowrap"
                  >
                    {dept.name} ({dept.code})
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2 shrink-0">
              <Layout className="h-4 w-4" />
              Commissions:
            </div>
            <Link href={`/deputies?${getQueryString({ commission: null })}`}>
              <Badge
                variant={!searchParams.commission ? "default" : "outline"}
                className="cursor-pointer rounded-full px-4 py-1.5 min-h-[36px] flex items-center"
              >
                Toutes
              </Badge>
            </Link>
            {commissions.map((comm: any) => (
              <Link
                key={comm.uid}
                href={`/deputies?${getQueryString({ commission: comm.uid })}`}
              >
                <Badge
                  variant={searchParams.commission === comm.uid ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105 rounded-full px-4 py-1.5 min-h-[36px] flex items-center font-normal whitespace-nowrap"
                >
                  {comm.acronym || comm.name}
                </Badge>
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* Results Grid with Infinite Scroll */}
      {deputies.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-xl font-semibold mb-2">Aucun député trouvé</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Nous n'avons trouvé aucun député correspondant à vos critères de recherche.
          </p>
          <Link href="/deputies" className="mt-6 inline-block">
            <Button variant="secondary">Réinitialiser les filtres</Button>
          </Link>
        </div>
      ) : (
        <InfiniteDeputiesGrid
          initialDeputies={deputies}
          total={total}
          filters={searchParams}
        />
      )}
    </div>
  );
}
