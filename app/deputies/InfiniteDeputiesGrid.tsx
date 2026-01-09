"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, TrendingUp, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { loadMoreDeputies } from "./actions";

const ITEMS_PER_PAGE = 24;

interface Deputy {
    uid: string;
    slug: string;
    firstName: string;
    lastName: string;
    imageUrl: string | null;
    active: boolean;
    currentGroup: { acronym?: string; name: string; colorCode?: string } | null;
    currentCommission: { name: string } | null;
    departmentName: string | null;
    departmentCode: string | null;
    regionName: string | null;
    adoptedAmendmentCount: number;
    amendmentCount: number;
    activities: { type: 'PPL' | 'AMEND'; title: string }[];
}

interface InfiniteDeputiesGridProps {
    initialDeputies: Deputy[];
    total: number;
    filters: {
        q?: string;
        groupe?: string;
        commission?: string;
        sort?: string;
        statut?: string;
        region?: string;
        department?: string;
    };
}

export function InfiniteDeputiesGrid({
    initialDeputies,
    total,
    filters
}: InfiniteDeputiesGridProps) {
    const [deputies, setDeputies] = useState<Deputy[]>(initialDeputies);
    const [hasMore, setHasMore] = useState(initialDeputies.length < total);
    const [isPending, startTransition] = useTransition();
    const loaderRef = useRef<HTMLDivElement>(null);

    // Reset when filters change
    useEffect(() => {
        setDeputies(initialDeputies);
        setHasMore(initialDeputies.length < total);
    }, [initialDeputies, total]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !isPending) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [hasMore, isPending, deputies.length]);

    const loadMore = () => {
        startTransition(async () => {
            const result = await loadMoreDeputies({
                search: filters.q,
                groupId: filters.groupe,
                commissionId: filters.commission,
                sortBy: (filters.sort || 'alphabetical') as any,
                activeOnly: filters.statut !== 'tous',
                region: filters.region,
                department: filters.department,
                limit: ITEMS_PER_PAGE,
                offset: deputies.length
            });

            const newDeputies = result.deputies as Deputy[];
            setDeputies(prev => [...prev, ...newDeputies]);
            setHasMore(deputies.length + newDeputies.length < result.total);
        });
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
                {deputies.map((deputy, index) => (
                    <Link key={deputy.uid} href={`/deputies/${deputy.slug}`}>
                        <Card
                            className={`card-hover group border-l-4 transition-all duration-300 h-full flex flex-col ${deputy.active ? 'border-l-primary' : 'grayscale opacity-70 border-l-muted-foreground/30'}`}
                            style={index >= initialDeputies.length ? { animationDelay: `${(index - initialDeputies.length) * 50}ms` } : undefined}
                        >
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start gap-4 mb-4">
                                    <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl group-hover:scale-105 transition-all shrink-0">
                                        <AvatarImage src={deputy.imageUrl || ""} alt={`${deputy.firstName} ${deputy.lastName}`} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-bold">
                                            {deputy.firstName[0]}{deputy.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-extrabold text-xl leading-tight group-hover:text-primary transition-colors mb-2">
                                            {deputy.firstName} {deputy.lastName}
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-1">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] py-0 h-5"
                                                    style={deputy.currentGroup?.colorCode ? {
                                                        backgroundColor: `${deputy.currentGroup.colorCode}20`,
                                                        color: deputy.currentGroup.colorCode,
                                                        borderColor: `${deputy.currentGroup.colorCode}40`
                                                    } : {}}
                                                >
                                                    {deputy.currentGroup?.acronym || deputy.currentGroup?.name || "Non inscrit"}
                                                </Badge>
                                                {!deputy.active && (
                                                    <Badge variant="outline" className="text-[10px] py-0 h-5 text-muted-foreground border-muted-foreground/50">
                                                        Ancien député
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                {deputy.departmentName && (
                                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                                        <MapPin className="h-2.5 w-2.5" />
                                                        {deputy.departmentName} {deputy.departmentCode ? `(${deputy.departmentCode})` : ''}
                                                    </div>
                                                )}
                                                {deputy.regionName && (
                                                    <div className="text-[9px] text-muted-foreground/70 uppercase tracking-wide pl-3.5">
                                                        {deputy.regionName}
                                                    </div>
                                                )}
                                            </div>
                                            {deputy.currentCommission && (
                                                <span className="text-[10px] text-muted-foreground italic leading-tight">
                                                    {deputy.currentCommission.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Activities Section */}
                                <div className="space-y-3 mt-4 pt-4 border-t border-muted/50">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        Activités principales
                                    </p>
                                    <div className="space-y-2">
                                        {deputy.activities && deputy.activities.length > 0 ? (
                                            deputy.activities.map((act, idx) => (
                                                <div key={idx} className="flex items-start gap-2 group/item">
                                                    {act.type === 'PPL' ? (
                                                        <FileText className="h-3 w-3 mt-0.5 text-blue-500 shrink-0" />
                                                    ) : (
                                                        <TrendingUp className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                                                    )}
                                                    <p className="text-[11px] leading-tight text-muted-foreground group-hover/item:text-foreground transition-colors line-clamp-2">
                                                        {act.title}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[11px] italic text-muted-foreground/50">Aucune activité récente répertoriée</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto pt-6">
                                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-primary/[0.03] border border-primary/10 group-hover:bg-primary/5 transition-colors">
                                        <span className="text-2xl font-black text-primary">{deputy.adoptedAmendmentCount}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Adoptés</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-muted/30 border border-transparent group-hover:bg-muted/50 transition-colors">
                                        <span className="text-2xl font-black text-foreground/80">{deputy.amendmentCount}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Total</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Loader / End of list */}
            <div ref={loaderRef} className="flex justify-center py-8">
                {isPending ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Chargement...</span>
                    </div>
                ) : hasMore ? (
                    <div className="h-10" />
                ) : deputies.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {deputies.length} député{deputies.length > 1 ? 's' : ''} affiché{deputies.length > 1 ? 's' : ''}
                    </p>
                ) : null}
            </div>
        </>
    );
}
