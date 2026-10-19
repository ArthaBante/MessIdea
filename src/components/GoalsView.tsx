import React, { useState } from 'react';
import { Goal, Horizon, GoalStatus } from '../types';
import { Target, Plus, CheckCircle, Trash2, Calendar, Star, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHorizon, setNewHorizon] = useState<Horizon>('3m');
  const [newImportance, setNewImportance] = useState(5);
  const [newTargetDate, setNewTargetDate] = useState('');

  const activeGoals = goals.filter((g) => g.status === 'active');
  const pastGoals = goals.filter((g) => g.status !== 'active');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddGoal({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      horizon: newHorizon,
      importance: newImportance,
      targetDate: newTargetDate || undefined,
      status: 'active',
    });
    setNewTitle('');
    setNewDesc('');
    setNewHorizon('3m');
    setNewImportance(5);
    setNewTargetDate('');
    setShowAddModal(false);
  };

  const getHorizonLabel = (h: Horizon) => {
    switch (h) {
      case '3m':
        return '3 Months (High urgency wt: 1.0)';
      case '1y':
        return '1 Year (Wt: 0.9)';
      case '3y_plus':
        return '3+ Years (Wt: 0.8)';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Goals Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Ideas are scored against these active goals. Modifying importance or horizon instantly recalculates all idea rankings across the board.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Goal</span>
        </button>
      </div>

      {/* Active Goals Grid */}
      <div className="space-y-4 mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Active Goals ({activeGoals.length})
        </h3>

        {activeGoals.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              No active goals configured
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Every idea needs at least one target to be ranked properly.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900">
                      {goal.horizon}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= goal.importance ? 'fill-current' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {goal.title}
                  </h4>
                  {goal.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {goal.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  {/* Importance Quick Slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Importance:</span>
                    <select
                      value={goal.importance}
                      onChange={(e) =>
                        onUpdateGoal({
                          ...goal,
                          importance: Number(e.target.value),
                          updatedAt: Date.now(),
                        })
                      }
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                    >
                      <option value={1}>1 (Low)</option>
                      <option value={2}>2</option>
                      <option value={3}>3 (Medium)</option>
                      <option value={4}>4</option>
                      <option value={5}>5 (High)</option>
                    </select>
                  </div>

                  {/* Actions: Mark Achieved or Dropped */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateGoal({
                          ...goal,
                          status: 'achieved',
                          updatedAt: Date.now(),
                        })
                      }
                      title="Mark Goal Achieved"
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      aria-label="Mark Goal Achieved"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalToDelete(goal.id)}
                      title="Delete Goal"
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      aria-label="Delete Goal"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Completed Goals */}
      {pastGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Past Goals ({pastGoals.length})
          </h3>
          <div className="space-y-2">
            {pastGoals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {g.title}
                  </span>
                  <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {g.status}
                  </span>
                </div>
                <button
                  onClick={() =>
                    onUpdateGoal({
                      ...g,
                      status: 'active',
                      updatedAt: Date.now(),
                    })
                  }
                  className="min-h-[44px] px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Add Personal Goal
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Land a software developer job"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or milestone criteria..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time Horizon
                  </label>
                  <select
                    value={newHorizon}
                    onChange={(e) => setNewHorizon(e.target.value as Horizon)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="3m">3 Months</option>
                    <option value="1y">1 Year</option>
                    <option value="3y_plus">3+ Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Importance (1-5)
                  </label>
                  <select
                    value={newImportance}
                    onChange={(e) => setNewImportance(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value={5}>5 - Critical</option>
                    <option value={4}>4 - High</option>
                    <option value={3}>3 - Medium</option>
                    <option value={2}>2 - Low</option>
                    <option value={1}>1 - Minor</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app delete goal confirmation dialog */}
      <ConfirmModal
        isOpen={goalToDelete !== null}
        title="Delete this goal?"
        message="Ideas linked to it will be re-ranked."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (goalToDelete) {
            onDeleteGoal(goalToDelete);
            setGoalToDelete(null);
          }
        }}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};
