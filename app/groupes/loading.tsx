import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { UsersRound } from "lucide-react";

export default function GroupesLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                    <UsersRound className="h-6 w-6 text-accent" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(10)].map((_, i) => (
                    <Card key={i} className="h-full overflow-hidden">
                        <Skeleton className="h-2 w-full" />
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-4 w-32 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
