import { auth } from "@/auth";
import { getConversations, getConversation } from "@/app/actions/chat";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { redirect } from "next/navigation";

export default async function MessagesPage({ searchParams }: { searchParams: { c?: string } }) {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const conversations = await getConversations();
    const selectedId = searchParams.c; // Selected conversation ID from query params

    let selectedConversation = null;
    if (selectedId) {
        selectedConversation = await getConversation(selectedId);
    }

    return (
        <div className="container py-6 h-screen max-h-screen flex flex-col">
            <h1 className="text-2xl font-bold mb-4 font-outfit">Messagerie</h1>

            <ChatLayout
                conversations={conversations as any}
                currentUserId={session.user.id}
                onSelectConversation={async (id) => {
                    'use server';
                    redirect(`/messages?c=${id}`);
                }}
                selectedId={selectedId}
            >
                {selectedConversation ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-4 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between">
                            <h3 className="font-semibold">
                                {selectedConversation.type === 'GROUP' || selectedConversation.type === 'CAUSE'
                                    ? selectedConversation.name
                                    : "Conversation privée"}
                            </h3>
                            {/* Actions like "Add Member" can go here */}
                        </div>

                        <ChatWindow
                            conversationId={selectedConversation.id}
                            messages={selectedConversation.messages as any}
                            currentUserId={session.user.id}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
                        <MessageSquare className="h-12 w-12 opacity-20" />
                        <p>Sélectionnez une conversation pour commencer</p>
                    </div>
                )}
            </ChatLayout>
        </div>
    );
}

import { MessageSquare } from "lucide-react";
