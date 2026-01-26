import React, { useMemo } from 'react';
import { Objective, Person } from '../../types';
import { PlusIcon, TargetIcon } from '../icons';
import { ObjectiveCard } from '../objectives/ObjectiveCard';
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

interface OkrsViewProps {
    objectives: Objective[];
    categories: string[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onObjectiveClick: (id: string) => void;
    isAddingObj: boolean;
    setIsAddingObj: (val: boolean) => void;
    handleAddObjective: (e: React.FormEvent) => void;
    newObjTitle: string;
    setNewObjTitle: (val: string) => void;
    newObjCategory: string;
    setNewObjCategory: (val: string) => void;
    people: Person[];
    onReorderObjectives: (objectives: Objective[]) => void;
}

interface SortableObjectiveCardProps {
  objective: Objective;
  onClick: () => void;
  people: Person[];
}

const SortableObjectiveCard: React.FC<SortableObjectiveCardProps> = ({ objective, onClick, people }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: objective.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ObjectiveCard
        objective={objective}
        onClick={onClick}
        people={people}
        dragHandleProps={listeners}
      />
    </div>
  );
};

export const OkrsView: React.FC<OkrsViewProps> = ({
    objectives,
    categories,
    activeTab,
    setActiveTab,
    onObjectiveClick,
    isAddingObj,
    setIsAddingObj,
    handleAddObjective,
    newObjTitle,
    setNewObjTitle,
    newObjCategory,
    setNewObjCategory,
    people,
    onReorderObjectives
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const filteredObjectives = useMemo(() => {
        if (activeTab === "All") return objectives;
        return objectives.filter((o: Objective) => o.category === activeTab);
    }, [objectives, activeTab]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const draggedObj = objectives.find((obj) => obj.id === active.id);
        const targetObj = objectives.find((obj) => obj.id === over.id);

        if (!draggedObj || !targetObj) return;

        // Check if we're crossing sections on "All" tab
        const draggedIsCompany = draggedObj.category === "Company";
        const targetIsCompany = targetObj.category === "Company";
        const crossingSections = activeTab === "All" && draggedIsCompany !== targetIsCompany;

        if (crossingSections) {
            // Update category when crossing sections
            // If moving TO Company, set to "Company"
            // If moving FROM Company, set to target's category or "General"
            const newCategory = targetIsCompany
                ? "Company"
                : (targetObj.category || "General");

            const updatedObj = {
                ...draggedObj,
                category: newCategory
            };

            // Find position in the target section
            const targetSectionObjs = objectives.filter(o =>
                targetIsCompany ? o.category === "Company" : o.category !== "Company"
            );
            const targetIndex = targetSectionObjs.findIndex(o => o.id === over.id);

            // Remove from original list and insert at new position
            const withoutDragged = objectives.filter(o => o.id !== active.id);
            const allTargetSection = withoutDragged.filter(o =>
                targetIsCompany ? o.category === "Company" : o.category !== "Company"
            );
            const reorderedSection = [
                ...allTargetSection.slice(0, targetIndex),
                updatedObj,
                ...allTargetSection.slice(targetIndex)
            ];

            // Reconstruct full list
            const otherSection = withoutDragged.filter(o =>
                targetIsCompany ? o.category !== "Company" : o.category === "Company"
            );
            const reordered = targetIsCompany
                ? [...reorderedSection, ...otherSection]
                : [...otherSection, ...reorderedSection];

            onReorderObjectives(reordered);
        } else {
            // Normal reordering within same section
            const oldIndex = filteredObjectives.findIndex((obj) => obj.id === active.id);
            const newIndex = filteredObjectives.findIndex((obj) => obj.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const reordered = arrayMove(filteredObjectives, oldIndex, newIndex);

            // If we're in a filtered view, merge back with full list
            if (activeTab !== "All") {
                const otherObjs = objectives.filter(o => o.category !== activeTab);
                onReorderObjectives([...reordered, ...otherObjs]);
            } else {
                onReorderObjectives(reordered);
            }
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
            {/* Secondary Nav Chips */}
            <div className="flex overflow-x-auto gap-2 scrollbar-hide mb-8 pb-2">
                {categories.map((cat: string) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`whitespace-nowrap px-4 py-1.5 text-xs font-medium rounded-full transition-all border ${
                            activeTab === cat
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                            : 'bg-white/50 dark:bg-zinc-900/50 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
                 <button
                    onClick={() => setIsAddingObj(true)}
                    className="ml-auto bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-full font-medium text-xs flex items-center gap-2 transition-colors shadow-lg shadow-violet-900/20 whitespace-nowrap"
                >
                    <PlusIcon /> <span>New OKR</span>
                </button>
            </div>

            {/* Add Form */}
            {isAddingObj && (
                <div className="max-w-4xl mx-auto mb-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleAddObjective}>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">Objective Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Increase brand awareness"
                                    value={newObjTitle}
                                    onChange={(e) => setNewObjTitle(e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="w-full md:w-1/3">
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">Category</label>
                                <input
                                    type="text"
                                    placeholder="Engineering"
                                    value={newObjCategory}
                                    onChange={(e) => setNewObjCategory(e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
                                    list="categories"
                                />
                                <datalist id="categories">
                                    {categories.map((c: string) => c !== "All" && <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAddingObj(false)}
                                className="px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                                Create Objective
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-1 max-w-5xl mx-auto">
                    {filteredObjectives.length === 0 && !isAddingObj ? (
                        <div className="text-center py-20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
                            <div className="bg-zinc-100 dark:bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-700">
                                <TargetIcon />
                            </div>
                            <h3 className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">No Objectives found</h3>
                            <p className="text-zinc-400 dark:text-zinc-600 text-sm">Try changing the filter or create a new goal.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <SortableContext
                                items={filteredObjectives.map(obj => obj.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {/* Separate Company OKRs visually if on 'All' tab */}
                                {activeTab === "All" && objectives.some((o: Objective) => o.category === "Company") && (
                                    <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                                            <span className="text-xs font-bold text-violet-600 dark:text-violet-500 uppercase tracking-widest">Company Priorities</span>
                                            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                                    </div>
                                        {objectives.filter((o: Objective) => o.category === "Company").map((obj: Objective) => (
                                            <SortableObjectiveCard
                                                key={obj.id}
                                                objective={obj}
                                                onClick={() => onObjectiveClick(obj.id)}
                                                people={people}
                                            />
                                        ))}

                                    <div className="flex items-center gap-3 mb-4 mt-10">
                                            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Department Objectives</span>
                                            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                                    </div>
                                    </div>
                                )}

                                {filteredObjectives
                                    .filter((o: Objective) => activeTab !== "All" || o.category !== "Company") // If 'All', filtering out Company because handled above
                                    .map((obj: Objective) => (
                                    <SortableObjectiveCard
                                        key={obj.id}
                                        objective={obj}
                                        onClick={() => onObjectiveClick(obj.id)}
                                        people={people}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    )}
                </div>
            </DndContext>
        </div>
    )
}
