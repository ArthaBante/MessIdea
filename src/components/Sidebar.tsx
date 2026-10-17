import React, { useEffect, useRef } from 'react';
import {
  Compass,
  Grid,
  Target,
  CalendarCheck,
  Archive,
  Settings,
  Sun,
  Moon,
  X,
  User,
  LogOut,
} from 'lucide-react';
import { Goal, UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'board' | 'matrix' | 'goals' | 'archive' | 'settings';
  onViewChange: (view: 'board' | 'matrix' | 'goals' | 'archive' | 'settings') => void;
  onOpenWeeklyReview: () => void;
  profile: UserProfile;
  goals: Goal[];
  staleCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSwitchUser?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentView,
  onViewChange,
  onOpenWeeklyReview,
  profile,
  goals,
  staleCount,
  darkMode,
  onToggleDarkMode,
  onSwitchUser,
}) => {
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Touch handlers for swipe-left to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchCurrentXRef.current !== null) {
      const diffX = touchCurrentXRef.current - touchStartXRef.current;
      // If swiped left by more than 50px, close sidebar
      if (diffX < -50) {
        onClose();
      }
    }
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
  };

  if (!isOpen) return null;

  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

  const handleItemClick = (view: 'board' | 'matrix' | 'goals' | 'archive' | 'settings') => {
    onViewChange(view);
    onClose();
  };

  const handleWeeklyReviewClick = () => {
    onOpenWeeklyReview();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed background backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in sidebar drawer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col justify-between transform transition-transform duration-300 ease-out animate-in slide-in-from-left"
      >
        {/* Top Header / Branding in Sidebar */}
        <div>
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                IB
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  IdeaBoard
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  Prioritisation
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items (Top to bottom: Board, Matrix, Goals, Weekly review, Archive, Settings) */}
          <nav className="p-3 space-y-1">
            {/* 1. Board */}
            <button
              onClick={() => handleItemClick('board')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                currentView === 'board'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Board</span>
            </button>

            {/* 2. Matrix */}
            <button
              onClick={() => handleItemClick('matrix')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                currentView === 'matrix'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>Matrix</span>
            </button>

            {/* 3. Goals */}
            <button
              onClick={() => handleItemClick('goals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                currentView === 'goals'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 shrink-0" />
                <span>Goals</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {activeGoalsCount}
              </span>
            </button>

            {/* 4. Weekly Review */}
            <button
              onClick={handleWeeklyReviewClick}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>Weekly review</span>
              </div>
              {staleCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                  {staleCount} stale
                </span>
              )}
            </button>

            {/* 5. Archive */}
            <button
              onClick={() => handleItemClick('archive')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                currentView === 'archive'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span>Archive</span>
            </button>

            {/* 6. Settings */}
            <button
              onClick={() => handleItemClick('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                currentView === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: User info & Light/Dark Mode Toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Light/Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500" />
              )}
              <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              {darkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* User profile info & switch user */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                  {profile.displayName || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {profile.email || 'signed in'}
                </p>
              </div>
            </div>

            {onSwitchUser && (
              <button
                onClick={onSwitchUser}
                title="Switch user / profile"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
