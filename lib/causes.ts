import { prisma } from './db'

export async function getCauses(filters?: {
    search?: string
    status?: string
}) {
    return prisma.cause.findMany({
        where: {
            status: 'ACTIVE',
            AND: [
                filters?.search ? {
                    OR: [
                        { title: { contains: filters.search, mode: 'insensitive' } },
                        { description: { contains: filters.search, mode: 'insensitive' } },
                    ]
                } : {}
            ]
        },
        include: {
            creator: {
                select: { id: true, name: true, image: true }
            },
            _count: {
                select: { members: true, actions: true }
            }
        },
        orderBy: { memberCount: 'desc' }
    })
}

export async function getCauseBySlug(slug: string) {
    const cause = await prisma.cause.findUnique({
        where: { slug },
        include: {
            creator: {
                select: { id: true, name: true, image: true }
            },
            members: {
                take: 20,
                include: {
                    user: {
                        select: { id: true, name: true, image: true }
                    }
                },
                orderBy: { joinedAt: 'desc' }
            },
            targetDeputies: {
                include: {
                    deputy: true
                }
            },
            targetLaws: {
                include: {
                    law: true
                }
            },
            actions: {
                include: {
                    _count: {
                        select: { completions: true }
                    }
                }
            },
            _count: {
                select: { members: true }
            }
        }
    })

    if (!cause) return null

    return cause
}

export async function joinCause(causeId: string, userId: string) {
    // Check if already member
    const existing = await prisma.causeMember.findUnique({
        where: {
            causeId_userId: { causeId, userId }
        }
    })

    if (existing) {
        // Leave the cause
        await prisma.causeMember.delete({
            where: { id: existing.id }
        })
        await prisma.cause.update({
            where: { id: causeId },
            data: { memberCount: { decrement: 1 } }
        })
        return { joined: false }
    } else {
        // Join the cause
        await prisma.causeMember.create({
            data: { causeId, userId }
        })
        await prisma.cause.update({
            where: { id: causeId },
            data: { memberCount: { increment: 1 } }
        })
        return { joined: true }
    }
}

export async function createCause(data: {
    title: string
    description: string
    creatorId: string
    targetDeputyIds?: string[]
    targetLawIds?: string[]
}) {
    const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)

    const cause = await prisma.cause.create({
        data: {
            title: data.title,
            description: data.description,
            slug,
            creatorId: data.creatorId,
            memberCount: 1, // Creator is first member
            members: {
                create: { userId: data.creatorId }
            },
            targetDeputies: data.targetDeputyIds ? {
                create: data.targetDeputyIds.map(id => ({ deputyId: id }))
            } : undefined,
            targetLaws: data.targetLawIds ? {
                create: data.targetLawIds.map(id => ({ lawId: id }))
            } : undefined
        }
    })

    return cause
}

export async function isMember(causeId: string, userId: string) {
    const member = await prisma.causeMember.findUnique({
        where: {
            causeId_userId: { causeId, userId }
        }
    })
    return !!member
}
