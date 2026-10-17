import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Filter, X } from 'lucide-react';
import { FieldTag, Goal, IdeaStatus } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Minimal Header: Hamburger on far left, IdeaBoard + Search in center, nothing else */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Far Left: Menu Icon */}
          <div className="flex items-center">
            <button
              onClick={onOpenSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Center: App name "IdeaBoard" with small search icon right next to it */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white select-none">
              IdeaBoard
            </span>
            <button
              onClick={onToggleSearch}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
                isSearchOpen
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Search ideas"
              aria-label="Search ideas"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Far Right: Invisible spacer to keep center content optically centered */}
          <div className="w-9" aria-hidden="true" />
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
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />

                {/* Filter icon inside search bar */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  title={showFilters ? 'Hide filters' : 'Show filters'}
                  className={`absolute right-2.5 p-1 rounded-md transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  aria-label="Toggle filters"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {hasActiveFilters && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              </div>

              {/* Close search button (X) */}
              <button
                type="button"
                onClick={onCloseSearch}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close search (Esc)"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter row shown ONLY when filter icon inside search bar is tapped */}
            {showFilters && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs animate-in fade-in slide-in-from-top-1">
                {/* Field Tag Filter */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Field
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => onTagChange(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Goal
                  </label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => onGoalChange(e.target.value)}
                    className="w-full py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
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
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </label>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
