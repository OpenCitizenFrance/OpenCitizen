"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';

// Official hemicycle order from left to right
const HEMICYCLE_ORDER: Record<string, number> = {
    'LFI-NFP': 1,
    'GDR': 2,
    'SOC': 3,
    'EcoS': 4,
    'LIOT': 5,
    'Dem': 6,
    'HOR': 7,
    'EPR': 8,
    'DR': 9,
    'UDR': 10,
    'RN': 11,
    'NI': 12,
};

interface GroupData {
    uid: string;
    name: string;
    acronym: string | null;
    colorCode: string | null;
    memberCount: number;
}

interface HemicycleSVGProps {
    groups: GroupData[];
    // Mode: 'filter' for textes page (toggle selection), 'navigate' for groupes page (click to navigate)
    mode?: 'filter' | 'navigate';
    // Selected group UIDs (for filter mode)
    selectedGroups?: string[];
    // Callback when a group is clicked (for filter mode)
    onGroupClick?: (groupId: string) => void;
}

// Convert polar to cartesian (0° = right, increases counterclockwise)
function polarToCartesian(cx: number, cy: number, r: number, angleDegrees: number) {
    const angleRad = angleDegrees * Math.PI / 180;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy - r * Math.sin(angleRad)
    };
}

// Generate SVG arc path for a segment
function describeArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number): string {
    // Ensure we go from lower angle to higher angle for consistent arc direction
    const s = Math.min(startAngle, endAngle);
    const e = Math.max(startAngle, endAngle);

    // Outer arc: from start to end (counterclockwise = sweep-flag 1)
    const outerStart = polarToCartesian(cx, cy, outerR, s);
    const outerEnd = polarToCartesian(cx, cy, outerR, e);

    // Inner arc: from end back to start (clockwise = sweep-flag 0)
    const innerEnd = polarToCartesian(cx, cy, innerR, e);
    const innerStart = polarToCartesian(cx, cy, innerR, s);

    const largeArcFlag = (e - s) > 180 ? 1 : 0;

    // Path: outer arc (sweep=0 for clockwise curve), then line to inner, then inner arc (sweep=1 for counterclockwise curve)
    return [
        "M", outerStart.x, outerStart.y,
        "A", outerR, outerR, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
        "L", innerEnd.x, innerEnd.y,
        "A", innerR, innerR, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
        "Z"
    ].join(" ");
}

