import { prisma } from './db'
import { DossierStatus, DossierType } from '@prisma/client'

export type DossierFilters = {
    search?: string
    type?: DossierType
    status?: DossierStatus
    commissionId?: string      // Now uses Group uid directly
    groupIds?: string[]        // Political groups of author (for propositions de loi)
    creationFrom?: Date        // Filter by deposit/creation date
    creationTo?: Date
    updateFrom?: Date          // Filter by last activity date (applied in-memory after sorting)
    updateTo?: Date
    limit?: number
    offset?: number
}

// Get list of dossiers with pagination and filters
export async function getDossiers(filters: DossierFilters = {}) {
    const { search, type, status, commissionId, groupIds, creationFrom, creationTo, updateFrom, updateTo, limit = 10, offset = 0 } = filters

    const where: any = {
        // Only actual dossier parlementaires from 17th legislature
        // UIDs like DLR5L17N... are real dossiers, while PRJLANR/PIONANR are legislative texts
        uid: { startsWith: 'DLR5L17' },
        // Exclude dossiers without a proper title (relics or incomplete data)
        title: { not: '' },
        NOT: { title: 'Inconnu' }
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { uid: { contains: search, mode: 'insensitive' } }
        ]
    }

    if (type) {
        where.type = type
    }

    if (status) {
        where.status = status
    }

    // Commission filter - now using commissionId directly
    if (commissionId) {
        where.commissionId = commissionId
    }

    // Political group filter - filter by author's current political group(s)
    if (groupIds && groupIds.length > 0) {
        where.author = {
            mandates: {
                some: {
                    groupId: { in: groupIds },
                    endDate: null // Active mandate
                }
            }
        }
    }

    // Date filter using DEPOT stage date - for creation date filtering
    if (creationFrom || creationTo) {
        where.stages = {
            some: {
                stageType: 'DEPOT', // Look for deposit stages (the actual dated ones)
                date: { not: null },
                ...(creationFrom && { date: { gte: creationFrom } }),
                ...(creationTo && { date: { lte: creationTo } })
            }
        }
    }

    const [rawDossiers, total] = await Promise.all([
        // Fetch ALL matching dossiers (no pagination at DB level)
        // We'll sort and paginate in memory to ensure proper ordering by last activity
        prisma.legislativeDossier.findMany({
            where,
            include: {
                _count: {
                    select: {
                        amendments: true,
                        votes: true
                    }
                },
                // Include commission for name display
                commission: {
                    select: {
                        uid: true,
                        name: true,
                        acronym: true
                    }
                },
                // Include author with their current political group
                author: {
                    select: {
                        uid: true,
                        firstName: true,
                        lastName: true,
                        slug: true,
                        imageUrl: true,
                        mandates: {
                            where: { endDate: null },
                            take: 1,
                            include: {
                                group: {
                                    select: {
                                        uid: true,
                                        name: true,
                                        acronym: true,
                                        colorCode: true
                                    }
                                }
                            }
                        }
                    }
                },
                // Get ALL stages with dates to find the most recent one
                stages: {
                    orderBy: { date: 'desc' },
                    where: { date: { not: null } },
                    select: {
                        date: true,
                        stageType: true,
                        organName: true,
                        stageOrder: true
                    }
                }
            }
        }),
        prisma.legislativeDossier.count({ where })
    ])

    // Process dossiers to extract both dates
    const processedDossiers = rawDossiers
        .map(dossier => {
            // Find the most recent stage date (last activity) - stages are already ordered desc by date
            const latestStageDate = dossier.stages[0]?.date || null;

            // Get the earliest DEPOT stage with a date for creation date
            const depotStages = dossier.stages.filter(s => s.stageType === 'DEPOT' && s.date);
            const creationDate = depotStages.length > 0
                ? depotStages.reduce((earliest, s) =>
                    !earliest || (s.date && s.date < earliest) ? s.date : earliest,
                    depotStages[0].date)
                : (dossier.stages.length > 0 ? dossier.stages[dossier.stages.length - 1]?.date : null);

            return {
                ...dossier,
                // Both dates for display
                _creationDate: creationDate,
                _lastActivityDate: latestStageDate
            };
        })
        // Filter by update date range (in-memory since it's computed)
        .filter(dossier => {
            if (updateFrom && dossier._lastActivityDate) {
                if (dossier._lastActivityDate < updateFrom) return false;
            }
            if (updateTo && dossier._lastActivityDate) {
                if (dossier._lastActivityDate > updateTo) return false;
            }
            return true;
        })
        // Sort by most recent activity first (DESCENDING)
        .sort((a, b) => {
            const dateA = a._lastActivityDate?.getTime() || 0;
            const dateB = b._lastActivityDate?.getTime() || 0;
            return dateB - dateA;
        });

    // Get actual count after in-memory filtering
    const filteredTotal = (updateFrom || updateTo) ? processedDossiers.length : total;

    // Apply pagination AFTER sorting and filtering
    const dossiers = processedDossiers.slice(offset, offset + limit);

    return { dossiers, total: filteredTotal }
}

