'use client';

import { useState } from 'react';
import { Conversation } from '@prisma/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, MessageSquare, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatLayoutProps {
    conversations: (Conversation & {
        participants: { user: { name: string | null; image: string | null } }[];
        messages: { content: string; createdAt: Date }[];
    })[];
    currentUserId: string;
    onSelectConversation: (id: string) => void;
    selectedId?: string;
    children: React.ReactNode;
}

export function ChatLayout({ conversations, currentUserId, onSelectConversation, selectedId, children }: ChatLayoutProps) {

    const getConversationName = (conv: any) => {
        if (conv.type === 'GROUP' || conv.type === 'CAUSE') return conv.name;
        // For DM, get other user's name
        const otherUser = conv.participants.find((p: any) => p.userId !== currentUserId)?.user;
        return otherUser?.name || "Utilisateur inconnu";
    };

    const getConversationIcon = (conv: any) => {
        if (conv.type === 'GROUP') return <Hash className="h-4 w-4" />;
        if (conv.type === 'CAUSE') return <MessageSquare className="h-4 w-4 text-primary" />;
        // DM avatar handling could be here
        return null;
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border/50">
            {/* Sidebar */}
            <div className="w-80 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Messages</h2>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-accent/10",
                                    selectedId === conv.id ? "bg-accent/10 shadow-sm" : ""
                                )}
                            >
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src="" /> {/* TODO: Handle Group/User images */}
                                    <AvatarFallback>{getConversationName(conv).substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-medium truncate text-sm flex items-center gap-2">
                                        {getConversationIcon(conv)}
                                        {getConversationName(conv)}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {conv.messages[0]?.content || "Aucun message"}
                                    </p>
                                </div>
                                {conv.messages[0] && (
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {new Date(conv.messages[0].createdAt).toLocaleDateString()}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
