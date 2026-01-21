import React, { useState } from 'react';
import { KeyResult, Person, WinLog } from '../../types';
import { PlusIcon, MinusIcon, TrashIcon, TrophyIcon } from '../icons';
import { KRTypeBadge } from '../ui/SharedComponents';
import { WinLogger, WinList } from '../ui/WinLogger';

interface KeyResultItemProps {
  kr: KeyResult;
  onUpdate: (updatedKr: KeyResult) => void;
  onDelete: () => void;
  people: Person[];
}

export const KeyResultItem: React.FC<KeyResultItemProps> = ({
  kr,
  onUpdate,
  onDelete,
  people,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const progress = kr.target === 0 ? 0 : (kr.current / kr.target) * 100;
  const isWinCondition = kr.type === 'win_condition';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onUpdate({ ...kr, current: val });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onUpdate({ ...kr, current: val });
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      onUpdate({ ...kr, target: val });
  };

  const handleIncrement = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUpdate({ ...kr, current: kr.current + 1 });
  };

  const handleDecrement = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUpdate({ ...kr, current: Math.max(0, kr.current - 1) });
  };

  const handleLogWin = (note: string, attributedTo: string[]) => {
      const newWin: WinLog = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString(),
          note,
          attributedTo
      };
      const updatedLog = [newWin, ...(kr.winLog || [])];
      onUpdate({ ...kr, winLog: updatedLog, current: updatedLog.length });
  }

  const handleDeleteWin = (winId: string) => {
      const updatedLog = (kr.winLog || []).filter(w => w.id !== winId);
      onUpdate({ ...kr, winLog: updatedLog, current: updatedLog.length });
  }

  return (
    <div className={`group border border-zinc-800/50 bg-zinc-900/30 rounded-xl transition-all ${isEditing ? 'ring-1 ring-violet-500/50 bg-zinc-900' : 'hover:bg-zinc-900'}`}>
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setIsEditing(!isEditing)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1.5 flex-1 pr-4">
              <div className="flex items-center gap-2">
                 <KRTypeBadge type={kr.type} />
              </div>
              <span className="font-medium text-zinc-200 flex items-start gap-2 leading-tight">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${progress >= 100 ? (isWinCondition ? 'bg-pink-500' : 'bg-violet-500') : 'bg-violet-500'}`}></div>
                {kr.title}
              </span>
          </div>
          <span className="text-xs font-mono text-zinc-500 mt-1 whitespace-nowrap">
            {kr.current} / {kr.target} {kr.unit}
          </span>
        </div>
        <div className="flex items-center gap-3">
             <div className={`h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden`}>
                <div
                className={`h-full transition-all duration-500 ease-out ${isWinCondition ? 'bg-pink-500' : 'bg-violet-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
            <span className="text-xs font-bold text-zinc-500 w-8 text-right">{Math.round(progress)}%</span>
        </div>
      </div>

      {isEditing && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-1 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-5">
            <div className="flex items-center justify-between">
               <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                   {isWinCondition ? 'Log Progress' : 'Update Metrics'}
               </label>
               <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-zinc-600 hover:text-red-400 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800"
               >
                 <TrashIcon /> Delete
               </button>
            </div>

            {isWinCondition ? (
                <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-4">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target Wins</label>
                        <input
                            type="number"
                            value={kr.target}
                            onChange={handleTargetChange}
                            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 w-20 text-white outline-none font-mono text-sm text-center focus:border-violet-500/50"
                        />
                     </div>

                    <WinLogger
                        onLog={handleLogWin}
                        people={people}
                        placeholder="Log a win for this condition..."
                        buttonLabel="Log Win"
                        icon={<TrophyIcon />}
                    />

                    <WinList wins={kr.winLog || []} people={people} onDelete={handleDeleteWin} />
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex items-end gap-6 flex-wrap">
                        {/* Value Controls */}
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">Current Value</label>
                            <div className="flex items-center gap-3">
                                <button onClick={handleDecrement} className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-zinc-700/50"><MinusIcon /></button>
                                <div className="w-24">
                                    <input type="number" value={kr.current} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-700 text-white text-center text-xl font-mono p-1.5 rounded-lg outline-none focus:border-violet-500/50" />
                                </div>
                                <button onClick={handleIncrement} className="w-12 h-10 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-900/20 active:scale-95"><PlusIcon /></button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-8 w-px bg-zinc-800 hidden sm:block mx-2"></div>

                        {/* Target Control */}
                        <div>
                             <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">Goal</label>
                             <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-lg px-3 h-10 w-32">
                                <input type="number" value={kr.target} onChange={handleTargetChange} className="w-full bg-transparent text-white p-1 outline-none font-mono text-sm" />
                                <span className="text-zinc-500 text-xs select-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[40px]">{kr.unit}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                         <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-2 block">Slide to adjust</label>
                         <input type="range" min="0" max={Math.max(kr.target, kr.current * 1.1)} value={kr.current} onChange={handleSliderChange} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
