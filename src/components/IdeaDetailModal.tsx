import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  Target,
  ArrowRight,
  Clock,
  Flame,
  HelpCircle,
  Link as LinkIcon,
  Trash2,
  Check,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  ListTodo,
} from 'lucide-react';
import {
  FieldTag,
  Goal,
  Idea,
  IdeaStatus,
  NextStep,
  UserProfile,
} from '../types';
import { getFieldTagColor, getScoreBadgeClass, getBucketDetails } from '../utils/colors';
import { calculateIdeaScore } from '../shared/scoring';
import { suggestNextStepsWithAi } from '../services/api';
import { ConfirmModal } from './ConfirmModal';

interface IdeaDetailModalProps {
  idea: Idea | null;
  profile: UserProfile;
  goals: Goal[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateIdea: (updatedIdea: Idea) => void;
  onDeleteIdea: (ideaId: string) => void;
  onReScoreWithAi: (idea: Idea) => Promise<void>;
  isAiScoring: boolean;
  aiEnabled: boolean;
}

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  profile,
  goals,
  isOpen,
  onClose,
  onUpdateIdea,
  onDeleteIdea,
  onReScoreWithAi,
  isAiScoring,
  aiEnabled,
}) => {
  const [formData, setFormData] = useState<Idea | null>(null);
  const [activeTab, setActiveTab] = useState<'scores' | 'reasoning' | 'questions' | 'notes' | 'links'>('scores');
  const [newNote, setNewNote] = useState('');
  const [newLink, setNewLink] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Next steps checklist state
  const [hideCompletedSteps, setHideCompletedSteps] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepText, setEditingStepText] = useState('');
  const [isSuggestingSteps, setIsSuggestingSteps] = useState(false);

  const initialSnapshotRef = useRef<string>('');
  const openedIdeaIdRef = useRef<string | null>(null);
  const lastScoredAtRef = useRef<number | undefined>(undefined);

  // Opening an idea makes a draft copy.
  // Requirement 1: when the open idea's lastScoredAt changes, copy the AI-owned fields from the updated idea into formData and initialSnapshotRef:
  // aiReasoning, followUpQuestions, aiSuggestedScores, nextSteps, scoresSource, aiError, isAiScoring, priorityScore, scoreBreakdown, and any score or goal fit the user has NOT edited.
  // Keep the user's unsaved edits and typed answers.
  useEffect(() => {
    if (isOpen && idea) {
      if (openedIdeaIdRef.current !== idea.id) {
        const copy: Idea = JSON.parse(JSON.stringify(idea));
        if (!copy.nextSteps || copy.nextSteps.length === 0) {
          copy.nextSteps = copy.nextAction
            ? [{ id: `step-${copy.id}-0`, text: copy.nextAction, done: false, userEdited: false }]
            : [];
        }
        setFormData(copy);
        initialSnapshotRef.current = JSON.stringify(copy);
        openedIdeaIdRef.current = idea.id;
        lastScoredAtRef.current = idea.lastScoredAt;
        setShowBreakdown(false);
        setHideCompletedSteps(false);
        setNewStepText('');
        setEditingStepId(null);

        const answersMap: Record<string, string> = {};
        idea.followUpAnswers?.forEach((qa) => {
          answersMap[qa.question] = qa.answer;
        });
        setQuestionAnswers(answersMap);
      } else if (idea.lastScoredAt !== lastScoredAtRef.current && idea.lastScoredAt != null) {
        lastScoredAtRef.current = idea.lastScoredAt;

        setFormData((prevDraft) => {
          if (!prevDraft) return null;

          const userOverrides = prevDraft.userEditedScores || {};
          const userGoalFits = userOverrides.goalFits || {};

          // Copy scores that user has NOT edited
          const mergedImpact = userOverrides.impact != null ? prevDraft.impact : idea.impact;
          const mergedUrgency = userOverrides.urgency != null ? prevDraft.urgency : idea.urgency;
          const mergedSkillMatch = userOverrides.skillMatch != null ? prevDraft.skillMatch : idea.skillMatch;
          const mergedEffort = userOverrides.effort != null ? prevDraft.effort : idea.effort;
          const mergedConfidence = userOverrides.confidence != null ? prevDraft.confidence : idea.confidence;
          const mergedHours = userOverrides.hoursPerWeekNeeded != null ? prevDraft.hoursPerWeekNeeded : idea.hoursPerWeekNeeded;
          const mergedFieldTag = userOverrides.fieldTag != null ? prevDraft.fieldTag : idea.fieldTag;

          // Goal fits: preserve user-edited goal fits, use incoming idea goal fits for non-edited
          const mergedGoalLinks = (idea.goalLinks || []).map((gl) => ({
            ...gl,
            fit: userGoalFits[gl.goalId] != null ? userGoalFits[gl.goalId] : gl.fit,
          }));

          const updatedDraft: Idea = {
            ...prevDraft, // keeps user edits: title, notes, links, excitement, etc.
            impact: mergedImpact,
            urgency: mergedUrgency,
            skillMatch: mergedSkillMatch,
            effort: mergedEffort,
            confidence: mergedConfidence,
            hoursPerWeekNeeded: mergedHours,
            fieldTag: mergedFieldTag,
            goalLinks: mergedGoalLinks,
            aiReasoning: idea.aiReasoning,
            followUpQuestions: idea.followUpQuestions,
            aiSuggestedScores: idea.aiSuggestedScores,
            nextSteps: idea.nextSteps || prevDraft.nextSteps,
            nextAction: idea.nextAction || prevDraft.nextAction,
            scoresSource: idea.scoresSource,
            aiError: idea.aiError,
            isAiScoring: idea.isAiScoring,
            priorityScore: idea.priorityScore,
            scoreBreakdown: idea.scoreBreakdown,
            lastScoredAt: idea.lastScoredAt,
          };

          try {
            const baseline = JSON.parse(initialSnapshotRef.current || '{}');
            const updatedBaseline = {
              ...baseline,
              impact: mergedImpact,
              urgency: mergedUrgency,
              skillMatch: mergedSkillMatch,
              effort: mergedEffort,
              confidence: mergedConfidence,
              hoursPerWeekNeeded: mergedHours,
              fieldTag: mergedFieldTag,
              goalLinks: mergedGoalLinks,
              aiReasoning: idea.aiReasoning,
              followUpQuestions: idea.followUpQuestions,
              aiSuggestedScores: idea.aiSuggestedScores,
              nextSteps: idea.nextSteps || baseline.nextSteps,
              nextAction: idea.nextAction || baseline.nextAction,
              scoresSource: idea.scoresSource,
              aiError: idea.aiError,
              isAiScoring: idea.isAiScoring,
              priorityScore: idea.priorityScore,
              scoreBreakdown: idea.scoreBreakdown,
              lastScoredAt: idea.lastScoredAt,
            };
            initialSnapshotRef.current = JSON.stringify(updatedBaseline);
          } catch (e) {
            initialSnapshotRef.current = JSON.stringify(updatedDraft);
          }

          return updatedDraft;
        });
      } else {
        // Keep live isAiScoring / aiError flags in sync
        setFormData((prevDraft) => {
          if (!prevDraft) return null;
          if (prevDraft.isAiScoring !== idea.isAiScoring || prevDraft.aiError !== idea.aiError) {
            return {
              ...prevDraft,
              isAiScoring: idea.isAiScoring,
              aiError: idea.aiError,
            };
          }
          return prevDraft;
        });
      }
    } else if (!isOpen) {
      openedIdeaIdRef.current = null;
      lastScoredAtRef.current = undefined;
      setFormData(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, idea]);

  // Compute if draft is dirty
  const isDirty = useMemo(() => {
    if (!formData || !initialSnapshotRef.current) return false;
    return JSON.stringify(formData) !== initialSnapshotRef.current;
  }, [formData]);

  // Priority score and breakdown update live from the draft as sliders move, labelled "Preview" until saved
  const { previewScore, previewBreakdown } = useMemo(() => {
    if (!formData) {
      return { previewScore: 0, previewBreakdown: null };
    }
    const activeGoals = goals.filter((g) => g.status === 'active');
    const { priorityScore, scoreBreakdown } = calculateIdeaScore(
      formData,
      profile,
      activeGoals
    );
    return { previewScore: priorityScore, previewBreakdown: scoreBreakdown };
  }, [formData, profile, goals]);

  // Section A: X and Cancel close immediately and throw away the draft. No confirmation question.
  const handleRequestClose = () => {
    onClose();
  };

  // Keyboard shortcut: Esc closes immediately and throws away draft
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !formData) return null;

  // Section A: Save saves the draft, then closes the idea
  // If the user sets the sliders themselves and presses Save on an unscored idea, it becomes scoresSource 'user' and shows its score normally.
  const handleSave = () => {
    if (!formData) return;
    const isUnscored = formData.scoresSource === 'unscored';
    const toSave: Idea = {
      ...formData,
      scoresSource: isUnscored ? 'user' : formData.scoresSource,
      priorityScore: previewScore,
      scoreBreakdown: previewBreakdown || formData.scoreBreakdown,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateIdea(toSave);
    onClose();
  };

  // Score Slider change (updates local draft ONLY)
  const handleScoreChange = (field: keyof Idea, value: number) => {
    const updatedUserOverrides = {
      ...formData.userEditedScores,
      [field]: value,
    };
    setFormData({
      ...formData,
      [field]: value,
      userEditedScores: updatedUserOverrides,
      scoresSource: 'user',
    });
  };

  // Goal fit slider change (updates local draft ONLY and tracks override)
  const handleGoalFitChange = (goalId: string, fit: number) => {
    const currentLinks = formData.goalLinks || [];
    const exists = currentLinks.some((gl) => gl.goalId === goalId);
    let updatedLinks;
    if (exists) {
      updatedLinks = currentLinks.map((gl) =>
        gl.goalId === goalId ? { ...gl, fit } : gl
      );
    } else {
      updatedLinks = [...currentLinks, { goalId, fit }];
    }

    const updatedUserOverrides = {
      ...formData.userEditedScores,
      goalFits: {
        ...(formData.userEditedScores?.goalFits || {}),
        [goalId]: fit,
      },
    };

    setFormData({
      ...formData,
      goalLinks: updatedLinks,
      userEditedScores: updatedUserOverrides,
      scoresSource: 'user',
    });
  };

  // Adopt AI suggested score (updates local draft ONLY)
  const handleAdoptAiScore = (field: keyof Idea, value: any) => {
    const updatedOverrides = { ...formData.userEditedScores };
    delete (updatedOverrides as any)[field];
    setFormData({
      ...formData,
      [field]: value,
      userEditedScores: updatedOverrides,
    });
  };

  // Adopt AI suggested goal fit (updates local draft ONLY)
  const handleAdoptGoalFit = (goalId: string, fit: number) => {
    const currentLinks = formData.goalLinks || [];
    const exists = currentLinks.some((gl) => gl.goalId === goalId);
    const updatedLinks = exists
      ? currentLinks.map((gl) => (gl.goalId === goalId ? { ...gl, fit } : gl))
      : [...currentLinks, { goalId, fit }];

    const updatedGoalFits = { ...(formData.userEditedScores?.goalFits || {}) };
    delete updatedGoalFits[goalId];

    setFormData({
      ...formData,
      goalLinks: updatedLinks,
      userEditedScores: {
        ...formData.userEditedScores,
        goalFits: updatedGoalFits,
      },
    });
  };

  // Add note (updates local draft ONLY)
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const note = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      createdAt: Date.now(),
    };
    setFormData({
      ...formData,
      notes: [...(formData.notes || []), note],
    });
    setNewNote('');
  };

  // Add link (updates local draft ONLY)
  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.trim()) return;
    let url = newLink.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    setFormData({
      ...formData,
      links: [...(formData.links || []), url],
    });
    setNewLink('');
  };

  // Remove link (updates local draft ONLY)
  const handleRemoveLink = (urlToRemove: string) => {
    setFormData({
      ...formData,
      links: (formData.links || []).filter((l) => l !== urlToRemove),
    });
  };

  // Next steps checklist handlers (updates local draft; saved on Save)
  const handleToggleStep = (stepId: string) => {
    if (!formData) return;
    const existingSteps = formData.nextSteps || [];
    const target = existingSteps.find((s) => s.id === stepId);
    if (!target) return;

    const willBeDone = !target.done;
    const newSteps = existingSteps.map((s) =>
      s.id === stepId ? { ...s, done: willBeDone } : s
    );

    // A ticked step is added to the Activity Log as done and counts as activity
    let updatedNotes = formData.notes || [];
    if (willBeDone) {
      const noteItem = {
        id: `note-${Date.now()}`,
        text: `Completed step: ${target.text}`,
        createdAt: Date.now(),
      };
      updatedNotes = [...updatedNotes, noteItem];
    }

    const firstUnticked = newSteps.find((s) => !s.done);
    setFormData({
      ...formData,
      nextSteps: newSteps,
      nextAction: firstUnticked?.text || '',
      notes: updatedNotes,
      lastActivityAt: Date.now(),
    });
  };

  const handleSaveEditStep = (stepId: string) => {
    if (!formData || !editingStepText.trim()) {
      setEditingStepId(null);
      return;
    }
    const newSteps = (formData.nextSteps || []).map((s) =>
      s.id === stepId ? { ...s, text: editingStepText.trim(), userEdited: true } : s
    );
    const firstUnticked = newSteps.find((s) => !s.done);
    setFormData({
      ...formData,
      nextSteps: newSteps,
      nextAction: firstUnticked?.text || '',
    });
    setEditingStepId(null);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!formData) return;
    const newSteps = (formData.nextSteps || []).filter((s) => s.id !== stepId);
    const firstUnticked = newSteps.find((s) => !s.done);
    setFormData({
      ...formData,
      nextSteps: newSteps,
      nextAction: firstUnticked?.text || '',
    });
  };

  const handleAddCustomStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !newStepText.trim()) return;
    const newStep: NextStep = {
      id: `step-${Date.now()}`,
      text: newStepText.trim(),
      done: false,
      userEdited: true,
    };
    const newSteps = [...(formData.nextSteps || []), newStep];
    const firstUnticked = newSteps.find((s) => !s.done);
    setFormData({
      ...formData,
      nextSteps: newSteps,
      nextAction: firstUnticked?.text || '',
    });
    setNewStepText('');
  };

  const handleSuggestNextSteps = async () => {
    if (!aiEnabled) return;
    if (!formData) return;
    // Saves the draft first
    const toSave: Idea = {
      ...formData,
      priorityScore: previewScore,
      scoreBreakdown: previewBreakdown || formData.scoreBreakdown,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateIdea(toSave);
    initialSnapshotRef.current = JSON.stringify(toSave);
    setFormData(toSave);

    setIsSuggestingSteps(true);
    try {
      const activeGoals = goals.filter((g) => g.status === 'active');
      const completedList = (toSave.nextSteps || []).filter((s) => s.done).map((s) => s.text);
      const res = await suggestNextStepsWithAi(profile, activeGoals, toSave, completedList);
      if (res.success && res.data?.nextSteps) {
        const freshSteps: NextStep[] = res.data.nextSteps.map((txt, idx) => ({
          id: `step-${Date.now()}-${idx}`,
          text: txt,
          done: false,
          userEdited: false,
        }));
        const mergedSteps = [...(toSave.nextSteps || []), ...freshSteps];
        const updatedIdea: Idea = {
          ...toSave,
          nextSteps: mergedSteps,
          nextAction: freshSteps[0]?.text || '',
          lastActivityAt: Date.now(),
          updatedAt: Date.now(),
        };
        onUpdateIdea(updatedIdea);
        setFormData(updatedIdea);
        initialSnapshotRef.current = JSON.stringify(updatedIdea);
      }
    } catch (e) {
      console.error('Error suggesting next steps:', e);
    } finally {
      setIsSuggestingSteps(false);
    }
  };

  // "Re-score with AI" and "Submit & Re-score" save the draft first, then call the AI
  const handleReScoreWithAi = async () => {
    if (!formData) return;
    const toSave: Idea = {
      ...formData,
      priorityScore: previewScore,
      scoreBreakdown: previewBreakdown || formData.scoreBreakdown,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateIdea(toSave);
    initialSnapshotRef.current = JSON.stringify(toSave);
    setFormData(toSave);
    await onReScoreWithAi(toSave);
  };

  // Requirement: One "Submit answers & Re-score" button submits all newly answered questions,
  // saves answers into the idea, clears the input boxes, and calls AI re-score.
  const handleSubmitAllAnswersAndReScore = async () => {
    if (!formData) return;
    const answeredEntries = Object.entries(questionAnswers).filter(
      ([, ans]) => ans && ans.trim().length > 0
    );
    if (answeredEntries.length === 0) return;

    const existingAnswers = formData.followUpAnswers || [];
    const updatedQA = [...existingAnswers];

    for (const [q, ans] of answeredEntries) {
      const idx = updatedQA.findIndex((item) => item.question === q);
      if (idx >= 0) {
        updatedQA[idx] = { question: q, answer: ans.trim(), answeredAt: Date.now() };
      } else {
        updatedQA.push({ question: q, answer: ans.trim(), answeredAt: Date.now() });
      }
    }

    // Clear answered input boxes
    setQuestionAnswers({});

    // Filter out newly answered questions from pending followUpQuestions
    const answeredSet = new Set(updatedQA.map((qa) => qa.question));
    const remainingPendingQuestions = (formData.followUpQuestions || []).filter(
      (q) => !answeredSet.has(q)
    );

    const toSave: Idea = {
      ...formData,
      followUpQuestions: remainingPendingQuestions,
      followUpAnswers: updatedQA,
      priorityScore: previewScore,
      scoreBreakdown: previewBreakdown || formData.scoreBreakdown,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };

    onUpdateIdea(toSave);
    initialSnapshotRef.current = JSON.stringify(toSave);
    setFormData(toSave);

    await onReScoreWithAi(toSave);
  };

  const breakdown = previewBreakdown || formData.scoreBreakdown || {
    goalFit: 0,
    normalizedImpact: 0,
    normalizedUrgency: 0,
    normalizedSkillMatch: 0,
    normalizedExcitement: 0,
    normalizedEffort: 0,
    normalizedConfidence: 0,
    value: 0,
    effortPenalty: 1,
    confidenceFactor: 1,
    priorityScore: previewScore,
  };

  const tagColor = getFieldTagColor(formData.fieldTag);
  const bucketDetails = getBucketDetails(formData.bucket);

  const getEffortLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'A weekend';
      case 2:
        return 'About a week';
      case 3:
        return 'A few weeks';
      case 4:
        return 'A couple of months';
      case 5:
        return 'Many months';
      default:
        return '';
    }
  };

  return (
    <>
      <div
        onClick={handleRequestClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-hidden md:overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-full md:h-auto md:max-h-[90dvh] max-w-4xl bg-white dark:bg-slate-900 rounded-none md:rounded-3xl shadow-2xl border-0 md:border md:border-slate-200 dark:md:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        >
          {/* Modal Top Header */}
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {/* Field Tag selector */}
                <select
                  value={formData.fieldTag}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      fieldTag: e.target.value as FieldTag,
                    });
                  }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none cursor-pointer ${tagColor.bg} ${tagColor.text} ${tagColor.border}`}
                >
                  {[
                    'Tech',
                    'Business',
                    'Finance',
                    'Creative',
                    'Health',
                    'Learning',
                    'Social',
                    'Other',
                  ].map((tag) => (
                    <option key={tag} value={tag} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {tag}
                    </option>
                  ))}
                </select>

                {/* Status Selector */}
                <select
                  value={formData.status}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      status: e.target.value as IdeaStatus,
                    });
                  }}
                  className="text-xs font-medium px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none capitalize cursor-pointer"
                >
                  <option value="idea">Idea (Backlog)</option>
                  <option value="in_progress">In Progress</option>
                  <option value="paused">Paused (Parked)</option>
                  <option value="done">Done (Archive)</option>
                  <option value="dropped">Dropped (Archive)</option>
                </select>

                {/* Hand-placed indicator: An idea moved by hand shows only a small line in its detail view */}
                {formData.pinnedBucket != null && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                    <span>
                      Placed in <strong className="capitalize text-slate-800 dark:text-slate-200">{formData.pinnedBucket}</strong> by you
                    </span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          pinnedBucket: null,
                        });
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Let MessIdea decide
                    </button>
                  </div>
                )}
              </div>

              {/* Editable Title */}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                }}
                className="w-full text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Idea Title..."
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Score & Bucket Summary Badge */}
              <div className="flex flex-col items-end">
                {formData.isAiScoring ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Scoring…</span>
                  </div>
                ) : aiEnabled && !formData.lastScoredAt ? (
                  <button
                    type="button"
                    onClick={handleReScoreWithAi}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Score with AI
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {aiEnabled && (
                      <button
                        type="button"
                        onClick={handleReScoreWithAi}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500"
                        title="Re-score with AI"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                    <div
                      className={`px-3 py-1 rounded-xl text-base font-extrabold ${getScoreBadgeClass(
                        previewScore
                      )}`}
                    >
                      {previewScore}/100
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-xs uppercase font-bold ${bucketDetails.badgeText}`}>
                    Bucket: {formData.bucket}
                  </span>
                  {isDirty && formData.scoresSource !== 'unscored' && (
                    <span className="text-xs px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Preview
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button X (closes immediately and throws away draft) */}
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs Navigation: Horizontal scroll on mobile */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none shrink-0">
            {[
              { id: 'scores', label: 'Scores & Formula' },
              { id: 'reasoning', label: 'AI Reasoning & Next Action' },
              {
                id: 'questions',
                label: `Follow-up Questions ${
                  (() => {
                    const answered = new Set((formData.followUpAnswers || []).map((a) => a.question));
                    const pending = (formData.followUpQuestions || []).filter((q) => !answered.has(q));
                    return pending.length > 0 ? `(${pending.length})` : '';
                  })()
                }`,
              },
              {
                id: 'notes',
                label: `Notes (${(formData.notes || []).length})`,
              },
              {
                id: 'links',
                label: `Links (${(formData.links || []).length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-3 min-h-[44px] text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Editable Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description & Context
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                }}
                placeholder="What is this idea about? What problem does it solve?"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            {/* TAB 1: Scores & Sliders & Collapsible Formula Breakdown */}
            {activeTab === 'scores' && (
              <div className="space-y-6">
                {/* Sliders Grid */}
                <div className="space-y-5">
                  {/* Linked Goals Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Target className="w-3.5 h-3.5 text-blue-500" />
                        Goal Fit (1 to 5)
                      </h4>
                      <span className="text-xs text-slate-500">
                        Dominates formula (40% weight)
                      </span>
                    </div>

                    {goals.filter((g) => g.status === 'active').length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        No active goals created yet. Create goals in the Goals tab to score ideas against them.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {goals
                          .filter((g) => g.status === 'active')
                          .map((goal) => {
                            const link = formData.goalLinks?.find(
                              (gl) => gl.goalId === goal.id
                            );
                            const fit = link ? link.fit : 1;
                            const aiSuggestedFit = formData.aiSuggestedScores?.goalFits?.[goal.id];
                            const hasUserGoalOverride = formData.userEditedScores?.goalFits?.[goal.id] != null;
                            const showGoalAdopt =
                              aiSuggestedFit != null &&
                              hasUserGoalOverride &&
                              aiSuggestedFit !== fit;

                            return (
                              <div key={goal.id} className="text-xs">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                                    {goal.title}{' '}
                                    <span className="text-slate-400 text-xs">
                                      ({goal.importance}★ • {goal.horizon})
                                    </span>
                                  </span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    Fit: {fit}/5
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={fit}
                                  onChange={(e) =>
                                    handleGoalFitChange(goal.id, Number(e.target.value))
                                  }
                                  className="w-full accent-blue-600 cursor-pointer"
                                />
                                {showGoalAdopt && (
                                  <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded mt-1">
                                    <span>AI suggested: {aiSuggestedFit}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleAdoptGoalFit(goal.id, aiSuggestedFit)}
                                      className="underline font-bold cursor-pointer"
                                    >
                                      Adopt
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Standard Score Sliders in responsive grid */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Idea Attributes (1 to 5)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Impact */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Impact (Payoff)
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {formData.impact}/5{' '}
                            <span className="text-slate-400 font-normal">
                              {formData.impact === 1 ? '(Tiny)' : formData.impact === 5 ? '(Life-changing)' : ''}
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={formData.impact}
                          onChange={(e) => handleScoreChange('impact', Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        {formData.aiSuggestedScores?.impact != null &&
                          formData.userEditedScores?.impact != null &&
                          formData.aiSuggestedScores.impact !== formData.impact && (
                            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              <span>AI suggested: {formData.aiSuggestedScores.impact}</span>
                              <button
                                type="button"
                                onClick={() => handleAdoptAiScore('impact', formData.aiSuggestedScores!.impact)}
                                className="underline font-bold cursor-pointer"
                              >
                                Adopt
                              </button>
                            </div>
                          )}
                      </div>

                      {/* Urgency */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Urgency (Time sensitivity)
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {formData.urgency}/5{' '}
                            <span className="text-slate-400 font-normal">
                              {formData.urgency === 1 ? '(Can wait)' : formData.urgency === 5 ? '(Window closes)' : ''}
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={formData.urgency}
                          onChange={(e) => handleScoreChange('urgency', Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        {formData.aiSuggestedScores?.urgency != null &&
                          formData.userEditedScores?.urgency != null &&
                          formData.aiSuggestedScores.urgency !== formData.urgency && (
                            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              <span>AI suggested: {formData.aiSuggestedScores.urgency}</span>
                              <button
                                type="button"
                                onClick={() => handleAdoptAiScore('urgency', formData.aiSuggestedScores!.urgency)}
                                className="underline font-bold cursor-pointer"
                              >
                                Adopt
                              </button>
                            </div>
                          )}
                      </div>

                      {/* Skill Match */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Skill Match (Current expertise)
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {formData.skillMatch}/5{' '}
                            <span className="text-slate-400 font-normal">
                              {formData.skillMatch === 1 ? '(New skills)' : formData.skillMatch === 5 ? '(Already skilled)' : ''}
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={formData.skillMatch}
                          onChange={(e) => handleScoreChange('skillMatch', Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        {formData.aiSuggestedScores?.skillMatch != null &&
                          formData.userEditedScores?.skillMatch != null &&
                          formData.aiSuggestedScores.skillMatch !== formData.skillMatch && (
                            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              <span>AI suggested: {formData.aiSuggestedScores.skillMatch}</span>
                              <button
                                type="button"
                                onClick={() => handleAdoptAiScore('skillMatch', formData.aiSuggestedScores!.skillMatch)}
                                className="underline font-bold cursor-pointer"
                              >
                                Adopt
                              </button>
                            </div>
                          )}
                      </div>

                      {/* Excitement (USER ONLY) */}
                      <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            Excitement (User-only)
                          </span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {formData.excitement}/5
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={formData.excitement}
                          onChange={(e) => handleScoreChange('excitement', Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Effort */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Effort (Penalty)
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            Level {formData.effort}/5{' '}
                            <span className="text-slate-500 dark:text-slate-400 font-normal">
                              ({getEffortLabel(formData.effort)})
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={formData.effort}
                          onChange={(e) => handleScoreChange('effort', Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        {formData.aiSuggestedScores?.effort != null &&
                          formData.userEditedScores?.effort != null &&
                          formData.aiSuggestedScores.effort !== formData.effort && (
                            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              <span>AI suggested: {formData.aiSuggestedScores.effort} ({getEffortLabel(formData.aiSuggestedScores.effort)})</span>
                              <button
                                type="button"
                                onClick={() => handleAdoptAiScore('effort', formData.aiSuggestedScores!.effort)}
                                className="underline font-bold cursor-pointer"
                              >
                                Adopt
                              </button>
                            </div>
                          )}
                      </div>

                      {/* Confidence */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Confidence in Estimates
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {formData.confidence}/5{' '}
                            <span className="text-slate-400 font-normal">
                              {formData.confidence === 1 ? '(Wild guess)' : formData.confidence === 5 ? '(Tested)' : ''}
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={formData.confidence}
                          onChange={(e) => handleScoreChange('confidence', Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        {formData.aiSuggestedScores?.confidence != null &&
                          formData.userEditedScores?.confidence != null &&
                          formData.aiSuggestedScores.confidence !== formData.confidence && (
                            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              <span>AI suggested: {formData.aiSuggestedScores.confidence}</span>
                              <button
                                type="button"
                                onClick={() => handleAdoptAiScore('confidence', formData.aiSuggestedScores!.confidence)}
                                className="underline font-bold cursor-pointer"
                              >
                                Adopt
                              </button>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Hours per Week Needed */}
                    <div className="space-y-1 pt-1 max-w-sm">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          Hours Per Week Needed
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formData.hoursPerWeekNeeded}h / week
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={Math.max(20, profile.hoursPerWeek * 1.5)}
                        step={1}
                        value={formData.hoursPerWeekNeeded}
                        onChange={(e) =>
                          handleScoreChange('hoursPerWeekNeeded', Number(e.target.value))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      {formData.aiSuggestedScores?.hoursPerWeekNeeded != null &&
                        formData.userEditedScores?.hoursPerWeekNeeded != null &&
                        formData.aiSuggestedScores.hoursPerWeekNeeded !== formData.hoursPerWeekNeeded && (
                          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                            <span>AI suggested: {formData.aiSuggestedScores.hoursPerWeekNeeded}h</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleAdoptAiScore('hoursPerWeekNeeded', formData.aiSuggestedScores!.hoursPerWeekNeeded)
                              }
                              className="underline font-bold cursor-pointer"
                            >
                              Adopt
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Section E: Collapsible Formula Breakdown Panel */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBreakdown((prev) => !prev)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <span className="font-bold">
                      Show how this score works {showBreakdown ? '▴' : '▾'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {showBreakdown ? 'Hide formula' : 'Expand calculation breakdown'}
                    </span>
                  </button>

                  {showBreakdown && (
                    <div className="mt-3 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4 animate-in fade-in-50 duration-150">
                      {formData.scoresSource === 'unscored' ? (
                        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                          {formData.isAiScoring
                            ? 'AI is currently calculating scores for this idea. The formula breakdown will appear once complete.'
                            : 'No scores calculated yet. Once AI scoring finishes or you set scores manually and click Save, the formula breakdown will appear here.'}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/60">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <span>Formula Breakdown</span>
                            {isDirty && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                                (Preview)
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Value = Σ(weight × score) × EffortPenalty × Uncertainty
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreBadgeClass(
                            previewScore
                          )}`}
                        >
                          {previewScore}/100
                        </div>
                      </div>

                      {/* Breakdown Bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* GoalFit (40%) */}
                        <div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                            <span>Goal Fit (40% wt)</span>
                            <span className="font-mono font-semibold">
                              {(breakdown.goalFit * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, breakdown.goalFit * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Impact (20%) */}
                        <div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                            <span>Impact (20% wt)</span>
                            <span className="font-mono font-semibold">
                              {(breakdown.normalizedImpact * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, breakdown.normalizedImpact * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Urgency (15%) */}
                        <div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                            <span>Urgency (15% wt)</span>
                            <span className="font-mono font-semibold">
                              {(breakdown.normalizedUrgency * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, breakdown.normalizedUrgency * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Skill Match (15%) */}
                        <div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                            <span>Skill Match (15% wt)</span>
                            <span className="font-mono font-semibold">
                              {(breakdown.normalizedSkillMatch * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, breakdown.normalizedSkillMatch * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Excitement (10%) */}
                        <div className="sm:col-span-2">
                          <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                            <span>Excitement (10% wt)</span>
                            <span className="font-mono font-semibold">
                              {(breakdown.normalizedExcitement * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, breakdown.normalizedExcitement * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Multipliers Box */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Base Value (weighted):</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {(breakdown.value * 100).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Effort Penalty:</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            ×{breakdown.effortPenalty.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Uncertainty factor:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            ×{breakdown.confidenceFactor.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-xs text-blue-800 dark:text-blue-300">
                          <strong>Rule:</strong>{' '}
                          {breakdown.goalFit < 0.2
                            ? 'GoalFit < 0.20 → Automatically placed in Parked.'
                            : previewScore >= 55
                            ? 'Score ≥ 55 → Qualified for Now column (subject to weekly hours budget).'
                            : previewScore >= 40
                            ? 'Score 40-100 → Positioned in Next column.'
                            : previewScore >= 20
                            ? 'Score 20-39 → Positioned in Later column.'
                            : 'Score < 20 → Parked.'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
                </div>
              </div>
            )}

            {/* TAB 2: AI Reasoning & Action */}
            {activeTab === 'reasoning' && (
              <div className="space-y-5">
                {/* AI Reasoning Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-slate-800 dark:to-slate-800/60 border border-blue-200/80 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      AI Reasoning
                    </h4>
                    <span className="text-xs text-slate-500">
                      Calibrated to your goals & available hours
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {formData.aiReasoning ||
                      'Click "Re-score with AI" to generate customized reasoning analyzing trade-offs against your active profile and goals.'}
                  </p>
                </div>

                {/* Next Steps Checklist */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <ListTodo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Next Steps
                      </h4>
                      {formData.nextSteps && formData.nextSteps.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {formData.nextSteps.filter((s) => s.done).length}/{formData.nextSteps.length} done
                        </span>
                      )}
                    </div>
                    {formData.nextSteps && formData.nextSteps.some((s) => s.done) && (
                      <button
                        type="button"
                        onClick={() => setHideCompletedSteps(!hideCompletedSteps)}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        {hideCompletedSteps ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Show completed
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Hide completed
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Concrete, sequential steps taking under 2 hours each. Check off as you make progress.
                  </p>

                  {/* Steps List */}
                  <div className="space-y-2">
                    {(!formData.nextSteps || formData.nextSteps.length === 0) && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                        No steps added yet. Add a step below or click &quot;Suggest next steps with AI&quot;.
                      </p>
                    )}

                    {formData.nextSteps
                      ?.filter((s) => (hideCompletedSteps ? !s.done : true))
                      .map((step) => {
                        const isEditing = editingStepId === step.id;
                        return (
                          <div
                            key={step.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${
                              step.done
                                ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                                : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {/* Tick checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleStep(step.id)}
                              className="mt-0.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0 cursor-pointer"
                              title={step.done ? 'Mark step as incomplete' : 'Mark step as completed'}
                            >
                              {step.done ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                              )}
                            </button>

                            {/* Step Text or Inline Edit */}
                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingStepText}
                                  onChange={(e) => setEditingStepText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditStep(step.id);
                                    if (e.key === 'Escape') setEditingStepId(null);
                                  }}
                                  autoFocus
                                  className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditStep(step.id)}
                                  className="px-2 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStepId(null)}
                                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                <span
                                  className={`text-xs leading-relaxed break-words ${
                                    step.done ? 'line-through text-slate-400 dark:text-slate-500' : ''
                                  }`}
                                >
                                  {step.text}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStepId(step.id);
                                      setEditingStepText(step.text);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                                    title="Edit step"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                                    title="Delete step"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Add new custom step */}
                  <form onSubmit={handleAddCustomStep} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newStepText}
                      onChange={(e) => setNewStepText(e.target.value)}
                      placeholder="Add a custom next step (< 2 hours)..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newStepText.trim()}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </form>

                  {/* If all steps are ticked (or list is empty), show button "Suggest next steps with AI" */}
                  {formData.nextSteps &&
                    formData.nextSteps.length > 0 &&
                    formData.nextSteps.every((s) => s.done) && (
                      <div className="pt-2">
                        {aiEnabled ? (
                          <button
                            type="button"
                            onClick={handleSuggestNextSteps}
                            disabled={isSuggestingSteps}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isSuggestingSteps ? 'animate-spin' : ''}`} />
                            <span>
                              {isSuggestingSteps
                                ? 'Suggesting new steps...'
                                : 'All steps completed! Suggest next steps with AI'}
                            </span>
                          </button>
                        ) : (
                          <p className="text-xs text-slate-500 italic text-center py-2">
                            AI is off — turn it on in Settings
                          </p>
                        )}
                      </div>
                    )}
                </div>

                {/* Re-score AI trigger: Saves draft first then triggers AI */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Update AI Analysis
                    </h5>
                    <p className="text-xs text-slate-500">
                      Re-evaluates this idea against current goals, notes, and profile.
                    </p>
                  </div>
                  {aiEnabled ? (
                    <button
                      type="button"
                      onClick={handleReScoreWithAi}
                      disabled={isAiScoring}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAiScoring ? 'animate-spin' : ''}`} />
                      <span>{isAiScoring ? 'Scoring...' : 'Re-score with AI'}</span>
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      AI is off — turn it on in Settings
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Follow-up Questions */}
            {activeTab === 'questions' && (() => {
              const answeredList = formData.followUpAnswers || [];
              const answeredQuestionsSet = new Set(answeredList.map((a) => a.question));
              const pendingQuestions = (formData.followUpQuestions || []).filter(
                (q) => !answeredQuestionsSet.has(q)
              );
              const hasNewText = pendingQuestions.some(
                (q) => (questionAnswers[q] || '').trim().length > 0
              );

              return (
                <div className="space-y-5">
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-xl text-xs text-blue-900 dark:text-blue-300">
                    <strong>Clarifying Questions:</strong> When an idea is vague or uncertain, the AI raises up to 3 targeted questions. Answering them refines the confidence score and triggers an automatic re-score.
                  </div>

                  {/* All clear banner when answered > 0 and pending === 0 */}
                  {answeredList.length > 0 && pendingQuestions.length === 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All clear: no open questions.</span>
                    </div>
                  )}

                  {/* Pending Questions (Open questions first) */}
                  {pendingQuestions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                        <span>Clarifying Questions ({pendingQuestions.length})</span>
                      </h4>
                      <div className="space-y-3">
                        {pendingQuestions.map((q, idx) => {
                          const currentAnswer = questionAnswers[q] || '';
                          return (
                            <div
                              key={`pending-${idx}`}
                              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5"
                            >
                              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span>{q}</span>
                              </p>
                              <input
                                type="text"
                                placeholder="Type your answer..."
                                value={currentAnswer}
                                onChange={(e) =>
                                  setQuestionAnswers({
                                    ...questionAnswers,
                                    [q]: e.target.value,
                                  })
                                }
                                className="w-full px-3.5 py-2.5 min-h-[44px] text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Submit answers & Re-score button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSubmitAllAnswersAndReScore}
                          disabled={!hasNewText || isAiScoring || !aiEnabled}
                          className="px-5 py-2.5 min-h-[44px] text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isAiScoring ? 'animate-spin' : ''}`} />
                          <span>{aiEnabled ? (isAiScoring ? 'Re-scoring with answers…' : 'Submit answers & Re-score') : 'AI is off — turn it on in Settings'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Answered Questions (editable in draft) */}
                  {answeredList.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Answered ({answeredList.length})</span>
                      </h4>
                      <div className="space-y-3">
                        {answeredList.map((qa, idx) => (
                          <div
                            key={`answered-${idx}`}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>{qa.question}</span>
                              </p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                Answered
                              </span>
                            </div>
                            <input
                              type="text"
                              value={qa.answer}
                              onChange={(e) => {
                                const newAns = e.target.value;
                                const updated = answeredList.map((item, i) =>
                                  i === idx ? { ...item, answer: newAns } : item
                                );
                                setFormData({ ...formData, followUpAnswers: updated });
                              }}
                              className="w-full px-3.5 py-2.5 min-h-[44px] text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Edit your answer..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {answeredList.length === 0 && pendingQuestions.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No pending follow-up questions from the AI. The idea scope is currently clear.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB 4: Notes Log */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add quick progress note or milestone..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shrink-0 cursor-pointer"
                  >
                    Add Note
                  </button>
                </form>

                <div className="space-y-2">
                  {(formData.notes || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No notes recorded yet.
                    </p>
                  ) : (
                    formData.notes
                      .slice()
                      .reverse()
                      .map((note) => (
                        <div
                          key={note.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <p className="text-slate-800 dark:text-slate-200 mb-1">
                            {note.text}
                          </p>
                          <span className="text-xs text-slate-400">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Reference Links */}
            {activeTab === 'links' && (
              <div className="space-y-4">
                <form onSubmit={handleAddLink} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add URL (GitHub, Figma, Notion, Docs...)"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newLink.trim()}
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shrink-0 cursor-pointer"
                  >
                    Add Link
                  </button>
                </form>

                <div className="space-y-2">
                  {(formData.links || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No reference URLs added yet.
                    </p>
                  ) : (
                    formData.links.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline truncate mr-2 flex items-center gap-1.5"
                        >
                          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{link}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(link)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer fixed at bottom: Delete on the left; Cancel and blue Save on the right */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shrink-0 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))]">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {isDirty && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mr-1">
                  Unsaved changes
                </span>
              )}

              <button
                type="button"
                onClick={handleRequestClose}
                className="px-4 sm:px-5 py-2.5 min-h-[44px] text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isDirty}
                onClick={handleSave}
                className="px-5 sm:px-6 py-2.5 min-h-[44px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* In-app delete confirmation dialog */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete this idea?"
        message="Clearing space is part of the process. Every idea teaches you something."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteIdea(formData.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
