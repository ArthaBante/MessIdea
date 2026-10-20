import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  CheckCircle,
  Check,
  MoreVertical,
  RotateCcw,
  ExternalLink,
  Target,
  ArrowRight,
  Flame,
  Trash2,
} from 'lucide-react';
import { Bucket, Goal, Idea } from '../types';
import { getFieldTagColor, getScoreBadgeClass } from '../utils/colors';
import { ConfirmModal } from './ConfirmModal';

interface IdeaCardProps {
  idea: Idea;
  goals: Goal[];
  onSelect: (idea: Idea) => void;
  onPinBucket: (ideaId: string, bucket: Bucket | null) => void;
  onStatusChange: (ideaId: string, status: any) => void;
  onRetryAiScoring: (idea: Idea) => void;
  onDeleteIdea?: (ideaId: string) => void;
  isStale?: boolean;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  goals,
  onSelect,
  onPinBucket,
  onStatusChange,
  onRetryAiScoring,
  onDeleteIdea,
  isStale = false,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
}) => {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const menuOpen = isMenuOpen !== undefined ? isMenuOpen : internalMenuOpen;
  const toggleMenu = () => {
    if (onToggleMenu) {
      onToggleMenu();
    } else {
      setInternalMenuOpen((prev) => !prev);
    }
  };
  const closeMenu = () => {
    if (onCloseMenu) {
      onCloseMenu();
    } else {
      setInternalMenuOpen(false);
    }
  };

  // Find primary linked goal
  const primaryGoalLink = idea.goalLinks && idea.goalLinks.length > 0
    ? [...idea.goalLinks].sort((a, b) => b.fit - a.fit)[0]
    : null;
  const primaryGoal = primaryGoalLink
    ? goals.find((g) => g.id === primaryGoalLink.goalId)
    : null;

  const tagColor = getFieldTagColor(idea.fieldTag);

  return (
    <>
      <div
        onClick={() => onSelect(idea)}
        className="group relative bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500/80 shadow-xs hover:shadow-md transition-all cursor-pointer select-none"
      >
        {/* Top Header: Field Tag + Badges + Score Badge + Menu */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border ${tagColor.bg} ${tagColor.text} ${tagColor.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tagColor.dot}`} />
              {idea.fieldTag}
            </span>

            {idea.status === 'in_progress' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold tracking-wide uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Play className="w-2.5 h-2.5 fill-current" />
                Active
              </span>
            )}

            {idea.status === 'paused' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold tracking-wide uppercase rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                <Pause className="w-2.5 h-2.5 fill-current" />
                Paused
              </span>
            )}

            {isStale && (
              <span
                title="No activity for 14+ days while in Now"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                Stale
              </span>
            )}
          </div>

          {/* Priority Score badge or Scoring Spinner */}
          <div className="flex items-center gap-1">
            {idea.isAiScoring ? (
              <div
                title="AI is scoring this idea..."
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 text-xs font-semibold animate-pulse"
              >
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Scoring…</span>
              </div>
            ) : idea.scoresSource === 'unscored' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetryAiScoring(idea);
                }}
                className={`min-h-[36px] px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer ${
                  idea.aiError
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-blue-900'
                }`}
                title={idea.aiError ? `AI Error: ${idea.aiError}. Click to retry.` : 'Scoring…'}
              >
                {idea.aiError ? 'Not scored · Retry' : 'Scoring…'}
              </button>
            ) : (
              <div
                title={`Priority Score: ${idea.priorityScore}/100`}
                className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-tight ${getScoreBadgeClass(
                  idea.priorityScore
                )}`}
              >
                {idea.priorityScore}
              </div>
            )}

            {/* Quick Menu */}
            <div
              className="relative"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu();
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors -mr-2 cursor-pointer"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-40 text-xs animate-in fade-in-50 zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1 text-xs uppercase font-bold tracking-wider text-slate-400">
                    Move to
                  </div>
                  {(['now', 'next', 'later', 'parked'] as Bucket[]).map((b) => {
                    const label = b.charAt(0).toUpperCase() + b.slice(1);
                    const isCurrent = idea.bucket === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          onPinBucket(idea.id, b);
                          closeMenu();
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                          isCurrent
                            ? 'font-bold text-blue-600 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>Move to {label}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}

                  {idea.pinnedBucket != null && (
                    <button
                      type="button"
                      onClick={() => {
                        onPinBucket(idea.id, null);
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700/60 mt-1 pt-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Let MessIdea decide</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                  {/* Status switches */}
                  {idea.status !== 'in_progress' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange(idea.id, 'in_progress');
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      <span>Set In Progress</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange(idea.id, 'idea');
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Set as Backlog Idea</span>
                    </button>
                  )}

                  {idea.status !== 'paused' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange(idea.id, 'paused');
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Pause Idea</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange(idea.id, 'idea');
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      <span>Resume Idea</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onStatusChange(idea.id, 'done');
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Mark as Done</span>
                  </button>

                  {/* Red Delete Button */}
                  {onDeleteIdea && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {idea.title}
        </h3>

        {/* Description preview */}
        {idea.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            {idea.description}
          </p>
        )}

        {/* Real failure message shown on the card if AI scoring failed */}
        {idea.aiError && !idea.isAiScoring && (
          <div
            className="mb-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">AI scoring notice:</span>
              <span className="leading-snug">{idea.aiError}</span>
            </div>
          </div>
        )}

        {/* Linked Goal Chip */}
        {primaryGoal ? (
          <div className="flex items-center gap-1.5 mb-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 px-2 py-1.5 rounded-md border border-slate-100 dark:border-slate-700/60">
            <Target className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="truncate">{primaryGoal.title}</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0 text-xs ml-auto">
              Fit: {primaryGoalLink?.fit}/5
            </span>
          </div>
        ) : null}

        {/* Next Step Preview: First unticked step */}
        {(() => {
          const firstUnticked = (idea.nextSteps || []).find((s) => !s.done);
          const displayText = firstUnticked?.text || idea.nextAction;
          if (!displayText) return null;
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/30 px-2 py-1.5 rounded-md border border-blue-100/60 dark:border-blue-900/40 mb-2.5">
              <ArrowRight className="w-3 h-3 text-blue-500 shrink-0" />
              <span className="truncate">{displayText}</span>
            </div>
          );
        })()}

        {/* Footer: Excitement, Hours & Links */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <span
              title="Personal Excitement"
              className="flex items-center gap-0.5 text-amber-500 font-semibold"
            >
              <Flame className="w-3 h-3 fill-current" />
              {idea.excitement}
            </span>

            <span
              title="Hours per week needed"
              className="flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              {idea.hoursPerWeekNeeded}h/wk
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(idea.links || []).length > 0 && (
              <span className="flex items-center gap-0.5 text-blue-500">
                <ExternalLink className="w-3 h-3" />
                {idea.links.length}
              </span>
            )}
            {(idea.notes || []).length > 0 && (
              <span>
                {idea.notes.length} {idea.notes.length === 1 ? 'note' : 'notes'}
              </span>
            )}
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
          if (onDeleteIdea) {
            onDeleteIdea(idea.id);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
