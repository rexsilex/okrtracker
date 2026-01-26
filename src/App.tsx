import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Objective, Person, Category } from './types';
import { LayoutDashboardIcon, TargetIcon, TrophyIcon, SettingsIcon } from './components/icons';
import { Modal } from './components/ui/Modal';
import { ObjectiveDetail } from './components/objectives/ObjectiveDetail';
import { DashboardView } from './components/views/DashboardView';
import { OkrsView } from './components/views/OkrsView';
import { GoalsView } from './components/views/GoalsView';
import { WinsFeedView } from './components/views/WinsFeedView';
import { SettingsView } from './components/views/SettingsView';
import { AuthForm } from './components/auth/AuthForm';
import { ThemeProvider } from './contexts/ThemeContext';
import * as api from './lib/api';

// Main app content with routing
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: objectiveIdParam } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [okrs, setOkrs] = useState<Objective[]>([]);
  const [goals, setGoals] = useState<Objective[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Determine current view from URL path
  const currentPath = location.pathname;
  const view = currentPath.startsWith('/okrs') ? 'okrs'
    : currentPath.startsWith('/goals') ? 'goals'
    : currentPath.startsWith('/wins') ? 'wins'
    : currentPath.startsWith('/settings') ? 'settings'
    : 'dashboard';

  // OKR View State
  const [isAddingObj, setIsAddingObj] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  // Get selected objective ID from URL param
  const selectedObjectiveId = objectiveIdParam || null;

  // Form State
  const [newObjTitle, setNewObjTitle] = useState("");
  const [newObjCategory, setNewObjCategory] = useState("");

  // Check auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

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
      // Ensure user exists in database on login/signup
      await api.ensureUserExists();

      const [okrsData, goalsData, peopleData, categoriesData] = await Promise.all([
        api.fetchObjectives('okr'),
        api.fetchObjectives('goal'),
        api.fetchPeople(),
        api.fetchCategories()
      ]);

      setOkrs(okrsData);
      setGoals(goalsData);
      setPeople(peopleData);
      setCategories(categoriesData);
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
        navigate('/goals');
      } else {
        setOkrs(okrs.filter((o) => o.id !== id));
        navigate('/okrs');
      }
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

  const handleAddCategory = async (name: string) => {
    if (!session?.user) return;

    try {
      const newCategory = await api.createCategory(name);
      setCategories([...categories, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
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
          const nextObj = filteredObjectivesForReview[nextIndex];
          const basePath = nextObj.type === 'goal' ? '/goals' : '/okrs';
          navigate(`${basePath}/${nextObj.id}`);
      }
  };

  // Helper to navigate to an objective
  const handleObjectiveClick = (id: string) => {
      const obj = [...okrs, ...goals].find(o => o.id === id);
      if (obj) {
          const basePath = obj.type === 'goal' ? '/goals' : '/okrs';
          navigate(`${basePath}/${id}`);
      }
  };

  // Helper to close the modal and go back to the list
  const handleCloseObjective = () => {
      if (selectedObjective?.type === 'goal') {
          navigate('/goals');
      } else {
          navigate('/okrs');
      }
  };

  const currentReviewIndex = selectedObjective ? filteredObjectivesForReview.findIndex(o => o.id === selectedObjective.id) : -1;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show login at root or redirect to root
  if (!session) {
    if (location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }
    return <AuthForm />;
  }

  // Redirect logged-in users from root to dashboard
  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">

      {/* Top Bar / Main Navigation */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-full max-w-[1600px] mx-auto px-6">
              <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-12">
                      <div className="font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 text-lg">
                         <img src="/logo.png" alt="Frequency" className="h-7 w-auto" />
                      </div>

                      {/* Top Level Nav Links */}
                      <nav className="hidden md:flex items-center gap-6">
                          <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                             <LayoutDashboardIcon /> Dashboard
                          </Link>
                          <Link
                            to="/okrs"
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'okrs' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                             <TargetIcon /> OKRs
                          </Link>
                          <Link
                            to="/goals"
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'goals' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                             <TargetIcon /> Goals
                          </Link>
                          <Link
                            to="/wins"
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'wins' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                             <TrophyIcon /> Wins
                          </Link>
                          <Link
                            to="/settings"
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'settings' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                             <SettingsIcon /> Settings
                          </Link>
                      </nav>
                  </div>

                  <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{session.user.email}</span>
                      <button
                        onClick={handleSignOut}
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-2 rounded-lg transition-colors"
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
            <DashboardView
                objectives={[...okrs, ...goals]}
                onObjectiveClick={handleObjectiveClick}
                onCategoryClick={(category) => {
                    setActiveTab(category);
                    navigate('/okrs');
                }}
            />
        )}

        {view === 'okrs' && (
            <OkrsView
                objectives={okrs}
                categories={['All', ...categories.map(c => c.name)]}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onObjectiveClick={(id) => navigate(`/okrs/${id}`)}
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
                categories={['All', ...categories.map(c => c.name)]}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onObjectiveClick={(id) => navigate(`/goals/${id}`)}
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
            <WinsFeedView
                objectives={[...okrs, ...goals]}
                people={people}
                onLogWin={async (note, attributedTo, objectiveId, keyResultId) => {
                    try {
                        await api.createWinLog(note, attributedTo, objectiveId, keyResultId);

                        // If logging to a key result, update its current count
                        if (keyResultId) {
                            const allObjs = [...okrs, ...goals];
                            for (const obj of allObjs) {
                                const kr = obj.keyResults.find(k => k.id === keyResultId);
                                if (kr) {
                                    const newCount = (kr.winLog?.length || 0) + 1;
                                    await api.updateKeyResultProgress(keyResultId, newCount);
                                    break;
                                }
                            }
                        }

                        // Reload data
                        loadData();
                    } catch (error) {
                        console.error('Error logging win:', error);
                    }
                }}
            />
        )}

        {view === 'settings' && (
            <SettingsView
                people={people}
                onAddPerson={handleAddPerson}
                onDeletePerson={handleDeletePerson}
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
            />
        )}

      </main>

      {/* Review Mode / Detail Modal */}
      <Modal
        isOpen={!!selectedObjectiveId}
        onClose={handleCloseObjective}
      >
          {selectedObjective && (
              <ObjectiveDetail
                  objective={selectedObjective}
                  people={people}
                  onUpdate={updateObjective}
                  onDelete={() => deleteObjective(selectedObjective.id)}
                  onClose={handleCloseObjective}
                  onNext={() => navigateObjectives('next')}
                  onPrev={() => navigateObjectives('prev')}
                  hasPrev={currentReviewIndex > 0}
                  hasNext={currentReviewIndex < filteredObjectivesForReview.length - 1}
              />
          )}
      </Modal>


    </div>
  );
};

