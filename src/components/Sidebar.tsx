import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Target,
  CalendarCheck,
  Archive,
  Settings,
  Sun,
  Moon,
  X,
  Users,
  LogOut,
} from 'lucide-react';
import { Goal, UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'board' | 'goals' | 'archive' | 'settings';
  onViewChange: (view: 'board' | 'goals' | 'archive' | 'settings') => void;
  onOpenWeeklyReview: () => void;
  profile: UserProfile;
  goals: Goal[];
  staleCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSwitchUser: () => void;
  onLogOut: () => void;
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
  onOpenSwitchUser,
  onLogOut,
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  // Close account menu when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setAccountMenuOpen(false);
    }
  }, [isOpen]);

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

  const handleItemClick = (view: 'board' | 'goals' | 'archive' | 'settings') => {
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
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
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
              <img
                src="/logo.svg"
                alt="MessIdea"
                className="w-7 h-7 rounded-lg shadow-xs object-contain"
              />
              <div>
                <span className="font-bold text-base text-slate-900 dark:text-white block">
                  MessIdea
                </span>
                <span className="text-xs text-slate-400 block -mt-0.5">
                  Prioritisation
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items (Top to bottom: Board, Goals, Weekly review, Archive, Settings) */}
          <nav className="p-3 space-y-1.5">
            {/* 1. Board */}
            <button
              onClick={() => handleItemClick('board')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium transition-all ${
                currentView === 'board'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Board</span>
            </button>

            {/* 2. Goals */}
            <button
              onClick={() => handleItemClick('goals')}
              className={`w-full flex items-center justify-between px-3.5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium transition-all ${
                currentView === 'goals'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 shrink-0" />
                <span>Goals</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {activeGoalsCount}
              </span>
            </button>

            {/* 3. Weekly Review */}
            <button
              onClick={handleWeeklyReviewClick}
              className="w-full flex items-center justify-between px-3.5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>Weekly review</span>
              </div>
              {staleCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  {staleCount} stale
                </span>
              )}
            </button>

            {/* 4. Archive */}
            <button
              onClick={() => handleItemClick('archive')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium transition-all ${
                currentView === 'archive'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span>Archive</span>
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => handleItemClick('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium transition-all ${
                currentView === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: User info & Light/Dark Mode Toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Light/Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3.5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500" />
              )}
              <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">
              {darkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* User profile info & Account Menu */}
          <div className="relative">
            {accountMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    handleItemClick('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Profile & settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onClose();
                    onOpenSwitchUser();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium transition-colors text-left cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Switch demo user</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onClose();
                    onLogOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}

            {/* Tapping user row opens menu */}
            <button
              type="button"
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              className="w-full p-3 min-h-[48px] rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer text-left focus:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                    {profile.displayName || 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {profile.email || 'signed in'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
