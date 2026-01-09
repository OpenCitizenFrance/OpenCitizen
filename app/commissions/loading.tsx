import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

export default function CommissionsLoading() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <LayoutGrid className="h-5 w-5" />
                        <span>Assemblée Nationale</span>
                    </div>
                    <Skeleton className="h-10 w-80" />
                    <Skeleton className="h-5 w-96" />
                </div>

                {/* Most active commission skeleton */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 shrink-0">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            </div>

            {/* Commissions Permanentes */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-1.5 bg-primary rounded-full" />
                    <Skeleton className="h-7 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="h-2 w-full" />
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-3">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                                    <Skeleton className="h-16 rounded-lg" />
                                    <Skeleton className="h-16 rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Commissions Spéciales */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-1.5 bg-orange-500 rounded-full" />
                    <Skeleton className="h-7 w-72" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="h-2 w-full" />
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-3">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                                    <Skeleton className="h-16 rounded-lg" />
                                    <Skeleton className="h-16 rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
