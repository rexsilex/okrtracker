import React, { useState } from 'react';
import { Person, KeyResult, WinLog } from '../../types';
import { UsersIcon, CheckIcon, LinkIcon, TrashIcon } from '../icons';
import { Avatar } from './SharedComponents';

interface WinLoggerProps {
    onLog: (note: string, attributedTo: string[], linkedConditionId?: string) => void;
    people: Person[];
    placeholder?: string;
    buttonLabel?: string;
    icon?: React.ReactNode;
    winConditions?: KeyResult[];
}

export const WinLogger: React.FC<WinLoggerProps> = ({ onLog, people, placeholder, buttonLabel = "Log Win", icon, winConditions = [] }) => {
    const [note, setNote] = useState("");
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [isPeopleOpen, setIsPeopleOpen] = useState(false);
    const [selectedConditionId, setSelectedConditionId] = useState<string>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!note.trim()) return;
        onLog(note, selectedPeople, selectedConditionId || undefined);
        setNote("");
        setSelectedPeople([]);
        setSelectedConditionId("");
        setIsPeopleOpen(false);
    }

    const togglePerson = (id: string) => {
        if(selectedPeople.includes(id)) {
            setSelectedPeople(selectedPeople.filter(pid => pid !== id));
        } else {
            setSelectedPeople([...selectedPeople, id]);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 relative">
                <div className="flex gap-2 w-full">
                    <input
                        type="text"
                        placeholder={placeholder || "What did you achieve?"}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                    />
                     {/* Attribution Trigger */}
                     <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsPeopleOpen(!isPeopleOpen)}
                            className={`h-full px-2 rounded-lg border flex items-center gap-1 transition-colors ${selectedPeople.length > 0 ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                            title="Attribute to..."
                        >
                            <UsersIcon />
                            {selectedPeople.length > 0 && <span className="text-xs font-bold">{selectedPeople.length}</span>}
                        </button>

                        {isPeopleOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 p-2 grid gap-1">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold px-2 py-1">Who did this?</div>
                                {people.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => togglePerson(p.id)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm w-full text-left transition-colors ${selectedPeople.includes(p.id) ? 'bg-violet-500/20 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${selectedPeople.includes(p.id) ? p.color : 'bg-zinc-700'}`}></div>
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                     </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-violet-900/20 whitespace-nowrap"
                    >
                        {icon || <CheckIcon />} {buttonLabel}
                    </button>
                </div>

                {winConditions.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                         <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 shrink-0">
                             <LinkIcon /> Link to Condition:
                         </div>
                         <select
                            value={selectedConditionId}
                            onChange={(e) => setSelectedConditionId(e.target.value)}
                            className="bg-transparent text-xs text-zinc-300 flex-1 focus:outline-none focus:text-white cursor-pointer"
                         >
                             <option value="">General Objective Win</option>
                             {winConditions.map(wc => (
                                 <option key={wc.id} value={wc.id}>{wc.title}</option>
                             ))}
                         </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export const WinList = ({ wins, people, onDelete }: { wins: WinLog[], people: Person[], onDelete: (id: string) => void }) => {
    if (!wins || wins.length === 0) return null;
    return (
        <div className="space-y-2 mt-3">
             <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Recent Wins</label>
             <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {wins.map((win) => (
                    <div key={win.id} className="flex justify-between items-start text-sm bg-zinc-800/40 p-2.5 rounded border border-zinc-800 hover:border-zinc-700 transition-colors group">
                        <div className="flex-1 min-w-0 mr-2">
                            <span className="text-zinc-300 block break-words leading-snug">{win.note}</span>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-zinc-600 text-[10px] font-mono">{win.date}</span>
                                <div className="flex -space-x-1.5">
                                    {(win.attributedTo || []).map(pid => (
                                        <Avatar key={pid} person={people.find(p => p.id === pid)} size="xs" />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onDelete(win.id)}
                            className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
