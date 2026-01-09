"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, BarChart3 } from "lucide-react";
import { CommissionStats } from "@/lib/commissions";
import { cleanHtml } from "@/lib/text-utils";

interface CommissionCardProps {
    stats: CommissionStats;
}

export function CommissionCard({ stats }: CommissionCardProps) {
    const statusColors: Record<string, string> = {
        EN_COURS: "bg-blue-500",
        ADOPTE: "bg-green-500",
        PROMULGUE: "bg-purple-500",
        REJETE: "bg-red-500",
        RETIRE: "bg-gray-500",
    };

    // Icon mapping based on UID or Name keywords
    const getCommissionIcon = () => {
        const name = stats.name.toLowerCase();
        if (name.includes('lois')) return "/commissions/icons/laws.png";
        if (name.includes('finances') || name.includes('économ')) return "/commissions/icons/finance.png";
        if (name.includes('social') || name.includes('santé') || name.includes('culture')) return "/commissions/icons/social.png";
        if (name.includes('développement durable') || name.includes('environ') || name.includes('aménagement')) return "/commissions/icons/environment.png";
        return null;
    };

    const iconUrl = getCommissionIcon();

    return (
        <Card className="group hover:shadow-xl transition-all duration-500 border-primary/10 hover:border-primary/30 overflow-hidden flex flex-col bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3 bg-muted/20 relative overflow-hidden">
                {/* Visual Background Decoration */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                <div className="flex justify-between items-start gap-4 relative z-10">
                    <div className="flex-1 space-y-2">
                        <CardTitle className="text-lg font-extrabold leading-snug line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors pr-4">
                            {stats.name}
                        </CardTitle>
                    </div>

                    {iconUrl ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border shadow-inner bg-white shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <img src={iconUrl} alt={stats.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold text-primary">{stats.totalDossiers}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Dossiers</span>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-1.5 justify-end">
                        {stats.statusDistribution.slice(0, 3).map((s) => (
                            <Badge key={s.status} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[s.status] || 'bg-gray-400'} mr-1.5`} />
                                {s.count} {s.status.toLowerCase().replace('_', ' ')}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dernières activités</p>
                    {stats.recentDossiers.map((d) => (
                        <div key={d.uid} className="flex items-start gap-2 text-sm group/item">
                            <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="line-clamp-1 flex-1 text-xs text-muted-foreground group-hover/item:text-foreground transition-colors italic">
                                {cleanHtml(d.title)}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="pt-0 pb-4 px-6 mt-auto">
                <Link href={`/commissions/${stats.uid}`} className="w-full">
                    <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2 rounded-md bg-primary/5 hover:bg-primary/10">
                        Explorer la commission
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </Link>
            </CardFooter>
        </Card>
    );
}
