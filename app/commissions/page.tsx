import { getAllCommissionStats } from "@/lib/commissions";
import { CommissionCard } from "@/components/CommissionCard";
import { LayoutGrid, TrendingUp, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
    const allStats = await getAllCommissionStats();

    const permanentCommissions = allStats.filter(s => s.type === 'COMPER');
    const specialCommissions = allStats.filter(s => s.type === 'CNPS');

    // Find the most active commission
    const mostActive = [...allStats].sort((a, b) => b.totalDossiers - a.totalDossiers)[0];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <LayoutGrid className="h-5 w-5" />
                        <span>Assemblée Nationale</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Commissions Parlementaires</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Suivez le travail de fond des députés. De la Commission des lois aux commissions spéciales ad hoc.
                    </p>
                </div>

                {mostActive && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 shrink-0">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Commission la plus active</p>
                            <p className="font-bold text-sm line-clamp-1 max-w-[200px]">{mostActive.name}</p>
                            <p className="text-xs text-muted-foreground">{mostActive.totalDossiers} dossiers traités</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Commissions Permanentes */}
            {permanentCommissions.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-1.5 bg-primary rounded-full" />
                        <h2 className="text-2xl font-bold">Commissions Permanentes</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {permanentCommissions.map((stats) => (
                            <CommissionCard key={stats.uid} stats={stats} />
                        ))}
                    </div>
                </div>
            )}

            {/* Commissions Spéciales / Ad Hoc */}
            {specialCommissions.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-1.5 bg-orange-500 rounded-full" />
                        <h2 className="text-2xl font-bold">Commissions Spéciales & Ad Hoc</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {specialCommissions.map((stats) => (
                            <CommissionCard key={stats.uid} stats={stats} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {allStats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-4 bg-muted rounded-full">
                        <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">Aucune donnée trouvée</h3>
                    <p className="text-muted-foreground">Nous n'avons pas pu charger les statistiques des commissions pour le moment.</p>
                </div>
            )}
        </div>
    );
}
