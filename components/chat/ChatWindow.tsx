'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { sendMessage } from '@/app/actions/chat';

interface Message {
    id: string;
    content: string;
    createdAt: Date;
    author: { id: string; name: string | null; image: string | null };
}

interface ChatWindowProps {
    conversationId: string;
    messages: Message[];
    currentUserId: string;
}

export function ChatWindow({ conversationId, messages, currentUserId }: ChatWindowProps) {
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        setIsSending(true);
        try {
            await sendMessage(conversationId, inputValue);
            setInputValue("");
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.author.id === currentUserId;
                        return (
                            <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                    isMe
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-muted rounded-bl-none"
                                )}>
                                    {!isMe && (
                                        <p className="text-[10px] text-muted-foreground mb-1 font-medium">
                                            {msg.author.name}
                                        </p>
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    <p className={cn("text-[10px] mt-1 text-right opacity-70", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                <div className="flex items-end gap-2">
                    <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Écrivez votre message..."
                        className="min-h-[2.5rem] max-h-32 resize-none rounded-xl"
                        rows={1}
                    />
                    <Button
                        onClick={handleSend}
                        size="icon"
                        disabled={isSending || !inputValue.trim()}
                        className="rounded-xl h-10 w-10 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </>
    );
}
