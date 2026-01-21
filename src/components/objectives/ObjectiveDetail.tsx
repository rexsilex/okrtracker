import React, { useState, useEffect } from 'react';
import { Objective, Person, KeyResult, KeyResultType, WinLog } from '../../types';
import { CloseIcon, ChevronLeft, ChevronRight, TrophyIcon, TrashIcon, PlusIcon, CheckIcon } from '../icons';
import { ProgressBar } from '../ui/SharedComponents';
import { WinLogger, WinList } from '../ui/WinLogger';
import { KeyResultItem } from './KeyResultItem';

interface ObjectiveDetailProps {
    objective: Objective;
    people: Person[];
    onUpdate: (updatedObjective: Objective) => void;
    onDelete: () => void;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}

export const ObjectiveDetail: React.FC<ObjectiveDetailProps> = ({
    objective, people, onUpdate, onDelete, onClose, onNext, onPrev, hasPrev, hasNext
}) => {
    const [showAddKr, setShowAddKr] = useState(false);
    const [activeKrTab, setActiveKrTab] = useState<'metrics' | 'conditions' | 'all'>('metrics');

    // New KR Form State
    const [newKrTitle, setNewKrTitle] = useState("");
    const [newKrTarget, setNewKrTarget] = useState(100);
    const [newKrUnit, setNewKrUnit] = useState("%");
    const [newKrType, setNewKrType] = useState<KeyResultType>('standard');

    // Handle Keyboard Nav
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && hasNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, hasNext, hasPrev, onClose]);

    // Calculate progress
    const totalProgress = objective.keyResults.length === 0
      ? 0
      : objective.keyResults.reduce((acc, kr) => {
          return acc + (kr.target === 0 ? 0 : Math.min(100, (kr.current / kr.target) * 100));
        }, 0) / objective.keyResults.length;

    // Calculate total wins for header
    const krWins = objective.keyResults.reduce((acc, kr) => acc + (kr.winLog?.length || 0), 0);
    const objWins = objective.wins?.length || 0;
    const totalWins = krWins + objWins;

    // Direct Objective Win Handlers
    const handleAddObjectiveWin = (note: string, attributedTo: string[], linkedConditionId?: string) => {
        const newWin: WinLog = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString(),
            note,
            attributedTo
        };

        // If tied to a specific win condition, update that KR instead of the general objective wins
        if (linkedConditionId) {
            const updatedKrs = objective.keyResults.map(kr => {
                if (kr.id === linkedConditionId) {
                    const updatedWinLog = [newWin, ...(kr.winLog || [])];
                    return {
                        ...kr,
                        winLog: updatedWinLog,
                        current: updatedWinLog.length // Auto-increment current progress for win conditions
                    };
                }
                return kr;
            });
            onUpdate({ ...objective, keyResults: updatedKrs });
        } else {
             // Otherwise, add to general objective wins
             onUpdate({ ...objective, wins: [newWin, ...(objective.wins || [])] });
        }
    };

    const handleDeleteObjectiveWin = (winId: string) => {
        onUpdate({ ...objective, wins: (objective.wins || []).filter(w => w.id !== winId) });
    };

    // KR Handlers
    const handleAddKeyResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKrTitle.trim()) return;

        const newKr: KeyResult = {
            id: Date.now().toString(),
            title: newKrTitle,
            type: newKrType,
            current: 0,
            target: newKrTarget,
            unit: newKrUnit,
            winLog: newKrType === 'win_condition' ? [] : undefined
        };

        onUpdate({
            ...objective,
            keyResults: [...objective.keyResults, newKr],
        });

        // Reset form
        setNewKrTitle("");
        setNewKrTarget(100);
        setNewKrType('standard');
        setShowAddKr(false);
    };

    const updateKeyResult = (updatedKr: KeyResult) => {
        const updatedKrs = objective.keyResults.map((kr) =>
        kr.id === updatedKr.id ? updatedKr : kr
        );
        onUpdate({ ...objective, keyResults: updatedKrs });
    };

    const deleteKeyResult = (krId: string) => {
        const updatedKrs = objective.keyResults.filter((kr) => kr.id !== krId);
        onUpdate({ ...objective, keyResults: updatedKrs });
    };

    // Derived Lists
    const winConditions = objective.keyResults.filter(kr => kr.type === 'win_condition');
    const filteredKRs = objective.keyResults.filter(kr => {
        if (activeKrTab === 'all') return true;
        if (activeKrTab === 'conditions') return kr.type === 'win_condition';
        return kr.type !== 'win_condition';
    });

    // Handle "Add" button click logic to preset types
    const onStartAdd = () => {
        setShowAddKr(true);
        if (activeKrTab === 'conditions') {
            setNewKrType('win_condition');
            setNewKrTarget(1);
            setNewKrUnit('wins');
        } else {
            setNewKrType('standard');
            setNewKrTarget(100);
            setNewKrUnit('%');
        }
    };

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full h-full flex flex-col overflow-hidden shadow-2xl">
            {/* Header / Nav Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                        <CloseIcon />
                    </button>
                    <div className="h-6 w-px bg-zinc-800"></div>
                    <div className="flex gap-2">
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className={`p-2 rounded-lg transition-colors ${hasPrev ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'text-zinc-800 cursor-not-allowed'}`}
                        >
                            <ChevronLeft />
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className={`p-2 rounded-lg transition-colors ${hasNext ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'text-zinc-800 cursor-not-allowed'}`}
                        >
                            <ChevronRight />
                        </button>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium hidden sm:inline-block">Use Arrow Keys to Navigate</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-zinc-500 uppercase font-bold">Total Wins</span>
                        <span className="text-yellow-500 font-bold flex items-center gap-1">
                             <TrophyIcon /> {totalWins}
                        </span>
                    </div>
                    <button onClick={onDelete} className="text-zinc-600 hover:text-red-500 transition-colors p-2" title="Delete Objective">
                        <TrashIcon />
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* LEFT COLUMN: Context & Direct Wins */}
                <div className="lg:w-1/3 lg:border-r border-zinc-800 flex flex-col bg-zinc-900/10 overflow-y-auto">
                    <div className="p-8">
                        {/* Meta Tags */}
                        <div className="flex gap-2 mb-4">
                            {objective.category && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                    {objective.category}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">{objective.title}</h2>

                        {/* Progress */}
                         <div className="mb-8 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Overall Progress</span>
                                <span className="text-2xl font-bold font-mono text-white">{Math.round(totalProgress)}%</span>
                            </div>
                            <ProgressBar progress={totalProgress} className="h-3" />
                        </div>

                        {/* Description */}
                        {objective.description && (
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">{objective.description}</p>
                            </div>
                        )}

                        {/* Initiatives */}
                        {objective.initiatives && objective.initiatives.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Initiatives</h4>
                                <ul className="space-y-2">
                                    {objective.initiatives.map((init, i) => (
                                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5 p-2 rounded hover:bg-zinc-800/30 transition-colors">
                                            <span className="text-violet-500 mt-1 shrink-0"><CheckIcon /></span>
                                            {init}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Direct Wins Section */}
                        <div className="border-t border-zinc-800 pt-6">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                                <span className="text-yellow-500"><TrophyIcon /></span>
                                Objective Wins
                            </h4>
                            <div className="mb-4">
                                <WinLogger
                                    onLog={handleAddObjectiveWin}
                                    people={people}
                                    placeholder="Add a win directly to this objective..."
                                    buttonLabel="Add Win"
                                    winConditions={winConditions}
                                />
                            </div>
                            <WinList wins={objective.wins || []} people={people} onDelete={handleDeleteObjectiveWin} />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Key Results */}
                <div className="lg:w-2/3 flex flex-col bg-zinc-950 overflow-y-auto">
                    <div className="p-8">
                         <div className="flex items-center justify-between mb-6 sticky top-0 bg-zinc-950 z-10 py-2 border-b border-zinc-900 backdrop-blur-sm bg-zinc-950/90">
                            <div className="flex items-center gap-6">
                                <h3 className="text-lg font-semibold text-zinc-200">Key Results</h3>
                                {/* Tabs */}
                                <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <button
                                        onClick={() => setActiveKrTab('metrics')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeKrTab === 'metrics' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Metrics
                                    </button>
                                     <button
                                        onClick={() => setActiveKrTab('conditions')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeKrTab === 'conditions' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Win Conditions
                                    </button>
                                    <button
                                        onClick={() => setActiveKrTab('all')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeKrTab === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        All
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={onStartAdd}
                                className="text-sm bg-zinc-900 hover:bg-zinc-800 text-violet-400 font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border border-zinc-800 shadow-sm"
                            >
                                <PlusIcon /> {activeKrTab === 'conditions' ? 'Add Condition' : 'Add Metric'}
                            </button>
                        </div>

                        {showAddKr && (
                            <form onSubmit={handleAddKeyResult} className="mb-8 p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl animate-in slide-in-from-top-2">
                                <div className="grid gap-6">
                                    <div>
                                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-2">
                                            {activeKrTab === 'conditions' || newKrType === 'win_condition' ? 'Condition Title' : 'Metric Title'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={activeKrTab === 'conditions' || newKrType === 'win_condition' ? "e.g., Secure 3 reference customers" : "What are we measuring?"}
                                            value={newKrTitle}
                                            onChange={(e) => setNewKrTitle(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-2">Type</label>
                                            <select
                                                value={newKrType}
                                                onChange={(e) => setNewKrType(e.target.value as KeyResultType)}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                                            >
                                                <option value="standard">Standard Metric</option>
                                                <option value="leading">Leading Indicator</option>
                                                <option value="lagging">Lagging Indicator</option>
                                                <option value="win_condition">Win Condition</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-2">Target Value</label>
                                            <input
                                                type="number"
                                                value={newKrTarget}
                                                onChange={(e) => setNewKrTarget(Number(e.target.value))}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-2">Unit</label>
                                            <input
                                                type="text"
                                                value={newKrUnit}
                                                onChange={(e) => setNewKrUnit(e.target.value)}
                                                placeholder="%"
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddKr(false)}
                                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-violet-900/20"
                                        >
                                            Create {activeKrTab === 'conditions' || newKrType === 'win_condition' ? 'Condition' : 'Metric'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="space-y-3 pb-8">
                            {objective.keyResults.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-900/20">
                                    <span className="text-zinc-600 text-sm">No key results yet. Add metrics or win conditions.</span>
                                </div>
                            ) : filteredKRs.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-900/20">
                                    <span className="text-zinc-600 text-sm">No {activeKrTab === 'metrics' ? 'metrics' : 'win conditions'} found for this objective.</span>
                                </div>
                            ) : (
                                filteredKRs.map((kr) => (
                                    <KeyResultItem
                                        key={kr.id}
                                        kr={kr}
                                        onUpdate={updateKeyResult}
                                        onDelete={() => deleteKeyResult(kr.id)}
                                        people={people}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
