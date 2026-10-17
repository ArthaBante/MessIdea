import {
  Bucket,
  Goal,
  Idea,
  ScoreBreakdown,
  ScoringConfig,
  UserProfile,
} from '../types';
import { DEFAULT_SCORING_CONFIG } from './scoringConfig';

/**
 * Normalise 1-5 integer to 0.0 - 1.0 range
 * n(x) = (x - 1) / 4
 */
export function normalize(score: number): number {
  if (score < 1) return 0;
  if (score > 5) return 1;
  return (score - 1) / 4;
}

/**
 * Calculate GoalFit:
 * GoalFit = max_{g in active linked goals} n(fit_g) * (importance_g / 5) * h_g
 */
export function calculateGoalFit(
  idea: Pick<Idea, 'goalLinks'>,
  activeGoals: Goal[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (!idea.goalLinks || idea.goalLinks.length === 0 || activeGoals.length === 0) {
    return 0;
  }

  const activeGoalMap = new Map(activeGoals.map((g) => [g.id, g]));

  let maxFitScore = 0;

  for (const link of idea.goalLinks) {
    const goal = activeGoalMap.get(link.goalId);
    if (!goal || goal.status !== 'active') continue;

    const nFit = normalize(link.fit);
    const importanceWeight = Math.min(5, Math.max(1, goal.importance)) / 5;
    const horizonWeight = config.horizonWeights[goal.horizon] ?? 0.8;

    const fitScore = nFit * importanceWeight * horizonWeight;
    if (fitScore > maxFitScore) {
      maxFitScore = fitScore;
    }
  }

  return maxFitScore;
}

/**
 * Calculate full score breakdown and priority score (0-100) for a single idea
 */
export function calculateIdeaScore(
  idea: Pick<
    Idea,
    | 'goalLinks'
    | 'impact'
    | 'urgency'
    | 'skillMatch'
    | 'excitement'
    | 'effort'
    | 'confidence'
  >,
  profile: Pick<UserProfile, 'riskAppetite'>,
  activeGoals: Goal[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): { priorityScore: number; scoreBreakdown: ScoreBreakdown } {
  const goalFit = calculateGoalFit(idea, activeGoals, config);
  const nImpact = normalize(idea.impact);
  const nUrgency = normalize(idea.urgency);
  const nSkillMatch = normalize(idea.skillMatch);
  const nExcitement = normalize(idea.excitement);
  const nEffort = normalize(idea.effort);
  const nConfidence = normalize(idea.confidence);

  // Step 3: Value
  // Value = 0.40 * GoalFit + 0.20 * n(Impact) + 0.15 * n(Urgency) + 0.15 * n(SkillMatch) + 0.10 * n(Excitement)
  const value =
    config.goalFitWeight * goalFit +
    config.impactWeight * nImpact +
    config.urgencyWeight * nUrgency +
    config.skillMatchWeight * nSkillMatch +
    config.excitementWeight * nExcitement;

  // Step 4: Priority
  // Priority = round(100 * Value * (1 - 0.35 * n(Effort)) * (1 - r * (1 - n(Confidence))))
  const r = config.riskFactors[profile.riskAppetite] ?? 0.30;
  const effortPenalty = 1 - config.effortPenaltyWeight * nEffort;
  const confidenceFactor = 1 - r * (1 - nConfidence);

  const rawPriority = 100 * value * effortPenalty * confidenceFactor;
  const priorityScore = Math.max(0, Math.min(100, Math.round(rawPriority)));

  const scoreBreakdown: ScoreBreakdown = {
    goalFit,
    normalizedImpact: nImpact,
    normalizedUrgency: nUrgency,
    normalizedSkillMatch: nSkillMatch,
    normalizedExcitement: nExcitement,
    normalizedEffort: nEffort,
    normalizedConfidence: nConfidence,
    value,
    effortPenalty,
    confidenceFactor,
    priorityScore,
  };

  return { priorityScore, scoreBreakdown };
}

/**
 * Step 5: Bucket rules (applied across the full ideas list)
 * 1. Status done or dropped -> removed from the board, shown in Archive
 * 2. Status in_progress -> always in Now, counts towards Now limits
 * 3. Pinned -> stays in the pinned bucket
 * 4. GoalFit below cutoff (0.2) -> Parked
 * 5. Sort rest by priority desc (Ties: higher GoalFit, then older idea first)
 * 6. Now: take ideas scoring >= 55 while Now holds < 3 ideas and sum(hoursPerWeekNeeded) <= profile.hoursPerWeek.
 *    Anything that doesn't fit drops to Next.
 * 7. Next: 40-100 and not in Now. Later: 20-39. Parked: below 20.
 */
export function assignBuckets(
  ideas: Idea[],
  profile: Pick<UserProfile, 'hoursPerWeek'>,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): Map<string, Bucket> {
  const bucketMap = new Map<string, Bucket>();

  // Filter out archived
  const activeIdeas = ideas.filter(
    (idea) => idea.status !== 'done' && idea.status !== 'dropped'
  );

  let nowCount = 0;
  let nowHoursSum = 0;

  // 1. Process explicit In-Progress first (guaranteed Now)
  const inProgressIdeas = activeIdeas.filter(
    (idea) => idea.status === 'in_progress'
  );
  for (const idea of inProgressIdeas) {
    bucketMap.set(idea.id, 'now');
    nowCount++;
    nowHoursSum += idea.hoursPerWeekNeeded || 0;
  }

  // 2. Process pinned ideas
  const pinnedNonInProgress = activeIdeas.filter(
    (idea) => idea.status !== 'in_progress' && idea.pinnedBucket !== null
  );
  for (const idea of pinnedNonInProgress) {
    const bucket = idea.pinnedBucket!;
    bucketMap.set(idea.id, bucket);
    if (bucket === 'now') {
      nowCount++;
      nowHoursSum += idea.hoursPerWeekNeeded || 0;
    }
  }

  // 3. Process remaining unpinned ideas
  const unpinned = activeIdeas.filter(
    (idea) => idea.status !== 'in_progress' && idea.pinnedBucket === null
  );

  // Separate low goal fit (< cutoff) -> directly Parked
  const lowGoalFit: Idea[] = [];
  const candidates: Idea[] = [];

  for (const idea of unpinned) {
    if (idea.scoreBreakdown.goalFit < config.thresholds.goalFitCutoff) {
      lowGoalFit.push(idea);
    } else {
      candidates.push(idea);
    }
  }

  for (const idea of lowGoalFit) {
    bucketMap.set(idea.id, 'parked');
  }

  // Sort candidates by priority desc, tie breaker: goalFit desc, then createdAt asc (older first)
  candidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (b.scoreBreakdown.goalFit !== a.scoreBreakdown.goalFit) {
      return b.scoreBreakdown.goalFit - a.scoreBreakdown.goalFit;
    }
    return a.createdAt - b.createdAt;
  });

  // Evaluate candidates
  for (const idea of candidates) {
    const ideaHours = idea.hoursPerWeekNeeded || 0;
    const canFitInNow =
      idea.priorityScore >= config.thresholds.nowScoreMin &&
      nowCount < config.thresholds.maxNowCount &&
      nowHoursSum + ideaHours <= profile.hoursPerWeek;

    if (canFitInNow) {
      bucketMap.set(idea.id, 'now');
      nowCount++;
      nowHoursSum += ideaHours;
    } else if (idea.priorityScore >= config.thresholds.nextScoreMin) {
      bucketMap.set(idea.id, 'next');
    } else if (idea.priorityScore >= config.thresholds.laterScoreMin) {
      bucketMap.set(idea.id, 'later');
    } else {
      bucketMap.set(idea.id, 'parked');
    }
  }

  return bucketMap;
}

