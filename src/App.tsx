import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Bucket,
  FieldTag,
  Goal,
  Idea,
  IdeaStatus,
  NextStep,
  ScoringConfig,
  UserProfile,
} from './types';
import {
  loadCurrentUserId,
  saveCurrentUserId,
  loadUserData,
  saveUserData,
  loadScoringConfig,
  saveScoringConfig,
  exportUserDataAsJson,
  importUserDataFromJson,
  replaceWithSampleData,
  listSavedDemoUsers,
  deleteUserData,
  DemoUserSummary,
  INITIAL_DEMO_IDEAS,
  INITIAL_DEMO_GOALS,
  INITIAL_DEMO_PROFILE,
} from './services/storage';
import { rankAllIdeas } from './shared/scoring';
import { scoreIdeaWithAi } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BoardView } from './components/BoardView';
import { GoalsView } from './components/GoalsView';
import { ArchiveView } from './components/ArchiveView';
import { SettingsView } from './components/SettingsView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { IdeaDetailModal } from './components/IdeaDetailModal';
import { WeeklyReviewModal } from './components/WeeklyReviewModal';
import { OnboardingModal } from './components/OnboardingModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SwitchUserModal } from './components/SwitchUserModal';
import { Plus } from 'lucide-react';

export default function App() {
  const [userId, setUserId] = useState<string>(() => {
    const saved = loadCurrentUserId();
    if (saved && saved !== '__logged_out__') {
      return saved;
    }
    return 'demo-user-1';
  });
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    const saved = localStorage.getItem('ideaboard_current_user');
    return saved === '__logged_out__';
  });
  const [switchUserModalOpen, setSwitchUserModalOpen] = useState(false);
  const [savedUsers, setSavedUsers] = useState<DemoUserSummary[]>([]);

  const [profile, setProfile] = useState<UserProfile>(INITIAL_DEMO_PROFILE);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_DEMO_GOALS);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(() =>
    loadScoringConfig()
  );

  // Views: Matrix removed completely as requested
  const [currentView, setCurrentView] = useState<
    'board' | 'goals' | 'archive' | 'settings'
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

  // Bug fix: On load, follow device theme ONLY if user has never chosen; if they chose light, keep light
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ideaboard_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('ideaboard_dark_mode', String(next));
      return next;
    });
  };

  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('ideaboard_ai_enabled');
    return saved !== 'false'; // default true
  });

  const handleToggleAi = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem('ideaboard_ai_enabled', String(enabled));
  };

  // User ID persistence: saveCurrentUserId whenever it changes or on logout
  useEffect(() => {
    if (isLoggedOut) {
      saveCurrentUserId('__logged_out__');
    } else if (userId && userId !== '__logged_out__') {
      saveCurrentUserId(userId);
    }
  }, [userId, isLoggedOut]);

  // Load User Data on mount or when userId changes
  useEffect(() => {
    if (isLoggedOut || !userId || userId === '__logged_out__') return;
    const store = loadUserData(userId);
    setProfile(store.profile);
    setGoals(store.goals);
    setIdeas(store.ideas);

    if (!store.profile.onboardingDone) {
      setOnboardingOpen(true);
    }
  }, [userId, isLoggedOut]);

  // Global Keyboard Shortcuts (N for Quick Capture, Escape for modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
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

  const profileRef = useRef(profile);
  const goalsRef = useRef(goals);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  // Helper to re-rank and save data state
  const updateAndPersist = useCallback(
    (newIdeas: Idea[], newProfile: UserProfile = profileRef.current, newGoals: Goal[] = goalsRef.current) => {
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
    [userId, scoringConfig]
  );

  // Background AI scoring trigger: always saves latest profile and goals when done
  const triggerAiScoring = useCallback(
    async (ideaToScore: Idea, currentProfile: UserProfile, currentGoals: Goal[]) => {
      if (!aiEnabled) return; // Requirement: When AI is off, make no AI calls.
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaToScore.id ? { ...i, isAiScoring: true, aiError: undefined } : i))
      );

      const activeGoals = currentGoals.filter((g) => g.status === 'active');
      const response = await scoreIdeaWithAi(currentProfile, activeGoals, ideaToScore);

      setIdeas((prev) => {
        const found = prev.find((i) => i.id === ideaToScore.id);
        if (!found) return prev;

        // Requirement: In triggerAiScoring, save latest profile and goals, not the ones captured when the call started
        const latestProfile = profileRef.current;
        const latestGoals = goalsRef.current;
        const latestActiveGoals = (latestGoals || []).filter((g: Goal) => g.status === 'active');

        if (!response.success || !response.data) {
          const withError = {
            ...found,
            isAiScoring: false,
            aiError: response.error || 'AI scoring failed. Adjust scores manually or click Retry.',
            scoresSource: (found.scoresSource === 'unscored' ? 'unscored' : found.scoresSource) as any,
          };
          const reranked = rankAllIdeas(
            prev.map((i) => (i.id === found.id ? withError : i)),
            latestProfile,
            latestActiveGoals,
            scoringConfig
          );
          saveUserData(userId, { profile: latestProfile, goals: latestGoals, ideas: reranked });
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

        // Goal fit: AI re-scoring must NOT overwrite user-set goal fits
        const userGoalFits = userOverrides.goalFits || {};
        const aiGoalLinks = data.goalLinks || [];
        const aiGoalFitsRecord: Record<string, number> = {};
        aiGoalLinks.forEach((gl) => {
          aiGoalFitsRecord[gl.goalId] = gl.fit;
        });

        const mergedGoalLinks = (found.goalLinks || []).map((gl) => {
          const userFit = userGoalFits[gl.goalId];
          if (userFit != null) {
            return { ...gl, fit: userFit };
          }
          const aiFit = aiGoalFitsRecord[gl.goalId];
          return aiFit != null ? { ...gl, fit: aiFit } : gl;
        });

        for (const gl of aiGoalLinks) {
          if (!mergedGoalLinks.some((m) => m.goalId === gl.goalId)) {
            const userFit = userGoalFits[gl.goalId];
            mergedGoalLinks.push({ goalId: gl.goalId, fit: userFit ?? gl.fit });
          }
        }

        // Requirement: re-scoring replaces only unticked steps the user hasn't edited; ticked and user-written steps stay.
        const existingSteps = found.nextSteps || [];
        const preservedSteps = existingSteps.filter((s) => s.done || s.userEdited);

        const rawAiSteps: string[] =
          Array.isArray(data.nextSteps) && data.nextSteps.length > 0
            ? data.nextSteps
            : data.nextAction
            ? [data.nextAction]
            : [];

        const newAiSteps: NextStep[] = rawAiSteps.map((stepText, idx) => ({
          id: `step-${Date.now()}-${idx}`,
          text: stepText,
          done: false,
          userEdited: false,
        }));

        const mergedNextSteps: NextStep[] =
          preservedSteps.length > 0
            ? [...preservedSteps, ...newAiSteps]
            : newAiSteps;

        const primaryNextAction =
          mergedNextSteps.find((s) => !s.done)?.text || data.nextAction || found.nextAction || '';

        const existingAnsweredSet = new Set((found.followUpAnswers || []).map((a) => a.question.toLowerCase().replace(/[^\w\s]/g, '').trim()));
        const filteredQuestions = (data.followUpQuestions || []).filter(
          (q) => !existingAnsweredSet.has(q.toLowerCase().replace(/[^\w\s]/g, '').trim())
        );

        const updatedIdea: Idea = {
          ...found,
          fieldTag: (found.fieldTag === 'Other' && data.fieldTag ? data.fieldTag : found.fieldTag) as FieldTag,
          goalLinks: mergedGoalLinks,
          impact: mergedImpact,
          urgency: mergedUrgency,
          skillMatch: mergedSkillMatch,
          effort: mergedEffort,
          confidence: mergedConfidence,
          hoursPerWeekNeeded: mergedHours,
          aiReasoning: data.reasoning,
          nextAction: primaryNextAction,
          nextSteps: mergedNextSteps,
          followUpQuestions: filteredQuestions,
          aiSuggestedScores: {
            impact: data.impact,
            urgency: data.urgency,
            skillMatch: data.skillMatch,
            effort: data.effort,
            confidence: data.confidence,
            hoursPerWeekNeeded: data.hoursPerWeekNeeded,
            fieldTag: data.fieldTag as any,
            goalFits: aiGoalFitsRecord,
          },
          scoresSource: Object.keys(userOverrides).length > 0 ? 'mixed' : 'ai',
          isAiScoring: false,
          aiError: undefined,
          lastActivityAt: Date.now(),
          lastScoredAt: Date.now(),
          updatedAt: Date.now(),
        };

        const updatedList = prev.map((i) => (i.id === found.id ? updatedIdea : i));
        const reranked = rankAllIdeas(updatedList, latestProfile, latestActiveGoals, scoringConfig);
        saveUserData(userId, { profile: latestProfile, goals: latestGoals, ideas: reranked });
        return reranked;
      });
    },
    [userId, scoringConfig, aiEnabled]
  );

  // Quick Capture Save: saves in 1 click with user scores and no automatic AI call
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
      nextSteps: [],
      followUpQuestions: [],
      followUpAnswers: [],
      notes: [],
      links: [],
      scoresSource: 'user',
      userEditedScores: {},
      lastActivityAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isAiScoring: false,
    };

    const nextIdeas = [newIdea, ...ideas];
    updateAndPersist(nextIdeas, profile, goals);
  };

  // Re-score single idea from detail modal
  const handleReScoreWithAi = async (idea: Idea) => {
    await triggerAiScoring(idea, profile, goals);
  };

  // Update an existing idea
  // Requirement: if the status changed to "paused" or "in_progress", set pinnedBucket to null before re-ranking.
  const handleUpdateIdea = (updatedIdea: Idea) => {
    const existing = ideas.find((i) => i.id === updatedIdea.id);
    let finalized = updatedIdea;
    if (
      (updatedIdea.status === 'paused' || updatedIdea.status === 'in_progress') &&
      (!existing || existing.status !== updatedIdea.status || updatedIdea.pinnedBucket != null)
    ) {
      finalized = { ...updatedIdea, pinnedBucket: null };
    }
    const nextIdeas = ideas.map((i) => (i.id === finalized.id ? finalized : i));
    updateAndPersist(nextIdeas, profile, goals);
  };

  // Move / Pin idea to bucket or return to automatic ranking
  const handlePinBucket = (ideaId: string, bucket: Bucket | null) => {
    const targetIdea = ideas.find((i) => i.id === ideaId);
    if (!targetIdea) return;

    // Return to automatic ranking
    if (bucket === null) {
      const nextIdeas = ideas.map((i) =>
        i.id === ideaId ? { ...i, pinnedBucket: null, updatedAt: Date.now() } : i
      );
      updateAndPersist(nextIdeas, profileRef.current, goalsRef.current);
      return;
    }

    // Dropping a card back on its own column does nothing
    if (targetIdea.bucket === bucket) {
      return;
    }

    // Dragging an In-progress idea out of Now also changes its status to "Idea".
    // Dragging a paused idea out of Parked changes its status back to "Idea".
    let newStatus: IdeaStatus = targetIdea.status;
    if (targetIdea.status === 'in_progress' && bucket !== 'now') {
      newStatus = 'idea';
    } else if (targetIdea.status === 'paused' && bucket !== 'parked') {
      newStatus = 'idea';
    }

    const nextIdeas = ideas.map((i) =>
      i.id === ideaId
        ? {
            ...i,
            pinnedBucket: bucket,
            status: newStatus,
            lastActivityAt: Date.now(),
            updatedAt: Date.now(),
          }
        : i
    );
    updateAndPersist(nextIdeas, profileRef.current, goalsRef.current);
  };

  // Status change
  // Requirement: when the new status is "paused" or "in_progress", also set pinnedBucket to null.
  const handleStatusChange = (ideaId: string, status: IdeaStatus) => {
    const shouldClearPin = status === 'paused' || status === 'in_progress';
    const nextIdeas = ideas.map((i) =>
      i.id === ideaId
        ? {
            ...i,
            status,
            pinnedBucket: shouldClearPin ? null : i.pinnedBucket,
            lastActivityAt: Date.now(),
            updatedAt: Date.now(),
          }
        : i
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

  // Data management: Export filename renamed to messidea-backup-DATE.json
  const handleExportJson = () => {
    const jsonStr = exportUserDataAsJson(userId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messidea-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
    const store = replaceWithSampleData(userId);
    setProfile(store.profile);
    setGoals(store.goals);
    setIdeas(store.ideas);
    setSelectedIdeaId(null);
  };

  // Demo user management
  const handleStartWithUser = (displayName: string) => {
    const newUid = `user-${Date.now()}`;
    const newProfile: UserProfile = {
      uid: newUid,
      displayName: displayName.trim(),
      email: `${displayName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      aboutMe: '',
      situation: 'employed_full',
      skills: [],
      hoursPerWeek: 10,
      riskAppetite: 'medium',
      onboardingDone: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Section G.4: A new user gets no goals and no ideas; onboarding creates their goals. Never copy the demo goals.
    saveUserData(newUid, {
      profile: newProfile,
      goals: [],
      ideas: [],
      version: 2,
    });
    setUserId(newUid);
    saveCurrentUserId(newUid);
    setProfile(newProfile);
    setGoals([]);
    setIdeas([]);
    setSelectedIdeaId(null);
    setIsLoggedOut(false);
    setOnboardingOpen(true);
  };

  const handleTrySampleData = () => {
    setUserId('demo-user-1');
    saveCurrentUserId('demo-user-1');
    setIsLoggedOut(false);
    const store = loadUserData('demo-user-1');
    setProfile(store.profile);
    setGoals(store.goals);
    setIdeas(store.ideas);
    setSelectedIdeaId(null);
    setOnboardingOpen(false);
  };

  const handleLogOut = () => {
    setIsLoggedOut(true);
    saveCurrentUserId('__logged_out__');
    setSidebarOpen(false);
    setSelectedIdeaId(null);
  };

  const handleSelectDemoUser = (targetUid: string) => {
    setUserId(targetUid);
    saveCurrentUserId(targetUid);
    setIsLoggedOut(false);
    const store = loadUserData(targetUid);
    setProfile(store.profile);
    setGoals(store.goals);
    setIdeas(store.ideas);
    setSelectedIdeaId(null);
    if (!store.profile.onboardingDone) {
      setOnboardingOpen(true);
    }
  };

  const handleDeleteDemoUser = (targetUid: string) => {
    deleteUserData(targetUid);
    const remaining = listSavedDemoUsers();
    setSavedUsers(remaining);
    if (userId === targetUid) {
      if (remaining.length > 0) {
        handleSelectDemoUser(remaining[0].uid);
      } else {
        handleLogOut();
      }
    }
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

  // Section G.2: If logged out, show simple welcome screen
  if (isLoggedOut) {
    return (
      <WelcomeScreen
        onStartWithUser={handleStartWithUser}
        onTrySampleData={handleTrySampleData}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors overflow-x-hidden">
      {/* Header: Menu on far left, logo/name in centre, search on far right */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        onGoToBoard={() => {
          setCurrentView('board');
          handleCloseSearch();
        }}
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

      {/* Slide-in Overlay Sidebar */}
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
        onToggleDarkMode={handleToggleDarkMode}
        onOpenSwitchUser={() => {
          setSidebarOpen(false);
          setSavedUsers(listSavedDemoUsers());
          setSwitchUserModalOpen(true);
        }}
        onLogOut={handleLogOut}
      />

      {/* Main Views */}
      <main className="flex-1 pb-24 md:pb-12">
        {currentView === 'board' && (
          <BoardView
            ideas={filteredIdeas}
            profile={profile}
            goals={goals}
            onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
            onPinBucket={handlePinBucket}
            onStatusChange={handleStatusChange}
            onRetryAiScoring={(idea) => triggerAiScoring(idea, profile, goals)}
            onDeleteIdea={handleDeleteIdea}
            onOpenQuickCapture={() => setQuickCaptureOpen(true)}
            aiEnabled={aiEnabled}
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
            aiEnabled={aiEnabled}
            onToggleAi={handleToggleAi}
            onDone={() => setCurrentView('board')}
          />
        )}
      </main>

      {/* Floating "+" round button fixed above bottom safe area on EVERY page */}
      <button
        onClick={() => setQuickCaptureOpen(true)}
        title="Add Idea (Shortcut: N)"
        aria-label="Add Idea"
        className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] right-4 sm:right-6 z-40 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
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
        aiEnabled={aiEnabled}
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
        aiEnabled={aiEnabled}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onComplete={handleOnboardingComplete}
        initialProfile={profile}
        initialGoals={goals}
      />

      <SwitchUserModal
        isOpen={switchUserModalOpen}
        onClose={() => setSwitchUserModalOpen(false)}
        users={savedUsers}
        currentUserId={userId}
        onSelectUser={handleSelectDemoUser}
        onNewUser={() => {
          setSwitchUserModalOpen(false);
          handleLogOut();
        }}
        onNewUserWithName={(name) => {
          handleStartWithUser(name);
        }}
        onDeleteUser={handleDeleteDemoUser}
      />
    </div>
  );
}
