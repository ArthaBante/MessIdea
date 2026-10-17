import React, { useState } from 'react';
import {
  X,
  CalendarCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Target,
  RefreshCw,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { Goal, Idea, UserProfile, WeeklyReviewResult } from '../types';
import { generateWeeklyReviewWithAi } from '../services/api';
import { getScoreBadgeClass } from '../utils/colors';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  goals: Goal[];
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  profile,
  goals,
  ideas,
  onSelectIdea,
}) => {
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<WeeklyReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute stale ideas in Now (no activity for 14+ days)
  const nowIdeas = ideas.filter((i) => i.bucket === 'now' && i.status !== 'done');
  const nextIdeas = ideas.filter((i) => i.bucket === 'next' && i.status !== 'done');

  const staleIdeas = nowIdeas
    .map((idea) => {
      const daysInactive = Math.floor(
        (Date.now() - idea.lastActivityAt) / (1000 * 60 * 60 * 24)
      );
      return { id: idea.id, title: idea.title, daysInactive, idea };
    })
    .filter((item) => item.daysInactive >= 14);

  const handleGenerateReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateWeeklyReviewWithAi(
        profile,
        goals.filter((g) => g.status === 'active'),
        nowIdeas,
        nextIdeas,
        staleIdeas.map((s) => ({
          id: s.id,
          title: s.title,
          daysInactive: s.daysInactive,
        })),
        []
      );

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to generate review');
      }

      setReviewResult({
        summary: res.data.summary,
        focusIdeaId: res.data.focusIdeaId,
        generatedAt: Date.now(),
        moves: [],
        staleIdeaIds: staleIdeas.map((s) => s.id),
      });
    } catch (err: any) {
      setError(err?.message || 'Could not generate weekly review at this moment.');
    } finally {
      setLoading(false);
    }
  };

  const focusIdea = reviewResult?.focusIdeaId
    ? ideas.find((i) => i.id === reviewResult.focusIdeaId)
    : nowIdeas[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Weekly Strategic Review
              </h3>
              <p className="text-[11px] text-slate-500">
                Audits progress, flags stale ideas, and locks in next week's single focus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Stale Ideas Alert */}
          {staleIdeas.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {staleIdeas.length} Stale Idea{staleIdeas.length > 1 ? 's' : ''} in "Now" (≥14 days inactive)
                </span>
              </div>
              <p className="text-xs text-rose-800/80 dark:text-rose-300/80">
                These ideas hold precious focus slots without recent notes or progress. Either log a step, pause, or move them back to Next.
              </p>
              <div className="space-y-1.5 pt-1">
                {staleIdeas.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onClose();
                      onSelectIdea(s.idea);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-rose-200/60 text-xs cursor-pointer hover:bg-white transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {s.title}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px] shrink-0 ml-2">
                      {s.daysInactive} days inactive
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Weekly Review Summary */}
          {reviewResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50">
                <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Review Summary</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {reviewResult.summary}
                </p>
              </div>

              {/* Recommended Focus Idea */}
              {focusIdea && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    🎯 Recommended Focus for the Week
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {focusIdea.title}
                      </h4>
                      {focusIdea.nextAction && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
                          <ArrowRight className="w-3.5 h-3.5" /> Next: {focusIdea.nextAction}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectIdea(focusIdea);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shrink-0"
                    >
                      Open Idea
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate your personalized AI weekly digest analyzing what moved, what is stuck, and your top priority recommendation.
              </p>
              <button
                onClick={handleGenerateReview}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs inline-flex items-center gap-2 transition-all"
              >
                <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Analyzing your board...' : 'Generate Weekly Review'}</span>
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-500 text-center font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
          {reviewResult && (
            <button
              onClick={handleGenerateReview}
              disabled={loading}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Regenerate Review
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
