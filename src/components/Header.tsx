import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Filter, X } from 'lucide-react';
import { FieldTag, Goal, IdeaStatus } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  onGoToBoard: () => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  goals: Goal[];
  selectedTag: FieldTag | 'ALL';
  onTagChange: (tag: FieldTag | 'ALL') => void;
  selectedGoalId: string | 'ALL';
  onGoalChange: (id: string | 'ALL') => void;
  selectedStatus: IdeaStatus | 'ALL';
  onStatusChange: (status: IdeaStatus | 'ALL') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onGoToBoard,
  isSearchOpen,
  onToggleSearch,
  onCloseSearch,
  searchQuery,
  onSearchChange,
  goals,
  selectedTag,
  onTagChange,
  selectedGoalId,
  onGoalChange,
  selectedStatus,
  onStatusChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input whenever search bar opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setShowFilters(false);
    }
  }, [isSearchOpen]);

  // Handle Escape key to close search and reset filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSearchOpen && e.key === 'Escape') {
        onCloseSearch();
        setShowFilters(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, onCloseSearch]);

  const hasActiveFilters =
    selectedTag !== 'ALL' || selectedGoalId !== 'ALL' || selectedStatus !== 'ALL';

  const clearAllFilters = () => {
    onTagChange('ALL');
    onGoalChange('ALL');
    onStatusChange('ALL');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        {/* Section F: Menu icon at far left; MessIdea logo & name in centre; search icon at far right */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Far Left: Menu Icon */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all focus:outline-none cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Centre: MessIdea logo and name (goes to Board and closes search; never toggles search) */}
          <button
            type="button"
            onClick={() => {
              onGoToBoard();
              onCloseSearch();
            }}
            className="flex items-center gap-2 cursor-pointer select-none focus:outline-none hover:opacity-85 transition-opacity"
            title="Go to Board"
          >
            <img
              src="/logo.svg"
              alt="MessIdea"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 rounded"
            />
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              MessIdea
            </span>
          </button>

          {/* Far Right: Search Icon (same size and spacing as menu icon) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onToggleSearch}
              className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all focus:outline-none cursor-pointer ${
                isSearchOpen
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Search ideas"
              aria-label="Search ideas"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar directly below the header */}
        {isSearchOpen && (
          <div className="py-2.5 pb-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search ideas, descriptions & notes..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-11 py-2.5 min-h-[44px] text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />

                {/* Filter icon inside search bar */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  title={showFilters ? 'Hide filters' : 'Show filters'}
                  className={`absolute right-1 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  aria-label="Toggle filters"
                >
                  <Filter className="w-4 h-4" />
                  {hasActiveFilters && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              </div>

              {/* Close search button (X) */}
              <button
                type="button"
                onClick={onCloseSearch}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close search (Esc)"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter row shown ONLY when filter icon inside search bar is tapped */}
            {showFilters && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in slide-in-from-top-1">
                {/* Field Tag Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Field
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => onTagChange(e.target.value as any)}
                    className="w-full py-2 px-2.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ALL">All Fields</option>
                    <option value="Tech">Tech</option>
                    <option value="Business">Business</option>
                    <option value="Finance">Finance</option>
                    <option value="Creative">Creative</option>
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Social">Social</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Goal Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Goal
                  </label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => onGoalChange(e.target.value)}
                    className="w-full py-2 px-2.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                  >
                    <option value="ALL">All Goals</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({g.importance}★)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </label>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value as any)}
                    className="w-full py-2 px-2.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="idea">Idea</option>
                    <option value="in_progress">In Progress</option>
                    <option value="paused">Paused</option>
                    <option value="done">Done</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
