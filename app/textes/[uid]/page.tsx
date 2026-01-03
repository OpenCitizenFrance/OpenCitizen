import { getLawByUid } from "@/lib/laws";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, FileText, Vote, MessageSquare, User } from "lucide-react";
import Link from "next/link";

export const revalidate = 3600;

interface PageProps {
    params: { uid: string }
}

export default async function LawDetailPage({ params }: PageProps) {
    const law = await getLawByUid(params.uid);

    if (!law) {
        notFound();
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-bold">{law.title}</h1>
                    <Badge variant={
                        law.status === 'Adopté' ? 'default' :
                            law.status === 'Rejeté' ? 'destructive' : 'secondary'
                    } className="shrink-0">
                        {law.status || 'En cours'}
                    </Badge>
                </div>
                <p className="text-muted-foreground">
                    Dossier législatif {law.uid}
                </p>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Résumé IA
                    </Button>
                    <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Poser une question
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Amendements
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{law._count.amendments}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Vote className="h-4 w-4" />
                            Scrutins
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{law.votes.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Votes */}
            {law.votes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Scrutins associés</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {law.votes.map((vote) => (
                            <div key={vote.uid} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <p className="font-medium">{vote.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(vote.date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="flex gap-2 text-sm">
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        {vote.totalPour} pour
                                    </Badge>
                                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                                        {vote.totalContre} contre
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Amendments */}
            <Card>
                <CardHeader>
                    <CardTitle>Amendements</CardTitle>
                    <CardDescription>
                        {law._count.amendments} amendement{law._count.amendments > 1 ? 's' : ''} déposé{law._count.amendments > 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {law.amendments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Aucun amendement enregistré.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {law.amendments.map((amendment) => (
                                <Link
                                    key={amendment.uid}
                                    href={`/amendements/${amendment.uid}`}
                                    className="block p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">Amendement {amendment.uid}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {amendment.expose || amendment.content.substring(0, 150)}...
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarFallback className="text-xs">
                                                        {amendment.author.firstName[0]}{amendment.author.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-muted-foreground">
                                                    {amendment.author.firstName} {amendment.author.lastName}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant={
                                            amendment.status === 'Adopté' ? 'default' :
                                                amendment.status === 'Rejeté' ? 'destructive' : 'secondary'
                                        }>
                                            {amendment.status || 'En cours'}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
