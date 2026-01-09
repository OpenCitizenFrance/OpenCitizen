"use client";

/**
 * US-UI-005: Diff Viewer Component
 * 
 * Affichage comparatif de textes avec:
 * - Desktop: Split View (side-by-side)
 * - Mobile: Tabs [Avant] [Après] [Diff]
 * - Surlignage: Rouge (Suppression) / Vert (Ajout)
 * - Insertion de la 'Note IA' en bloc citation stylisé
 */

import { useState, useEffect, useMemo } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, SplitSquareHorizontal, Layers } from 'lucide-react';

interface DiffLine {
    type: 'add' | 'remove' | 'unchanged';
    content: string;
    lineNumber?: number;
}

interface DiffViewerProps {
    textBefore: string;
    textAfter: string;
    diffLines?: DiffLine[];
    magicNote?: string;
    noteType?: 'forme' | 'fond' | 'mixte';
    className?: string;
}

type ViewMode = 'before' | 'after' | 'diff' | 'split';

/**
 * Simple diff calculation if not provided
 */
function calculateDiff(before: string, after: string): DiffLine[] {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    const result: DiffLine[] = [];

    const maxLen = Math.max(beforeLines.length, afterLines.length);

    for (let i = 0; i < maxLen; i++) {
        const bLine = beforeLines[i];
        const aLine = afterLines[i];

        if (bLine === aLine) {
            if (bLine !== undefined) {
                result.push({ type: 'unchanged', content: bLine, lineNumber: i + 1 });
            }
        } else {
            if (bLine !== undefined) {
                result.push({ type: 'remove', content: bLine, lineNumber: i + 1 });
            }
            if (aLine !== undefined) {
                result.push({ type: 'add', content: aLine, lineNumber: i + 1 });
            }
        }
    }

    return result;
}

const NOTE_TYPE_STYLES = {
    forme: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: '📝',
        label: 'Modification de forme',
        accent: 'text-blue-700'
    },
    fond: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: '⚠️',
        label: 'Modification de fond',
        accent: 'text-amber-700'
    },
    mixte: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: '🔄',
        label: 'Modification mixte',
        accent: 'text-purple-700'
    }
};

export function DiffViewer({
    textBefore,
    textAfter,
    diffLines: providedDiffLines,
    magicNote,
    noteType = 'mixte',
    className = ''
}: DiffViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('diff');
    const [isDesktop, setIsDesktop] = useState(false);

    // Detect screen size
    useEffect(() => {
        const checkSize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Auto-switch to split view on desktop
    useEffect(() => {
        if (isDesktop && viewMode !== 'split') {
            setViewMode('split');
        } else if (!isDesktop && viewMode === 'split') {
            setViewMode('diff');
        }
    }, [isDesktop]);

    // Calculate diff if not provided
    const diffLines = useMemo(() => {
        return providedDiffLines || calculateDiff(textBefore, textAfter);
    }, [textBefore, textAfter, providedDiffLines]);

    const stats = useMemo(() => {
        const added = diffLines.filter(l => l.type === 'add').length;
        const removed = diffLines.filter(l => l.type === 'remove').length;
        return { added, removed };
    }, [diffLines]);

    const noteStyles = NOTE_TYPE_STYLES[noteType];

    const renderLine = (line: DiffLine, index: number) => {
        const baseStyles = "px-3 py-1 font-mono text-sm whitespace-pre-wrap";

        switch (line.type) {
            case 'add':
                return (
                    <div
                        key={`add-${index}`}
                        className={`${baseStyles} bg-green-100 text-green-800 border-l-4 border-green-500`}
                    >
                        <span className="text-green-600 mr-2">+</span>
                        {line.content}
                    </div>
                );
            case 'remove':
                return (
                    <div
                        key={`rem-${index}`}
                        className={`${baseStyles} bg-red-100 text-red-800 border-l-4 border-red-500`}
                    >
                        <span className="text-red-600 mr-2">−</span>
                        {line.content}
                    </div>
                );
            default:
                return (
                    <div
                        key={`unch-${index}`}
                        className={`${baseStyles} text-gray-600`}
                    >
                        <span className="mr-3"> </span>
                        {line.content}
                    </div>
                );
        }
    };

    const renderText = (text: string, type: 'before' | 'after') => {
        return (
            <div className="h-full overflow-auto">
                <div className={`p-4 font-mono text-sm whitespace-pre-wrap ${type === 'before' ? 'bg-red-50/30' : 'bg-green-50/30'
                    }`}>
                    {text.split('\n').map((line, i) => (
                        <div key={i} className="py-0.5">
                            <span className="text-gray-400 mr-3 select-none text-xs">
                                {String(i + 1).padStart(3, ' ')}
                            </span>
                            {line}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={`diff-viewer ${className}`}>
            {/* Magic Note - AI Analysis */}
            {magicNote && (
                <div className={`
                    mb-4 p-4 rounded-lg border-2 ${noteStyles.bg} ${noteStyles.border}
                `}>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-2xl">{noteStyles.icon}</div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className={`font-medium text-sm ${noteStyles.accent}`}>
                                    {noteStyles.label}
                                </span>
                                <span className="text-xs text-gray-500">• Analyse IA</span>
                            </div>
                            <blockquote className="text-gray-700 text-sm leading-relaxed italic border-l-4 border-gray-300 pl-3">
                                {magicNote}
                            </blockquote>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats bar */}
            <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                        <span className="font-medium">+{stats.added}</span> ajouts
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                        <span className="font-medium">−{stats.removed}</span> suppressions
                    </span>
                </div>

                {/* View mode switcher (mobile only) */}
                {!isDesktop && (
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        {(['before', 'after', 'diff'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`
                                    px-3 py-1 text-xs font-medium rounded transition-all
                                    ${viewMode === mode
                                        ? 'bg-white shadow text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                {mode === 'before' ? 'Avant' : mode === 'after' ? 'Après' : 'Diff'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Desktop toggle */}
                {isDesktop && (
                    <button
                        onClick={() => setViewMode(viewMode === 'split' ? 'diff' : 'split')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        {viewMode === 'split' ? (
                            <>
                                <Layers size={16} /> Vue unifiée
                            </>
                        ) : (
                            <>
                                <SplitSquareHorizontal size={16} /> Vue côte à côte
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Content area */}
            <div className="border rounded-lg overflow-hidden bg-white">
                {/* Split view (desktop) */}
                {viewMode === 'split' && (
                    <div className="flex h-[500px]">
                        <div className="flex-1 border-r">
                            <div className="bg-red-100/50 px-3 py-2 border-b font-medium text-sm text-red-700 flex items-center gap-2">
                                <ChevronLeft size={16} />
                                Avant
                            </div>
                            {renderText(textBefore, 'before')}
                        </div>
                        <div className="flex-1">
                            <div className="bg-green-100/50 px-3 py-2 border-b font-medium text-sm text-green-700 flex items-center gap-2">
                                <ChevronRight size={16} />
                                Après
                            </div>
                            {renderText(textAfter, 'after')}
                        </div>
                    </div>
                )}

                {/* Diff view */}
                {viewMode === 'diff' && (
                    <div className="max-h-[500px] overflow-auto">
                        {diffLines.map((line, i) => renderLine(line, i))}
                    </div>
                )}

                {/* Before view (mobile) */}
                {viewMode === 'before' && (
                    <div className="max-h-[400px] overflow-auto">
                        {renderText(textBefore, 'before')}
                    </div>
                )}

                {/* After view (mobile) */}
                {viewMode === 'after' && (
                    <div className="max-h-[400px] overflow-auto">
                        {renderText(textAfter, 'after')}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DiffViewer;
