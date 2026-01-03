import { prisma } from './db'

export type DeputyWithGroup = Awaited<ReturnType<typeof getDeputies>>[number]

export async function getDeputies(filters?: {
    groupId?: string
    search?: string
}) {
    const deputies = await prisma.deputy.findMany({
        where: {
            AND: [
                filters?.search ? {
                    OR: [
                        { firstName: { contains: filters.search, mode: 'insensitive' } },
                        { lastName: { contains: filters.search, mode: 'insensitive' } },
                    ]
                } : {},
                filters?.groupId ? {
                    mandates: {
                        some: {
                            groupId: filters.groupId,
                            endDate: null
                        }
                    }
                } : {}
            ]
        },
        include: {
            mandates: {
                where: { endDate: null, groupId: { not: null } },
                include: { group: true },
                take: 1,
            },
            _count: {
                select: { votes: true, amendments: true }
            }
        },
        orderBy: { lastName: 'asc' },
    })

    return deputies.map(d => ({
        ...d,
        currentGroup: d.mandates[0]?.group || null,
        voteCount: d._count.votes,
        amendmentCount: d._count.amendments,
    }))
}

export async function getDeputyBySlug(slug: string) {
    const deputy = await prisma.deputy.findUnique({
        where: { slug },
        include: {
            mandates: {
                include: { group: true },
                orderBy: { startDate: 'desc' }
            },
            votes: {
                take: 20,
                orderBy: { vote: { date: 'desc' } },
                include: { vote: true }
            },
            amendments: {
                take: 10,
                orderBy: { uid: 'desc' },
                include: { law: true }
            },
            _count: {
                select: { votes: true, amendments: true }
            }
        }
    })

    if (!deputy) return null

    // Calculate stats
    const totalVotes = deputy._count.votes
    const currentMandate = deputy.mandates.find(m => !m.endDate && m.groupId)

    return {
        ...deputy,
        currentGroup: currentMandate?.group || null,
        stats: {
            totalVotes,
            totalAmendments: deputy._count.amendments,
            // Participation would require counting all votes during mandate period
            participationScore: 85, // Placeholder - needs complex query
            loyaltyScore: 92, // Placeholder - needs complex query
        }
    }
}

export async function getGroups() {
    return prisma.group.findMany({
        include: {
            _count: {
                select: { mandates: true }
            }
        },
        orderBy: { name: 'asc' }
    })
}
