import React from 'react';
import { KeyResultType, Person } from '../../types';

export const ProgressBar = ({ progress, className = "" }: { progress: number; className?: string }) => (
  <div className={`h-2 w-full bg-zinc-800 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full bg-violet-500 transition-all duration-500 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

export const KRTypeBadge = ({ type }: { type: KeyResultType }) => {
    switch(type) {
        case 'leading':
            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Leading</span>;
        case 'lagging':
            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Lagging</span>;
        case 'win_condition':
            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20">Win Condition</span>;
        default:
            return null;
    }
}

export const Avatar: React.FC<{ person?: Person; size?: 'xs' | 'sm' | 'md' }> = ({ person, size = 'sm' }) => {
    if (!person) return null;
    const sizeClasses = {
        'xs': 'w-5 h-5 text-[9px]',
        'sm': 'w-6 h-6 text-[10px]',
        'md': 'w-8 h-8 text-xs'
    };
    return (
        <div
            className={`${sizeClasses[size]} rounded-full ${person.color} flex items-center justify-center text-white font-bold border border-zinc-900 shadow-sm shrink-0`}
            title={person.name}
        >
            {person.initials}
        </div>
    );
}