export function HemicycleSVG({
    groups,
    mode = 'navigate',
    selectedGroups = [],
    onGroupClick
}: HemicycleSVGProps) {
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

    // SVG dimensions - adjusted for better semicircle appearance
    const cx = 200;
    const cy = 185;
    const innerR = 55;
    const outerR = 175;

    const hasSelection = selectedGroups.length > 0;

    // Sort groups by hemicycle order and calculate arcs
    const groupArcs = useMemo(() => {
        const politicalGroups = groups.filter(g => g.memberCount > 0);

        const sorted = [...politicalGroups].sort((a, b) => {
            const orderA = HEMICYCLE_ORDER[a.acronym || ''] || 50;
            const orderB = HEMICYCLE_ORDER[b.acronym || ''] || 50;
            return orderA - orderB;
        });

        const totalSeats = sorted.reduce((sum, g) => sum + g.memberCount, 0);
        let currentAngle = 180;

        return sorted.map(group => {
            const proportion = group.memberCount / totalSeats;
            const arcAngle = proportion * 180;
            const startAngle = currentAngle;
            const endAngle = currentAngle - arcAngle;
            currentAngle = endAngle;

            const midAngle = (startAngle + endAngle) / 2;
            const labelRadius = (innerR + outerR) / 2;
            const labelPos = polarToCartesian(cx, cy, labelRadius, midAngle);

            return {
                ...group,
                startAngle: endAngle,
                endAngle: startAngle,
                path: describeArc(cx, cy, innerR, outerR, endAngle, startAngle),
                labelX: labelPos.x,
                labelY: labelPos.y,
                showLabel: arcAngle > 15,
            };
        });
    }, [groups, cx, cy, innerR, outerR]);

    // Sort groups for legend
    const sortedGroups = useMemo(() => {
        return [...groups]
            .filter(g => g.memberCount > 0)
            .sort((a, b) => {
                const orderA = HEMICYCLE_ORDER[a.acronym || ''] || 50;
                const orderB = HEMICYCLE_ORDER[b.acronym || ''] || 50;
                return orderA - orderB;
            });
    }, [groups]);

    const handleGroupClick = (groupId: string) => {
        if (mode === 'filter' && onGroupClick) {
            onGroupClick(groupId);
        }
    };

    const isSelected = (groupId: string) => selectedGroups.includes(groupId);

    // Determine opacity for a group
    const getOpacity = (groupId: string) => {
        if (!hasSelection) return 0.9;
        if (isSelected(groupId)) return 1;
        return 0.35; // Grayed out
    };

    const getFilter = (groupId: string) => {
        const isHovered = hoveredGroup === groupId;
        const selected = isSelected(groupId);

        if (isHovered && selected) {
            return 'brightness(1.1) drop-shadow(0 2px 6px rgba(0,0,0,0.4))';
        }
        if (isHovered) {
            return 'brightness(1.15) drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
        }
        if (selected) {
            return 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
        }
        if (hasSelection && !selected) {
            return 'saturate(0.5)';
        }
        return 'none';
    };

    const SegmentWrapper = mode === 'navigate' ? Link : 'g';

    return (
        <div className="w-full">
            {/* SVG Hemicycle */}
            <div className="relative w-full max-w-lg mx-auto">
                <svg
                    viewBox="0 0 400 195"
                    className="w-full h-auto"
                    style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))' }}
                >
                    {/* Background semicircle for visual reference */}
                    <path
                        d={describeArc(cx, cy, innerR - 5, outerR + 5, 0, 180)}
                        fill="#0f172a"
                        opacity="0.1"
                    />

                    {/* Group segments */}
                    {groupArcs.map((group) => {
                        const segmentProps = {
                            d: group.path,
                            fill: group.colorCode || '#888888',
                            stroke: isSelected(group.uid) ? '#ffffff' : '#1e293b',
                            strokeWidth: isSelected(group.uid) ? '2' : '1',
                            opacity: getOpacity(group.uid),
                            className: 'cursor-pointer transition-all duration-300',
                            style: { filter: getFilter(group.uid) },
                            onMouseEnter: () => setHoveredGroup(group.uid),
                            onMouseLeave: () => setHoveredGroup(null),
                            onClick: mode === 'filter' ? () => handleGroupClick(group.uid) : undefined,
                        };

                        return (
                            <g key={group.uid}>
                                {mode === 'navigate' ? (
                                    <Link href={`/groupes/${group.uid}`}>
                                        <path {...segmentProps} />
                                    </Link>
                                ) : (
                                    <path {...segmentProps} />
                                )}

                                {/* Label on segment */}
                                {group.showLabel && (
                                    <text
                                        x={group.labelX}
                                        y={group.labelY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="pointer-events-none select-none"
                                        fill="white"
                                        fontSize="10"
                                        fontWeight="600"
                                        opacity={hasSelection && !isSelected(group.uid) ? 0.5 : 1}
                                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                                    >
                                        {group.acronym}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Center podium */}
                    <circle cx={cx} cy={cy} r="28" fill="#3b82f6" />
                    <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="6"
                        fontWeight="600"
                    >
                        ASSEMBLÉE
                    </text>
                </svg>

                {/* Tooltip */}
                {hoveredGroup && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm z-10 whitespace-nowrap">
                        {(() => {
                            const group = groupArcs.find(g => g.uid === hoveredGroup);
                            if (!group) return null;
                            return (
                                <span>
                                    <span className="font-semibold">{group.name}</span>
                                    <span className="text-slate-300 ml-2">({group.memberCount} députés)</span>
                                    {mode === 'filter' && (
                                        <span className="text-slate-400 ml-2">
                                            {isSelected(group.uid) ? '✓' : '— cliquer pour filtrer'}
                                        </span>
                                    )}
                                </span>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Instruction */}
            <p className="text-center text-xs text-muted-foreground mt-2">
                {mode === 'filter'
                    ? 'Cliquez sur un ou plusieurs groupes pour filtrer les textes'
                    : 'Cliquez sur un groupe pour accéder à sa page'
                }
            </p>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2 px-4">
                {sortedGroups.map(group => {
                    const selected = isSelected(group.uid);
                    const dimmed = hasSelection && !selected;

                    const content = (
                        <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all duration-200 ${selected
                                ? 'bg-primary/20 ring-1 ring-primary'
                                : dimmed
                                    ? 'opacity-50'
                                    : 'hover:bg-muted/50'
                                } ${mode === 'filter' ? 'cursor-pointer' : ''}`}
                            onClick={mode === 'filter' ? () => handleGroupClick(group.uid) : undefined}
                        >
                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                    backgroundColor: group.colorCode || '#888',
                                    opacity: dimmed ? 0.5 : 1
                                }}
                            />
                            <span className="font-medium">{group.acronym}</span>
                            <span className="text-muted-foreground">({group.memberCount})</span>
                        </span>
                    );

                    return mode === 'navigate' ? (
                        <Link key={group.uid} href={`/groupes/${group.uid}`}>
                            {content}
                        </Link>
                    ) : (
                        <div key={group.uid}>{content}</div>
                    );
                })}
            </div>

            {/* Clear filter button */}
            {mode === 'filter' && hasSelection && (
                <div className="flex justify-center mt-2">
                    <button
                        onClick={() => selectedGroups.forEach(id => onGroupClick?.(id))}
                        className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                        Effacer le filtre ({selectedGroups.length} groupe{selectedGroups.length > 1 ? 's' : ''})
                    </button>
                </div>
            )}
        </div>
    );
}

export default HemicycleSVG;
