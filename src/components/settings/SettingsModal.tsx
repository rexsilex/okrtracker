import React, { useState } from 'react';
import { Person } from '../../types';
import { Modal } from '../ui/Modal';
import { CloseIcon, TrashIcon } from '../icons';
import { Avatar } from '../ui/SharedComponents';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    people: Person[];
    setPeople: (p: Person[]) => void;
    onAddPerson?: (name: string, initials: string, color: string) => Promise<Person | undefined>;
    onDeletePerson?: (id: string) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, people, setPeople, onAddPerson, onDeletePerson }) => {
    const [newName, setNewName] = useState("");

    const handleAddPerson = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newName.trim()) return;

        const initials = newName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        if (onAddPerson) {
            await onAddPerson(newName, initials, color);
        } else {
            const newPerson: Person = {
                id: Date.now().toString(),
                name: newName,
                initials,
                color
            };
            setPeople([...people, newPerson]);
        }
        setNewName("");
    };

    const handleDelete = async (id: string) => {
        if (onDeletePerson) {
            await onDeletePerson(id);
        } else {
            setPeople(people.filter(p => p.id !== id));
        }
    };

    if(!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
             <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg p-6 m-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Team Settings</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                 </div>

                 <div className="mb-6">
                     <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Team Members</h3>
                     <div className="space-y-2 mb-4">
                         {people.map(person => (
                             <div key={person.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                 <div className="flex items-center gap-3">
                                     <Avatar person={person} />
                                     <span className="text-zinc-200">{person.name}</span>
                                 </div>
                                 <button onClick={() => handleDelete(person.id)} className="text-zinc-600 hover:text-red-500"><TrashIcon /></button>
                             </div>
                         ))}
                     </div>

                     <form onSubmit={handleAddPerson} className="flex gap-2">
                         <input
                            type="text"
                            placeholder="Add new team member..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                        />
                         <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-zinc-700">Add</button>
                     </form>
                 </div>
             </div>
        </Modal>
    );
};
