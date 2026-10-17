import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bucket,
  FieldTag,
  Goal,
  Idea,
  IdeaStatus,
  ScoringConfig,
  UserProfile,
} from './types';
import {
  loadCurrentUserId,
  loadUserData,
  saveUserData,
  loadScoringConfig,
  saveScoringConfig,
  exportUserDataAsJson,
  importUserDataFromJson,
  INITIAL_DEMO_IDEAS,
  INITIAL_DEMO_GOALS,
  INITIAL_DEMO_PROFILE,
} from './services/storage';
import { calculateIdeaScore, rankAllIdeas } from './shared/scoring';
import { scoreIdeaWithAi } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BoardView } from './components/BoardView';
import { MatrixView } from './components/MatrixView';
import { GoalsView } from './components/GoalsView';
import { ArchiveView } from './components/ArchiveView';
import { SettingsView } from './components/SettingsView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { IdeaDetailModal } from './components/IdeaDetailModal';
import { WeeklyReviewModal } from './components/WeeklyReviewModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Plus } from 'lucide-react';

export default function App() {
  const [userId, setUserId] = useState<string>(() => loadCurrentUserId());
  const [profile, setProfile] = useState<UserProfile>(INITIAL_DEMO_PROFILE);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_DEMO_GOALS);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(() =>
    loadScoringConfig()
  );

  const [currentView, setCurrentView] = useState<
    'board' | 'matrix' | 'goals' | 'archive' | 'settings'
  >('board');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Search & Filters state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<FieldTag | 'ALL'>('ALL');
  const [selectedGoalId, setSelectedGoalId] = useState<string | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<IdeaStatus | 'ALL'>('ALL');

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('ideaboard_dark_mode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ideaboard_dark_mode', String(darkMode));
  }, [darkMode]);

  // Load User Data on mount or when userId changes
  useEffect(() => {
    const store = loadUserData(userId);
    setProfile(store.profile);
    setGoals(store.goals);
    setIdeas(store.ideas);

    if (!store.profile.onboardingDone) {
      setOnboardingOpen(true);
    }
  }, [userId]);

  // Global Keyboard Shortcuts (N for Quick Capture, Escape for modals/search/sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to re-rank and save data state
  const updateAndPersist = useCallback(
    (newIdeas: Idea[], newProfile: UserProfile = profile, newGoals: Goal[] = goals) => {
      const activeGoals = newGoals.filter((g) => g.status === 'active');
      const reranked = rankAllIdeas(newIdeas, newProfile, activeGoals, scoringConfig);
      setIdeas(reranked);
      setProfile(newProfile);
      setGoals(newGoals);
      saveUserData(userId, {
        profile: newProfile,
        goals: newGoals,
        ideas: reranked,
      });
    },
    [userId, profile, goals, scoringConfig]
  );

  // Background AI scoring trigger
  const triggerAiScoring = useCallback(
    async (ideaToScore: Idea, currentProfile: UserProfile, currentGoals: Goal[]) => {
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaToScore.id ? { ...i, isAiScoring: true, aiError: undefined } : i))
      );

      const activeGoals = currentGoals.filter((g) => g.status === 'active');
      const response = await scoreIdeaWithAi(currentProfile, activeGoals, ideaToScore);

      setIdeas((prev) => {
        const found = prev.find((i) => i.id === ideaToScore.id);
        if (!found) return prev;

        if (!response.success || !response.data) {
          const withError = {
            ...found,
            isAiScoring: false,
            aiError: response.error || 'AI scoring failed. Adjust scores manually or click Retry.',
            scoresSource: (found.scoresSource === 'unscored' ? 'unscored' : found.scoresSource) as any,
          };
          const reranked = rankAllIdeas(
            prev.map((i) => (i.id === found.id ? withError : i)),
            currentProfile,
            activeGoals,
            scoringConfig
          );
          saveUserData(userId, { profile: currentProfile, goals: currentGoals, ideas: reranked });
          return reranked;
        }

        const data = response.data;
        const userOverrides = found.userEditedScores || {};

        // Merge: Never overwrite user-edited scores
        const mergedImpact = userOverrides.impact ?? data.impact;
        const mergedUrgency = userOverrides.urgency ?? data.urgency;
        const mergedSkillMatch = userOverrides.skillMatch ?? data.skillMatch;
        const mergedEffort = userOverrides.effort ?? data.effort;
        const mergedConfidence = userOverrides.confidence ?? data.confidence;
        const mergedHours = userOverrides.hoursPerWeekNeeded ?? data.hoursPerWeekNeeded;

        const updatedIdea: Idea = {
          ...found,
          fieldTag: (found.fieldTag === 'Other' && data.fieldTag ? data.fieldTag : found.fieldTag) as FieldTag,
          goalLinks: data.goalLinks || found.goalLinks,
          impact: mergedImpact,
          urgency: mergedUrgency,
          skillMatch: mergedSkillMatch,
          effort: mergedEffort,
          confidence: mergedConfidence,
          hoursPerWeekNeeded: mergedHours,
          aiReasoning: data.reasoning,
          nextAction: found.nextAction || data.nextAction,
          followUpQuestions: data.followUpQuestions || [],
          aiSuggestedScores: {
            impact: data.impact,
            urgency: data.urgency,
            skillMatch: data.skillMatch,
            effort: data.effort,
            confidence: data.confidence,
            hoursPerWeekNeeded: data.hoursPerWeekNeeded,
            fieldTag: data.fieldTag as any,
          },
          scoresSource: Object.keys(userOverrides).length > 0 ? 'mixed' : 'ai',
          isAiScoring: false,
          aiError: undefined,
          lastActivityAt: Date.now(),
          lastScoredAt: Date.now(),
          updatedAt: Date.now(),
        };

        const updatedList = prev.map((i) => (i.id === found.id ? updatedIdea : i));
        const reranked = rankAllIdeas(updatedList, currentProfile, activeGoals, scoringConfig);
        saveUserData(userId, { profile: currentProfile, goals: currentGoals, ideas: reranked });
        return reranked;
      });
    },
    [userId, scoringConfig]
  );

  // Quick Capture Save: saves in 1 click and immediately kicks off AI scoring
  const handleQuickCaptureSave = (title: string, description: string) => {
    const newId = `idea-${Date.now()}`;
    const initialExcitement = 3;

    const newIdea: Idea = {
      id: newId,
      userId,
      title,
      description,
      fieldTag: 'Other',
      goalLinks: goals.filter((g) => g.status === 'active').map((g) => ({ goalId: g.id, fit: 3 })),
      impact: 3,
      urgency: 2,
      skillMatch: 3,
      excitement: initialExcitement,
      effort: 3,
      hoursPerWeekNeeded: 3,
      confidence: 3,
      priorityScore: 0,
      scoreBreakdown: {} as any,
      bucket: 'next',
      pinnedBucket: null,
      status: 'idea',
      aiReasoning: '',
      nextAction: '',
      followUpQuestions: [],
      followUpAnswers: [],
      notes: [],
      links: [],
      scoresSource: 'unscored',
      userEditedScores: {},
      lastActivityAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isAiScoring: true,
    };

    const nextIdeas = [newIdea, ...ideas];
    updateAndPersist(nextIdeas, profile, goals);
    triggerAiScoring(newIdea, profile, goals);
  };

  // Re-score single idea from detail modal
  const handleReScoreWithAi = async (idea: Idea) => {
    await triggerAiScoring(idea, profile, goals);
  };

  // Update an existing idea
  const handleUpdateIdea = (updatedIdea: Idea) => {
    const nextIdeas = ideas.map((i) => (i.id === updatedIdea.id ? updatedIdea : i));
    updateAndPersist(nextIdeas, profile, goals);
  };

  // Pin/override bucket
  const handlePinBucket = (ideaId: string, bucket: Bucket | null) => {
    const nextIdeas = ideas.map((i) =>
      i.id === ideaId ? { ...i, pinnedBucket: bucket, updatedAt: Date.now() } : i
    );
    updateAndPersist(nextIdeas, profile, goals);
  };

  // Status change
  const handleStatusChange = (ideaId: string, status: IdeaStatus) => {
    const nextIdeas = ideas.map((i) =>
      i.id === ideaId ? { ...i, status, lastActivityAt: Date.now(), updatedAt: Date.now() } : i
    );
    updateAndPersist(nextIdeas, profile, goals);
  };

  // Delete idea
  const handleDeleteIdea = (ideaId: string) => {
    const nextIdeas = ideas.filter((i) => i.id !== ideaId);
    updateAndPersist(nextIdeas, profile, goals);
    if (selectedIdeaId === ideaId) {
      setSelectedIdeaId(null);
    }
  };

  // Goal actions
  const handleAddGoal = (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const nextGoals = [...goals, newGoal];
    updateAndPersist(ideas, profile, nextGoals);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const nextGoals = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    updateAndPersist(ideas, profile, nextGoals);
  };

  const handleDeleteGoal = (goalId: string) => {
    const nextGoals = goals.filter((g) => g.id !== goalId);
    updateAndPersist(ideas, profile, nextGoals);
  };

  // Profile update
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    updateAndPersist(ideas, updatedProfile, goals);
  };

  // Scoring config update
  const handleUpdateScoringConfig = (newConfig: ScoringConfig) => {
    setScoringConfig(newConfig);
    saveScoringConfig(newConfig);
    const activeGoals = goals.filter((g) => g.status === 'active');
    const reranked = rankAllIdeas(ideas, profile, activeGoals, newConfig);
    setIdeas(reranked);
    saveUserData(userId, { profile, goals, ideas: reranked });
  };

  // Data management
  const handleExportJson = () => {
    const jsonStr = exportUserDataAsJson(userId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideaboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonStr: string) => {
    const store = importUserDataFromJson(userId, jsonStr);
    setProfile(store.profile);
    setGoals(store.goals);
    setIdeas(store.ideas);
  };

  const handleResetData = () => {
    const ranked = rankAllIdeas(INITIAL_DEMO_IDEAS, INITIAL_DEMO_PROFILE, INITIAL_DEMO_GOALS, scoringConfig);
    const store = {
      profile: { ...INITIAL_DEMO_PROFILE, uid: userId },
      goals: INITIAL_DEMO_GOALS.map((g) => ({ ...g, userId })),
      ideas: ranked.map((i) => ({ ...i, userId })),
    };
    saveUserData(userId, store);
    setProfile(store.profile);
    setGoals(store.goals);
    setIdeas(store.ideas);
  };

  // Onboarding completion
  const handleOnboardingComplete = (completedProfile: UserProfile, completedGoals: Goal[]) => {
    setOnboardingOpen(false);
    updateAndPersist(ideas, completedProfile, completedGoals);
  };

  // Search toggling & closing
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSelectedTag('ALL');
    setSelectedGoalId('ALL');
    setSelectedStatus('ALL');
  };

  // Stale ideas count in Now (≥14 days inactive)
  const staleCount = useMemo(() => {
    return ideas.filter((i) => {
      if (i.bucket !== 'now' || i.status === 'done' || i.status === 'dropped') return false;
      const daysInactive = Math.floor((Date.now() - i.lastActivityAt) / (1000 * 60 * 60 * 24));
      return daysInactive >= 14;
    }).length;
  }, [ideas]);

  // Filtered Ideas based on search and dropdown filters
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(query);
        const matchesDesc = idea.description?.toLowerCase().includes(query);
        const matchesNotes = idea.notes?.some((n) => n.text.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesNotes) return false;
      }
      // Tag filter
      if (selectedTag !== 'ALL' && idea.fieldTag !== selectedTag) {
        return false;
      }
      // Goal filter
      if (selectedGoalId !== 'ALL') {
        const hasGoal = idea.goalLinks?.some((gl) => gl.goalId === selectedGoalId && gl.fit > 1);
        if (!hasGoal) return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && idea.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [ideas, searchQuery, selectedTag, selectedGoalId, selectedStatus]);

  const selectedIdea = useMemo(() => {
    return ideas.find((i) => i.id === selectedIdeaId) || null;
  }, [ideas, selectedIdeaId]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Redesigned Minimal Header: Hamburger far left, IdeaBoard + Search in center, nothing else */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => {
          if (isSearchOpen) {
            handleCloseSearch();
          } else {
            setIsSearchOpen(true);
          }
        }}
        onCloseSearch={handleCloseSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        goals={goals}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        selectedGoalId={selectedGoalId}
        onGoalChange={setSelectedGoalId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Slide-in Overlay Sidebar (like Claude mobile app) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenWeeklyReview={() => setWeeklyReviewOpen(true)}
        profile={profile}
        goals={goals}
        staleCount={staleCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSwitchUser={() => {
          setSidebarOpen(false);
          const newName = prompt('Enter a profile name or email for this session:', profile.displayName);
          if (newName && newName.trim()) {
            const newUid = `user-${Date.now()}`;
            setUserId(newUid);
            const newProfile: UserProfile = {
              ...INITIAL_DEMO_PROFILE,
              uid: newUid,
              displayName: newName.trim(),
              email: `${newName.toLowerCase().replace(/\s+/g, '')}@example.com`,
              onboardingDone: false,
            };
            saveUserData(newUid, {
              profile: newProfile,
              goals: INITIAL_DEMO_GOALS.map((g) => ({ ...g, userId: newUid })),
              ideas: [],
            });
            setProfile(newProfile);
            setGoals(INITIAL_DEMO_GOALS.map((g) => ({ ...g, userId: newUid })));
            setIdeas([]);
            setOnboardingOpen(true);
          }
        }}
      />

      {/* Main Views */}
      <main className="flex-1 pb-20">
        {currentView === 'board' && (
          <BoardView
            ideas={filteredIdeas}
            profile={profile}
            goals={goals}
            onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
            onPinBucket={handlePinBucket}
            onStatusChange={handleStatusChange}
            onRetryAiScoring={(idea) => triggerAiScoring(idea, profile, goals)}
            onOpenQuickCapture={() => setQuickCaptureOpen(true)}
          />
        )}

        {currentView === 'matrix' && (
          <MatrixView
            ideas={filteredIdeas}
            goals={goals}
            onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
            onOpenQuickCapture={() => setQuickCaptureOpen(true)}
          />
        )}

        {currentView === 'goals' && (
          <GoalsView
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {currentView === 'archive' && (
          <ArchiveView
            ideas={filteredIdeas}
            onRestoreIdea={(id) => handleStatusChange(id, 'idea')}
            onDeleteIdea={handleDeleteIdea}
            onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            profile={profile}
            scoringConfig={scoringConfig}
            onUpdateProfile={handleUpdateProfile}
            onUpdateScoringConfig={handleUpdateScoringConfig}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onResetData={handleResetData}
            onRestartOnboarding={() => setOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Item 4: Floating "+" round button fixed to bottom-right corner on EVERY page */}
      <button
        onClick={() => setQuickCaptureOpen(true)}
        title="Add Idea (Shortcut: N)"
        aria-label="Add Idea"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Modals */}
      <QuickCaptureModal
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        onSave={handleQuickCaptureSave}
      />

      <IdeaDetailModal
        idea={selectedIdea}
        profile={profile}
        goals={goals}
        isOpen={Boolean(selectedIdeaId && selectedIdea)}
        onClose={() => setSelectedIdeaId(null)}
        onUpdateIdea={handleUpdateIdea}
        onDeleteIdea={handleDeleteIdea}
        onReScoreWithAi={handleReScoreWithAi}
        isAiScoring={Boolean(selectedIdea?.isAiScoring)}
      />

      <WeeklyReviewModal
        isOpen={weeklyReviewOpen}
        onClose={() => setWeeklyReviewOpen(false)}
        profile={profile}
        goals={goals}
        ideas={ideas}
        onSelectIdea={(idea) => {
          setWeeklyReviewOpen(false);
          setSelectedIdeaId(idea.id);
        }}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onComplete={handleOnboardingComplete}
        initialProfile={profile}
        initialGoals={goals}
      />
    </div>
  );
}
