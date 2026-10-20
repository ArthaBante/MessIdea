import { Bucket, FieldTag } from '../types';

export function getFieldTagColor(tag: FieldTag): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (tag) {
    case 'Tech':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    case 'Business':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'Finance':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'Creative':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
      };
    case 'Health':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'Learning':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500',
      };
    case 'Social':
      return {
        bg: 'bg-teal-500/10 dark:bg-teal-500/20',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800',
        dot: 'bg-teal-500',
      };
    default:
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-500',
      };
  }
}

export function getBucketDetails(bucket: Bucket): {
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  headerBg: string;
} {
  switch (bucket) {
    case 'now':
      return {
        label: 'Now',
        description: 'Focus here (within your weekly hours)',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-300 dark:border-emerald-800/80',
        headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
      };
    case 'next':
      return {
        label: 'Next',
        description: 'Strong candidates ready when Now has room (40-100)',
        badgeBg: 'bg-sky-100 dark:bg-sky-950/60',
        badgeText: 'text-sky-700 dark:text-sky-300',
        borderColor: 'border-sky-300 dark:border-sky-800/80',
        headerBg: 'bg-sky-50/80 dark:bg-sky-950/30',
      };
    case 'later':
      return {
        label: 'Later',
        description: 'Promising concepts needing more time or clarity (20-39)',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
        badgeText: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-300 dark:border-amber-800/80',
        headerBg: 'bg-amber-50/80 dark:bg-amber-950/30',
      };
    case 'parked':
      return {
        label: 'Parked',
        description: 'Low goal alignment or poor fit (<20 or GoalFit <0.2)',
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeText: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-300 dark:border-slate-700',
        headerBg: 'bg-slate-50/80 dark:bg-slate-900/50',
      };
  }
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 60) {
    return 'bg-emerald-500 text-white dark:bg-emerald-500 font-semibold shadow-xs';
  }
  if (score >= 40) {
    return 'bg-sky-500 text-white dark:bg-sky-500 font-semibold shadow-xs';
  }
  if (score >= 20) {
    return 'bg-amber-500 text-white dark:bg-amber-500 font-semibold shadow-xs';
  }
  return 'bg-slate-400 text-white dark:bg-slate-600 font-semibold';
}
