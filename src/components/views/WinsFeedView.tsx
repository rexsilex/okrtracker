import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Objective, Person, KeyResult } from '../../types';
import { TrophyIcon } from '../icons';
import { Avatar } from '../ui/SharedComponents';
import { WinLogger } from '../ui/WinLogger';

interface WinsFeedViewProps {
    objectives: Objective[];
    people: Person[];
    onLogWin?: (note: string, attributedTo: string[], objectiveId?: string, keyResultId?: string) => void;
}

export const WinsFeedView: React.FC<WinsFeedViewProps> = ({ objectives, people, onLogWin }) => {
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>("");

    // Get all objectives for the dropdown
    const objectiveOptions = useMemo(() => {
        return objectives.map(obj => ({
            id: obj.id,
            title: obj.title,
            category: obj.category,
            winConditions: obj.keyResults.filter(kr => kr.type === 'win_condition')
        }));
    }, [objectives]);

    // Get win conditions for selected objective
    const selectedObjective = objectiveOptions.find(o => o.id === selectedObjectiveId);
    const winConditions = selectedObjective?.winConditions || [];

    const handleLogWin = (note: string, attributedTo: string[], linkedConditionId?: string) => {
        if (onLogWin) {
            if (linkedConditionId) {
                // Log to specific win condition
                onLogWin(note, attributedTo, undefined, linkedConditionId);
            } else if (selectedObjectiveId) {
                // Log to objective
                onLogWin(note, attributedTo, selectedObjectiveId, undefined);
            }
        }
        setSelectedObjectiveId("");
    };

    // Flatten all wins
    const allWins = useMemo(() => {
        let wins: any[] = [];
        objectives.forEach(obj => {
            const basePath = obj.type === 'goal' ? '/goals' : '/okrs';
            // Objective wins
            if (obj.wins) {
                obj.wins.forEach(w => wins.push({
                    ...w,
                    winType: 'Objective',
                    sourceTitle: obj.title,
                    category: obj.category,
                    objId: obj.id,
                    objLink: `${basePath}/${obj.id}`
                }));
            }
            // KR wins
            obj.keyResults.forEach(kr => {
                if (kr.winLog) {
                    kr.winLog.forEach(w => wins.push({
                        ...w,
                        winType: 'Key Result',
                        sourceTitle: kr.title,
                        parentTitle: obj.title,
                        category: obj.category,
                        objId: obj.id,
                        objLink: `${basePath}/${obj.id}`
                    }));
                }
            });
        });
        // Sort by date (descending)
        return wins.sort((a, b) => Number(b.id) - Number(a.id));
    }, [objectives]);

    if (allWins.length === 0) {
        return (
            <div className="text-center py-20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl max-w-2xl mx-auto mt-10">
                <div className="bg-zinc-100 dark:bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-700">
                    <TrophyIcon />
                </div>
                <h3 className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">No wins recorded yet</h3>
                <p className="text-zinc-400 dark:text-zinc-600 text-sm">Log wins on your objectives to see them appear here.</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-4 animate-in slide-in-from-bottom-4">
             <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
                 <span className="text-yellow-600 dark:text-yellow-500"><TrophyIcon /></span> Activity Feed
             </h2>

             {/* Add Win Form */}
             {onLogWin && (
                 <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 mb-8">
                     <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-4">Log a Win</h3>
                     <div className="flex flex-col gap-3">
                         <select
                             value={selectedObjectiveId}
                             onChange={(e) => setSelectedObjectiveId(e.target.value)}
                             className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-violet-500/50"
                         >
                             <option value="" className="bg-white dark:bg-zinc-800">Select an objective...</option>
                             {objectiveOptions.map(obj => (
                                 <option key={obj.id} value={obj.id} className="bg-white dark:bg-zinc-800">
                                     [{obj.category}] {obj.title}
                                 </option>
                             ))}
                         </select>
                         {selectedObjectiveId && (
                             <WinLogger
                                 onLog={handleLogWin}
                                 people={people}
                                 placeholder="What did you achieve?"
                                 buttonLabel="Log Win"
                                 winConditions={winConditions}
                             />
                         )}
                     </div>
                 </div>
             )}
             <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 space-y-8">
                 {allWins.map((win, idx) => (
                     <div key={win.id} className="relative pl-8">
                         {/* Timeline Dot */}
                         <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-950 ring-2 ring-zinc-200 dark:ring-zinc-800"></div>

                         <Link to={win.objLink} className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${win.category === 'Company' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700/50'}`}>
                                         {win.category}
                                     </span>
                                     <span className="text-xs text-zinc-500">•</span>
                                     <span className="text-xs text-zinc-500 font-mono">{win.date}</span>
                                 </div>
                             </div>

                             <div className="mb-3">
                                 <p className="text-zinc-800 dark:text-zinc-200 text-lg leading-snug mb-2">{win.note}</p>
                                 <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded border border-zinc-200/50 dark:border-zinc-800/50 inline-block">
                                     <span className="font-bold text-zinc-600 dark:text-zinc-400">{win.winType === 'Objective' ? 'Objective Win' : 'Metric Update'}:</span> {win.sourceTitle}
                                     {win.parentTitle && <span className="block mt-1 text-zinc-400 dark:text-zinc-600">↳ {win.parentTitle}</span>}
                                 </div>
                             </div>

                             <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                 <span className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase font-bold">Attributed To</span>
                                 <div className="flex -space-x-1.5">
                                    {(win.attributedTo || []).map((pid: string) => (
                                        <Avatar key={pid} person={people.find(p => p.id === pid)} size="xs" />
                                    ))}
                                    {(!win.attributedTo || win.attributedTo.length === 0) && <span className="text-xs text-zinc-400 dark:text-zinc-600 italic">No attribution</span>}
                                </div>
                             </div>
                         </Link>
                     </div>
                 ))}
             </div>
        </div>
    )
}
