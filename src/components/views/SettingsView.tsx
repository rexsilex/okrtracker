import React, { useState } from 'react';
import { Person, Category } from '../../types';
import { TrashIcon, SunIcon, MoonIcon } from '../icons';
import { Avatar } from '../ui/SharedComponents';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsViewProps {
    people: Person[];
    onAddPerson: (name: string, initials: string, color: string) => Promise<Person | undefined>;
    onDeletePerson: (id: string) => Promise<void>;
    categories: Category[];
    onAddCategory: (name: string) => Promise<Category | undefined>;
    onDeleteCategory: (id: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    people,
    onAddPerson,
    onDeletePerson,
    categories,
    onAddCategory,
    onDeleteCategory
}) => {
    const [newName, setNewName] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const { theme, setTheme } = useTheme();

    const handleAddPerson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const initials = newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        await onAddPerson(newName, initials, color);
        setNewName("");
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        await onAddCategory(newCategoryName);
        setNewCategoryName("");
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Settings</h1>

            {/* Appearance Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Appearance</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                    Choose between light and dark mode.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                            theme === 'light'
                                ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-500 text-violet-700 dark:text-violet-300'
                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                    >
                        <SunIcon />
                        <span className="font-medium">Light</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                            theme === 'dark'
                                ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-500 text-violet-700 dark:text-violet-300'
                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                    >
                        <MoonIcon />
                        <span className="font-medium">Dark</span>
                    </button>
                </div>
            </div>

            {/* Team Members Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Team Members</h2>
                <p className="text-sm text-zinc-500 mb-4">
                    Add team members to attribute wins and track contributions.
                </p>

                <div className="space-y-2 mb-4">
                    {people.map(person => (
                        <div key={person.id} className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                                <Avatar person={person} />
                                <span className="text-zinc-800 dark:text-zinc-200">{person.name}</span>
                            </div>
                            <button
                                onClick={() => onDeletePerson(person.id)}
                                className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 transition-colors"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    {people.length === 0 && (
                        <p className="text-zinc-500 text-sm py-4 text-center">No team members yet</p>
                    )}
                </div>

                <form onSubmit={handleAddPerson} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add new team member..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-violet-500"
                    />
                    <button
                        type="submit"
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Add
                    </button>
                </form>
            </div>

            {/* Departments Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Departments</h2>
                <p className="text-sm text-zinc-500 mb-4">
                    Organize your OKRs and Goals by department or team.
                </p>

                <div className="space-y-2 mb-4">
                    {categories.map(category => (
                        <div key={category.id} className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <span className="text-zinc-800 dark:text-zinc-200">{category.name}</span>
                            <button
                                onClick={() => onDeleteCategory(category.id)}
                                className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 transition-colors"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <p className="text-zinc-500 text-sm py-4 text-center">No departments yet</p>
                    )}
                </div>

                <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add new department..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-violet-500"
                    />
                    <button
                        type="submit"
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Add
                    </button>
                </form>
            </div>
        </div>
    );
};
