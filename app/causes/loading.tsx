import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

export default function CausesLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-background p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-sm font-medium">
                            <Target className="h-4 w-4" />
                            Mobilisation citoyenne
                        </div>
                        <Skeleton className="h-9 w-56" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-11 w-40 rounded-lg" />
                </div>
            </div>

            {/* Search */}
            <Skeleton className="h-11 max-w-md" />

            {/* Results count */}
            <Skeleton className="h-4 w-32" />

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="h-full">
                        <Skeleton className="h-32 rounded-t-xl" />
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full mt-2" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
