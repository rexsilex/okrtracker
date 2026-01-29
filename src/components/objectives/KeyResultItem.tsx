import React, { useState } from 'react';
import { KeyResult, Person, WinLog, KeyResultType } from '../../types';
import { PlusIcon, MinusIcon, TrashIcon, TrophyIcon, EditIcon, SaveIcon, XIcon } from '../icons';
import { KRTypeBadge } from '../ui/SharedComponents';
import { WinLogger, WinList } from '../ui/WinLogger';

interface KeyResultItemProps {
  kr: KeyResult;
  onUpdate: (updatedKr: KeyResult) => void;
  onDelete: () => void;
  people: Person[];
  onLogWin?: (krId: string, note: string, attributedTo: string[]) => void;
  onDeleteWin?: (winId: string) => void;
}

export const KeyResultItem: React.FC<KeyResultItemProps> = ({
  kr,
  onUpdate,
  onDelete,
  people,
  onLogWin,
  onDeleteWin,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedTitle, setEditedTitle] = useState(kr.title);
  const [editedUnit, setEditedUnit] = useState(kr.unit);
  const [editedType, setEditedType] = useState<KeyResultType>(kr.type);

  // Local state for input values to prevent premature updates
  const [localCurrent, setLocalCurrent] = useState(kr.current.toString());
  const [localTarget, setLocalTarget] = useState(kr.target.toString());

  const progress = kr.target === 0 ? 0 : (kr.current / kr.target) * 100;
  const isWinCondition = kr.type === 'win_condition';

  // Sync local state when kr values change externally (e.g., from slider or buttons)
  React.useEffect(() => {
    setLocalCurrent(kr.current.toString());
  }, [kr.current]);

  React.useEffect(() => {
    setLocalTarget(kr.target.toString());
  }, [kr.target]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onUpdate({ ...kr, current: val });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCurrent(e.target.value);
  };

  const handleInputBlur = () => {
    const val = Number(localCurrent);
    if (!isNaN(val) && val !== kr.current) {
      onUpdate({ ...kr, current: val });
    } else {
      setLocalCurrent(kr.current.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTarget(e.target.value);
  };

  const handleTargetBlur = () => {
    const val = Number(localTarget);
    if (!isNaN(val) && val !== kr.target) {
      onUpdate({ ...kr, target: val });
    } else {
      setLocalTarget(kr.target.toString());
    }
  };

  const handleTargetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
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
      if (onLogWin) {
          onLogWin(kr.id, note, attributedTo);
      }
  }

  const handleDeleteWin = (winId: string) => {
      if (onDeleteWin) {
          onDeleteWin(winId);
      }
  }

  const handleSwapType = () => {
    if (kr.type === 'leading' || kr.type === 'lagging') {
      const newType = kr.type === 'leading' ? 'lagging' : 'leading';
      onUpdate({ ...kr, type: newType });
    }
  }

  const handleStartEditDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(kr.title);
    setEditedUnit(kr.unit);
    setEditedType(kr.type);
    setIsEditingDetails(true);
  };

  const handleSaveDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim()) {
      const updates: Partial<KeyResult> = {
        title: editedTitle.trim(),
        type: editedType
      };

      // Handle conversion to/from win_condition
      if (editedType === 'win_condition' && kr.type !== 'win_condition') {
        // Converting TO win_condition
        updates.unit = 'wins';
        updates.target = 999999;
        updates.current = kr.winLog?.length || 0;
      } else if (editedType !== 'win_condition' && kr.type === 'win_condition') {
        // Converting FROM win_condition to metric
        updates.unit = editedUnit.trim() || '%';
        updates.target = 100;
        updates.current = 0;
      } else {
        updates.unit = editedUnit.trim();
      }

      onUpdate({ ...kr, ...updates });
    }
    setIsEditingDetails(false);
  };

  const handleConvertToWinCondition = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...kr,
      type: 'win_condition',
      unit: 'wins',
      target: 999999,
      current: kr.winLog?.length || 0
    });
  };

  const handleCancelEditDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(kr.title);
    setEditedUnit(kr.unit);
    setEditedType(kr.type);
    setIsEditingDetails(false);
  };

  return (
    <div className={`group border border-zinc-800/50 bg-zinc-900/30 rounded-xl transition-all ${isExpanded ? 'ring-1 ring-violet-500/50 bg-zinc-900' : 'hover:bg-zinc-900'}`}>
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1.5 flex-1 pr-4">
              <div className="flex items-center gap-2">
                 <KRTypeBadge type={kr.type} onSwap={handleSwapType} />
              </div>
              {isEditingDetails ? (
                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="font-medium text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500/50"
                    placeholder="Key result title..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDetails(e as any);
                      if (e.key === 'Escape') handleCancelEditDetails(e as any);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={editedType}
                      onChange={(e) => setEditedType(e.target.value as KeyResultType)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="leading">Leading</option>
                      <option value="lagging">Lagging</option>
                      <option value="win_condition">Win Condition</option>
                    </select>
                    {editedType !== 'win_condition' && (
                      <input
                        type="text"
                        value={editedUnit}
                        onChange={(e) => setEditedUnit(e.target.value)}
                        className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50"
                        placeholder="Unit"
                      />
                    )}
                    <button
                      onClick={handleSaveDetails}
                      className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <SaveIcon /> Save
                    </button>
                    <button
                      onClick={handleCancelEditDetails}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <XIcon /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <span className="font-medium text-zinc-200 flex items-start gap-2 leading-tight group/title">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${progress >= 100 ? (isWinCondition ? 'bg-pink-500' : 'bg-violet-500') : 'bg-violet-500'}`}></div>
                  {kr.title}
                  <button
                    onClick={handleStartEditDetails}
                    className="text-zinc-600 hover:text-violet-400 opacity-0 group-hover/title:opacity-100 transition-opacity ml-1"
                    title="Edit key result"
                  >
                    <EditIcon />
                  </button>
                </span>
              )}
          </div>
          <span className="text-xs font-mono text-zinc-500 mt-1 whitespace-nowrap">
            {isWinCondition ? `${kr.current} ${kr.unit}` : `${kr.current} / ${kr.target} ${kr.unit}`}
          </span>
        </div>
        {!isWinCondition && !isEditingDetails && (
          <div className="flex items-center gap-3">
               <div className={`h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden`}>
                  <div
                  className={`h-full transition-all duration-500 ease-out bg-violet-500`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
              </div>
              <span className="text-xs font-bold text-zinc-500 w-8 text-right">{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-1 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-5">
            <div className="flex items-center justify-between">
               <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                   {isWinCondition ? 'Log Progress' : 'Update Metrics'}
               </label>
               <div className="flex items-center gap-2">
                 {!isWinCondition && (
                   <button
                    onClick={handleConvertToWinCondition}
                    className="text-zinc-600 hover:text-pink-400 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800"
                    title="Convert to win condition"
                   >
                     <TrophyIcon /> Make Win Condition
                   </button>
                 )}
                 <button
                  onClick={handleStartEditDetails}
                  className="text-zinc-600 hover:text-violet-400 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800"
                 >
                   <EditIcon /> Edit
                 </button>
                 <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800"
                 >
                   <TrashIcon /> Delete
                 </button>
               </div>
            </div>

            {isWinCondition ? (
                <div className="flex flex-col gap-4">
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
                                    <input
                                        type="number"
                                        value={localCurrent}
                                        onChange={handleInputChange}
                                        onBlur={handleInputBlur}
                                        onKeyDown={handleInputKeyDown}
                                        className="w-full bg-zinc-950 border border-zinc-700 text-white text-center text-xl font-mono p-1.5 rounded-lg outline-none focus:border-violet-500/50"
                                    />
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
                                <input
                                    type="number"
                                    value={localTarget}
                                    onChange={handleTargetChange}
                                    onBlur={handleTargetBlur}
                                    onKeyDown={handleTargetKeyDown}
                                    className="w-full bg-transparent text-white p-1 outline-none font-mono text-sm"
                                />
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
