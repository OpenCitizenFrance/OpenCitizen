"use client";

/**
 * DeputyContactAction - Action de contact député avec génération AI
 * Permet de sélectionner un député et génère un email personnalisé
 */

import { useState } from 'react';
import { Mail, Users, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AIEmailGenerator } from '@/components/AIEmailGenerator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Deputy {
    uid: string;
    firstName: string;
    lastName: string;
    slug: string;
    imageUrl?: string | null;
    group?: {
        name: string;
        acronym?: string | null;
    } | null;
}

interface DeputyContactActionProps {
    deputies: Deputy[];
    causeTitle: string;
    lawTitle?: string;
    className?: string;
}

export function DeputyContactAction({
    deputies,
    causeTitle,
    lawTitle,
    className = ''
}: DeputyContactActionProps) {
    const [selectedDeputy, setSelectedDeputy] = useState<Deputy | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    if (deputies.length === 0) {
        return null;
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Contacter vos élus avec l'IA
                </CardTitle>
                <CardDescription>
                    Générez un email personnalisé pour {deputies.length} député{deputies.length > 1 ? 's' : ''} concerné{deputies.length > 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Deputy list */}
                <div className="grid gap-2">
                    {deputies.slice(0, 5).map(deputy => (
                        <Dialog key={deputy.uid} open={isOpen && selectedDeputy?.uid === deputy.uid} onOpenChange={(open) => {
                            setIsOpen(open);
                            if (!open) setSelectedDeputy(null);
                        }}>
                            <DialogTrigger asChild>
                                <button
                                    onClick={() => {
                                        setSelectedDeputy(deputy);
                                        setIsOpen(true);
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all text-left w-full group"
                                >
                                    <Avatar className="h-10 w-10 ring-2 ring-background shadow">
                                        <AvatarImage src={deputy.imageUrl || ''} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                            {deputy.firstName[0]}{deputy.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                                            {deputy.firstName} {deputy.lastName}
                                        </p>
                                        {deputy.group && (
                                            <Badge variant="secondary" className="text-xs mt-0.5">
                                                {deputy.group.acronym || deputy.group.name}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-purple-500" />
                                        Générer un email
                                    </DialogTitle>
                                    <DialogDescription>
                                        L'IA va créer un email adapté au profil politique de {deputy.firstName} {deputy.lastName}
                                    </DialogDescription>
                                </DialogHeader>
                                <AIEmailGenerator
                                    deputyId={deputy.uid}
                                    deputyName={`${deputy.firstName} ${deputy.lastName}`}
                                    lawTitle={lawTitle || causeTitle}
                                    causeTitle={causeTitle}
                                />
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>

                {deputies.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                        +{deputies.length - 5} autre{deputies.length - 5 > 1 ? 's' : ''} député{deputies.length - 5 > 1 ? 's' : ''}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default DeputyContactAction;
