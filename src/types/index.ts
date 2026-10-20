export type Situation =
  | 'student'
  | 'employed_full'
  | 'employed_part'
  | 'self_employed'
  | 'between_jobs';

export type RiskAppetite = 'low' | 'medium' | 'high';

export type Horizon = '3m' | '1y' | '3y_plus';

export type GoalStatus = 'active' | 'achieved' | 'dropped';

export type Bucket = 'now' | 'next' | 'later' | 'parked';

export type IdeaStatus = 'idea' | 'in_progress' | 'paused' | 'done' | 'dropped';

export type ScoresSource = 'ai' | 'user' | 'mixed' | 'unscored';

export type FieldTag =
  | 'Tech'
  | 'Business'
  | 'Finance'
  | 'Creative'
  | 'Health'
  | 'Learning'
  | 'Social'
  | 'Other';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  aboutMe: string;
  situation: Situation;
  skills: string[];
  hoursPerWeek: number;
  riskAppetite: RiskAppetite;
  onboardingDone: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  horizon: Horizon;
  importance: number; // 1 to 5
  targetDate?: string;
  status: GoalStatus;
  createdAt: number;
  updatedAt: number;
}

export interface GoalLink {
  goalId: string;
  fit: number; // 1 to 5
}

export interface ScoreBreakdown {
  goalFit: number; // 0 to 1
  normalizedImpact: number; // 0 to 1
  normalizedUrgency: number; // 0 to 1
  normalizedSkillMatch: number; // 0 to 1
  normalizedExcitement: number; // 0 to 1
  normalizedEffort: number; // 0 to 1
  normalizedConfidence: number; // 0 to 1
  value: number; // weighted sum
  effortPenalty: number; // 1 - 0.35 * n(Effort)
  confidenceFactor: number; // 1 - r * (1 - n(Confidence))
  priorityScore: number; // 0 to 100
}

export interface NoteItem {
  id: string;
  text: string;
  createdAt: number;
}

export interface FollowUpQA {
  question: string;
  answer: string;
  answeredAt: number;
}

export interface ScoreSet {
  impact?: number;
  urgency?: number;
  skillMatch?: number;
  effort?: number;
  confidence?: number;
  hoursPerWeekNeeded?: number;
  fieldTag?: FieldTag;
  goalFits?: Record<string, number>; // goalId -> fit override
}

export interface NextStep {
  id: string;
  text: string;
  done: boolean;
  userEdited?: boolean;
}

export interface Idea {
  id: string;
  userId: string;
  title: string;
  description: string;
  fieldTag: FieldTag;
  goalLinks: GoalLink[];
  impact: number; // 1 to 5
  urgency: number; // 1 to 5
  skillMatch: number; // 1 to 5
  excitement: number; // 1 to 5 (user only)
  effort: number; // 1 to 5
  hoursPerWeekNeeded: number;
  confidence: number; // 1 to 5
  priorityScore: number; // 0 to 100
  scoreBreakdown: ScoreBreakdown;
  bucket: Bucket;
  pinnedBucket: Bucket | null;
  status: IdeaStatus;
  aiReasoning: string;
  nextAction: string;
  nextSteps?: NextStep[];
  followUpQuestions: string[];
  followUpAnswers: FollowUpQA[];
  notes: NoteItem[];
  links: string[];
  scoresSource: ScoresSource;
  userEditedScores: ScoreSet; // tracks user manual overrides
  aiSuggestedScores?: ScoreSet; // latest AI suggestion for comparison
  lastActivityAt: number;
  lastScoredAt?: number;
  createdAt: number;
  updatedAt: number;
  isAiScoring?: boolean;
  aiError?: string;
}

export interface ScoringConfig {
  goalFitWeight: number; // 0.40
  impactWeight: number; // 0.20
  urgencyWeight: number; // 0.15
  skillMatchWeight: number; // 0.15
  excitementWeight: number; // 0.10
  effortPenaltyWeight: number; // 0.35
  riskFactors: {
    low: number; // 0.40
    medium: number; // 0.30
    high: number; // 0.15
  };
  horizonWeights: {
    '3m': number; // 1.0
    '1y': number; // 0.9
    '3y_plus': number; // 0.8
  };
  thresholds: {
    goalFitCutoff: number; // 0.20
    nowScoreMin: number; // 55
    maxNowCount: number; // 3
    nextScoreMin: number; // 40
    laterScoreMin: number; // 20
  };
}

export interface WeeklyReviewResult {
  summary: string;
  focusIdeaId: string;
  generatedAt: number;
  moves: string[];
  staleIdeaIds: string[];
}
