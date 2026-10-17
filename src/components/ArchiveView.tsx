import React, { useState } from 'react';
import { Archive, CheckCircle, RotateCcw, Trash2, Tag, Calendar } from 'lucide-react';
import { Idea } from '../types';
import { getFieldTagColor } from '../utils/colors';

interface ArchiveViewProps {
  ideas: Idea[];
  onRestoreIdea: (ideaId: string) => void;
  onDeleteIdea: (ideaId: string) => void;
  onSelectIdea: (idea: Idea) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  ideas,
  onRestoreIdea,
  onDeleteIdea,
  onSelectIdea,
}) => {
  const [filter, setFilter] = useState<'all' | 'done' | 'dropped'>('all');

  const archivedIdeas = ideas.filter(
    (i) => i.status === 'done' || i.status === 'dropped'
  );

  const filtered = archivedIdeas.filter((i) => {
    if (filter === 'done') return i.status === 'done';
    if (filter === 'dropped') return i.status === 'dropped';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Archive & Completed Ideas
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ideas marked as Done or Dropped are preserved here to keep your active board focused.
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({archivedIdeas.length})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'done'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Done ({archivedIdeas.filter((i) => i.status === 'done').length})
          </button>
          <button
            onClick={() => setFilter('dropped')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'dropped'
                ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Dropped ({archivedIdeas.filter((i) => i.status === 'dropped').length})
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Archive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            No archived ideas in this category
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            When you complete or drop an idea, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((idea) => {
            const tagColor = getFieldTagColor(idea.fieldTag);
            return (
              <div
                key={idea.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectIdea(idea)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        idea.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idea.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${tagColor.bg} ${tagColor.text}`}
                    >
                      {idea.fieldTag}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Score was: {idea.priorityScore}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {idea.title}
                  </h4>
                  {idea.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {idea.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onRestoreIdea(idea.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore to Board
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this archived idea permanently?')) {
                        onDeleteIdea(idea.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
