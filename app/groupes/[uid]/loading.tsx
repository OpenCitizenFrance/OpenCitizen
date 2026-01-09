import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Users, Vote, FileText, TrendingUp } from "lucide-react";

export default function GroupeProfileLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back link */}
            <div className="inline-flex items-center gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux groupes</span>
            </div>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-primary/5 to-background p-6 md:p-8">
                <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Skeleton className="h-20 w-20 rounded-xl" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-10 w-80" />
                        <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Users, color: "text-purple-600", bg: "bg-purple-500/10" },
                    { icon: Vote, color: "text-primary", bg: "bg-primary/10" },
                    { icon: FileText, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { icon: TrendingUp, color: "text-green-600", bg: "bg-green-500/10" },
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
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Deputies Grid */}
            <Card>
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Vote className="h-5 w-5 text-primary" />
                        <Skeleton className="h-5 w-36" />
                    </div>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
