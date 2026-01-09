'use client';

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postComment } from "@/lib/user-actions";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    author: {
        name: string | null;
        image: string | null;
    };
}

interface CommentSectionProps {
    targetId: string;
    targetType: 'dossier' | 'deputy' | 'cause';
    comments: Comment[];
    currentUser?: {
        name?: string | null;
        image?: string | null;
    } | null;
}

export function CommentSection({ targetId, targetType, comments, currentUser }: CommentSectionProps) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        startTransition(async () => {
            const result = await postComment(content, { type: targetType, id: targetId });
            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: result.error
                });
            } else {
                setContent("");
                toast({
                    title: "Commentaire publié",
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
                Discussions <span className="text-muted-foreground text-sm font-normal">({comments.length})</span>
            </h3>

            {/* Comment Form */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={currentUser.image || ""} />
                        <AvatarFallback>{currentUser.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            placeholder="Participez à la discussion..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[100px] resize-none focus-visible:ring-indigo-500"
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending || !content.trim()}>
                                {isPending ? "Envoi..." : <><Send className="mr-2 h-4 w-4" /> Publier</>}
                            </Button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                    Connectez-vous pour participer à la discussion.
                </div>
            )}

            {/* Comment List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 italic">Aucun commentaire pour le moment. Soyez le premier !</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={comment.author.image || ""} />
                                <AvatarFallback>{comment.author.name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">{comment.author.name || "Utilisateur"}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                                    </span>
                                </div>
                                <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-r-lg rounded-bl-lg">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
