'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ConversationType, ParticipantRole } from "@prisma/client";

// Feed Actions for Causes

export async function createFeedPost(causeId: string, content: string, title?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Check if user is a member of the cause (or admin logic)
    const membership = await prisma.causeMember.findUnique({
        where: { causeId_userId: { causeId, userId: session.user.id } }
    });

    if (!membership) throw new Error("Not a member of this cause");

    // TODO: Add stricter role check if only admins can post to feed
    // For now, any member can post to simulate a lively feed

    const post = await prisma.feedPost.create({
        data: {
            title,
            content,
            causeId,
            authorId: session.user.id
        }
    });

    revalidatePath(`/causes/${causeId}`);
    return post;
}

export async function getFeedPosts(causeId: string) {
    return prisma.feedPost.findMany({
        where: { causeId },
        include: {
            author: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

// Ensure Chat setup for Cause
export async function getOrCreateCauseConversation(causeId: string, causeTitle: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.conversation.findUnique({
        where: { causeId }
    });

    if (existing) return existing;

    // Create if not exists (usually should be created with Cause, but good fallback)
    return prisma.conversation.create({
        data: {
            type: 'CAUSE',
            name: `Discussion: ${causeTitle}`,
            causeId,
            participants: {
                create: {
                    userId: session.user.id,
                    role: 'ADMIN' // Founder is admin
                }
            }
        }
    });
}

// Join Cause Conversation (sync with Cause Membership)
export async function joinCauseConversation(causeId: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    const conversation = await prisma.conversation.findUnique({
        where: { causeId }
    });

    if (!conversation) return;

    // Check if already participant
    const existing = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: conversation.id, userId: session.user.id } }
    });

    if (!existing) {
        await prisma.conversationParticipant.create({
            data: {
                conversationId: conversation.id,
                userId: session.user.id,
                role: 'MEMBER'
            }
        });
    }
}
