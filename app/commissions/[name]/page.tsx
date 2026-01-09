import { getCommissionStats } from "@/lib/commissions";
import { getDossiers } from "@/lib/dossiers";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowLeft, BarChart3, Clock, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { cleanHtml } from "@/lib/text-utils";

export const dynamic = "force-dynamic";

interface CommissionDetailPageProps {
    params: {
        name: string;
    };
}

export default async function CommissionDetailPage({ params }: CommissionDetailPageProps) {
    const decodedName = decodeURIComponent(params.name);
    const stats = await getCommissionStats(decodedName);

    if (!stats) {
        notFound();
    }

    const { dossiers } = await getDossiers({ commissionId: decodedName, limit: 50 });

    const statusColors: Record<string, string> = {
        EN_COURS: "bg-blue-500",
        ADOPTE: "bg-green-500",
        PROMULGUE: "bg-purple-500",
        REJETE: "bg-red-500",
        RETIRE: "bg-gray-500",
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Back button */}
            <Link href="/commissions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Retour aux commissions
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <LayoutGrid className="h-5 w-5" />
                        <span>Commission Spécialisée</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight max-w-4xl">
                        {stats.name}
                    </h1>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">{stats.totalDossiers} dossiers traités</span>
                        </div>
                    </div>
                </div>

                {/* Status distribution overview */}
                <div className="flex gap-2">
                    {stats.statusDistribution.map((s) => (
                        <div key={s.status} className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border min-w-[80px]">
                            <span className="text-xl font-bold">{s.count}</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                                {s.status.replace('_', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left col: Dossiers list */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Historique Légal
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {dossiers.map((dossier) => (
                            <Link key={dossier.uid} href={`/dossiers/${dossier.uid}`}>
                                <Card className="hover:bg-accent/50 transition-colors border-primary/5 group">
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] px-1 h-4 uppercase">
                                                    {dossier.type.replace('_', ' ')}
                                                </Badge>
                                                <Badge className={`${statusColors[dossier.status] || 'bg-gray-500'} text-[10px] px-1 h-4`}>
                                                    {dossier.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <h3 className="font-bold text-sm line-clamp-2 leading-snug">
                                                {cleanHtml(dossier.title)}
                                            </h3>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                {dossier.uid}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right col: Stats & Analysis */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Analyse d'impact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-muted-foreground">
                                Répartition des issues pour les dossiers traités par cette commission en 17ème législature.
                            </p>

                            <div className="space-y-4">
                                {stats.statusDistribution.map((s) => {
                                    const percentage = Math.round((s.count / stats.totalDossiers) * 100);
                                    return (
                                        <div key={s.status} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>{s.status.replace('_', ' ')}</span>
                                                <span className="text-muted-foreground">{percentage}% ({s.count})</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${statusColors[s.status] || 'bg-gray-500'} transition-all`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note d'analyse</h4>
                                <p className="text-[11px] leading-relaxed italic text-muted-foreground">
                                    Une forte proportion de dossiers "EN COURS" est typique d'une législature active. Les commissions de fond jouent un rôle crucial dans le filtrage des amendements avant la séance publique.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder for more commission specific info */}
                    <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-6 border border-primary/10">
                        <h3 className="font-bold mb-2">Comprendre cette commission</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Chaque commission est composée de députés spécialisés par thématique. Elles sont le lieu du premier débat législatif approfondi où chaque mot de la loi est pesé.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