/**
 * Re-score all ideas and re-compute their buckets
 */
export function rankAllIdeas(
  ideas: Idea[],
  profile: UserProfile,
  activeGoals: Goal[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): Idea[] {
  // First calculate each idea's individual priorityScore & scoreBreakdown
  const scored = ideas.map((idea) => {
    const { priorityScore, scoreBreakdown } = calculateIdeaScore(
      idea,
      profile,
      activeGoals,
      config
    );
    return {
      ...idea,
      priorityScore,
      scoreBreakdown,
      lastScoredAt: Date.now(),
    };
  });

  // Then determine bucket placements based on the whole group
  const bucketMap = assignBuckets(scored, profile, config);

  return scored.map((idea) => ({
    ...idea,
    bucket: bucketMap.get(idea.id) ?? idea.bucket,
  }));
}

/**
 * Unit Test / Verification function matching the spec worked example:
 *
 * User: 1 goal "Get a developer job within 6 months" (importance 5, horizon 3m), 8 hrs/wk, medium risk
 * Idea A: Goal fit 5, Impact 4, Urgency 3, Skill Match 4, Excitement 4, Effort 3, Confidence 4 -> 62 (Now)
 * Idea B: Goal fit 2, Impact 3, Urgency 1, Skill Match 2, Excitement 5, Effort 4, Confidence 2 -> 19 (Parked)
 */
export function verifyWorkedExample(): {
  ideaAScore: number;
  ideaABucket: Bucket;
  ideaBScore: number;
  ideaBBucket: Bucket;
  passed: boolean;
  details: string;
} {
  const goal: Goal = {
    id: 'goal-job-dev',
    userId: 'test-user',
    title: 'Get a developer job within 6 months',
    importance: 5,
    horizon: '3m',
    status: 'active',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const profile: UserProfile = {
    uid: 'test-user',
    displayName: 'Alex Builder',
    email: 'alex@example.com',
    aboutMe: 'Software builder',
    situation: 'employed_full',
    skills: ['React', 'TypeScript'],
    hoursPerWeek: 8,
    riskAppetite: 'medium',
    onboardingDone: true,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const ideaA: Idea = {
    id: 'idea-a',
    userId: 'test-user',
    title: 'Build a portfolio web app',
    description: 'Showcase best interactive projects with live demos',
    fieldTag: 'Tech',
    goalLinks: [{ goalId: 'goal-job-dev', fit: 5 }],
    impact: 4,
    urgency: 3,
    skillMatch: 4,
    excitement: 4,
    effort: 3,
    hoursPerWeekNeeded: 4,
    confidence: 4,
    priorityScore: 0,
    scoreBreakdown: {} as any,
    bucket: 'next',
    pinnedBucket: null,
    status: 'idea',
    aiReasoning: '',
    nextAction: 'Outline first project demo',
    followUpQuestions: [],
    followUpAnswers: [],
    notes: [],
    links: [],
    scoresSource: 'user',
    userEditedScores: {},
    lastActivityAt: Date.now(),
    createdAt: 1000,
    updatedAt: 1000,
  };

  const ideaB: Idea = {
    id: 'idea-b',
    userId: 'test-user',
    title: 'Start a cooking YouTube channel',
    description: 'Weekly video recipes for quick high-protein meals',
    fieldTag: 'Creative',
    goalLinks: [{ goalId: 'goal-job-dev', fit: 2 }],
    impact: 3,
    urgency: 1,
    skillMatch: 2,
    excitement: 5,
    effort: 4,
    hoursPerWeekNeeded: 6,
    confidence: 2,
    priorityScore: 0,
    scoreBreakdown: {} as any,
    bucket: 'next',
    pinnedBucket: null,
    status: 'idea',
    aiReasoning: '',
    nextAction: 'Record sample test video',
    followUpQuestions: [],
    followUpAnswers: [],
    notes: [],
    links: [],
    scoresSource: 'user',
    userEditedScores: {},
    lastActivityAt: Date.now(),
    createdAt: 2000,
    updatedAt: 2000,
  };

  const ranked = rankAllIdeas([ideaA, ideaB], profile, [goal]);
  const rankedA = ranked.find((i) => i.id === 'idea-a')!;
  const rankedB = ranked.find((i) => i.id === 'idea-b')!;

  const passed =
    rankedA.priorityScore === 62 &&
    rankedA.bucket === 'now' &&
    rankedB.priorityScore === 19 &&
    rankedB.bucket === 'parked';

  return {
    ideaAScore: rankedA.priorityScore,
    ideaABucket: rankedA.bucket,
    ideaBScore: rankedB.priorityScore,
    ideaBBucket: rankedB.bucket,
    passed,
    details: `Idea A: score=${rankedA.priorityScore} (expected 62), bucket=${rankedA.bucket} (expected now). Idea B: score=${rankedB.priorityScore} (expected 19), bucket=${rankedB.bucket} (expected parked).`,
  };
}
