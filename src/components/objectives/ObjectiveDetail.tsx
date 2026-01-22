import React, { useState, useEffect } from 'react';
import { Objective, Person, KeyResult, KeyResultType, WinLog } from '../../types';
import { CloseIcon, ChevronLeft, ChevronRight, TrophyIcon, TrashIcon, PlusIcon, CheckIcon, EditIcon, SaveIcon, XIcon, LinkIcon, GripVerticalIcon } from '../icons';
import { ProgressBar } from '../ui/SharedComponents';
import { WinLogger, WinList } from '../ui/WinLogger';
import { KeyResultItem } from './KeyResultItem';
import { ConfirmModal } from '../ui/ConfirmModal';
import { WinsDrawer } from '../ui/WinsDrawer';
import * as api from '../../lib/api';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable wrapper for KeyResultItem
interface SortableKeyResultProps {
    kr: KeyResult;
    onUpdate: (updatedKr: KeyResult) => void;
    onDelete: () => void;
    people: Person[];
    onLogWin?: (krId: string, note: string, attributedTo: string[]) => void;
    onDeleteWin?: (winId: string) => void;
}

const SortableKeyResult: React.FC<SortableKeyResultProps> = ({ kr, onUpdate, onDelete, people, onLogWin, onDeleteWin }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: kr.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="relative">
            <div
                {...listeners}
                className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing z-10"
            >
                <GripVerticalIcon />
            </div>
            <div className="pl-8">
                <KeyResultItem
                    kr={kr}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    people={people}
                    onLogWin={onLogWin}
                    onDeleteWin={onDeleteWin}
                />
            </div>
        </div>
    );
};

// Sortable wrapper for Initiative items
interface SortableInitiativeProps {
    id: string;
    index: number;
    text: string;
    url: string;
    onRemove: () => void;
}

