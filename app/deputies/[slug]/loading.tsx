import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Award, Vote, FileText } from "lucide-react";

export default function DeputyProfileLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back link */}
            <div className="inline-flex items-center gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux députés</span>
            </div>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-6 md:p-8">
                <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-10 w-64" />
                        <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-7 w-40 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-56" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-28" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: TrendingUp, color: "text-green-600", bg: "bg-green-500/10" },
                    { icon: Award, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { icon: Vote, color: "text-primary", bg: "bg-primary/10" },
                    { icon: FileText, color: "text-accent", bg: "bg-accent/10" },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                            {i < 2 && (
                                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                                    <Skeleton className="h-full w-3/4 rounded-full" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Votes */}
            <Card>
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Vote className="h-5 w-5 text-primary" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-4 w-72 mt-1" />
                </CardHeader>
                <CardContent className="p-0 divide-y">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Amendments */}
            <Card>
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-accent" />
                        <Skeleton className="h-5 w-44" />
                    </div>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Comments Section Placeholder */}
            <div className="mt-12 max-w-3xl space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        </div>
    );
}
