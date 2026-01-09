'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createConversation(userIds: string[], type: 'DM' | 'GROUP' = 'DM', name?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const currentUserId = session.user.id;
    const allParticipantIds = Array.from(new Set([currentUserId, ...userIds]));

    if (type === 'DM') {
        if (allParticipantIds.length !== 2) throw new Error("DM must have exactly 2 participants");

        // Check if DM exists
        const existingDm = await prisma.conversation.findFirst({
            where: {
                type: 'DM',
                AND: [
                    { participants: { some: { userId: currentUserId } } },
                    { participants: { some: { userId: userIds[0] } } }
                ]
            }
        });

        if (existingDm) return existingDm;
    }

    const conversation = await prisma.conversation.create({
        data: {
            type,
            name: type === 'GROUP' ? (name || "Nouveau groupe") : undefined,
            participants: {
                create: allParticipantIds.map(uid => ({
                    userId: uid,
                    role: type === 'GROUP' && uid === currentUserId ? 'ADMIN' : 'MEMBER'
                }))
            }
        }
    });

    revalidatePath('/messages');
    return conversation;
}

export async function getConversations() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.conversation.findMany({
        where: {
            participants: { some: { userId: session.user.id } }
        },
        include: {
            participants: {
                include: { user: true }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { lastMessageAt: 'desc' }
    });
}

export async function getConversation(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            participants: {
                include: { user: true }
            },
            messages: {
                include: { author: true },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    // Verify membership
    if (!session?.user?.id || !conversation?.participants.some(p => p.userId === session.user?.id)) return null;

    return conversation;
}

export async function sendMessage(conversationId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Check membership
    const membership = await prisma.conversationParticipant.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId: session.user.id
            }
        }
    });

    if (!membership) throw new Error("Not a member");

    const message = await prisma.message.create({
        data: {
            content,
            conversationId,
            authorId: session.user.id
        }
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    });

    revalidatePath(`/messages`);
    return message;
}

// Admin Actions for Group Chats
export async function addParticipant(conversationId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Check admin rights
    const membership = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: session.user.id } }
    });

    if (membership?.role !== 'ADMIN') throw new Error("Admin rights required");

    await prisma.conversationParticipant.create({
        data: {
            conversationId,
            userId,
            role: 'MEMBER'
        }
    });

    revalidatePath(`/messages`);
}
