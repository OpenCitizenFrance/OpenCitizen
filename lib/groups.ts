import { prisma } from "./db";

export async function getGroupByUid(uid: string) {
    const group = await prisma.group.findUnique({
        where: { uid },
        include: {
            mandates: {
                where: { endDate: null }, // Active mandates
                include: {
                    deputy: {
                        include: {
                            votes: true
                        }
                    }
                }
            }
        }
    });

    if (!group) return null;

    // Transform to easier format
    const members = group.mandates.map(m => {
        const d = m.deputy;
        return {
            uid: d.uid,
            firstName: d.firstName,
            lastName: d.lastName,
            slug: d.slug,
            imageUrl: d.imageUrl,
            voteCount: d.votes.length
        };
    });

    // Calculate cohesion (simplified mock logic for now, real calculation is heavy)
    const cohesionScore = 85 + Math.floor(Math.random() * 15);

    return {
        ...group,
        members,
        memberCount: members.length,
        cohesionScore
    };
}

export async function getGroupStats(groupId: string) {
    // 1. Get database statistics for this group
    // We need to find amendments authored by members of this group OR where authorId is the group UID
    // Since schema links Amendment.author -> Deputy, we rely on Deputy membership.

    // Get all current member IDs
    const currentMembers = await prisma.mandate.findMany({
        where: {
            groupId: groupId,
            endDate: null
        },
        select: { deputyId: true }
    });

    // This part is no longer needed if we use the nested where clause directly in topDossiers
    // const currentMembers = await prisma.mandate.findMany({
    //     where: {
    //         groupId: groupId,
    //         endDate: null
    //     },
    //     select: { deputyId: true }
    // });

    // const memberIds = currentMembers.map(m => m.deputyId);

    // Aggregate: Top Amended Dossiers
    // Find amendments by these authors, grouped by Dossier (was Law)

    const topDossiers = await prisma.amendment.groupBy({
        by: ['lawId'],
        _count: {
            uid: true
        },
        orderBy: {
            _count: {
                uid: 'desc'
            }
        },
        where: {
            author: {
                mandates: {
                    some: {
                        groupId: groupId // Changed from groupUid to groupId to match function parameter
                    }
                }
            },
            lawId: { not: null }
        },
        take: 5
    });

    const dossierDetails = await prisma.legislativeDossier.findMany({
        where: {
            uid: { in: topDossiers.map(t => t.lawId!).filter(Boolean) }
        }
    });

    // Map counts back to dossiers
    const mostAmendedDossiers = topDossiers
        .map(t => {
            const dossier = dossierDetails.find(l => l.uid === t.lawId);
            if (!dossier) return null;
            return {
                ...dossier,
                amendmentCount: t._count.uid
            };
        })
        .filter(Boolean);

    // Get Top Subjects (Derived from Titles for now)
    const subjects = new Map<string, number>();
    const stopWords = ['loi', 'projet', 'proposition', 'portant', 'sur', 'pour', 'le', 'la', 'les', 'et', 'du', 'de', 'des', 'à', 'au', 'aux', 'en', 'par', 'visant', 'relative', 'relatif'];

    mostAmendedDossiers.forEach(l => {
        if (!l) return;
        const words = l.title.toLowerCase().split(/\W+/);
        words.forEach(w => {
            if (w.length > 3 && !stopWords.includes(w)) {
                subjects.set(w, (subjects.get(w) || 0) + l.amendmentCount);
            }
        });
    });

    // Sort subjects
    const topSubjects = Array.from(subjects.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return {
        mostAmendedDossiers,
        topSubjects
    };
}

export async function getGroupsWithStats() {
    const groups = await prisma.group.findMany({
        where: {
            mandates: {
                some: { endDate: null } // Only groups with active members? Or all groups?
            }
        },
        include: {
            mandates: {
                where: { endDate: null }
            }
        }
    });

    return groups.map(g => ({
        ...g,
        memberCount: g.mandates.length
    }));
}
