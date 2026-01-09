import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function DeputiesLoading() {
    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>

                {/* Sort buttons skeleton */}
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <Skeleton className="h-11 flex-1 w-full" />
                    <div className="flex items-center gap-2 bg-background p-1 rounded-lg border shrink-0">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Groups filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Skeleton className="h-4 w-20 shrink-0" />
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-7 w-16 rounded-full shrink-0" />
                        ))}
                    </div>

                    {/* Regions filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Skeleton className="h-4 w-20 shrink-0" />
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-7 w-24 rounded-full shrink-0" />
                        ))}
                    </div>

                    {/* Commissions filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Skeleton className="h-4 w-24 shrink-0" />
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-7 w-20 rounded-full shrink-0" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="border-l-4 border-l-muted h-full">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            </div>

                            <div className="space-y-3 mt-4 pt-4 border-t border-muted/50">
                                <Skeleton className="h-3 w-32" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <Skeleton className="h-16 rounded-xl" />
                                <Skeleton className="h-16 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
