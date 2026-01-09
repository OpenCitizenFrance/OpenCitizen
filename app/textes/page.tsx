import { getDossiers, getCommissions, getPoliticalGroups } from "@/lib/dossiers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Vote, BookOpen, Layers, ChevronLeft, ChevronRight, Filter, Calendar, Building2, Users } from "lucide-react";
import Link from "next/link";
import { DossierStatus, DossierType } from "@prisma/client";
import Image from "next/image";
import { HemicycleFilter } from "@/components/HemicycleFilter";
import { DateRangeSlider } from "@/components/DateRangeSlider";
import { StatusFilters } from "./StatusFilters";

export const dynamic = 'force-dynamic';

export default async function TextesPage({
    searchParams
}: {
    searchParams: {
        q?: string;
        status?: string;
        type?: string;
        commission?: string;
        groupe?: string;
        creationFrom?: string;
        creationTo?: string;
        updateFrom?: string;
        updateTo?: string;
        page?: string
    }
}) {
    const page = parseInt(searchParams.page || "1");
    const limit = 15;
    const offset = (page - 1) * limit;

    const [{ dossiers, total }, commissions, politicalGroups] = await Promise.all([
        getDossiers({
            search: searchParams.q,
            status: searchParams.status as DossierStatus,
            type: searchParams.type as DossierType,
            commissionId: searchParams.commission,
            groupIds: searchParams.groupe?.split(',').filter(Boolean),
            creationFrom: searchParams.creationFrom ? new Date(searchParams.creationFrom) : undefined,
            creationTo: searchParams.creationTo ? new Date(searchParams.creationTo) : undefined,
            updateFrom: searchParams.updateFrom ? new Date(searchParams.updateFrom) : undefined,
            updateTo: searchParams.updateTo ? new Date(searchParams.updateTo) : undefined,
            limit,
            offset
        }),
        getCommissions(),
        getPoliticalGroups()
    ]);

    const statusColors: Record<string, string> = {
        EN_COURS: 'bg-blue-500',
        PROMULGUE: 'bg-purple-500',
        REJETE: 'bg-red-500'
    };

    const statusLabels: Record<string, string> = {
        EN_COURS: 'En cours',
        PROMULGUE: 'Promulgué',
        REJETE: 'Rejeté'
    };

    const typeLabels: Record<string, string> = {
        PROJET_LOI: 'Projet de loi',
        PROJET_LOI_FIN: 'Projet de loi de finances',
        PROJET_LOI_ORG: 'Projet de loi organique',
        PROPOSITION_LOI: 'Proposition de loi'
    };

    const totalPages = Math.ceil(total / limit);

    const getQueryString = (overrides: Record<string, string | number | null>) => {
        const params = new URLSearchParams();
        if (searchParams.q) params.set('q', searchParams.q);
        if (searchParams.status) params.set('status', searchParams.status);
        if (searchParams.type) params.set('type', searchParams.type);
        if (searchParams.commission) params.set('commission', searchParams.commission);
        if (searchParams.groupe) params.set('groupe', searchParams.groupe);
        if (searchParams.creationFrom) params.set('creationFrom', searchParams.creationFrom);
        if (searchParams.creationTo) params.set('creationTo', searchParams.creationTo);
        if (searchParams.updateFrom) params.set('updateFrom', searchParams.updateFrom);
        if (searchParams.updateTo) params.set('updateTo', searchParams.updateTo);
        params.set('page', page.toString());

        Object.entries(overrides).forEach(([key, value]) => {
            if (value === null) params.delete(key);
            else params.set(key, value.toString());
        });
        return params.toString();
    };

    // Check if dossier is a government bill (projet de loi)
    const isProjetDeLoi = (type: string) => type.startsWith('PROJET_LOI');

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dossiers Législatifs</h1>
                    <p className="text-muted-foreground">
                        Suivez le parcours complet des lois, de leur dépôt à leur promulgation.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border">
                {/* Search + Status Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <form action="/textes" method="GET" className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="q"
                            defaultValue={searchParams.q}
                            placeholder="Rechercher par titre ou numéro (ex: 1440)..."
                            className="pl-10 h-11 bg-background"
                        />
                        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
                        {searchParams.commission && <input type="hidden" name="commission" value={searchParams.commission} />}
                        {searchParams.groupe && <input type="hidden" name="groupe" value={searchParams.groupe} />}
                        {searchParams.creationFrom && <input type="hidden" name="creationFrom" value={searchParams.creationFrom} />}
                        {searchParams.creationTo && <input type="hidden" name="creationTo" value={searchParams.creationTo} />}
                        {searchParams.updateFrom && <input type="hidden" name="updateFrom" value={searchParams.updateFrom} />}
                        {searchParams.updateTo && <input type="hidden" name="updateTo" value={searchParams.updateTo} />}
                    </form>

                    <StatusFilters currentStatus={searchParams.status} />
                </div>

                {/* Commission Filter */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        Filtrer par Commission
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Link href={`/textes?${getQueryString({ commission: null, page: 1 })}`}>
                            <Badge
                                variant={!searchParams.commission ? "default" : "outline"}
                                className="px-3 py-1 cursor-pointer transition-all hover:scale-105"
                            >
                                Toutes
                            </Badge>
                        </Link>
                        {commissions.map((comm) => (
                            <Link
                                key={comm.uid}
                                href={`/textes?${getQueryString({ commission: comm.uid, page: 1 })}`}
                            >
                                <Badge
                                    variant={searchParams.commission === comm.uid ? "default" : "outline"}
                                    className="px-3 py-1 cursor-pointer transition-all hover:scale-105 font-normal"
                                >
                                    {comm.acronym || comm.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 3D Hemicycle + Date Filter Row */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* 3D Hemicycle for Political Groups */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Groupes Politiques — Cliquez pour filtrer ou accéder au groupe
                        </div>
                        <div className="bg-gradient-to-b from-background to-muted/30 rounded-xl p-4 border">
                            <HemicycleFilter
                                groups={politicalGroups as any}
                            />
                        </div>
                    </div>

                    {/* Date Filters */}
                    <div className="space-y-5">
                        {/* Creation Date Filter */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Date de création (dépôt)
                            </div>
                            <DateRangeSlider
                                minDate={new Date('2024-07-18')} // Start of 17th legislature
                                maxDate={new Date()}
                                currentMin={searchParams.creationFrom ? new Date(searchParams.creationFrom) : undefined}
                                currentMax={searchParams.creationTo ? new Date(searchParams.creationTo) : undefined}
                                baseUrl="/textes"
                                paramPrefix="creation"
                            />
                        </div>

                        {/* Last Update Date Filter */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Date de dernière mise à jour
                            </div>
                            <DateRangeSlider
                                minDate={new Date('2024-07-18')} // Start of 17th legislature
                                maxDate={new Date()}
                                currentMin={searchParams.updateFrom ? new Date(searchParams.updateFrom) : undefined}
                                currentMax={searchParams.updateTo ? new Date(searchParams.updateTo) : undefined}
                                baseUrl="/textes"
                                paramPrefix="update"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                    <span className="text-primary font-bold">{total}</span> dossier{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Page {page} sur {totalPages || 1}</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {dossiers.map((dossier: any, idx: number) => {
                    const authorGroup = dossier.author?.mandates?.[0]?.group;

                    return (
                        <Link key={dossier.uid} href={`/dossiers/${dossier.uid}`}>
                            <Card className="card-hover group border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Author Photo / Government Icon */}
                                        <div className="hidden sm:flex flex-col items-center justify-center shrink-0">
                                            {isProjetDeLoi(dossier.type) ? (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-red-600 flex items-center justify-center shadow-md">
                                                    <Building2 className="h-7 w-7 text-white" />
                                                </div>
                                            ) : dossier.author?.imageUrl ? (
                                                <Image
                                                    src={dossier.author.imageUrl}
                                                    alt={`${dossier.author.firstName} ${dossier.author.lastName}`}
                                                    width={56}
                                                    height={56}
                                                    className="rounded-full object-cover shadow-md"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                                        {dossier.title || "Sans titre"}
                                                    </h3>

                                                    {/* Author Info */}
                                                    <div className="text-sm text-muted-foreground">
                                                        {isProjetDeLoi(dossier.type) ? (
                                                            <span className="flex items-center gap-1.5">
                                                                <Building2 className="h-3.5 w-3.5" />
                                                                Gouvernement
                                                            </span>
                                                        ) : dossier.author ? (
                                                            <span className="flex items-center gap-1.5">
                                                                Par <span className="font-medium text-foreground">
                                                                    {dossier.author.firstName} {dossier.author.lastName}
                                                                </span>
                                                                {authorGroup && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-[10px] ml-1"
                                                                        style={authorGroup.colorCode ? {
                                                                            borderColor: authorGroup.colorCode,
                                                                            color: authorGroup.colorCode
                                                                        } : undefined}
                                                                    >
                                                                        {authorGroup.acronym || authorGroup.name}
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="italic">Auteur non renseigné</span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                                                            {typeLabels[dossier.type] || dossier.type.replace(/_/g, ' ')}
                                                        </Badge>
                                                        {dossier.commission && (
                                                            <span className="text-xs text-accent font-medium px-2 py-0.5 bg-accent/10 rounded-full">
                                                                {dossier.commission.acronym || dossier.commission.name}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Dates */}
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                        {dossier._creationDate && (
                                                            <span className="flex items-center gap-1" title="Date de création (dépôt)">
                                                                <Calendar className="h-3 w-3" />
                                                                Créé le {new Date(dossier._creationDate).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                        {dossier._lastActivityDate && (
                                                            <span className="flex items-center gap-1 text-primary/70" title="Dernière mise à jour">
                                                                <Layers className="h-3 w-3" />
                                                                Mis à jour le {new Date(dossier._lastActivityDate).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className={
                                                    `${statusColors[dossier.status] || 'bg-secondary'} hover:${statusColors[dossier.status]} text-white border-0 px-3 py-1 whitespace-nowrap`
                                                }>
                                                    {statusLabels[dossier.status] || dossier.status}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mt-5 text-sm text-muted-foreground border-t pt-4">
                                                <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-full border">
                                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                                    <span className="font-medium text-foreground">{dossier._count.amendments}</span> amendements
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-full border">
                                                    <Vote className="h-3.5 w-3.5 text-primary" />
                                                    <span className="font-medium text-foreground">{dossier._count.votes}</span> scrutins
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                    <Link href={`/textes?${getQueryString({ page: Math.max(1, page - 1) })}`}>
                        <Button variant="outline" size="sm" disabled={page === 1} className="gap-2">
                            <ChevronLeft className="h-4 w-4" /> Précédent
                        </Button>
                    </Link>

                    <div className="flex items-center gap-1 px-4">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = page;
                            if (page < 3) pageNum = i + 1;
                            else if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = page - 2 + i;

                            if (pageNum < 1 || pageNum > totalPages) return null;

                            return (
                                <Link key={pageNum} href={`/textes?${getQueryString({ page: pageNum })}`}>
                                    <Button
                                        variant={page === pageNum ? "default" : "ghost"}
                                        size="sm"
                                        className="w-9 h-9"
                                    >
                                        {pageNum}
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>

                    <Link href={`/textes?${getQueryString({ page: Math.min(totalPages, page + 1) })}`}>
                        <Button variant="outline" size="sm" disabled={page === totalPages} className="gap-2">
                            Suivant <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )}

            {dossiers.length === 0 && (
                <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed">
                    <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-xl font-semibold mb-2">Aucun dossier trouvé</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Nous n'avons trouvé aucun dossier correspondant à vos critères de recherche. Essayez de réinitialiser les filtres.
                    </p>
                    <Link href="/textes" className="mt-6 inline-block">
                        <Button variant="secondary">Réinitialiser les filtres</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
