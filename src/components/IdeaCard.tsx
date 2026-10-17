import React, { useState } from 'react';
import {
  Pin,
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  CheckCircle,
  MoreVertical,
  RotateCcw,
  ExternalLink,
  Target,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Bucket, Goal, Idea } from '../types';
import { getFieldTagColor, getScoreBadgeClass } from '../utils/colors';

interface IdeaCardProps {
  idea: Idea;
  goals: Goal[];
  onSelect: (idea: Idea) => void;
  onPinBucket: (ideaId: string, bucket: Bucket | null) => void;
  onStatusChange: (ideaId: string, status: any) => void;
  onRetryAiScoring: (idea: Idea) => void;
  isStale?: boolean;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  goals,
  onSelect,
  onPinBucket,
  onStatusChange,
  onRetryAiScoring,
  isStale = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Find primary linked goal
  const primaryGoalLink = idea.goalLinks && idea.goalLinks.length > 0
    ? [...idea.goalLinks].sort((a, b) => b.fit - a.fit)[0]
    : null;
  const primaryGoal = primaryGoalLink
    ? goals.find((g) => g.id === primaryGoalLink.goalId)
    : null;

  const tagColor = getFieldTagColor(idea.fieldTag);

  return (
    <div
      onClick={() => onSelect(idea)}
      className="group relative bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500/80 shadow-xs hover:shadow-md transition-all cursor-pointer select-none"
    >
      {/* Top Header: Field Tag + Score Badge + Pin / Menu */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${tagColor.bg} ${tagColor.text} ${tagColor.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tagColor.dot}`} />
            {idea.fieldTag}
          </span>

          {idea.status === 'in_progress' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Play className="w-2.5 h-2.5 fill-current" />
              Active
            </span>
          )}

          {idea.pinnedBucket && (
            <span
              title={`Pinned to ${idea.pinnedBucket}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
            >
              <Pin className="w-2.5 h-2.5 fill-current" />
              Pinned
            </span>
          )}

          {isStale && (
            <span
              title="No activity for 14+ days while in Now"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
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
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-medium animate-pulse"
            >
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Scoring...</span>
            </div>
          ) : idea.scoresSource === 'unscored' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetryAiScoring(idea);
              }}
              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              Unscored
            </button>
          ) : (
            <div
              title={`Priority Score: ${idea.priorityScore}/100`}
              className={`px-2.5 py-0.5 rounded-md text-xs tracking-tight ${getScoreBadgeClass(
                idea.priorityScore
              )}`}
            >
              {idea.priorityScore}
            </div>
          )}

          {/* Quick Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-40 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Override / Pin
                </div>
                {(['now', 'next', 'later', 'parked'] as Bucket[]).map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      onPinBucket(idea.id, b);
                      setShowMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 capitalize flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                      idea.pinnedBucket === b ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>Pin to {b}</span>
                    {idea.pinnedBucket === b && <Pin className="w-3 h-3 fill-current" />}
                  </button>
                ))}
                {idea.pinnedBucket && (
                  <button
                    onClick={() => {
                      onPinBucket(idea.id, null);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Pin (Auto-rank)
                  </button>
                )}
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                {idea.status !== 'in_progress' ? (
                  <button
                    onClick={() => {
                      onStatusChange(idea.id, 'in_progress');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    Set In Progress
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onStatusChange(idea.id, 'idea');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Set as Backlog Idea
                  </button>
                )}
                <button
                  onClick={() => {
                    onStatusChange(idea.id, 'done');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3 h-3" />
                  Mark as Done
                </button>
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

      {/* Linked Goal Chip */}
      {primaryGoal ? (
        <div className="flex items-center gap-1.5 mb-2.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
          <Target className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="truncate font-medium">{primaryGoal.title}</span>
          <span className="ml-auto text-slate-400 text-[10px] shrink-0">
            Fit: {primaryGoalLink?.fit}/5
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mb-2.5 text-[11px] text-slate-400 dark:text-slate-500 italic">
          <Target className="w-3 h-3 shrink-0" />
          <span>No direct goal link</span>
        </div>
      )}

      {/* Next Action in one line */}
      {idea.nextAction ? (
        <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100/60 dark:border-blue-900/40">
          <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1 font-medium">{idea.nextAction}</span>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 italic">
          Click to define first step & score sliders
        </div>
      )}

      {/* Footer metadata: hours/wk needed + confidence / excitement dots */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{idea.hoursPerWeekNeeded || 0}h/wk</span>
        </div>

        <div className="flex items-center gap-3">
          {idea.excitement > 0 && (
            <div className="flex items-center gap-0.5 text-amber-500" title={`Excitement: ${idea.excitement}/5`}>
              <Flame className="w-3 h-3 fill-current" />
              <span className="font-semibold text-[10px]">{idea.excitement}</span>
            </div>
          )}

          {idea.aiReasoning && (
            <span title="AI reasoning available" className="text-blue-500 dark:text-blue-400">
              <Sparkles className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Error or Retry banner */}
      {idea.aiError && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRetryAiScoring(idea);
          }}
          className="mt-2 p-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-md text-[11px] flex items-center justify-between hover:bg-rose-100 transition-colors"
        >
          <span className="truncate">{idea.aiError}</span>
          <span className="font-semibold underline shrink-0 ml-1">Retry</span>
        </div>
      )}
    </div>
  );
};
