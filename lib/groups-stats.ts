import { prisma } from "./db";

export interface GroupStats {
    groupId: string;
    groupName: string;
    acronym: string | null;
    colorCode: string | null;
    totalAmendments: number;
    adoptedCount: number;
    rejectionCount: number;
    withdrawalCount: number;
    adoptionRate: number;
    memberCount: number;
    activityScore: number; // Avg amendments per member
}

export async function getGroupsComparisonStats(): Promise<GroupStats[]> {
    // 1. Fetch all groups with their active members
    const groups = await prisma.group.findMany({
        where: {
            mandates: {
                some: { endDate: null }
            }
        },
        include: {
            _count: {
                select: { mandates: { where: { endDate: null } } }
            }
        }
    });

    const stats: GroupStats[] = [];

    for (const group of groups) {
        // Find all active deputies for this group
        const memberMandates = await prisma.mandate.findMany({
            where: {
                groupId: group.uid,
                endDate: null
            },
            select: { deputyId: true }
        });

        const deputyIds = memberMandates.map((m: { deputyId: string }) => m.deputyId);

        // Aggregate amendments for these deputies
        const groupAmendments = await prisma.amendment.groupBy({
            by: ['status'],
            where: {
                authorId: { in: deputyIds }
            },
            _count: {
                uid: true
            }
        });

        let total = 0;
        let adopted = 0;
        let rejected = 0;
        let withdrawn = 0;

        groupAmendments.forEach((stat: { status: string | null; _count: { uid: number } }) => {
            const count = stat._count.uid;
            total += count;

            // Normalize status strings
            const status = stat.status?.toLowerCase() || 'inconnu';
            if (status.includes('adopté')) adopted += count;
            else if (status.includes('rejeté')) rejected += count;
            else if (status.includes('retiré')) withdrawn += count;
        });

        const memberCount = group._count.mandates;

        stats.push({
            groupId: group.uid,
            groupName: group.name,
            acronym: group.acronym,
            colorCode: group.colorCode,
            totalAmendments: total,
            adoptedCount: adopted,
            rejectionCount: rejected,
            withdrawalCount: withdrawn,
            adoptionRate: total > 0 ? (adopted / total) * 100 : 0,
            memberCount: memberCount,
            activityScore: memberCount > 0 ? total / memberCount : 0
        });
    }

    // Sort by adoption rate descending by default
    return stats.sort((a, b) => b.adoptionRate - a.adoptionRate);
}
