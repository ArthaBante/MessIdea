import { Goal, Idea, UserProfile } from '../types';

export interface ScoreIdeaResponse {
  fieldTag: string;
  goalLinks: { goalId: string; fit: number }[];
  impact: number;
  urgency: number;
  skillMatch: number;
  effort: number;
  hoursPerWeekNeeded: number;
  confidence: number;
  nextAction: string;
  nextSteps: string[];
  followUpQuestions: string[];
  reasoning: string;
}

export interface WeeklyReviewResponse {
  summary: string;
  focusIdeaId: string;
}

export async function suggestNextStepsWithAi(
  profile: UserProfile,
  activeGoals: Goal[],
  idea: Idea,
  completedSteps: string[]
): Promise<{ success: boolean; data?: { nextSteps: string[] }; error?: string }> {
  try {
    const res = await fetch('/api/suggest-next-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, activeGoals, idea, completedSteps }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to suggest next steps',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while contacting AI server',
    };
  }
}

export async function scoreIdeaWithAi(
  profile: UserProfile,
  activeGoals: Goal[],
  idea: Idea
): Promise<{ success: boolean; data?: ScoreIdeaResponse; error?: string; remainingCalls?: number }> {
  try {
    const res = await fetch('/api/score-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, activeGoals, idea }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to score idea with AI',
        remainingCalls: result.remaining,
      };
    }

    return {
      success: true,
      data: result.data,
      remainingCalls: result.remainingDailyCalls,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while contacting AI server',
    };
  }
}

export async function generateWeeklyReviewWithAi(
  profile: UserProfile,
  activeGoals: Goal[],
  nowIdeas: Idea[],
  nextIdeas: Idea[],
  staleIdeas: { id: string; title: string; daysInactive: number }[],
  moves: string[]
): Promise<{ success: boolean; data?: WeeklyReviewResponse; error?: string }> {
  try {
    const res = await fetch('/api/weekly-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        activeGoals,
        nowIdeas,
        nextIdeas,
        staleIdeas,
        moves,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to generate weekly review',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while contacting AI server',
    };
  }
}

export async function checkRateLimit(userId: string): Promise<{ used: number; remaining: number }> {
  try {
    const res = await fetch(`/api/rate-limit-status?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      return { used: data.used, remaining: data.remaining };
    }
  } catch (e) {
    // Ignore error
  }
  return { used: 0, remaining: 50 };
}
