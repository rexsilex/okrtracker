import React from 'react';
import { Objective, WinLog } from '../../types';
import { ProgressBar } from '../ui/SharedComponents';
import { TrophyIcon, TargetIcon } from '../icons';

// Sparkline component for showing cumulative wins over a year
const WinsSparkline: React.FC<{ wins: WinLog[]; className?: string }> = ({ wins, className = '' }) => {
    const width = 80;
    const height = 24;
    const padding = 2;

    // Get year boundaries
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const totalDays = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));

    // Sort wins by date and calculate cumulative count per day
    const winsByDate = wins
        .map(w => new Date(w.date))
        .filter(d => d.getFullYear() === now.getFullYear())
        .sort((a, b) => a.getTime() - b.getTime());

    if (winsByDate.length === 0) {
        // No wins this year - show flat line at zero
        return (
            <svg width={width} height={height} className={className}>
                <line
                    x1={padding}
                    y1={height - padding}
                    x2={width - padding}
                    y2={height - padding}
                    stroke="rgb(63, 63, 70)"
                    strokeWidth="1"
                />
            </svg>
        );
    }

    // Build cumulative data points
    const dataPoints: { day: number; count: number }[] = [];
    let cumulative = 0;

    // Start at 0
    dataPoints.push({ day: 0, count: 0 });

    // Add a point for each win
    winsByDate.forEach(date => {
        const dayOfYear = Math.ceil((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        cumulative++;
        dataPoints.push({ day: dayOfYear, count: cumulative });
    });

    // Extend line to current day
    const currentDay = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    if (dataPoints[dataPoints.length - 1].day < currentDay) {
        dataPoints.push({ day: currentDay, count: cumulative });
    }

    const maxCount = cumulative;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Scale points to SVG coordinates
    const points = dataPoints.map(p => ({
        x: padding + (p.day / totalDays) * chartWidth,
        y: height - padding - (maxCount > 0 ? (p.count / maxCount) * chartHeight : 0)
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Create fill area path
    const fillD = pathD + ` L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
        <svg width={width} height={height} className={className}>
            {/* Fill area */}
            <path d={fillD} fill="rgb(234, 179, 8)" fillOpacity="0.15" />
            {/* Line */}
            <path d={pathD} fill="none" stroke="rgb(234, 179, 8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

interface DashboardViewProps {
    objectives: Objective[];
    onObjectiveClick?: (id: string) => void;
    onCategoryClick?: (category: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ objectives, onObjectiveClick, onCategoryClick }) => {
    // Metrics
    const totalObjectives = objectives.length;
    const totalKRs = objectives.reduce((acc, obj) => acc + obj.keyResults.length, 0);

    const objWins = objectives.reduce((acc, obj) => acc + (obj.wins?.length || 0), 0);
    const krWins = objectives.reduce((acc, obj) => acc + obj.keyResults.reduce((kAcc, kr) => kAcc + (kr.winLog?.length || 0), 0), 0);
    const totalWins = objWins + krWins;

    const totalProgress = objectives.reduce((acc, obj) => {
         const metricsOnly = obj.keyResults.filter(kr => kr.type !== 'win_condition');
         const objProg = metricsOnly.length === 0 ? 0 : metricsOnly.reduce((kAcc, kr) => kAcc + (kr.target === 0 ? 0 : Math.min(100, (kr.current / kr.target) * 100)), 0) / metricsOnly.length;
         return acc + objProg;
    }, 0) / (objectives.length || 1);


    const categories = Array.from(new Set(objectives.map(o => o.category || 'Uncategorized')));
    const categoryStats = categories.map(cat => {
        const catObjs = objectives.filter(o => o.category === cat);
        const count = catObjs.length;

        // Collect all wins with their full data for sparkline
        const allWins: WinLog[] = catObjs.flatMap(o => [
            ...(o.wins || []),
            ...o.keyResults.flatMap(kr => kr.winLog || [])
        ]);
        const winsCount = allWins.length;

        // Calculate progress for this category (only metric KRs, not win_conditions)
        const catKRs = catObjs.flatMap(o => o.keyResults.filter(kr => kr.type !== 'win_condition'));
        const progress = catKRs.length === 0
            ? 0
            : catKRs.reduce((acc, kr) => acc + (kr.target === 0 ? 0 : Math.min(100, (kr.current / kr.target) * 100)), 0) / catKRs.length;

        return { cat, count, wins: winsCount, allWins, progress };
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {categoryStats.map(stat => (
                    <div
                        key={stat.cat}
                        onClick={() => onCategoryClick?.(stat.cat)}
                        className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                    >
                         <div className="flex items-center justify-between mb-3">
                             <div>
                                 <div className="text-sm font-bold text-white mb-0.5">{stat.cat}</div>
                                 <div className="text-xs text-zinc-500">{stat.count} Objectives</div>
                             </div>
                             <div className="flex flex-col items-end">
                                 <div className="text-lg font-bold text-zinc-200">{stat.wins}</div>
                                 <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Wins</div>
                             </div>
                         </div>
                         {/* Progress bar */}
                         <div className="mb-3">
                             <div className="flex items-center justify-between mb-1">
                                 <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Progress</span>
                                 <span className="text-[10px] font-mono text-zinc-400">{Math.round(stat.progress)}%</span>
                             </div>
                             <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                 <div
                                     className={`h-full transition-all ${stat.progress >= 100 ? 'bg-green-500' : 'bg-violet-500'}`}
                                     style={{ width: `${Math.min(100, stat.progress)}%` }}
                                 />
                             </div>
                         </div>
                         {/* Wins sparkline */}
                         <div className="flex items-center justify-between">
                             <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Wins this year</span>
                             <WinsSparkline wins={stat.allWins} />
                         </div>
                    </div>
                ))}
            </div>

            {/* Compact OKR Table View */}
            <h3 className="text-lg font-bold text-zinc-300 mb-4">All Objectives</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800 text-left">
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Objective</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-28">Category</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-32">Progress</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center w-16">KRs</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center w-16">Wins</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Company objectives first */}
                        {objectives
                            .filter(o => o.category === 'Company')
                            .map(obj => <ObjectiveRow key={obj.id} obj={obj} onClick={onObjectiveClick} />)}

                        {/* Then by other categories */}
                        {categories
                            .filter(cat => cat !== 'Company')
                            .sort()
                            .map(cat =>
                                objectives
                                    .filter(o => o.category === cat)
                                    .map(obj => <ObjectiveRow key={obj.id} obj={obj} onClick={onObjectiveClick} />)
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const ObjectiveRow: React.FC<{ obj: Objective; onClick?: (id: string) => void }> = ({ obj, onClick }) => {
    const metricsOnly = obj.keyResults.filter(kr => kr.type !== 'win_condition');
    const progress = metricsOnly.length === 0
        ? 0
        : metricsOnly.reduce((acc, kr) => acc + (kr.target === 0 ? 0 : Math.min(100, (kr.current / kr.target) * 100)), 0) / metricsOnly.length;

    const totalWins = (obj.wins?.length || 0) + obj.keyResults.reduce((acc, kr) => acc + (kr.winLog?.length || 0), 0);
    const isCompany = obj.category === 'Company';

    return (
        <tr
            className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors ${isCompany ? 'bg-violet-950/20' : ''}`}
            onClick={() => onClick?.(obj.id)}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {isCompany && <div className="w-1 h-4 bg-violet-500 rounded-full"></div>}
                    <span className={`text-sm ${isCompany ? 'font-medium text-white' : 'text-zinc-300'}`}>
                        {obj.title}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded ${isCompany ? 'bg-violet-900/50 text-violet-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {obj.category}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-violet-500'}`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </div>
                    <span className="text-xs font-mono text-zinc-500 w-8 text-right">{Math.round(progress)}%</span>
                </div>
            </td>
            <td className="px-4 py-3 text-center">
                <span className="text-xs font-mono text-zinc-400">{obj.keyResults.length}</span>
            </td>
            <td className="px-4 py-3 text-center">
                <span className={`text-xs font-mono ${totalWins > 0 ? 'text-yellow-500' : 'text-zinc-600'}`}>
                    {totalWins}
                </span>
            </td>
        </tr>
    );
}