// Auth callback component - handles OAuth redirect
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in query params
      const params = new URLSearchParams(window.location.search);
      const error_param = params.get('error');
      const error_description = params.get('error_description');

      if (error_param) {
        setError(error_description || error_param);
        return;
      }

      // Check for hash fragment (implicit flow) or code (PKCE flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const code = params.get('code');

      if (accessToken) {
        // Implicit flow - token is in hash, Supabase client will pick it up automatically
        // Just need to wait for the session to be set
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          return;
        }

        if (session) {
          navigate('/dashboard', { replace: true });
          return;
        }
      }

      if (code) {
        // PKCE flow - exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
        navigate('/dashboard', { replace: true });
        return;
      }

      // No token or code - redirect to login
      navigate('/', { replace: true });
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-red-500 dark:text-red-400 text-center">
          <p className="text-lg mb-4">Authentication Error</p>
          <p className="text-sm text-zinc-500">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500 dark:text-zinc-400">Completing sign in...</div>
    </div>
  );
};

// Root App component with router
const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<AppContent />} />
          <Route path="/okrs" element={<AppContent />} />
          <Route path="/okrs/:id" element={<AppContent />} />
          <Route path="/goals" element={<AppContent />} />
          <Route path="/goals/:id" element={<AppContent />} />
          <Route path="/wins" element={<AppContent />} />
          <Route path="/settings" element={<AppContent />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
