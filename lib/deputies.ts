import { prisma } from './db'

// Text UID to Dossier mapping (generated from JSON dossier files)
import textDossierMapping from './text-dossier-mapping.json'

type DossierMapping = { uid: string; titre: string };
const textToDossier = textDossierMapping as Record<string, DossierMapping>;

// Helper to get the parent dossier for a text UID
function getParentDossier(textUid: string): DossierMapping | null {
    return textToDossier[textUid] || null;
}

// Helper to strip HTML tags and decode entities from content
function stripHtml(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    // Decode common HTML entities
    const entities: Record<string, string> = {
        '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
        '&quot;': '"', '&apos;': "'", '&euro;': '€', '&copy;': '©',
        '&laquo;': '«', '&raquo;': '»', '&ndash;': '–', '&mdash;': '—',
        '&hellip;': '…', '&rsquo;': "'", '&lsquo;': "'", '&rdquo;': '"', '&ldquo;': '"'
    };
    for (const [entity, char] of Object.entries(entities)) {
        text = text.replace(new RegExp(entity, 'gi'), char);
    }
    // Decode numeric entities (&#xNNNN; and &#NNNN;)
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    // Collapse whitespace
    return text.replace(/\s+/g, ' ').trim();
}

// Helper to get French label for dossier type
function getDossierTypeLabel(type: string | null | undefined): string {
    const labels: Record<string, string> = {
        'PROJET_LOI': 'Projet de loi',
        'PROJET_LOI_FIN': 'Projet de loi de finances',
        'PROJET_LOI_ORG': 'Projet de loi organique',
        'PROPOSITION_LOI': 'Proposition de loi'
    };
    return labels[type || ''] || 'Texte législatif';
}

export type DeputyFilters = {
    groupId?: string
    commissionId?: string
    search?: string
    sortBy?: 'alphabetical' | 'amendments' | 'propositions' | 'adopted_amendments'
    activeOnly?: boolean
    region?: string
    department?: string
    limit?: number
    offset?: number
}

export async function getDeputies(filters: DeputyFilters = {}): Promise<{ deputies: any[], total: number }> {
    const { groupId, commissionId, search, sortBy = 'alphabetical', activeOnly = true, region, department, limit, offset = 0 } = filters

    const whereClause = {
        AND: [
            search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' as const } },
                    { lastName: { contains: search, mode: 'insensitive' as const } },
                ]
            } : {},
            groupId ? {
                mandates: {
                    some: {
                        groupId: groupId,
                        endDate: null
                    }
                }
            } : {},
            commissionId ? {
                mandates: {
                    some: {
                        organId: commissionId,
                        endDate: null
                    }
                }
            } : {},
            activeOnly ? {
                mandates: {
                    some: {
                        endDate: null,
                        groupId: { not: null } // Most active deputies have a group mandate
                    }
                }
            } : {},
            region ? { regionName: region } : {},
            department ? { departmentName: department } : {}
        ]
    };

    // Get total count for pagination
    const total = await prisma.deputy.count({ where: whereClause });

    const deputies = await prisma.deputy.findMany({
        where: whereClause,
        include: {
            mandates: {
                where: { endDate: null },
                include: { group: true },
            },
            authoredDossiers: {
                take: 2,
                select: { uid: true, title: true }
            },
            _count: {
                select: {
                    votes: true,
                    amendments: true,
                    authoredDossiers: true
                }
            }
        },
    })

    // ------------------------------------------------------------------
    // OPTIMIZATION: Avoid N+1 Problem
    // Fetch adopted counts in ONE query instead of 600
    // ------------------------------------------------------------------
    const adoptedCounts = await prisma.amendment.groupBy({
        by: ['authorId'],
        where: {
            status: 'Adopté',
            authorId: { in: deputies.map(d => d.uid) }
        },
        _count: {
            _all: true
        }
    });

    const adoptedMap = new Map(adoptedCounts.map(c => [c.authorId, c._count._all]));

    // Efficiently map active mandate
    const mappedDeputies = deputies.map(d => {
        const adoptedCount = adoptedMap.get(d.uid) || 0;

        const activities: { type: 'PPL' | 'AMEND', title: string }[] = d.authoredDossiers.map((ad: any) => ({
            type: 'PPL' as const,
            title: ad.title
        })).slice(0, 3);

        const activeMandate = d.mandates.find((m: any) => m.endDate === null && m.groupId !== null);

        return {
            ...d,
            active: !!activeMandate,
            currentGroup: d.mandates.find((m: any) => m.group?.type === 'GP')?.group || null,
            currentCommission: d.mandates.find((m: any) => m.group?.type === 'COMPER')?.group || null,
            voteCount: d._count.votes,
            amendmentCount: d._count.amendments,
            adoptedAmendmentCount: adoptedCount,
            propositionsCount: d._count.authoredDossiers,
            activities
        };
    });

    // Sort
    let sortedDeputies: typeof mappedDeputies;
    if (sortBy === 'amendments') {
        sortedDeputies = mappedDeputies.sort((a, b) => b.amendmentCount - a.amendmentCount);
    } else if (sortBy === 'adopted_amendments') {
        sortedDeputies = mappedDeputies.sort((a, b) => b.adoptedAmendmentCount - a.adoptedAmendmentCount);
    } else if (sortBy === 'propositions') {
        sortedDeputies = mappedDeputies.sort((a, b) => b.propositionsCount - a.propositionsCount);
    } else {
        sortedDeputies = mappedDeputies.sort((a, b) => a.lastName.localeCompare(b.lastName));
    }

    // Apply pagination if limit is specified
    const paginatedDeputies = limit
        ? sortedDeputies.slice(offset, offset + limit)
        : sortedDeputies;

    return { deputies: paginatedDeputies, total };
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
                where: {
                    // Only show amendments with relevant statuses
                    status: { in: ['Adopté', 'Rejeté'] }
                },
                orderBy: { uid: 'desc' },
                include: {
                    law: {
                        select: {
                            uid: true,
                            title: true,
                            type: true,
                            status: true
                        }
                    }
                }
            },
            _count: {
                select: { votes: true, amendments: true }
            }
        }
    })

    if (!deputy) return null

    // Relevant amendment statuses for display
    const relevantAmendments = deputy.amendments;

    // Group amendments by PARENT DOSSIER (not by text UID)
    // Use the JSON mapping to look up the real dossier for each text
    const amendmentsByDossier = relevantAmendments.reduce((acc, amendment) => {
        const textUid = amendment.lawId || 'sans-dossier';

        // Look up the parent dossier from our mapping
        const parentDossier = getParentDossier(textUid);
        const dossierId = parentDossier?.uid || textUid;

        if (!acc[dossierId]) {
            // Use parent dossier title if available, otherwise fall back to text title
            const dossierTitle = parentDossier?.titre ||
                (amendment.law?.title !== 'Inconnu' ? amendment.law?.title : null);

            acc[dossierId] = {
                dossier: {
                    uid: dossierId,
                    title: dossierTitle,
                    displayTitle: dossierTitle || `Texte ${extractDossierReference(textUid)}`,
                    // Keep reference to the text for details
                    textUid: textUid,
                    textReference: extractDossierReference(textUid)
                },
                amendments: []
            };
        }

        acc[dossierId].amendments.push({
            uid: amendment.uid,
            shortUid: extractAmendmentNumber(amendment.uid),
            status: amendment.status,
            content: amendment.content ? stripHtml(amendment.content).slice(0, 200) : null,
            textUid: textUid // Track which text this amendment was on
        });
        return acc;
    }, {} as Record<string, { dossier: any, amendments: any[] }>);

    // Calculate stats
    const totalVotes = deputy._count.votes
    const currentMandate = deputy.mandates.find(m => !m.endDate && m.groupId)

    // Count adopted amendments
    const adoptedCount = deputy.amendments.filter(a => a.status === 'Adopté').length;
    const rejectedCount = deputy.amendments.filter(a => a.status === 'Rejeté').length;

    return {
        ...deputy,
        currentGroup: currentMandate?.group || null,
        amendmentsByDossier: Object.values(amendmentsByDossier).sort((a, b) =>
            b.amendments.length - a.amendments.length
        ),
        stats: {
            totalVotes,
            totalAmendments: deputy._count.amendments,
            adoptedAmendments: adoptedCount,
            rejectedAmendments: rejectedCount,
            // Participation would require counting all votes during mandate period
            participationScore: 85, // Placeholder - needs complex query
            loyaltyScore: 92, // Placeholder - needs complex query
        }
    }
}

