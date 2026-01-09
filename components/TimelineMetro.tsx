"use client";

/**
 * US-UI-002 & US-UI-003: Timeline Métro Component
 * 
 * Visualisation du parcours législatif en style "métro"
 * - Mobile: Vue verticale avec accordéon
 * - Desktop: Vue horizontale avec scroll
 * - Stations avec pulsation pour étape courante
 * - Gestion visuelle "Tunnel Sénat" (ligne pointillée)
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';

interface TimelineStage {
    id: string;
    label: string;
    labelShort?: string;
    date?: Date | string;
    chamber?: 'ASSEMBLEE_NATIONALE' | 'SENAT' | null;
    stageType: string;
    codeActe?: string;
    isCurrent?: boolean;
    pdfUrl?: string;
    details?: string;
}

interface TimelineMetroProps {
    stages: TimelineStage[];
    orientation?: 'auto' | 'vertical' | 'horizontal';
    className?: string;
}

const CHAMBER_COLORS = {
    ASSEMBLEE_NATIONALE: '#0055A4', // Bleu AN
    SENAT: '#6B21A8', // Violet Sénat
};

const STAGE_ICONS: Record<string, string> = {
    DEPOT: '📥',
    COMMISSION_FOND: '⚙️',
    COMMISSION_AVIS: '📋',
    SEANCE_PUBLIQUE: '🎤',
    CMP: '🤝',
    LECTURE_DEFINITIVE: '✅',
    CONSEIL_CONSTIT: '⚖️',
    PROMULGATION: '🏛️',
};

function formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function getStageIcon(stageType: string): string {
    return STAGE_ICONS[stageType] || '📍';
}

export function TimelineMetro({
    stages,
    orientation = 'auto',
    className = ''
}: TimelineMetroProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isHorizontal, setIsHorizontal] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Detect orientation based on screen size
    useEffect(() => {
        if (orientation !== 'auto') {
            setIsHorizontal(orientation === 'horizontal');
            return;
        }

        const checkSize = () => {
            setIsHorizontal(window.innerWidth >= 1024);
        };

        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, [orientation]);

    // Scroll to current stage on mount
    useEffect(() => {
        if (isHorizontal && scrollRef.current) {
            const currentIndex = stages.findIndex(s => s.isCurrent);
            if (currentIndex > 0) {
                const stageWidth = 200; // Approximate stage width
                scrollRef.current.scrollLeft = currentIndex * stageWidth - 200;
            }
        }
    }, [isHorizontal, stages]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (isHorizontal) {
        return (
            <div className={`timeline-metro-horizontal ${className}`} ref={containerRef}>
                {/* Zoom controls for long timelines */}
                {stages.length > 8 && (
                    <div className="flex justify-end mb-2 gap-2">
                        <span className="text-xs text-gray-500">
                            {stages.length} étapes • Scroll horizontal →
                        </span>
                    </div>
                )}

                <div
                    ref={scrollRef}
                    className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <div className="flex items-start min-w-max px-4">
                        {stages.map((stage, index) => {
                            const isSenat = stage.chamber === 'SENAT';
                            const color = isSenat ? CHAMBER_COLORS.SENAT : CHAMBER_COLORS.ASSEMBLEE_NATIONALE;
                            const isLast = index === stages.length - 1;
                            const isCurrent = stage.isCurrent;

                            return (
                                <div key={stage.id} className="flex items-start group">
                                    {/* Station */}
                                    <div className="flex flex-col items-center relative">
                                        {/* Station circle */}
                                        <div
                                            className={`
                                                w-10 h-10 rounded-full flex items-center justify-center
                                                border-4 transition-all duration-300
                                                ${isCurrent ? 'animate-pulse scale-110' : ''}
                                                group-hover:scale-110
                                            `}
                                            style={{
                                                borderColor: color,
                                                backgroundColor: isCurrent ? color : 'white'
                                            }}
                                        >
                                            <span className={`text-lg ${isCurrent ? '' : ''}`}>
                                                {getStageIcon(stage.stageType)}
                                            </span>
                                        </div>

                                        {/* Label below */}
                                        <div className="mt-2 text-center max-w-[160px]">
                                            <div className="text-xs font-medium text-gray-900 line-clamp-2">
                                                {stage.labelShort || stage.label}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatDate(stage.date)}
                                            </div>
                                            {/* Tooltip on hover */}
                                            <div className={`
                                                opacity-0 group-hover:opacity-100 transition-opacity
                                                absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                                                bg-gray-900 text-white text-xs p-2 rounded shadow-lg
                                                min-w-[200px] z-10
                                            `}>
                                                <div className="font-medium">{stage.label}</div>
                                                {stage.date && <div className="mt-1">{formatDate(stage.date)}</div>}
                                                {stage.pdfUrl && (
                                                    <a
                                                        href={stage.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 mt-2 text-blue-300 hover:text-blue-200"
                                                    >
                                                        <FileText size={12} />
                                                        Voir le texte
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connecting line */}
                                    {!isLast && (
                                        <div
                                            className="h-1 w-24 mt-5 mx-2"
                                            style={{
                                                backgroundColor: color,
                                                // Dotted line for "tunnel" (Sénat transition)
                                                backgroundImage: isSenat ?
                                                    `repeating-linear-gradient(90deg, ${color}, ${color} 8px, transparent 8px, transparent 16px)` :
                                                    undefined,
                                                backgroundSize: isSenat ? 'auto' : undefined
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Vertical (mobile) layout
    return (
        <div className={`timeline-metro-vertical ${className}`} ref={containerRef}>
            <div className="relative pl-8">
                {/* Main vertical line */}
                <div className="absolute left-3 top-0 bottom-0 w-1 bg-gray-200" />

                {stages.map((stage, index) => {
                    const isSenat = stage.chamber === 'SENAT';
                    const color = isSenat ? CHAMBER_COLORS.SENAT : CHAMBER_COLORS.ASSEMBLEE_NATIONALE;
                    const isExpanded = expandedId === stage.id;
                    const isCurrent = stage.isCurrent;

                    return (
                        <div key={stage.id} className="relative mb-4">
                            {/* Tunnel effect for Sénat */}
                            {isSenat && (
                                <div
                                    className="absolute left-3 -top-2 bottom-0 w-1"
                                    style={{
                                        background: `repeating-linear-gradient(
                                            180deg,
                                            ${CHAMBER_COLORS.SENAT},
                                            ${CHAMBER_COLORS.SENAT} 8px,
                                            transparent 8px,
                                            transparent 16px
                                        )`
                                    }}
                                />
                            )}

                            {/* Station dot */}
                            <div
                                className={`
                                    absolute left-0 w-7 h-7 rounded-full 
                                    flex items-center justify-center
                                    border-4 z-10 transition-all
                                    ${isCurrent ? 'animate-pulse scale-110' : ''}
                                `}
                                style={{
                                    borderColor: color,
                                    backgroundColor: isCurrent ? color : 'white'
                                }}
                            >
                                <span className="text-sm">{getStageIcon(stage.stageType)}</span>
                            </div>

                            {/* Content card */}
                            <div
                                className={`
                                    ml-6 p-3 rounded-lg border cursor-pointer
                                    transition-all duration-200
                                    ${isCurrent ? 'border-2 shadow-md' : 'border-gray-200'}
                                    hover:shadow-sm hover:border-gray-300
                                `}
                                style={{ borderColor: isCurrent ? color : undefined }}
                                onClick={() => toggleExpand(stage.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-xs font-medium px-2 py-0.5 rounded"
                                                style={{
                                                    backgroundColor: color + '20',
                                                    color: color
                                                }}
                                            >
                                                {isSenat ? 'Sénat' : 'AN'}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                    En cours
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-medium mt-1 text-gray-900">
                                            {stage.labelShort || stage.label}
                                        </h4>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(stage.date)}
                                        </div>
                                    </div>
                                    <div className="text-gray-400">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-sm text-gray-600 mb-2">
                                            {stage.label}
                                        </p>
                                        {stage.details && (
                                            <p className="text-sm text-gray-500 mb-2">
                                                {stage.details}
                                            </p>
                                        )}
                                        {stage.pdfUrl && (
                                            <a
                                                href={stage.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FileText size={14} />
                                                Consulter le texte
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TimelineMetro;
