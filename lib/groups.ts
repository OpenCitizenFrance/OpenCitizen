import { prisma } from './db'

export async function getGroupsWithStats() {
    const groups = await prisma.group.findMany({
        include: {
            mandates: {
                where: { endDate: null },
                select: { deputyId: true }
            }
        },
        orderBy: { name: 'asc' }
    })

    return groups.map(g => ({
        ...g,
        memberCount: g.mandates.length,
        mandates: undefined // Remove raw data
    }))
}

export async function getGroupByUid(uid: string) {
    const group = await prisma.group.findUnique({
        where: { uid },
        include: {
            mandates: {
                where: { endDate: null },
                include: {
                    deputy: {
                        include: {
                            _count: { select: { votes: true } }
                        }
                    }
                }
            }
        }
    })

    if (!group) return null

    // Get some vote stats for cohesion (simplified)
    const members = group.mandates.map(m => ({
        ...m.deputy,
        voteCount: m.deputy._count.votes
    }))

    return {
        ...group,
        members,
        memberCount: members.length,
        // Cohesion would require complex vote analysis
        cohesionScore: 78 // Placeholder
    }
}

// Get commissions (COMPER type organs stored differently)
export async function getCommissions() {
    // For now return empty - commissions need different data source
    // In the full implementation, we'd query organs with codeType = 'COMPER'
    return []
}
