import { getLaws } from "@/lib/laws";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Vote, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TextesPage({
    searchParams
}: {
    searchParams: { q?: string; status?: string }
}) {
    const laws = await getLaws({
        search: searchParams.q,
        status: searchParams.status
    });

    const statuses = [
        { value: 'En cours', color: 'bg-blue-500' },
        { value: 'Adopté', color: 'bg-green-500' },
        { value: 'Rejeté', color: 'bg-red-500' }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10">
                    <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Textes de Loi</h1>
                    <p className="text-muted-foreground">
                        Dossiers législatifs en discussion
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form action="/textes" method="GET" className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        name="q"
                        defaultValue={searchParams.q}
                        placeholder="Rechercher un texte..."
                        className="pl-10 h-11"
                    />
                </form>

                <div className="flex gap-2">
                    <Link href="/textes">
                        <Button variant={!searchParams.status ? "default" : "outline"} size="sm">
                            Tous
                        </Button>
                    </Link>
                    {statuses.map((status) => (
                        <Link
                            key={status.value}
                            href={`/textes?status=${encodeURIComponent(status.value)}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
                        >
                            <Button
                                variant={searchParams.status === status.value ? "default" : "outline"}
                                size="sm"
                                className="gap-2"
                            >
                                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                {status.value}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Results */}
            <p className="text-sm text-muted-foreground">
                {laws.length} texte{laws.length > 1 ? 's' : ''} trouvé{laws.length > 1 ? 's' : ''}
            </p>

            <div className="space-y-3 stagger-children">
                {laws.map((law) => (
                    <Link key={law.uid} href={`/textes/${law.uid}`}>
                        <Card className="card-hover group">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-muted shrink-0 group-hover:bg-primary/10 transition-colors">
                                        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                    {law.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Dossier {law.uid}
                                                </p>
                                            </div>
                                            <Badge className={
                                                law.status === 'Adopté' ? 'badge-pour' :
                                                    law.status === 'Rejeté' ? 'badge-contre' : 'bg-secondary text-secondary-foreground'
                                            }>
                                                {law.status || 'En cours'}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <FileText className="h-4 w-4" />
                                                {law._count.amendments} amendement{law._count.amendments !== 1 ? 's' : ''}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Vote className="h-4 w-4" />
                                                {law._count.votes} scrutin{law._count.votes !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {laws.length === 0 && (
                <div className="text-center py-16">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium mb-2">Aucun texte trouvé</h3>
                    <p className="text-muted-foreground">
                        Essayez de modifier vos critères de recherche
                    </p>
                </div>
            )}
        </div>
    );
}