// Helper to extract readable reference from dossier UID
function extractDossierReference(uid: string): string {
    // PRJLANR5L17B1906 -> Texte n°1906
    // PRJLANR5L17BTC13 -> Texte n°TC13
    const match = uid.match(/B([A-Z0-9]+)$/);
    if (match) {
        return `Texte n°${match[1]}`;
    }
    return uid;
}

// Helper to extract readable amendment number
function extractAmendmentNumber(uid: string): string {
    // AMANR5L17PO838901B1906P1D1N003892 -> N°3892
    const match = uid.match(/N(\d+)$/);
    if (match) {
        return `N°${parseInt(match[1], 10)}`;
    }
    return uid.slice(-10);
}

import { getGroupLogoUrl } from './groupLogos'

export async function getGroups() {
    const groups = await prisma.group.findMany({
        where: {
            type: 'GP',
            mandates: { some: { endDate: null } } // Only current legislature groups
        },
        include: {
            _count: {
                select: { mandates: { where: { endDate: null } } }
            }
        },
        orderBy: [
            { isMajority: 'desc' },
            { name: 'asc' }
        ]
    });

    // Add logo URLs from our mapping
    return groups.map(group => ({
        ...group,
        logoUrl: getGroupLogoUrl(group.acronym)
    }));
}

export async function getCommissions() {
    // These are the 8 permanent commissions of the 17th legislature
    const permanentCommissionIds = [
        'PO59048', // Finances
        'PO59051', // Lois
        'PO59047', // Affaires étrangères
        'PO59046', // Défense
        'PO419610', // Affaires économiques
        'PO420120', // Affaires sociales
        'PO419604', // Affaires culturelles
        'PO419865'  // Développement durable
    ];

    return prisma.group.findMany({
        where: {
            uid: { in: permanentCommissionIds },
        },
        orderBy: { name: 'asc' }
    })
}

export async function getGeoData() {
    const data = await prisma.deputy.findMany({
        where: {
            regionName: { not: null },
            departmentName: { not: null }
        },
        select: {
            regionName: true,
            departmentName: true,
            departmentCode: true
        },
        distinct: ['regionName', 'departmentName']
    });

    const regions: Record<string, { name: string, departments: { name: string, code: string }[] }> = {};

    data.forEach(d => {
        const region = d.regionName!;
        if (!regions[region]) {
            regions[region] = { name: region, departments: [] };
        }
        if (!regions[region].departments.some(dept => dept.name === d.departmentName)) {
            regions[region].departments.push({
                name: d.departmentName!,
                code: d.departmentCode!
            });
        }
    });

    return Object.values(regions).sort((a, b) => a.name.localeCompare(b.name)).map(r => ({
        ...r,
        departments: r.departments.sort((a, b) => a.name.localeCompare(b.name))
    }));
}
