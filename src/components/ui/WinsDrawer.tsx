import React from 'react';
import { WinLog, Person, KeyResult } from '../../types';
import { CloseIcon, TrophyIcon, TrashIcon } from '../icons';
import { Avatar } from './SharedComponents';

interface WinWithSource extends WinLog {
    source: string; // "Objective" or the KR title
    sourceType: 'objective' | 'key_result';
}

interface WinsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    objectiveWins: WinLog[];
    keyResults: KeyResult[];
    people: Person[];
    onDeleteWin: (winId: string, isKeyResultWin: boolean) => void;
}

export const WinsDrawer: React.FC<WinsDrawerProps> = ({
    isOpen,
    onClose,
    objectiveWins,
    keyResults,
    people,
    onDeleteWin
}) => {
    // Aggregate all wins with their source
    const allWins: WinWithSource[] = [
        // Objective-level wins
        ...(objectiveWins || []).map(win => ({
            ...win,
            source: 'Objective',
            sourceType: 'objective' as const
        })),
        // KR-level wins
        ...keyResults.flatMap(kr =>
            (kr.winLog || []).map(win => ({
                ...win,
                source: kr.title,
                sourceType: 'key_result' as const
            }))
        )
    ];

    // Sort by date (newest first) - dates are in locale string format
    const sortedWins = allWins.sort((a, b) => {
        // Parse the date strings for comparison
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 transition-opacity z-20 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`absolute inset-y-0 right-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl z-30 flex flex-col transform transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-yellow-500"><TrophyIcon /></span>
                        <h3 className="text-lg font-semibold text-white">All Wins</h3>
                        <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-full">
                            {sortedWins.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {sortedWins.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                                <TrophyIcon />
                            </div>
                            <p className="text-zinc-500 text-sm">No wins logged yet</p>
                            <p className="text-zinc-600 text-xs mt-1">Start logging achievements to see them here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedWins.map((win) => (
                                <div
                                    key={win.id}
                                    className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group"
                                >
                                    {/* Source badge */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                            win.sourceType === 'objective'
                                                ? 'bg-violet-500/20 text-violet-400'
                                                : 'bg-pink-500/20 text-pink-400'
                                        }`}>
                                            {win.sourceType === 'objective' ? 'Objective Win' : 'Win Condition'}
                                        </span>
                                        <button
                                            onClick={() => onDeleteWin(win.id, win.sourceType === 'key_result')}
                                            className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>

                                    {/* Win note */}
                                    <p className="text-zinc-200 text-sm leading-relaxed mb-3">{win.note}</p>

                                    {/* Source title for KR wins */}
                                    {win.sourceType === 'key_result' && (
                                        <p className="text-zinc-500 text-xs mb-2 truncate" title={win.source}>
                                            From: {win.source}
                                        </p>
                                    )}

                                    {/* Footer with date and attribution */}
                                    <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
                                        <span className="text-zinc-600 text-xs font-mono">{win.date}</span>
                                        {win.attributedTo && win.attributedTo.length > 0 && (
                                            <div className="flex -space-x-1.5">
                                                {win.attributedTo.slice(0, 4).map(pid => (
                                                    <Avatar key={pid} person={people.find(p => p.id === pid)} size="xs" />
                                                ))}
                                                {win.attributedTo.length > 4 && (
                                                    <div className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-600 text-[8px] flex items-center justify-center text-zinc-400 font-bold">
                                                        +{win.attributedTo.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
