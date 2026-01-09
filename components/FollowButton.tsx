'use client';

import { Button } from "@/components/ui/button";
import { Heart, Star, Bookmark } from "lucide-react";
import { useTransition } from "react";
import { useToast } from "@/components/ui/use-toast"; // Assuming shadcn toast
import { cn } from "@/lib/utils";
import { toggleFollowDeputy, toggleFollowGroup, toggleBookmarkDossier } from "@/lib/user-actions";

interface FollowButtonProps {
    targetId: string;
    targetType: 'deputy' | 'group' | 'dossier';
    isFollowing: boolean;
    className?: string;
    variant?: "default" | "secondary" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    label?: string; // Optional label override
}

export function FollowButton({
    targetId,
    targetType,
    isFollowing: initialIsFollowing,
    className,
    variant = "outline",
    size = "default",
    label
}: FollowButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Optimistic UI could be handled here with useOptimistic, but simpler for now

    const handleToggle = () => {
        startTransition(async () => {
            let success = false;
            try {
                if (targetType === 'deputy') {
                    await toggleFollowDeputy(targetId);
                } else if (targetType === 'group') {
                    await toggleFollowGroup(targetId);
                } else if (targetType === 'dossier') {
                    await toggleBookmarkDossier(targetId);
                }
                success = true;
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Une erreur est survenue. Êtes-vous connecté ?",
                });
            }

            if (success) {
                toast({
                    title: initialIsFollowing ? "Abonnement retiré" : "Abonnement ajouté",
                    description: `Vous ${initialIsFollowing ? "ne suivez plus" : "suivez maintenant"} cet élément.`,
                });
            }
        });
    };

    const Icon = targetType === 'dossier' ? Bookmark : targetType === 'group' ? Star : Heart;

    // Determine default text
    const actionLabel = label || (initialIsFollowing ? "Suivi" : "Suivre");

    return (
        <Button
            variant={initialIsFollowing ? "default" : variant}
            size={size}
            className={cn("gap-2 transition-all", className)}
            onClick={handleToggle}
            disabled={isPending}
        >
            <Icon className={cn(
                "h-4 w-4",
                initialIsFollowing && "fill-current"
            )} />
            {size !== "icon" && <span>{actionLabel}</span>}
        </Button>
    );
}
