import { prisma } from './db'

export async function getLaws(filters?: {
    search?: string
    status?: string
}) {
    return prisma.law.findMany({
        where: {
            AND: [
                filters?.search ? {
                    title: { contains: filters.search, mode: 'insensitive' }
                } : {},
                filters?.status ? {
                    status: filters.status
                } : {}
            ]
        },
        include: {
            _count: {
                select: { amendments: true, votes: true }
            }
        },
        orderBy: { uid: 'desc' },
        take: 100
    })
}

export async function getLawByUid(uid: string) {
    const law = await prisma.law.findUnique({
        where: { uid },
        include: {
            amendments: {
                take: 20,
                include: {
                    author: true
                }
            },
            votes: {
                orderBy: { date: 'desc' },
                take: 10
            },
            _count: {
                select: { amendments: true }
            }
        }
    })

    if (!law) return null

    return law
}

export async function getAmendmentByUid(uid: string) {
    return prisma.amendment.findUnique({
        where: { uid },
        include: {
            author: true,
            law: true
        }
    })
}
