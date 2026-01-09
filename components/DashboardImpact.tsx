"use client";

/**
 * US-UX-004: Dashboard Impact Component
 * 
 * Vue gamifiée utilisateur avec:
 * - Compteur: 'X Députés contactés'
 * - Timeline: 'Loi X que vous avez suivie a été amendée'
 * - Badge: 'Citoyen Engagé' (si > 5 actions)
 */

import { useMemo } from 'react';
import {
    Trophy,
    Mail,
    Users,
    BookOpen,
    Zap,
    Star,
    TrendingUp,
    Bell,
    CheckCircle,
    Clock
} from 'lucide-react';
import Link from 'next/link';

interface UserStats {
    deputiesContacted: number;
    causesJoined: number;
    lawsFollowed: number;
    actionsCompleted: number;
    emailsSent: number;
}

interface ActivityItem {
    id: string;
    type: 'law_amendment' | 'deputy_vote' | 'cause_update' | 'action_complete' | 'badge_earned';
    title: string;
    description: string;
    timestamp: Date;
    link?: string;
    metadata?: Record<string, any>;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt?: Date;
    progress?: number; // 0-100 for incomplete badges
}

interface DashboardImpactProps {
    stats: UserStats;
    activities: ActivityItem[];
    badges: Badge[];
    userName?: string;
}

const BADGE_DEFINITIONS: Record<string, { icon: string; threshold: number; field: keyof UserStats }> = {
    'citoyen_engage': { icon: '🏆', threshold: 5, field: 'actionsCompleted' },
    'voix_portee': { icon: '📢', threshold: 3, field: 'emailsSent' },
    'veilleur': { icon: '👁️', threshold: 10, field: 'lawsFollowed' },
    'mobilisateur': { icon: '🤝', threshold: 5, field: 'causesJoined' },
    'influent': { icon: '⭐', threshold: 10, field: 'deputiesContacted' }
};

function StatCard({
    icon: Icon,
    value,
    label,
    color
}: {
    icon: React.ElementType;
    value: number;
    label: string;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </div>
    );
}

function BadgeDisplay({ badge }: { badge: Badge }) {
    const isEarned = !!badge.earnedAt;

    return (
        <div
            className={`
                relative p-4 rounded-xl border-2 text-center transition-all
                ${isEarned
                    ? 'border-yellow-400 bg-gradient-to-b from-yellow-50 to-white shadow-md'
                    : 'border-gray-200 bg-gray-50 opacity-60'}
            `}
        >
            <div className="text-3xl mb-2">{badge.icon}</div>
            <div className={`font-medium text-sm ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                {badge.name}
            </div>
            {isEarned && (
                <div className="absolute -top-2 -right-2">
                    <CheckCircle className="w-5 h-5 text-green-500 fill-white" />
                </div>
            )}
            {!isEarned && badge.progress !== undefined && (
                <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${badge.progress}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{badge.progress}%</div>
                </div>
            )}
        </div>
    );
}

function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'law_amendment': return <BookOpen className="w-4 h-4 text-blue-500" />;
            case 'deputy_vote': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'cause_update': return <Bell className="w-4 h-4 text-purple-500" />;
            case 'action_complete': return <Zap className="w-4 h-4 text-amber-500" />;
            case 'badge_earned': return <Trophy className="w-4 h-4 text-yellow-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'À l\'instant';
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Activité récente
            </h3>

            <div className="space-y-3">
                {activities.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            {activity.link ? (
                                <Link
                                    href={activity.link}
                                    className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                                >
                                    {activity.title}
                                </Link>
                            ) : (
                                <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                    {activity.title}
                                </div>
                            )}
                            <div className="text-xs text-gray-500 line-clamp-1">
                                {activity.description}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDate(activity.timestamp)}
                        </div>
                    </div>
                ))}

                {activities.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune activité récente</p>
                        <p className="text-xs">Commencez par suivre une loi ou rejoindre une cause !</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function DashboardImpact({
    stats,
    activities,
    badges,
    userName
}: DashboardImpactProps) {
    // Calculate progress for each badge
    const enrichedBadges = useMemo(() => {
        return badges.map(badge => {
            if (badge.earnedAt) return badge;

            const def = BADGE_DEFINITIONS[badge.id];
            if (!def) return badge;

            const currentValue = stats[def.field] || 0;
            const progress = Math.min(Math.round((currentValue / def.threshold) * 100), 100);

            return { ...badge, progress };
        });
    }, [badges, stats]);

    // Determine engagement level
    const engagementLevel = useMemo(() => {
        const total = stats.actionsCompleted + stats.emailsSent * 2 + stats.causesJoined * 3;
        if (total >= 50) return { label: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100' };
        if (total >= 20) return { label: 'Engagé', color: 'text-blue-600', bg: 'bg-blue-100' };
        if (total >= 5) return { label: 'Actif', color: 'text-green-600', bg: 'bg-green-100' };
        return { label: 'Débutant', color: 'text-gray-600', bg: 'bg-gray-100' };
    }, [stats]);

    return (
        <div className="dashboard-impact space-y-6">
            {/* Header with engagement level */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {userName ? `Bonjour ${userName} !` : 'Votre impact'}
                    </h2>
                    <p className="text-gray-500">Suivez votre engagement citoyen</p>
                </div>
                <div className={`px-4 py-2 rounded-full ${engagementLevel.bg}`}>
                    <span className={`font-medium ${engagementLevel.color}`}>
                        🎯 Niveau {engagementLevel.label}
                    </span>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Mail}
                    value={stats.deputiesContacted}
                    label="Députés contactés"
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Users}
                    value={stats.causesJoined}
                    label="Causes rejointes"
                    color="bg-purple-500"
                />
                <StatCard
                    icon={BookOpen}
                    value={stats.lawsFollowed}
                    label="Lois suivies"
                    color="bg-green-500"
                />
                <StatCard
                    icon={Zap}
                    value={stats.actionsCompleted}
                    label="Actions réalisées"
                    color="bg-amber-500"
                />
            </div>

            {/* Badges section */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Vos badges
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {enrichedBadges.map(badge => (
                        <BadgeDisplay key={badge.id} badge={badge} />
                    ))}
                </div>
            </div>

            {/* Activity timeline */}
            <ActivityTimeline activities={activities} />

            {/* Call to action if low engagement */}
            {stats.actionsCompleted < 5 && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <Star className="w-12 h-12 opacity-80" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">Devenez un Citoyen Engagé !</h3>
                            <p className="text-white/80 text-sm">
                                Réalisez encore {5 - stats.actionsCompleted} actions pour débloquer ce badge.
                            </p>
                        </div>
                        <Link
                            href="/causes"
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                        >
                            Voir les causes
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardImpact;
