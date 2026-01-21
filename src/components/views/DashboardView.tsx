import React from 'react';
import { Objective } from '../../types';
import { ProgressBar } from '../ui/SharedComponents';

interface DashboardViewProps {
    objectives: Objective[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ objectives }) => {
    // Metrics
    const totalObjectives = objectives.length;
    const totalKRs = objectives.reduce((acc, obj) => acc + obj.keyResults.length, 0);

    const objWins = objectives.reduce((acc, obj) => acc + (obj.wins?.length || 0), 0);
    const krWins = objectives.reduce((acc, obj) => acc + obj.keyResults.reduce((kAcc, kr) => kAcc + (kr.winLog?.length || 0), 0), 0);
    const totalWins = objWins + krWins;

    const totalProgress = objectives.reduce((acc, obj) => {
         const objProg = obj.keyResults.length === 0 ? 0 : obj.keyResults.reduce((kAcc, kr) => kAcc + (kr.target === 0 ? 0 : Math.min(100, (kr.current / kr.target) * 100)), 0) / obj.keyResults.length;
         return acc + objProg;
    }, 0) / (objectives.length || 1);


    const categories = Array.from(new Set(objectives.map(o => o.category || 'Uncategorized')));
    const categoryStats = categories.map(cat => {
        const catObjs = objectives.filter(o => o.category === cat);
        const count = catObjs.length;
        const wins = catObjs.reduce((acc, o) => acc + (o.wins?.length || 0) + o.keyResults.reduce((ka, k) => ka + (k.winLog?.length || 0), 0), 0);
        return { cat, count, wins };
    });

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">At a Glance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total OKRs</div>
                    <div className="text-4xl font-mono text-white flex items-baseline gap-2">
                        {totalObjectives}
                        <span className="text-sm text-zinc-600 font-sans font-normal">objectives</span>
                    </div>
                </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Wins</div>
                    <div className="text-4xl font-mono text-yellow-500 flex items-baseline gap-2">
                        {totalWins}
                        <span className="text-sm text-yellow-500/50 font-sans font-normal">achievements</span>
                    </div>
                </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Metrics Tracked</div>
                    <div className="text-4xl font-mono text-violet-400 flex items-baseline gap-2">
                        {totalKRs}
                         <span className="text-sm text-violet-400/50 font-sans font-normal">key results</span>
                    </div>
                </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Overall Progress</div>
                    <div className="text-4xl font-mono text-white flex items-baseline gap-2">
                        {Math.round(totalProgress)}%
                         <span className="text-sm text-zinc-600 font-sans font-normal">avg completion</span>
                    </div>
                    <ProgressBar progress={totalProgress} className="h-1.5 mt-3" />
                </div>
            </div>

            <h3 className="text-lg font-bold text-zinc-300 mb-4">Breakdown by Department</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryStats.map(stat => (
                    <div key={stat.cat} className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl flex items-center justify-between">
                         <div>
                             <div className="text-sm font-bold text-white mb-1">{stat.cat}</div>
                             <div className="text-xs text-zinc-500">{stat.count} Objectives</div>
                         </div>
                         <div className="flex flex-col items-end">
                             <div className="text-xl font-bold text-zinc-200">{stat.wins}</div>
                             <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Wins</div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
