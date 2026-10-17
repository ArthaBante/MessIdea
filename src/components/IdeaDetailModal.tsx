import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Target,
  ArrowRight,
  Pin,
  Clock,
  Flame,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Link as LinkIcon,
  RotateCcw,
  Sliders,
  Trash2,
  AlertTriangle,
  Play,
  Check,
  Send,
  Zap,
} from 'lucide-react';
import {
  Bucket,
  FieldTag,
  Goal,
  Idea,
  IdeaStatus,
  UserProfile,
} from '../types';
import { getFieldTagColor, getScoreBadgeClass, getBucketDetails } from '../utils/colors';

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
}) => {
  const [formData, setFormData] = useState<Idea | null>(null);
  const [activeTab, setActiveTab] = useState<'scores' | 'reasoning' | 'questions' | 'notes' | 'links'>('scores');
  const [newNote, setNewNote] = useState('');
  const [newLink, setNewLink] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (idea) {
      setFormData({ ...idea });
      // Pre-fill existing answers
      const answersMap: Record<string, string> = {};
      idea.followUpAnswers?.forEach((qa) => {
        answersMap[qa.question] = qa.answer;
      });
      setQuestionAnswers(answersMap);
    }
  }, [idea]);

  if (!isOpen || !formData) return null;

  const handleScoreChange = (field: keyof Idea, value: number) => {
    const updatedUserOverrides = {
      ...formData.userEditedScores,
      [field]: value,
    };
    const updated = {
      ...formData,
      [field]: value,
      userEditedScores: updatedUserOverrides,
      scoresSource: 'user' as const,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFormData(updated);
    onUpdateIdea(updated);
  };

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
    const updated = {
      ...formData,
      goalLinks: updatedLinks,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFormData(updated);
    onUpdateIdea(updated);
  };

  const handleAdoptAiScore = (field: keyof Idea, value: any) => {
    const updatedOverrides = { ...formData.userEditedScores };
    delete (updatedOverrides as any)[field];
    const updated = {
      ...formData,
      [field]: value,
      userEditedScores: updatedOverrides,
      updatedAt: Date.now(),
    };
    setFormData(updated);
    onUpdateIdea(updated);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const note = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      createdAt: Date.now(),
    };
    const updated = {
      ...formData,
      notes: [...(formData.notes || []), note],
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFormData(updated);
    onUpdateIdea(updated);
    setNewNote('');
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.trim()) return;
    let url = newLink.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const updated = {
      ...formData,
      links: [...(formData.links || []), url],
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFormData(updated);
    onUpdateIdea(updated);
    setNewLink('');
  };

  const handleRemoveLink = (urlToRemove: string) => {
    const updated = {
      ...formData,
      links: (formData.links || []).filter((l) => l !== urlToRemove),
      updatedAt: Date.now(),
    };
    setFormData(updated);
    onUpdateIdea(updated);
  };

  const handleAnswerSubmit = async (question: string) => {
    const answer = questionAnswers[question];
    if (!answer?.trim()) return;

    const existingAnswers = formData.followUpAnswers || [];
    const filtered = existingAnswers.filter((qa) => qa.question !== question);
    const updatedQA = [
      ...filtered,
      { question, answer: answer.trim(), answeredAt: Date.now() },
    ];

    const updated = {
      ...formData,
      followUpAnswers: updatedQA,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFormData(updated);
    onUpdateIdea(updated);

    // Spec requirement: answering a follow-up question triggers an AI re-score!
    await onReScoreWithAi(updated);
  };

  const breakdown = formData.scoreBreakdown || {
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
    priorityScore: formData.priorityScore,
  };

  const tagColor = getFieldTagColor(formData.fieldTag);
  const bucketDetails = getBucketDetails(formData.bucket);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {/* Field Tag selector */}
              <select
                value={formData.fieldTag}
                onChange={(e) => {
                  const updated = {
                    ...formData,
                    fieldTag: e.target.value as FieldTag,
                    updatedAt: Date.now(),
                  };
                  setFormData(updated);
                  onUpdateIdea(updated);
                }}
                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${tagColor.bg} ${tagColor.text} ${tagColor.border} focus:outline-none`}
              >
                {(['Tech', 'Business', 'Finance', 'Creative', 'Health', 'Learning', 'Social', 'Other'] as FieldTag[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>

              {/* Status Selector */}
              <select
                value={formData.status}
                onChange={(e) => {
                  const updated = {
                    ...formData,
                    status: e.target.value as IdeaStatus,
                    lastActivityAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  setFormData(updated);
                  onUpdateIdea(updated);
                }}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none capitalize"
              >
                <option value="idea">Idea (Backlog)</option>
                <option value="in_progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="done">Done (Archive)</option>
                <option value="dropped">Dropped (Archive)</option>
              </select>

              {/* Pin Column Toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
                <Pin className={`w-3 h-3 ${formData.pinnedBucket ? 'text-amber-500 fill-current' : 'text-slate-400'}`} />
                <span className="text-slate-500 text-[11px]">Pin:</span>
                <select
                  value={formData.pinnedBucket || 'auto'}
                  onChange={(e) => {
                    const val = e.target.value === 'auto' ? null : (e.target.value as Bucket);
                    const updated = {
                      ...formData,
                      pinnedBucket: val,
                      updatedAt: Date.now(),
                    };
                    setFormData(updated);
                    onUpdateIdea(updated);
                  }}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-medium capitalize"
                >
                  <option value="auto">Auto ({formData.bucket})</option>
                  <option value="now">Now</option>
                  <option value="next">Next</option>
                  <option value="later">Later</option>
                  <option value="parked">Parked</option>
                </select>
              </div>
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                const updated = { ...formData, title: e.target.value };
                setFormData(updated);
              }}
              onBlur={() => onUpdateIdea(formData)}
              className="w-full text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Idea Title..."
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Score & Bucket Summary Badge */}
            <div className="flex flex-col items-end">
              <div
                className={`px-3 py-1 rounded-xl text-base font-extrabold ${getScoreBadgeClass(
                  formData.priorityScore
                )}`}
              >
                {formData.priorityScore}/100
              </div>
              <span className={`text-[10px] uppercase font-bold mt-1 ${bucketDetails.badgeText}`}>
                {formData.pinnedBucket ? `Pinned to ${formData.pinnedBucket}` : `Bucket: ${formData.bucket}`}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('scores')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'scores'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Scores & Formula Breakdown
          </button>
          <button
            onClick={() => setActiveTab('reasoning')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reasoning'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Reasoning & Action
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Follow-up Questions ({formData.followUpQuestions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Activity Log ({formData.notes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'links'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Links ({formData.links?.length || 0})
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {/* Editable Description (always visible at top) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => {
                const updated = { ...formData, description: e.target.value };
                setFormData(updated);
              }}
              onBlur={() => onUpdateIdea(formData)}
              placeholder="What is this idea about? Add details, assumptions, or target audience..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* TAB 1: Scores & Breakdown */}
          {activeTab === 'scores' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sliders */}
              <div className="lg:col-span-7 space-y-5">
                {/* Linked Goals Section */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      Goal Fit (1 to 5)
                    </h4>
                    <span className="text-[11px] text-slate-500">
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

                          return (
                            <div key={goal.id} className="text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                                  {goal.title}{' '}
                                  <span className="text-slate-400 text-[10px]">
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
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* The 6 Standard Score Sliders */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Idea Attributes (1 to 5)
                  </h4>

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
                    {formData.aiSuggestedScores?.impact &&
                      formData.userEditedScores.impact &&
                      formData.aiSuggestedScores.impact !== formData.impact && (
                        <div className="flex items-center justify-between text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                          <span>AI suggested: {formData.aiSuggestedScores.impact}</span>
                          <button
                            onClick={() => handleAdoptAiScore('impact', formData.aiSuggestedScores!.impact)}
                            className="underline font-bold"
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
                          {formData.urgency === 1 ? '(Can wait indefinitely)' : formData.urgency === 5 ? '(Window closes)' : ''}
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
                          {formData.skillMatch === 1 ? '(Mostly new skills)' : formData.skillMatch === 5 ? '(Already skilled)' : ''}
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
                  </div>

                  {/* Excitement (USER ONLY) */}
                  <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        Excitement (User-only score)
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formData.excitement}/5
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      AI never touches this score. Only you decide your personal drive.
                    </p>
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
                        Effort (Total work required)
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formData.effort}/5{' '}
                        <span className="text-slate-400 font-normal">
                          {formData.effort === 1 ? '(A weekend)' : formData.effort === 3 ? '(A few weeks)' : '(Many months)'}
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
                  </div>

                  {/* Confidence */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Confidence (Certainty of scores)
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formData.confidence}/5{' '}
                        <span className="text-slate-400 font-normal">
                          {formData.confidence === 1 ? '(Guessing / vague)' : formData.confidence === 5 ? '(Very sure)' : ''}
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
                  </div>

                  {/* Weekly Hours Needed */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        Hours per week needed while active
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formData.hoursPerWeekNeeded} hrs/wk
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      step={1}
                      value={formData.hoursPerWeekNeeded}
                      onChange={(e) =>
                        handleScoreChange('hoursPerWeekNeeded', Number(e.target.value))
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Explainable Formula Breakdown Bars */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Formula Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Why this idea scored {formData.priorityScore}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreBadgeClass(
                      formData.priorityScore
                    )}`}
                  >
                    {formData.priorityScore}/100
                  </div>
                </div>

                {/* Breakdown Bars */}
                <div className="space-y-3 text-xs">
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
                  <div>
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
                    <span>Uncertainty Factor ({profile.riskAppetite} risk):</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      ×{breakdown.confidenceFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-800 dark:text-blue-300">
                    <strong>Rule:</strong>{' '}
                    {breakdown.goalFit < 0.2
                      ? 'GoalFit < 0.20 → Automatically placed in Parked.'
                      : formData.priorityScore >= 55
                      ? 'Score ≥ 55 → Qualified for Now column (subject to 3 idea & hour cap).'
                      : formData.priorityScore >= 40
                      ? 'Score 40-100 → Positioned in Next column.'
                      : formData.priorityScore >= 20
                      ? 'Score 20-39 → Positioned in Later column.'
                      : 'Score < 20 → Parked.'}
                  </div>
                </div>
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
                  <span className="text-[11px] text-slate-500">
                    Calibrated to your goals & available hours
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {formData.aiReasoning ||
                    'Click "Re-score with AI" to generate customized reasoning analyzing trade-offs against your active profile and goals.'}
                </p>
              </div>

              {/* Concrete Next Action */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Concrete Next Action (&lt;2 hours)
                  </h4>
                  {formData.nextAction && (
                    <button
                      onClick={() => {
                        const note = {
                          id: `note-${Date.now()}`,
                          text: `Completed next action: ${formData.nextAction}`,
                          createdAt: Date.now(),
                        };
                        const updated = {
                          ...formData,
                          notes: [...(formData.notes || []), note],
                          nextAction: '',
                          lastActivityAt: Date.now(),
                          updatedAt: Date.now(),
                        };
                        setFormData(updated);
                        onUpdateIdea(updated);
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Step Complete
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.nextAction || ''}
                  onChange={(e) => {
                    const updated = { ...formData, nextAction: e.target.value };
                    setFormData(updated);
                  }}
                  onBlur={() => onUpdateIdea(formData)}
                  placeholder="Specific first step taking under 2 hours..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Re-score AI trigger */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Update AI Analysis
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Re-evaluates this idea against current goals, notes, and profile.
                  </p>
                </div>
                <button
                  onClick={() => onReScoreWithAi(formData)}
                  disabled={isAiScoring}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiScoring ? 'animate-spin' : ''}`} />
                  <span>{isAiScoring ? 'Scoring...' : 'Re-score with AI'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Follow-up Questions */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-xl text-xs text-blue-900 dark:text-blue-300">
                <strong>Clarifying Questions:</strong> When an idea is vague or uncertain, the AI raises up to 3 targeted questions. Answering them refines the confidence score and triggers an automatic re-score.
              </div>

              {formData.followUpQuestions && formData.followUpQuestions.length > 0 ? (
                <div className="space-y-4">
                  {formData.followUpQuestions.map((q, idx) => {
                    const currentAnswer = questionAnswers[q] || '';
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>{q}</span>
                        </p>
                        <div className="flex gap-2">
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
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAnswerSubmit(q)}
                            disabled={!currentAnswer.trim() || isAiScoring}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center gap-1 shrink-0"
                          >
                            <Send className="w-3 h-3" />
                            Submit & Re-score
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No pending follow-up questions from the AI. The idea scope is currently clear.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Activity Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Log progress, decision, experiment results..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shrink-0"
                >
                  Add Note
                </button>
              </form>

              <div className="space-y-2">
                {(formData.notes || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No notes recorded yet. Add notes to document steps and prevent the idea from going stale.
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
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          {note.text}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
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
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shrink-0"
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
                        onClick={() => handleRemoveLink(link)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
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

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              if (window.confirm('Delete this idea permanently?')) {
                onDeleteIdea(formData.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
