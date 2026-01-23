import React, { useState, useEffect, useMemo } from "react";
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Objective, Person } from './types';
import { CATEGORIES } from './constants/defaultData';
import { LayoutDashboardIcon, TargetIcon, TrophyIcon, UsersIcon } from './components/icons';
import { Modal } from './components/ui/Modal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ObjectiveDetail } from './components/objectives/ObjectiveDetail';
import { DashboardView } from './components/views/DashboardView';
import { OkrsView } from './components/views/OkrsView';
import { GoalsView } from './components/views/GoalsView';
import { WinsFeedView } from './components/views/WinsFeedView';
import { AuthForm } from './components/auth/AuthForm';
import * as api from './lib/api';

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [okrs, setOkrs] = useState<Objective[]>([]);
  const [goals, setGoals] = useState<Objective[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // App Logic State
  const [view, setView] = useState<'dashboard' | 'okrs' | 'goals' | 'wins'>('okrs');

  // OKR View State
  const [isAddingObj, setIsAddingObj] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);

  // Form State
  const [newObjTitle, setNewObjTitle] = useState("");
  const [newObjCategory, setNewObjCategory] = useState("");

  // Check auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    if (!session?.user) return;

    try {
      const [okrsData, goalsData, peopleData] = await Promise.all([
        api.fetchObjectives('okr'),
        api.fetchObjectives('goal'),
        api.fetchPeople()
      ]);

      setOkrs(okrsData);
      setGoals(goalsData);
      setPeople(peopleData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjTitle.trim() || !session?.user) return;

    try {
      const objectiveType = view === 'goals' ? 'goal' : 'okr';
      const newObj = await api.createObjective({
        title: newObjTitle,
        type: objectiveType,
        category: newObjCategory.trim() || "General",
        description: undefined,
        initiatives: []
      });

      if (objectiveType === 'goal') {
        setGoals([newObj, ...goals]);
      } else {
        setOkrs([newObj, ...okrs]);
      }

      setNewObjTitle("");
      setNewObjCategory("");
      setIsAddingObj(false);
    } catch (error) {
      console.error('Error creating objective:', error);
    }
  };

  const updateObjective = async (updatedObj: Objective) => {
    try {
      await api.updateObjective(updatedObj);

      const updateList = (list: Objective[]) => list.map((o) => (o.id === updatedObj.id ? updatedObj : o));

      if (updatedObj.type === 'goal') {
        setGoals(updateList(goals));
      } else {
        setOkrs(updateList(okrs));
      }

      // Refresh the objective with full details
      const fullObj = await api.fetchObjectiveWithDetails(updatedObj.id);

      if (fullObj.type === 'goal') {
        setGoals(goals.map((o) => (o.id === fullObj.id ? fullObj : o)));
      } else {
        setOkrs(okrs.map((o) => (o.id === fullObj.id ? fullObj : o)));
      }
    } catch (error) {
      console.error('Error updating objective:', error);
    }
  };

  const deleteObjective = async (id: string) => {
    try {
      // Find which list the objective is in
      const isGoal = goals.some(o => o.id === id);

      await api.deleteObjective(id);

      if (isGoal) {
        setGoals(goals.filter((o) => o.id !== id));
      } else {
        setOkrs(okrs.filter((o) => o.id !== id));
      }

      setSelectedObjectiveId(null);
    } catch (error) {
      console.error('Error deleting objective:', error);
    }
  };

  const handleAddPerson = async (name: string, initials: string, color: string) => {
    if (!session?.user) return;

    try {
      const newPerson = await api.createPerson({ name, initials, color });
      setPeople([...people, newPerson]);
      return newPerson;
    } catch (error) {
      console.error('Error creating person:', error);
      throw error;
    }
  };

  const handleDeletePerson = async (id: string) => {
    try {
      await api.deletePerson(id);
      setPeople(people.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOkrs([]);
    setGoals([]);
    setPeople([]);
  };

  const handleReorderObjectives = async (reorderedObjectives: Objective[]) => {
    // Determine which list we're working with
    const isGoalsList = view === 'goals';
    const currentList = isGoalsList ? goals : okrs;

    // Update local state immediately for responsive UI
    if (isGoalsList) {
      setGoals(reorderedObjectives);
    } else {
      setOkrs(reorderedObjectives);
    }

    // Prepare order updates (including category changes if any)
    const orderUpdates = reorderedObjectives.map((obj, index) => {
      const originalObj = currentList.find(o => o.id === obj.id);
      const updates: { id: string; order: number; category?: string } = {
        id: obj.id,
        order: index
      };

      // Include category if it changed
      if (originalObj && originalObj.category !== obj.category) {
        updates.category = obj.category;
      }

      return updates;
    });

    // Update in database
    try {
      await api.updateObjectivesOrder(orderUpdates);
    } catch (error) {
      console.error('Error updating objectives order:', error);
      // Reload data on error to sync with database
      loadData();
    }
  };

  // Get current objectives based on view
  const currentObjectives = view === 'goals' ? goals : okrs;

  const filteredObjectivesForReview = useMemo(() => {
      if (activeTab === "All") return currentObjectives;
      return currentObjectives.filter(o => o.category === activeTab);
  }, [currentObjectives, activeTab]);

  const selectedObjective = useMemo(() => {
    const allObjectives = [...okrs, ...goals];
    return allObjectives.find(o => o.id === selectedObjectiveId);
  }, [okrs, goals, selectedObjectiveId]);

  // Navigation Logic for Review Mode
  const navigateObjectives = (direction: 'next' | 'prev') => {
      if (!selectedObjectiveId) return;

      const currentIndex = filteredObjectivesForReview.findIndex(o => o.id === selectedObjectiveId);
      if (currentIndex === -1) return;

      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= 0 && nextIndex < filteredObjectivesForReview.length) {
          setSelectedObjectiveId(filteredObjectivesForReview[nextIndex].id);
      }
  };

  const currentReviewIndex = selectedObjective ? filteredObjectivesForReview.findIndex(o => o.id === selectedObjective.id) : -1;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!session) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">

      {/* Top Bar / Main Navigation */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
          <div className="w-full max-w-[1600px] mx-auto px-6">
              <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-12">
                      <div className="font-bold text-white tracking-tight flex items-center gap-2 text-lg">
                         <img src="/logo.png" alt="Frequency" className="h-7 w-auto" />
                      </div>

                      {/* Top Level Nav Links */}
                      <nav className="hidden md:flex items-center gap-6">
                          <button
                            onClick={() => setView('dashboard')}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                             <LayoutDashboardIcon /> Dashboard
                          </button>
                          <button
                            onClick={() => setView('okrs')}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'okrs' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                             <TargetIcon /> OKRs
                          </button>
                          <button
                            onClick={() => setView('goals')}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'goals' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                             <TargetIcon /> Goals
                          </button>
                           <button
                            onClick={() => setView('wins')}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'wins' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                             <TrophyIcon /> Wins
                          </button>
                      </nav>
                  </div>

                  <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{session.user.email}</span>
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-zinc-500 hover:text-white transition-colors"
                        title="Team Settings"
                      >
                          <UsersIcon />
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="text-xs text-zinc-500 hover:text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8">

        {view === 'dashboard' && (
            <DashboardView objectives={[...okrs, ...goals]} onObjectiveClick={setSelectedObjectiveId} />
        )}

        {view === 'okrs' && (
            <OkrsView
                objectives={okrs}
                categories={CATEGORIES}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onObjectiveClick={setSelectedObjectiveId}
                isAddingObj={isAddingObj}
                setIsAddingObj={setIsAddingObj}
                handleAddObjective={handleAddObjective}
                newObjTitle={newObjTitle}
                setNewObjTitle={setNewObjTitle}
                newObjCategory={newObjCategory}
                setNewObjCategory={setNewObjCategory}
                people={people}
                onReorderObjectives={handleReorderObjectives}
            />
        )}

        {view === 'goals' && (
            <GoalsView
                objectives={goals}
                categories={CATEGORIES}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onObjectiveClick={setSelectedObjectiveId}
                isAddingObj={isAddingObj}
                setIsAddingObj={setIsAddingObj}
                handleAddObjective={handleAddObjective}
                newObjTitle={newObjTitle}
                setNewObjTitle={setNewObjTitle}
                newObjCategory={newObjCategory}
                setNewObjCategory={setNewObjCategory}
                people={people}
                onReorderObjectives={handleReorderObjectives}
            />
        )}

        {view === 'wins' && (
            <WinsFeedView objectives={[...okrs, ...goals]} people={people} />
        )}

      </main>

      {/* Review Mode / Detail Modal */}
      <Modal
        isOpen={!!selectedObjectiveId}
        onClose={() => setSelectedObjectiveId(null)}
      >
          {selectedObjective && (
              <ObjectiveDetail
                  objective={selectedObjective}
                  people={people}
                  onUpdate={updateObjective}
                  onDelete={() => deleteObjective(selectedObjective.id)}
                  onClose={() => setSelectedObjectiveId(null)}
                  onNext={() => navigateObjectives('next')}
                  onPrev={() => navigateObjectives('prev')}
                  hasPrev={currentReviewIndex > 0}
                  hasNext={currentReviewIndex < filteredObjectivesForReview.length - 1}
              />
          )}
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        people={people}
        setPeople={setPeople}
        onAddPerson={handleAddPerson}
        onDeletePerson={handleDeletePerson}
      />

    </div>
  );
};

export default App;
