import React, { useMemo } from 'react';
import { Objective, Person } from '../../types';
import { TrophyIcon } from '../icons';
import { Avatar } from '../ui/SharedComponents';

interface WinsFeedViewProps {
    objectives: Objective[];
    people: Person[];
}

export const WinsFeedView: React.FC<WinsFeedViewProps> = ({ objectives, people }) => {

    // Flatten all wins
    const allWins = useMemo(() => {
        let wins: any[] = [];
        objectives.forEach(obj => {
            // Objective wins
            if (obj.wins) {
                obj.wins.forEach(w => wins.push({
                    ...w,
                    type: 'Objective',
                    sourceTitle: obj.title,
                    category: obj.category,
                    objId: obj.id
                }));
            }
            // KR wins
            obj.keyResults.forEach(kr => {
                if (kr.winLog) {
                    kr.winLog.forEach(w => wins.push({
                        ...w,
                        type: 'Key Result',
                        sourceTitle: kr.title,
                        parentTitle: obj.title,
                        category: obj.category,
                        objId: obj.id
                    }));
                }
            });
        });
        // Sort by date (descending)
        return wins.sort((a, b) => Number(b.id) - Number(a.id));
    }, [objectives]);

    if (allWins.length === 0) {
        return (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl max-w-2xl mx-auto mt-10">
                <div className="bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-700">
                    <TrophyIcon />
                </div>
                <h3 className="text-zinc-400 font-medium mb-1">No wins recorded yet</h3>
                <p className="text-zinc-600 text-sm">Log wins on your objectives to see them appear here.</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-4 animate-in slide-in-from-bottom-4">
             <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                 <span className="text-yellow-500"><TrophyIcon /></span> Activity Feed
             </h2>
             <div className="relative border-l border-zinc-800 ml-4 space-y-8">
                 {allWins.map((win, idx) => (
                     <div key={win.id} className="relative pl-8">
                         {/* Timeline Dot */}
                         <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-950 ring-2 ring-zinc-800"></div>

                         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${win.category === 'Company' ? 'bg-violet-900/30 text-violet-400 border border-violet-800/50' : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'}`}>
                                         {win.category}
                                     </span>
                                     <span className="text-xs text-zinc-500">•</span>
                                     <span className="text-xs text-zinc-500 font-mono">{win.date}</span>
                                 </div>
                             </div>

                             <div className="mb-3">
                                 <p className="text-zinc-200 text-lg leading-snug mb-2">{win.note}</p>
                                 <div className="text-xs text-zinc-500 bg-zinc-950/50 p-2 rounded border border-zinc-800/50 inline-block">
                                     <span className="font-bold text-zinc-400">{win.type === 'Objective' ? 'Objective Win' : 'Metric Update'}:</span> {win.sourceTitle}
                                     {win.parentTitle && <span className="block mt-1 text-zinc-600">↳ {win.parentTitle}</span>}
                                 </div>
                             </div>

                             <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                                 <span className="text-[10px] text-zinc-600 uppercase font-bold">Attributed To</span>
                                 <div className="flex -space-x-1.5">
                                    {(win.attributedTo || []).map((pid: string) => (
                                        <Avatar key={pid} person={people.find(p => p.id === pid)} size="xs" />
                                    ))}
                                    {(!win.attributedTo || win.attributedTo.length === 0) && <span className="text-xs text-zinc-600 italic">No attribution</span>}
                                </div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    )
}
