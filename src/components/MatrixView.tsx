import React, { useState } from 'react';
import { Goal, Idea } from '../types';
import { getFieldTagColor, getScoreBadgeClass } from '../utils/colors';
import { Sparkles, ArrowUp, ArrowRight, Target, Pin, CheckCircle2 } from 'lucide-react';

interface MatrixViewProps {
  ideas: Idea[];
  goals: Goal[];
  onSelectIdea: (idea: Idea) => void;
  onOpenQuickCapture: () => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  ideas,
  goals,
  onSelectIdea,
  onOpenQuickCapture,
}) => {
  const [hoveredIdea, setHoveredIdea] = useState<Idea | null>(null);

  const activeIdeas = ideas.filter(
    (i) => i.status !== 'done' && i.status !== 'dropped'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Matrix Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>2×2 Prioritisation Matrix</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              (Impact vs Effort)
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare across fields in two dimensions. Click any point to view breakdown or edit scores.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Quick Wins
          </span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-500" /> Big Bets
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Fill-ins
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Avoid
          </span>
        </div>
      </div>

      {/* Matrix Plot Container */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Axis Labels */}
        <div className="absolute top-4 left-6 flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <ArrowUp className="w-4 h-4 text-blue-500" />
          <span>High Impact (Payoff)</span>
        </div>

        <div className="absolute bottom-4 right-6 flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>High Effort (Months)</span>
          <ArrowRight className="w-4 h-4 text-blue-500" />
        </div>

        {/* 4 Quadrants Background Grid */}
        <div className="grid grid-cols-2 grid-rows-2 h-[560px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          {/* Top-Left: Quick Wins (High Impact, Low Effort) */}
          <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-b border-dashed border-slate-300 dark:border-slate-700 relative">
            <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              ⚡ Quick Wins (High Impact, Low Effort)
            </div>
          </div>

          {/* Top-Right: Big Bets (High Impact, High Effort) */}
          <div className="p-4 bg-sky-50/40 dark:bg-sky-950/20 border-b border-dashed border-slate-300 dark:border-slate-700 relative">
            <div className="inline-block px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
              🚀 Big Bets (High Impact, High Effort)
            </div>
          </div>

          {/* Bottom-Left: Fill-ins (Low Impact, Low Effort) */}
          <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border-r border-dashed border-slate-300 dark:border-slate-700 relative">
            <div className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              🌱 Fill-ins (Low Impact, Low Effort)
            </div>
          </div>

          {/* Bottom-Right: Avoid (Low Impact, High Effort) */}
          <div className="p-4 bg-rose-50/30 dark:bg-rose-950/20 relative">
            <div className="inline-block px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
              🛑 Avoid / Park (Low Impact, High Effort)
            </div>
          </div>

          {/* Center Intersection Mark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-300/60 dark:bg-slate-700/60 flex items-center justify-center text-[10px] font-bold text-slate-500">
            •
          </div>
        </div>

        {/* Plotted Ideas Layer */}
        <div className="absolute inset-6 sm:inset-10 pointer-events-none">
          {activeIdeas.map((idea, index) => {
            // Effort: 1 (left) to 5 (right) -> map to 8% to 92%
            // Impact: 1 (bottom) to 5 (top) -> map to 8% to 92%
            // Slight jitter based on index so overlapping items don't hide each other
            const effort = idea.effort || 3;
            const impact = idea.impact || 3;
            const jitterX = ((index % 3) - 1) * 2.5;
            const jitterY = (((index + 1) % 3) - 1) * 2.5;

            const leftPercent = Math.min(92, Math.max(8, ((effort - 1) / 4) * 80 + 10 + jitterX));
            // Inverted for Y so 5 is near top
            const topPercent = Math.min(92, Math.max(8, (1 - (impact - 1) / 4) * 80 + 10 + jitterY));

            const tagColor = getFieldTagColor(idea.fieldTag);

            return (
              <div
                key={idea.id}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                onMouseEnter={() => setHoveredIdea(idea)}
                onMouseLeave={() => setHoveredIdea(null)}
              >
                <button
                  onClick={() => onSelectIdea(idea)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 shadow-md hover:scale-110 active:scale-95 transition-all text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[160px] truncate group"
                >
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${getScoreBadgeClass(
                      idea.priorityScore
                    )}`}
                  >
                    {idea.priorityScore}
                  </span>
                  <span className="truncate">{idea.title}</span>
                  {idea.pinnedBucket && (
                    <Pin className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Hover preview drawer at bottom if an idea is hovered */}
        {hoveredIdea && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 z-20">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${getScoreBadgeClass(
                    hoveredIdea.priorityScore
                  )}`}
                >
                  Score {hoveredIdea.priorityScore}
                </span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  Bucket: {hoveredIdea.bucket}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">
                  Impact: {hoveredIdea.impact}/5 | Effort: {hoveredIdea.effort}/5
                </span>
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                {hoveredIdea.title}
              </p>
            </div>
            <button
              onClick={() => onSelectIdea(hoveredIdea)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shrink-0"
            >
              View Detail
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
