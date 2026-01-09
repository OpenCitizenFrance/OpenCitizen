/**
 * US-AI-004: Targeting Score Algorithm
 * 
 * Calcul des cibles de lobbying pour une cause citoyenne
 * - Score 'Rebelle': % de votes contre son propre groupe
 * - Score 'Local': Match Code Postal User vs Circonscription Député
 * - Score 'Intérêt': Match mots-clés loi vs déclaration HATVP
 */

import { PrismaClient, Position } from '@prisma/client';

const prisma = new PrismaClient();

interface TargetingScores {
    deputyId: string;
    deputyName: string;
    groupName: string;
    circonscription: string | null;
    scores: {
        rebelle: number;      // 0-100: Higher = more likely to vote against group
        local: number;        // 0-100: Higher = closer geographic match
        interet: number;      // 0-100: Higher = more HATVP interest overlap
        total: number;        // Weighted average
    };
    details: {
        totalVotes: number;
        votesContreGroupe: number;
        hatvpMatches: string[];
    };
}

interface TargetingOptions {
    userPostalCode?: string;
    keywords?: string[];
    limit?: number;
    weights?: {
        rebelle?: number;
        local?: number;
        interet?: number;
    };
}

/**
 * Calculate rebel score for a deputy (% of votes against their group)
 */
async function calculateRebelScore(deputyId: string): Promise<{
    score: number;
    totalVotes: number;
    votesContreGroupe: number;
}> {
    // Get deputy's current group
    const mandate = await prisma.mandate.findFirst({
        where: {
            deputyId,
            endDate: null,
            groupId: { not: null }
        },
        include: { group: true }
    });

    if (!mandate?.group) {
        return { score: 0, totalVotes: 0, votesContreGroupe: 0 };
    }

    // Get all votes by this deputy
    const voteDetails = await prisma.voteDetail.findMany({
        where: { deputyId },
        include: {
            vote: {
                include: {
                    voteDetails: {
                        where: {
                            deputy: {
                                mandates: {
                                    some: {
                                        groupId: mandate.groupId,
                                        endDate: null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    let votesContreGroupe = 0;
    const totalVotes = voteDetails.length;

    for (const vd of voteDetails) {
        // Determine majority position of the group for this vote
        const groupVotes = vd.vote.voteDetails;
        const posCounts: Record<Position, number> = {
            POUR: 0,
            CONTRE: 0,
            ABSTENTION: 0,
            NON_VOTANT: 0
        };

        for (const gv of groupVotes) {
            posCounts[gv.position]++;
        }

        const majorityPos = (Object.entries(posCounts) as [Position, number][])
            .reduce((a, b) => b[1] > a[1] ? b : a)[0];

        // Check if deputy voted against group majority
        if (vd.position !== majorityPos && vd.position !== 'NON_VOTANT') {
            votesContreGroupe++;
        }
    }

    const score = totalVotes > 0 ? Math.round((votesContreGroupe / totalVotes) * 100) : 0;

    return { score, totalVotes, votesContreGroupe };
}

/**
 * Calculate local score (geographic proximity)
 */
function calculateLocalScore(
    deputyDepartmentCode: string | null,
    userPostalCode?: string
): number {
    if (!userPostalCode || !deputyDepartmentCode) return 0;

    // Extract department code from postal code (first 2 digits, or 3 for DOM-TOM)
    let userDept = userPostalCode.substring(0, 2);
    if (userDept === '97' || userDept === '98') {
        userDept = userPostalCode.substring(0, 3);
    }

    // Exact match
    if (userDept === deputyDepartmentCode) {
        return 100;
    }

    // Same region bonus (simplified - could use a proper region mapping)
    const regionGroups: string[][] = [
        ['75', '77', '78', '91', '92', '93', '94', '95'], // Île-de-France
        ['59', '62'], // Hauts-de-France Nord
        ['02', '60', '80'], // Hauts-de-France Sud
        ['67', '68'], // Alsace
        ['13', '83', '84', '04', '05', '06'], // PACA
        ['31', '09', '12', '32', '46', '65', '81', '82'], // Occitanie Ouest
        ['11', '30', '34', '48', '66'], // Occitanie Est
    ];

    for (const region of regionGroups) {
        if (region.includes(userDept) && region.includes(deputyDepartmentCode)) {
            return 50;
        }
    }

    return 0;
}

/**
 * Calculate interest score (HATVP keyword matching)
 */
function calculateInterestScore(
    hatvpData: any,
    keywords: string[]
): { score: number; matches: string[] } {
    if (!hatvpData || !keywords.length) return { score: 0, matches: [] };

    const matches: string[] = [];
    const participations = hatvpData.participationsFinancieres || [];

    const normalizedKeywords = keywords.map(k => k.toLowerCase());

    for (const part of participations) {
        const denomination = (part.denomination || '').toLowerCase();
        const type = (part.type || '').toLowerCase();

        for (const keyword of normalizedKeywords) {
            if (denomination.includes(keyword) || type.includes(keyword)) {
                matches.push(`${part.denomination} (${part.montant}€)`);
            }
        }
    }

    // Score based on number of matches (max 100)
    const score = Math.min(matches.length * 25, 100);

    return { score, matches };
}

/**
 * Calculate targeting scores for all deputies and return ranked list
 */
export async function calculateTargetingScores(
    options: TargetingOptions = {}
): Promise<TargetingScores[]> {
    const {
        userPostalCode,
        keywords = [],
        limit = 50,
        weights = { rebelle: 0.4, local: 0.4, interet: 0.2 }
    } = options;

    // Get all active deputies with their groups and data
    const deputies = await prisma.deputy.findMany({
        where: {
            mandates: {
                some: {
                    endDate: null,
                    groupId: { not: null }
                }
            }
        },
        include: {
            mandates: {
                where: { endDate: null },
                include: { group: true }
            }
        }
    });

    const results: TargetingScores[] = [];

    for (const deputy of deputies) {
        const activeMandate = deputy.mandates.find(m => m.endDate === null && m.group);
        if (!activeMandate?.group) continue;

        // Calculate individual scores
        const rebelleData = await calculateRebelScore(deputy.uid);
        const localScore = calculateLocalScore(deputy.departmentCode, userPostalCode);
        const interestData = calculateInterestScore(deputy.hatvpData, keywords);

        // Calculate weighted total
        const total = Math.round(
            rebelleData.score * (weights.rebelle || 0.4) +
            localScore * (weights.local || 0.4) +
            interestData.score * (weights.interet || 0.2)
        );

        results.push({
            deputyId: deputy.uid,
            deputyName: `${deputy.firstName} ${deputy.lastName}`,
            groupName: activeMandate.group.name,
            circonscription: deputy.circonscription,
            scores: {
                rebelle: rebelleData.score,
                local: localScore,
                interet: interestData.score,
                total
            },
            details: {
                totalVotes: rebelleData.totalVotes,
                votesContreGroupe: rebelleData.votesContreGroupe,
                hatvpMatches: interestData.matches
            }
        });
    }

    // Sort by total score descending
    results.sort((a, b) => b.scores.total - a.scores.total);

    return results.slice(0, limit);
}

/**
 * Get top targets for a specific cause/law
 */
export async function getTopTargets(
    causeKeywords: string[],
    userPostalCode?: string,
    count: number = 10
): Promise<TargetingScores[]> {
    return calculateTargetingScores({
        keywords: causeKeywords,
        userPostalCode,
        limit: count,
        weights: {
            rebelle: 0.35,
            local: 0.35,
            interet: 0.30
        }
    });
}
