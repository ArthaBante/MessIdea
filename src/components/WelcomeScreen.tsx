import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStartWithUser: (displayName: string) => void;
  onTrySampleData: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartWithUser,
  onTrySampleData,
}) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onStartWithUser(trimmed);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
        {/* Logo & Name */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <img
            src="/logo.svg"
            alt="MessIdea Logo"
            className="w-9 h-9 object-contain rounded-lg shadow-xs"
          />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            MessIdea
          </h1>
        </div>

        {/* One line on what it does */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
          Clean prioritization and focus for builders juggling too many ideas.
        </p>

        {/* Start form with just a name field */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="text-left">
            <label
              htmlFor="welcome-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Your Name
            </label>
            <input
              id="welcome-name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Jordan Lee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 min-h-[44px] text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full min-h-[44px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span>Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-wider font-semibold absolute">
            or
          </span>
        </div>

        {/* Try with sample data button */}
        <button
          type="button"
          onClick={onTrySampleData}
          className="w-full min-h-[44px] px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Try with sample data</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6">
        All demo data stays private in this browser&apos;s localStorage.
      </p>
    </div>
  );
};