// Get commissions - only the 8 permanent commissions of the 17th legislature at Assemblée Nationale
export async function getCommissions() {
    const permanentCommissionIds = [
        'PO59048',  // Finances
        'PO59051',  // Lois
        'PO59047',  // Affaires étrangères
        'PO59046',  // Défense
        'PO419610', // Affaires économiques
        'PO420120', // Affaires sociales
        'PO419604', // Affaires culturelles et éducation
        'PO419865'  // Développement durable
    ];

    const commissions = await prisma.group.findMany({
        where: {
            uid: { in: permanentCommissionIds }
        },
        select: {
            uid: true,
            name: true,
            acronym: true
        },
        orderBy: { name: 'asc' }
    });

    return commissions;
}

// Get political groups for filter dropdown and hemicycle
export async function getPoliticalGroups() {
    const groups = await prisma.group.findMany({
        where: {
            type: 'GP',
            // Only groups with active members
            mandates: {
                some: { endDate: null }
            }
        },
        select: {
            uid: true,
            name: true,
            acronym: true,
            colorCode: true,
            logoUrl: true,
            _count: {
                select: {
                    mandates: {
                        where: { endDate: null }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Transform to include memberCount
    return groups.map(g => ({
        uid: g.uid,
        name: g.name,
        acronym: g.acronym,
        colorCode: g.colorCode,
        logoUrl: g.logoUrl,
        memberCount: g._count.mandates
    }));
}


// Get full details of a dossier
export async function getDossierByUid(uid: string) {
    return prisma.legislativeDossier.findUnique({
        where: { uid },
        include: {
            stages: {
                orderBy: { stageOrder: 'asc' },
                include: {
                    texts: true
                }
            },
            votes: {
                orderBy: { date: 'desc' },
                take: 5
            },
            _count: {
                select: {
                    amendments: true
                }
            }
        }
    })
}

// Get amendment stats by political group for a dossier
export async function getDossierAmendmentStats(dossierId: string) {
    const stats = await prisma.amendment.groupBy({
        by: ['groupId', 'status'],
        where: { lawId: dossierId },
        _count: {
            _all: true
        }
    })

    // We also need group details (names, colors)
    // Since groupBy doesn't support relation include, we fetch groups separately
    const groupIds = stats.map(s => s.groupId).filter(Boolean) as string[]
    const groups = await prisma.group.findMany({
        where: { uid: { in: groupIds } },
        select: { uid: true, acronym: true, colorCode: true }
    })

    // Map data for easy consumption
    // Structure: { [groupAcronym]: { adopted: 10, rejected: 5, ... } }
    const result: Record<string, any> = {}

    stats.forEach(stat => {
        if (!stat.groupId) return;
        const group = groups.find(g => g.uid === stat.groupId);
        if (!group) return;

        const acronym = group.acronym || 'Non inscrit';
        if (!result[acronym]) {
            result[acronym] = {
                group: { name: acronym, color: group.colorCode },
                total: 0,
                breakdown: {}
            };
        }

        result[acronym].total += stat._count._all;
        result[acronym].breakdown[stat.status || 'Non défini'] = stat._count._all;
    });

    return Object.values(result).sort((a, b) => b.total - a.total);
}
