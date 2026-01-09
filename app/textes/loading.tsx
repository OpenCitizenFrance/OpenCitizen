import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

export default function TextesLoading() {
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
                        Chargement des dossiers...
                    </p>
                </div>
            </div>

            {/* Filters skeleton */}
            <div className="rounded-2xl border bg-card p-6">
                <div className="space-y-6">
                    <Skeleton className="h-11 w-full" />
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-8 w-24 rounded-full" />
                        ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                </div>
            </div>

            {/* Results skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
            </div>

            {/* Cards skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="rounded-lg border bg-card p-5">
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                            <div className="flex-1 space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex items-center justify-center gap-2 mt-12">
                <Skeleton className="h-9 w-28" />
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-9 w-9" />
                    ))}
                </div>
                <Skeleton className="h-9 w-24" />
            </div>
        </div>
    );
}
