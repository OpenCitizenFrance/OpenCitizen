'use client';

import { useState } from 'react';
import { useTransition } from 'react';
import { FeedPost } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { createFeedPost } from '@/app/actions/feed';

interface FeedProps {
    causeId: string;
    posts: (FeedPost & { author: { name: string | null; image: string | null } })[];
    isMember: boolean;
    currentUserId?: string;
}

export function Feed({ causeId, posts, isMember, currentUserId }: FeedProps) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();

    const handlePost = () => {
        if (!content.trim()) return;

        startTransition(async () => {
            try {
                await createFeedPost(causeId, content);
                setContent("");
            } catch (e) {
                console.error(e);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Post Input */}
            {isMember && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Publier une actualité</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Partagez des nouvelles..."
                                className="resize-none"
                            />
                        </div>
                        <div className="flex justify-end mt-2">
                            <Button onClick={handlePost} disabled={isPending || !content.trim()}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Publier
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Posts List */}
            <div className="space-y-4">
                {posts.map((post) => (
                    <Card key={post.id}>
                        <CardHeader className="pb-3 flex flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src={post.author.image || ""} />
                                <AvatarFallback>{post.author.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-sm font-medium">{post.author.name}</CardTitle>
                                <CardDescription className="text-xs">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                        </CardContent>
                    </Card>
                ))}

                {posts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                        Aucune actualité pour le moment.
                    </div>
                )}
            </div>
        </div>
    );
}
