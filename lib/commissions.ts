import { prisma } from "./db";
import { DossierStatus, GroupType } from "@prisma/client";

export interface CommissionStats {
    uid: string;
    name: string;
    type: string;
    totalDossiers: number;
    statusDistribution: {
        status: DossierStatus;
        count: number;
    }[];
    recentDossiers: {
        uid: string;
        title: string;
        status: DossierStatus;
    }[];
}

export async function getCommissionsList() {
    // Fetch all groups and filter in memory to bypass Prisma enum synchronization issues
    const allOrgans = await prisma.group.findMany({
        select: {
            uid: true,
            name: true,
            type: true,
            _count: {
                select: { dossiers: true }
            }
        }
    });

    const specializedOrgans = allOrgans.filter((org: any) =>
        ['COMPER', 'CNPS'].includes(org.type)
    ).sort((a: any, b: any) => b._count.dossiers - a._count.dossiers);

    return specializedOrgans.map((org: any) => ({
        uid: org.uid,
        name: org.name,
        type: org.type,
        count: org._count.dossiers
    })).filter((c: any) => {
        const name = c.name.toLowerCase();
        // Skip those with 0 dossiers or Senate commissions
        return c.count > 0 && !name.includes('sénat');
    });
}

export async function getCommissionStats(id: string): Promise<CommissionStats | null> {
    // 1. Get organ name and type
    const organ = await prisma.group.findUnique({
        where: { uid: id },
        select: { name: true, type: true }
    });

    // 2. Get dossiers associated with this commission directly
    const dossiers = await prisma.legislativeDossier.findMany({
        where: {
            commissionId: id
        },
        select: {
            uid: true,
            title: true,
            status: true,
        },
        orderBy: { uid: 'desc' }
    });

    if (dossiers.length === 0) return null;

    // 3. Aggregate statuses
    const statusCounts = dossiers.reduce((acc: Record<string, number>, d: any) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: status as DossierStatus,
        count: count as number
    }));

    return {
        uid: id,
        name: organ?.name || id,
        type: organ?.type || 'AUTRE',
        totalDossiers: dossiers.length,
        statusDistribution,
        recentDossiers: dossiers.slice(0, 5)
    };
}

export async function getAllCommissionStats(): Promise<CommissionStats[]> {
    const commissions = await getCommissionsList();
    const stats: CommissionStats[] = [];

    for (const comm of commissions) {
        const s = await getCommissionStats(comm.uid);
        if (s) stats.push(s);
    }

    return stats;
}
