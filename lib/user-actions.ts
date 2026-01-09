'use server'

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleFollowDeputy(deputyUid: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Must be logged in");
    }

    const userId = session.user.id;

    // Check if following
    const isFollowing = await prisma.user.findFirst({
        where: {
            id: userId,
            followedDeputies: {
                some: { uid: deputyUid }
            }
        }
    });

    if (isFollowing) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                followedDeputies: {
                    disconnect: { uid: deputyUid }
                }
            }
        });
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: {
                followedDeputies: {
                    connect: { uid: deputyUid }
                }
            }
        });
    }

    revalidatePath(`/deputies/${deputyUid}`);
    revalidatePath(`/deputes/${deputyUid}`); // Handle both routes if they exist
    revalidatePath('/mon-espace');
    return !isFollowing;
}

export async function toggleFollowGroup(groupUid: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Must be logged in");
    }

    const userId = session.user.id;

    const isFollowing = await prisma.user.findFirst({
        where: {
            id: userId,
            followedGroups: {
                some: { uid: groupUid }
            }
        }
    });

    if (isFollowing) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                followedGroups: {
                    disconnect: { uid: groupUid }
                }
            }
        });
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: {
                followedGroups: {
                    connect: { uid: groupUid }
                }
            }
        });
    }

    revalidatePath(`/groupes/${groupUid}`);
    revalidatePath('/mon-espace');
    return !isFollowing;
}

export async function toggleBookmarkDossier(dossierUid: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Must be logged in");
    }

    const userId = session.user.id;

    const isBookmarked = await prisma.user.findFirst({
        where: {
            id: userId,
            bookmarkedLaws: {
                some: { uid: dossierUid }
            }
        }
    });

    if (isBookmarked) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                bookmarkedLaws: {
                    disconnect: { uid: dossierUid }
                }
            }
        });
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: {
                bookmarkedLaws: {
                    connect: { uid: dossierUid }
                }
            }
        });
    }

    revalidatePath(`/dossiers/${dossierUid}`);
    revalidatePath('/mon-espace');
    return !isBookmarked;
}

export async function postComment(content: string, target: { type: 'dossier' | 'deputy' | 'cause', id: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Connectez-vous pour commenter.");
    }

    if (!content.trim()) return { error: "Commentaire vide" };

    const data: any = {
        content,
        userId: session.user.id,
    };

    let path = '';

    if (target.type === 'dossier') {
        data.lawId = target.id;
        path = `/dossiers/${target.id}`;
    } else if (target.type === 'deputy') {
        data.deputyId = target.id;
        path = `/deputes/${target.id}`;
        revalidatePath(`/deputies/${target.id}`)
    } else if (target.type === 'cause') {
        data.causeId = target.id;
        path = `/causes/${target.id}`;
    }

    await prisma.comment.create({ data });

    revalidatePath(path);
    return { success: true };
}

export async function deleteComment(commentId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true }
    });

    if (!comment || comment.authorId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    await prisma.comment.delete({ where: { id: commentId } });
    // Hard to revalidate exact path without fetching parent.
    // For now client side refresh or optimistic update handles it.
    return { success: true };
}
