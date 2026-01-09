import { getDossierByUid, getDossierAmendmentStats } from "@/lib/dossiers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, PieChart, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatAmendmentTitle, extractArticleNumber } from "@/lib/legislative-utils";


export const dynamic = 'force-dynamic';

async function getAmendments(dossierId: string, status?: string, groupId?: string) {
    return prisma.amendment.findMany({
        where: {
            lawId: dossierId, // Changed to lawId to match schema
            status: status ? status : undefined,
            groupId: groupId ? groupId : undefined
        },
        include: {
            author: true,
            group: true
        },
        // orderBy: { uid: 'asc' }, // default sort
        take: 50 // Limit for performance, in real app need pagination
    }) as any;
}

export default async function AmendmentsPage({
    params,
    searchParams
}: {
    params: { uid: string },
    searchParams: { status?: string, group?: string }
}) {
    const dossier: any = await getDossierByUid(params.uid);
    if (!dossier) notFound();

    const stats = await getDossierAmendmentStats(params.uid);
    const amendments = await getAmendments(params.uid, searchParams.status, searchParams.group);

    const statusColors: Record<string, string> = {
        ADOPTE: 'bg-green-500',
        REJETE: 'bg-red-500',
        RETIRÉ: 'bg-gray-500',
        TOMBE: 'bg-orange-500',
        IRRECEVABLE: 'bg-yellow-500'
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            <Link href={`/dossiers/${dossier.uid}`} className="absolute -top-12 left-0 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Retour au dossier
            </Link>

            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">
                    Amendements
                </h1>
                <p className="text-muted-foreground">
                    Analyse des {dossier._count.amendments} amendements déposés sur le texte.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Répartition par Groupe
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.map((stat: any) => (
                                <div key={stat.group.name} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{stat.group.name}</span>
                                            <span className="text-muted-foreground">({stat.total})</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {stat.breakdown['ADOPTE'] > 0 && (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                    {stat.breakdown['ADOPTE']} adoptés
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {/* Mini Stacked Bar */}
                                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                                        {Object.entries(stat.breakdown).map(([status, count]: [string, any]) => (
                                            <div
                                                key={status}
                                                style={{ width: `${(count / stat.total) * 100}%` }}
                                                className={statusColors[status] || 'bg-gray-300'}
                                                title={`${status}: ${count}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Filters (could be interactive client component, using links for now) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtres
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/dossiers/${dossier.uid}/amendements`}>
                                <Button variant="outline" size="sm" className={!searchParams.status ? "bg-primary text-primary-foreground" : ""}>
                                    Tous
                                </Button>
                            </Link>
                            {['ADOPTE', 'REJETE', 'IRRECEVABLE'].map(s => (
                                <Link key={s} href={`/dossiers/${dossier.uid}/amendements?status=${s}`}>
                                    <Button variant="outline" size="sm" className={searchParams.status === s ? "bg-primary text-primary-foreground" : ""}>
                                        {s}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Liste des amendements ({amendments.length} affichés)</h2>
                <div className="grid gap-4">
                    {amendments.map((amdt: any) => {
                        const articleNumber = extractArticleNumber(amdt);
                        const amendmentTitle = formatAmendmentTitle(articleNumber);

                        return (
                            <Card key={amdt.uid} className="hover:border-primary/50 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="font-bold text-base">{amendmentTitle}</span>
                                                <span className="font-mono text-sm text-muted-foreground">({amdt.uid})</span>
                                                {amdt.group && (
                                                    <Badge variant="secondary" style={{
                                                        backgroundColor: amdt.group.colorCode || undefined,
                                                        color: amdt.group.colorCode ? '#fff' : undefined
                                                    }}>
                                                        {amdt.group.acronym}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Par {amdt.author.firstName} {amdt.author.lastName}
                                            </div>
                                        </div>
                                        <Badge className={statusColors[amdt.status || ''] || 'bg-gray-500'}>
                                            {amdt.status || 'Non défini'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {amdt.expose && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Exposé sommaire
                                            </p>
                                            <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md border-l-2 border-primary/30">
                                                {amdt.expose}
                                            </p>
                                        </div>
                                    )}

                                    {amdt.content && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Dispositif
                                            </p>
                                            <div className="bg-muted/50 p-3 rounded-md text-sm leading-relaxed max-h-[200px] overflow-y-auto">
                                                <div
                                                    className="prose prose-sm dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: amdt.content.substring(0, 500) + (amdt.content.length > 500 ? '...' : '') }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
