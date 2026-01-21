import React from 'react';
import { Objective, Person } from '../../types';
import { TrophyIcon, InfoIcon } from '../icons';
import { ProgressBar, Avatar } from '../ui/SharedComponents';

interface ObjectiveCardProps {
  objective: Objective;
  onClick: () => void;
  people: Person[];
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  onClick,
  people,
}) => {
  // Calculate aggregated progress
  const totalProgress = objective.keyResults.length === 0
    ? 0
    : objective.keyResults.reduce((acc, kr) => {
        return acc + (kr.target === 0 ? 0 : Math.min(100, (kr.current / kr.target) * 100));
      }, 0) / objective.keyResults.length;

  const isCompany = objective.category === "Company";

  // Calculate total wins (Objective Wins + KR Wins)
  const krWins = objective.keyResults.reduce((acc, kr) => acc + (kr.winLog?.length || 0), 0);
  const objWins = objective.wins?.length || 0;
  const totalWins = krWins + objWins;

  // Calculate contributors
  const contributorIds = new Set<string>();
  objective.wins?.forEach(w => w.attributedTo?.forEach(pid => contributorIds.add(pid)));
  objective.keyResults.forEach(kr =>
      kr.winLog?.forEach(w => w.attributedTo?.forEach(pid => contributorIds.add(pid)))
  );
  const contributors = Array.from(contributorIds).map(id => people.find(p => p.id === id)).filter(Boolean) as Person[];

  return (
    <div
        onClick={onClick}
        className={`bg-zinc-900 border ${isCompany ? 'border-violet-900/50 shadow-violet-900/10' : 'border-zinc-800'} rounded-xl overflow-hidden mb-4 shadow-sm transition-all hover:border-zinc-600 cursor-pointer group relative`}
    >
      {isCompany && (
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-violet-700"></div>
      )}
      <div className="p-5 pl-7">
        <div className="flex justify-between items-start mb-3">
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                    {objective.category && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCompany ? 'bg-violet-900/30 text-violet-400 border border-violet-800/50' : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'}`}>
                            {objective.category}
                        </span>
                    )}
                </div>
                <div className="flex items-start justify-between gap-4">
                     <h3 className="text-lg font-medium text-zinc-100 leading-snug group-hover:text-white transition-colors flex-1">
                        {objective.title}
                    </h3>
                    {objective.description && (
                        <div className="relative group/info shrink-0">
                            <div className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors cursor-help">
                                <InfoIcon />
                            </div>
                            <div className="absolute right-0 top-6 w-64 p-3 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl text-xs text-zinc-400 z-20 hidden group-hover/info:block animate-in fade-in zoom-in-95 pointer-events-none">
                                {objective.description}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Right Stats */}
            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-bold border border-zinc-700/50">
                     <TrophyIcon /> {totalWins}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
             <div className="flex-1">
                <ProgressBar progress={totalProgress} className="h-1.5" />
             </div>
             <span className={`text-xs font-bold font-mono ${totalProgress >= 100 ? 'text-violet-400' : 'text-zinc-500'}`}>
                {Math.round(totalProgress)}%
             </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
             <div className="text-xs text-zinc-500">
                {objective.keyResults.length} Key Results
             </div>

             {/* Contributors */}
             {contributors.length > 0 && (
                 <div className="flex -space-x-1.5">
                     {contributors.slice(0, 5).map(p => (
                         <Avatar key={p.id} person={p} size="xs" />
                     ))}
                     {contributors.length > 5 && (
                         <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-900 text-[8px] flex items-center justify-center text-zinc-400 font-bold">
                             +{contributors.length - 5}
                         </div>
                     )}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};
