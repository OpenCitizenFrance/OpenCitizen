import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, FileText, UsersRound, Target, Clock, Bell } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-background p-8 md:p-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-80" />
                        <div className="flex items-center gap-2 mt-4">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
                    { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { icon: UsersRound, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { icon: Target, color: "text-orange-500", bg: "bg-orange-500/10" },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-8 w-12" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Followed Deputies */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    <Skeleton className="h-5 w-40" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-1 flex-1">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-5 w-12 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Followed Groups */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UsersRound className="h-5 w-5 text-purple-500" />
                                    <Skeleton className="h-5 w-48" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border">
                                        <Skeleton className="w-4 h-12 rounded-full" />
                                        <div className="space-y-1 flex-1">
                                            <Skeleton className="h-6 w-12" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bookmarked Dossiers */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <Skeleton className="h-5 w-44" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl border">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-5 w-full" />
                                                <Skeleton className="h-5 w-3/4" />
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Skeleton className="h-5 w-24 rounded-full" />
                                                    <Skeleton className="h-4 w-20" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Joined Causes */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-orange-500" />
                                    <Skeleton className="h-5 w-28" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl">
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-4 w-24 mt-1" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-green-500" />
                                <Skeleton className="h-5 w-36" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-muted/30 border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Skeleton className="h-4 w-4" />
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                                        </div>
                                        <Skeleton className="h-4 w-full mt-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alerts Status */}
                    <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <Bell className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
