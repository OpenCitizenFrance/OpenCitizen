import { getCauses } from "@/lib/causes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Plus, Target, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function CausesPage({
    searchParams
}: {
    searchParams: { q?: string }
}) {
    const causes = await getCauses({
        search: searchParams.q
    });

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
                        <h1 className="text-3xl font-bold tracking-tight">Causes Citoyennes</h1>
                        <p className="text-muted-foreground max-w-lg">
                            Rejoignez une cause ou créez la vôtre pour influencer la fabrique de la loi.
                        </p>
                    </div>
                    <Link href="/causes/nouvelle">
                        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                            <Plus className="h-4 w-4" />
                            Créer une cause
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <form action="/causes" method="GET" className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    name="q"
                    defaultValue={searchParams.q}
                    placeholder="Rechercher une cause..."
                    className="pl-10 h-11"
                />
            </form>

            {/* Results */}
            <p className="text-sm text-muted-foreground">
                {causes.length} cause{causes.length > 1 ? 's' : ''} active{causes.length > 1 ? 's' : ''}
            </p>

            {causes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                    {causes.map((cause) => (
                        <Link key={cause.id} href={`/causes/${cause.slug}`}>
                            <Card className="card-hover h-full group">
                                {cause.imageUrl && (
                                    <div
                                        className="h-32 bg-cover bg-center rounded-t-xl"
                                        style={{ backgroundImage: `url(${cause.imageUrl})` }}
                                    />
                                )}
                                <CardHeader className={cause.imageUrl ? '' : 'pt-6'}>
                                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                        {cause.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-3">
                                        {cause.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7 ring-1 ring-background">
                                                <AvatarImage src={cause.creator.image || ""} />
                                                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                                                    {cause.creator.name?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                                                {cause.creator.name || "Anonyme"}
                                            </span>
                                        </div>
                                        <Badge variant="secondary" className="gap-1">
                                            <Users className="h-3 w-3" />
                                            {cause.memberCount}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-muted">
                    <div className="p-4 rounded-full bg-orange-500/10 w-fit mx-auto mb-4">
                        <Target className="h-10 w-10 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Aucune cause active</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Soyez le premier à créer une cause citoyenne et mobilisez d'autres citoyens !
                    </p>
                    <Link href="/causes/nouvelle">
                        <Button className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            Créer la première cause
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