const SortableInitiative: React.FC<SortableInitiativeProps> = ({ id, index, text, url, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li ref={setNodeRef} style={style} {...attributes} className="text-sm text-zinc-300 flex items-start gap-2.5 p-2 rounded bg-zinc-800/30 group">
            <div
                {...listeners}
                className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing mt-0.5"
            >
                <GripVerticalIcon />
            </div>
            <span className="text-violet-500 mt-1 shrink-0"><CheckIcon /></span>
            <div className="flex-1">
                <div>{text}</div>
                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <LinkIcon /> {url}
                    </a>
                )}
            </div>
            <button
                onClick={onRemove}
                className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <XIcon />
            </button>
        </li>
    );
};

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
    const [activeKrTab, setActiveKrTab] = useState<'metrics' | 'conditions' | 'all'>('all');
    const [showWinsDrawer, setShowWinsDrawer] = useState(false);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // New KR Form State
    const [newKrTitle, setNewKrTitle] = useState("");
    const [newKrTarget, setNewKrTarget] = useState(100);
    const [newKrUnit, setNewKrUnit] = useState("%");
    const [newKrType, setNewKrType] = useState<KeyResultType>('leading');

    // Inline Editing State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(objective.title);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState(objective.description || '');
    const [isEditingInitiatives, setIsEditingInitiatives] = useState(false);
    const [editedInitiatives, setEditedInitiatives] = useState<string[]>(objective.initiatives || []);
    const [newInitiative, setNewInitiative] = useState('');
    const [newInitiativeUrl, setNewInitiativeUrl] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    // Helper functions to parse initiative format: "text|||url"
    const parseInitiative = (init: string) => {
        const parts = init.split('|||');
        return { text: parts[0], url: parts[1] || '' };
    };

    const formatInitiative = (text: string, url: string) => {
        return url ? `${text}|||${url}` : text;
    };

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

    // Calculate progress (excluding win conditions since they don't have targets)
    const metricsOnly = objective.keyResults.filter(kr => kr.type !== 'win_condition');
    const totalProgress = metricsOnly.length === 0
      ? 0
      : metricsOnly.reduce((acc, kr) => {
          return acc + (kr.target === 0 ? 0 : Math.min(100, (kr.current / kr.target) * 100));
        }, 0) / metricsOnly.length;

    // Calculate total wins for header
    const krWins = objective.keyResults.reduce((acc, kr) => acc + (kr.winLog?.length || 0), 0);
    const objWins = objective.wins?.length || 0;
    const totalWins = krWins + objWins;

    // Direct Objective Win Handlers
    const handleAddObjectiveWin = async (note: string, attributedTo: string[], linkedConditionId?: string) => {
        try {
            // Create the win log in the database
            await api.createWinLog(
                note,
                attributedTo,
                linkedConditionId ? undefined : objective.id,
                linkedConditionId
            );

            // If linked to a win condition, update its current count
            if (linkedConditionId) {
                const kr = objective.keyResults.find(k => k.id === linkedConditionId);
                if (kr) {
                    const newCount = (kr.winLog?.length || 0) + 1;
                    await api.updateKeyResultProgress(linkedConditionId, newCount);
                }
            }

            // Refresh the full objective with details
            const refreshed = await api.fetchObjectiveWithDetails(objective.id);
            onUpdate(refreshed);
        } catch (error) {
            console.error('Error adding win:', error);
        }
    };

    const handleDeleteObjectiveWin = (winId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Win',
            message: 'Are you sure you want to delete this win? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.deleteWinLog(winId);
                    const refreshed = await api.fetchObjectiveWithDetails(objective.id);
                    onUpdate(refreshed);
                } catch (error) {
                    console.error('Error deleting win:', error);
                }
            }
        });
    };

    // KR Handlers
    const handleAddKeyResult = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKrTitle.trim()) return;

        try {
            await api.createKeyResult(objective.id, {
                title: newKrTitle,
                type: newKrType,
                current: 0,
                target: newKrTarget,
                unit: newKrUnit,
                winLog: newKrType === 'win_condition' ? [] : undefined
            });

            // Refresh the full objective with details
            const refreshed = await api.fetchObjectiveWithDetails(objective.id);
            onUpdate(refreshed);

            // Reset form
            setNewKrTitle("");
            setNewKrTarget(100);
            setNewKrType('leading');
            setShowAddKr(false);
        } catch (error) {
            console.error('Error creating key result:', error);
        }
    };

    const updateKeyResult = async (updatedKr: KeyResult) => {
        try {
            await api.updateKeyResult(updatedKr);

            // Refresh the full objective with details
            const refreshed = await api.fetchObjectiveWithDetails(objective.id);
            onUpdate(refreshed);
        } catch (error) {
            console.error('Error updating key result:', error);
        }
    };

    const deleteKeyResult = async (krId: string) => {
        const kr = objective.keyResults.find(k => k.id === krId);
        setConfirmModal({
            isOpen: true,
            title: 'Delete Key Result',
            message: `Are you sure you want to delete "${kr?.title}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await api.deleteKeyResult(krId);
                    const refreshed = await api.fetchObjectiveWithDetails(objective.id);
                    onUpdate(refreshed);
                } catch (error) {
                    console.error('Error deleting key result:', error);
                }
            }
        });
    };

    // KR Drag & Drop Handler
    const handleKRDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = filteredKRs.findIndex(kr => kr.id === active.id);
        const newIndex = filteredKRs.findIndex(kr => kr.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(filteredKRs, oldIndex, newIndex);

        // Optimistic update
        const updatedKRs = reordered.map((kr, i) => ({ ...kr, order: i }));
        onUpdate({
            ...objective,
            keyResults: activeKrTab === 'all'
                ? updatedKRs
                : objective.keyResults.map(kr => {
                    const updated = updatedKRs.find(u => u.id === kr.id);
                    return updated || kr;
                })
        });

        // Persist to database
        try {
            await api.updateKeyResultsOrder(updatedKRs.map((kr, i) => ({ id: kr.id, order: i })));
        } catch (error) {
            console.error('Error updating key results order:', error);
            // Revert on error
            const refreshed = await api.fetchObjectiveWithDetails(objective.id);
            onUpdate(refreshed);
        }
    };

    // Initiative Drag & Drop Handler
    const handleInitiativeDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = editedInitiatives.findIndex((_, i) => `initiative-${i}` === active.id);
        const newIndex = editedInitiatives.findIndex((_, i) => `initiative-${i}` === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        setEditedInitiatives(arrayMove(editedInitiatives, oldIndex, newIndex));
    };

    // Win deletion from drawer
    const handleDeleteWinFromDrawer = async (winId: string, isKeyResultWin: boolean) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Win',
            message: 'Are you sure you want to delete this win? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.deleteWinLog(winId);

                    // If it's a KR win, update the KR's current count
                    if (isKeyResultWin) {
                        const kr = objective.keyResults.find(k => k.winLog?.some(w => w.id === winId));
                        if (kr) {
                            const newCount = Math.max(0, (kr.winLog?.length || 0) - 1);
                            await api.updateKeyResultProgress(kr.id, newCount);
                        }
                    }

                    const refreshed = await api.fetchObjectiveWithDetails(objective.id);
                    onUpdate(refreshed);
                } catch (error) {
                    console.error('Error deleting win:', error);
                }
            }
        });
    };

    // Derived Lists
    const winConditions = objective.keyResults.filter(kr => kr.type === 'win_condition');
    const sortedKRs = [...objective.keyResults].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const filteredKRs = sortedKRs.filter(kr => {
        if (activeKrTab === 'all') return true;
        if (activeKrTab === 'conditions') return kr.type === 'win_condition';
        return kr.type !== 'win_condition';
    });

    // Handle "Add" button click logic to preset types
    const onStartAddMetric = () => {
        setShowAddKr(true);
        setNewKrType('leading');
        setNewKrTarget(100);
        setNewKrUnit('%');
    };

    const onStartAddCondition = () => {
        setShowAddKr(true);
        setNewKrType('win_condition');
        setNewKrTarget(999999); // High number since we want as many as possible
        setNewKrUnit('wins');
    };

    // Inline Edit Handlers
    const handleSaveTitle = async () => {
        if (editedTitle.trim() && editedTitle !== objective.title) {
            try {
                await api.updateObjective({ ...objective, title: editedTitle });
                const refreshed = await api.fetchObjectiveWithDetails(objective.id);
                onUpdate(refreshed);
            } catch (error) {
                console.error('Error updating title:', error);
            }
        }
        setIsEditingTitle(false);
    };

    const handleCancelTitle = () => {
        setEditedTitle(objective.title);
        setIsEditingTitle(false);
    };

    const handleSaveDescription = async () => {
        if (editedDescription !== objective.description) {
            try {
                await api.updateObjective({ ...objective, description: editedDescription || undefined });
                const refreshed = await api.fetchObjectiveWithDetails(objective.id);
                onUpdate(refreshed);
            } catch (error) {
                console.error('Error updating description:', error);
            }
        }
        setIsEditingDescription(false);
    };

    const handleCancelDescription = () => {
        setEditedDescription(objective.description || '');
        setIsEditingDescription(false);
    };

    const handleSaveInitiatives = async () => {
        try {
            await api.updateObjective({ ...objective, initiatives: editedInitiatives });
            const refreshed = await api.fetchObjectiveWithDetails(objective.id);
            onUpdate(refreshed);
        } catch (error) {
            console.error('Error updating initiatives:', error);
        }
        setIsEditingInitiatives(false);
    };

    const handleCancelInitiatives = () => {
        setEditedInitiatives(objective.initiatives || []);
        setIsEditingInitiatives(false);
    };

    const handleAddInitiative = () => {
        if (newInitiative.trim()) {
            const formatted = formatInitiative(newInitiative.trim(), newInitiativeUrl.trim());
            setEditedInitiatives([...editedInitiatives, formatted]);
            setNewInitiative('');
            setNewInitiativeUrl('');
        }
    };

    const handleRemoveInitiative = (index: number) => {
        setEditedInitiatives(editedInitiatives.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full h-full flex flex-col overflow-hidden shadow-2xl relative">
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
                    <button
                        onClick={() => setShowWinsDrawer(true)}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                        <span className="text-xs text-zinc-500 uppercase font-bold">Total Wins</span>
                        <span className="text-yellow-500 font-bold flex items-center gap-1">
                             <TrophyIcon /> {totalWins}
                        </span>
                    </button>
                    <button
                        onClick={() => setConfirmModal({
                            isOpen: true,
                            title: 'Delete Objective',
                            message: `Are you sure you want to delete "${objective.title}"? This will also delete all key results, wins, and initiatives associated with it. This action cannot be undone.`,
                            onConfirm: onDelete
                        })}
                        className="text-zinc-600 hover:text-red-500 transition-colors p-2"
                        title="Delete Objective"
                    >
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
                        <div className="mb-6">
                            {isEditingTitle ? (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        className="text-2xl md:text-3xl font-bold text-white bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') handleCancelTitle();
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveTitle}
                                            className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg flex items-center gap-1 transition-colors"
                                        >
                                            <SaveIcon /> Save
                                        </button>
                                        <button
                                            onClick={handleCancelTitle}
                                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg flex items-center gap-1 transition-colors"
                                        >
                                            <XIcon /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 group">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight flex-1">{objective.title}</h2>
                                    <button
                                        onClick={() => setIsEditingTitle(true)}
                                        className="text-zinc-600 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 mt-1"
                                        title="Edit title"
                                    >
                                        <EditIcon />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Progress */}
                         <div className="mb-8 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Overall Progress</span>
                                <span className="text-2xl font-bold font-mono text-white">{Math.round(totalProgress)}%</span>
                            </div>
                            <ProgressBar progress={totalProgress} className="h-3" />
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</h4>
                            {isEditingDescription ? (
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        className="text-sm text-white bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50 min-h-[80px]"
                                        placeholder="Add a description..."
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveDescription}
                                            className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg flex items-center gap-1 transition-colors"
                                        >
                                            <SaveIcon /> Save
                                        </button>
                                        <button
                                            onClick={handleCancelDescription}
                                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg flex items-center gap-1 transition-colors"
                                        >
                                            <XIcon /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 group">
                                    <p className="text-zinc-400 text-sm leading-relaxed flex-1">
                                        {objective.description || <span className="text-zinc-600 italic">No description yet</span>}
                                    </p>
                                    <button
                                        onClick={() => setIsEditingDescription(true)}
                                        className="text-zinc-600 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        title="Edit description"
                                    >
                                        <EditIcon />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Initiatives */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Initiatives</h4>
                                {!isEditingInitiatives && (
                                    <button
                                        onClick={() => setIsEditingInitiatives(true)}
                                        className="text-zinc-600 hover:text-violet-400 transition-colors p-1"
                                        title="Edit initiatives"
                                    >
                                        <EditIcon />
                                    </button>
                                )}
                            </div>
                            {isEditingInitiatives ? (
                                <div className="flex flex-col gap-3">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleInitiativeDragEnd}
                                    >
                                        <SortableContext
                                            items={editedInitiatives.map((_, i) => `initiative-${i}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <ul className="space-y-2">
                                                {editedInitiatives.map((init, i) => {
                                                    const { text, url } = parseInitiative(init);
                                                    return (
                                                        <SortableInitiative
                                                            key={`initiative-${i}`}
                                                            id={`initiative-${i}`}
                                                            index={i}
                                                            text={text}
                                                            url={url}
                                                            onRemove={() => handleRemoveInitiative(i)}
                                                        />
                                                    );
                                                })}
                                            </ul>
                                        </SortableContext>
                                    </DndContext>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            value={newInitiative}
                                            onChange={(e) => setNewInitiative(e.target.value)}
                                            placeholder="Initiative title..."
                                            className="text-sm text-white bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddInitiative();
                                                }
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={newInitiativeUrl}
                                                onChange={(e) => setNewInitiativeUrl(e.target.value)}
                                                placeholder="Linear link (optional)..."
                                                className="flex-1 text-sm text-white bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddInitiative();
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={handleAddInitiative}
                                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-violet-400 text-xs rounded-lg flex items-center gap-1 transition-colors"
                                            >
                                                <PlusIcon /> Add
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleSaveInitiatives}
                                            className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg flex items-center gap-1 transition-colors"
                                        >
                                            <SaveIcon /> Save
                                        </button>
                                        <button
                                            onClick={handleCancelInitiatives}
                                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg flex items-center gap-1 transition-colors"
                                        >
                                            <XIcon /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {objective.initiatives && objective.initiatives.length > 0 ? (
                                        objective.initiatives.map((init, i) => {
                                            const { text, url } = parseInitiative(init);
                                            return (
                                                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5 p-2 rounded hover:bg-zinc-800/30 transition-colors">
                                                    <span className="text-violet-500 mt-1 shrink-0"><CheckIcon /></span>
                                                    <div className="flex-1">
                                                        <div>{text}</div>
                                                        {url && (
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-1"
                                                            >
                                                                <LinkIcon /> Linear
                                                            </a>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-sm text-zinc-600 italic p-2">No initiatives yet</li>
                                    )}
                                </ul>
                            )}
                        </div>

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
                                        onClick={() => setActiveKrTab('all')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeKrTab === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        All
                                    </button>
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
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onStartAddMetric}
                                    className="text-sm bg-zinc-900 hover:bg-zinc-800 text-violet-400 font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border border-zinc-800 shadow-sm"
                                >
                                    <PlusIcon /> Add Metric
                                </button>
                                <button
                                    onClick={onStartAddCondition}
                                    className="text-sm bg-zinc-900 hover:bg-zinc-800 text-pink-400 font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border border-zinc-800 shadow-sm"
                                >
                                    <PlusIcon /> Add Win Condition
                                </button>
                            </div>
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
                                                onChange={(e) => {
                                                    const type = e.target.value as KeyResultType;
                                                    setNewKrType(type);
                                                    if (type === 'win_condition') {
                                                        setNewKrTarget(999999);
                                                        setNewKrUnit('wins');
                                                    }
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                                            >
                                                <option value="leading">Leading Indicator</option>
                                                <option value="lagging">Lagging Indicator</option>
                                                <option value="win_condition">Win Condition</option>
                                            </select>
                                        </div>
                                        {newKrType !== 'win_condition' && (
                                            <>
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
                                            </>
                                        )}
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

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleKRDragEnd}
                        >
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
                                    <SortableContext items={filteredKRs.map(kr => kr.id)} strategy={verticalListSortingStrategy}>
                                        {filteredKRs.map((kr) => (
                                            <SortableKeyResult
                                                key={kr.id}
                                                kr={kr}
                                                onUpdate={updateKeyResult}
                                                onDelete={() => deleteKeyResult(kr.id)}
                                                people={people}
                                                onLogWin={async (krId, note, attributedTo) => {
                                                    try {
                                                        await api.createWinLog(note, attributedTo, undefined, krId);
                                                        const newCount = (kr.winLog?.length || 0) + 1;
                                                        await api.updateKeyResultProgress(krId, newCount);
                                                        const refreshed = await api.fetchObjectiveWithDetails(objective.id);
                                                        onUpdate(refreshed);
                                                    } catch (error) {
                                                        console.error('Error logging win:', error);
                                                    }
                                                }}
                                                onDeleteWin={(winId) => {
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        title: 'Delete Win',
                                                        message: 'Are you sure you want to delete this win? This action cannot be undone.',
                                                        onConfirm: async () => {
                                                            try {
                                                                await api.deleteWinLog(winId);
                                                                const newCount = Math.max(0, (kr.winLog?.length || 0) - 1);
                                                                await api.updateKeyResultProgress(kr.id, newCount);
                                                                const refreshed = await api.fetchObjectiveWithDetails(objective.id);
                                                                onUpdate(refreshed);
                                                            } catch (error) {
                                                                console.error('Error deleting win:', error);
                                                            }
                                                        }
                                                    });
                                                }}
                                            />
                                        ))}
                                    </SortableContext>
                                )}
                            </div>
                        </DndContext>
                    </div>
                </div>
            </div>

            {/* Wins Drawer */}
            <WinsDrawer
                isOpen={showWinsDrawer}
                onClose={() => setShowWinsDrawer(false)}
                objectiveWins={objective.wins || []}
                keyResults={objective.keyResults}
                people={people}
                onDeleteWin={handleDeleteWinFromDrawer}
            />

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </div>
    );
};
