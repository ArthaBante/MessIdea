import {
  Goal,
  Idea,
  ScoringConfig,
  UserProfile,
} from '../types';
import { DEFAULT_SCORING_CONFIG } from '../shared/scoringConfig';
import { rankAllIdeas } from '../shared/scoring';

const STORAGE_KEYS = {
  CURRENT_USER: 'ideaboard_current_user',
  USERS_PREFIX: 'ideaboard_user_',
  SCORING_CONFIG: 'ideaboard_scoring_config',
  THEME: 'ideaboard_theme',
};

export const INITIAL_DEMO_GOALS: Goal[] = [
  {
    id: 'goal-job-dev',
    userId: 'demo-user-1',
    title: 'Land a software developer job',
    description: 'Transition into full-time software engineering within 6 months',
    horizon: '3m',
    importance: 5,
    status: 'active',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'goal-side-income',
    userId: 'demo-user-1',
    title: 'Build $1k/mo side income stream',
    description: 'Generate reliable passive or semi-passive revenue through digital products or services',
    horizon: '1y',
    importance: 4,
    status: 'active',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now() - 25 * 86400000,
  },
  {
    id: 'goal-health',
    userId: 'demo-user-1',
    title: 'Run a half marathon & maintain fitness',
    description: 'Build cardio endurance and consistent fitness habit',
    horizon: '1y',
    importance: 3,
    status: 'active',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 20 * 86400000,
  },
];

export const INITIAL_DEMO_PROFILE: UserProfile = {
  uid: 'demo-user-1',
  displayName: 'Alex Chen',
  email: 'alex.chen@example.com',
  aboutMe: 'Full-stack builder passionate about web apps, developer tools, and pragmatic products. Good with TypeScript, React, and UX prototyping.',
  situation: 'employed_full',
  skills: ['TypeScript', 'React', 'Node.js', 'UI Design', 'API Integration', 'Content Writing'],
  hoursPerWeek: 8,
  riskAppetite: 'medium',
  onboardingDone: true,
  createdAt: Date.now() - 30 * 86400000,
  updatedAt: Date.now() - 30 * 86400000,
};

export const INITIAL_DEMO_IDEAS: Idea[] = [
  {
    id: 'idea-portfolio-app',
    userId: 'demo-user-1',
    title: 'Build a portfolio web app with live interactive demos',
    description: 'A focused, showcase website highlighting 3 production-grade projects with live embeds and case studies to impress engineering hiring managers.',
    fieldTag: 'Tech',
    goalLinks: [
      { goalId: 'goal-job-dev', fit: 5 },
      { goalId: 'goal-side-income', fit: 2 },
    ],
    impact: 4,
    urgency: 3,
    skillMatch: 4,
    excitement: 4,
    effort: 3,
    hoursPerWeekNeeded: 4,
    confidence: 4,
    priorityScore: 62,
    scoreBreakdown: {} as any,
    bucket: 'now',
    pinnedBucket: null,
    status: 'in_progress',
    aiReasoning: 'Directly powers your primary 3-month goal of landing a developer job. Your high skill match keeps execution fast and realistic within your 8 weekly hours.',
    nextAction: 'Deploy the hero section and first interactive demo to Vercel',
    followUpQuestions: [
      'Do you have live links to your existing GitHub repositories ready?',
      'Which specific niche or stack (e.g. React frontend vs full-stack) do you want recruiters to notice first?',
    ],
    followUpAnswers: [
      {
        question: 'Do you have live links to your existing GitHub repositories ready?',
        answer: 'Yes, three clean GitHub repos with READMEs and unit tests.',
        answeredAt: Date.now() - 86400000 * 2,
      },
    ],
    notes: [
      { id: 'n1', text: 'Wireframed the layout in Figma and picked clean typography.', createdAt: Date.now() - 86400000 * 5 },
      { id: 'n2', text: 'Implemented dark mode and responsive layout.', createdAt: Date.now() - 86400000 * 2 },
    ],
    links: ['https://github.com/alexchen/portfolio-v2'],
    scoresSource: 'mixed',
    userEditedScores: {},
    lastActivityAt: Date.now() - 86400000 * 2,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'idea-cooking-channel',
    userId: 'demo-user-1',
    title: 'Start a cooking YouTube channel for quick high-protein meals',
    description: 'Produce weekly short-form & long-form videos showcasing batch cooking and clean eating for busy software developers.',
    fieldTag: 'Creative',
    goalLinks: [
      { goalId: 'goal-job-dev', fit: 2 },
      { goalId: 'goal-side-income', fit: 3 },
      { goalId: 'goal-health', fit: 4 },
    ],
    impact: 3,
    urgency: 1,
    skillMatch: 2,
    excitement: 5,
    effort: 4,
    hoursPerWeekNeeded: 6,
    confidence: 2,
    priorityScore: 19,
    scoreBreakdown: {} as any,
    bucket: 'parked',
    pinnedBucket: null,
    status: 'idea',
    aiReasoning: 'High personal excitement, but high effort and minimal direct alignment with your immediate 3-month goal of landing a software developer role. Better parked until career transition is secured.',
    nextAction: 'Outline 3 sample recipe scripts and test camera lighting on smartphone',
    followUpQuestions: [
      'Have you ever edited video footage before?',
      'Would you consider starting with 60-second TikTok/Reels first to test audience appetite?',
    ],
    followUpAnswers: [],
    notes: [
      { id: 'nb1', text: 'Brainstormed 10 high-protein dinner recipes that take under 20 minutes.', createdAt: Date.now() - 86400000 * 10 },
    ],
    links: [],
    scoresSource: 'user',
    userEditedScores: {},
    lastActivityAt: Date.now() - 86400000 * 10,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'idea-freelance-audit',
    userId: 'demo-user-1',
    title: 'Offer paid technical landing page audits for indie SaaS',
    description: 'Provide 15-minute video audits reviewing web performance, SEO structure, copy clarity, and conversion rate for bootstrapped startups.',
    fieldTag: 'Business',
    goalLinks: [
      { goalId: 'goal-job-dev', fit: 4 },
      { goalId: 'goal-side-income', fit: 5 },
    ],
    impact: 4,
    urgency: 4,
    skillMatch: 4,
    excitement: 3,
    effort: 2,
    hoursPerWeekNeeded: 3,
    confidence: 4,
    priorityScore: 68,
    scoreBreakdown: {} as any,
    bucket: 'now',
    pinnedBucket: null,
    status: 'idea',
    aiReasoning: 'Exceptional fit with your $1k/mo side income goal, low effort, and creates public case studies that strengthen your portfolio for developer hiring.',
    nextAction: 'Do 2 free audits on Twitter/X to collect video testimonials',
    followUpQuestions: [],
    followUpAnswers: [],
    notes: [
      { id: 'nfa1', text: 'Drafted audit checklist covering Lighthouse scores, CTA hierarchy, and mobile responsive checks.', createdAt: Date.now() - 86400000 * 3 },
    ],
    links: [],
    scoresSource: 'ai',
    userEditedScores: {},
    lastActivityAt: Date.now() - 86400000 * 3,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'idea-crypto-bot',
    userId: 'demo-user-1',
    title: 'Algorithmic crypto momentum trading bot in Python',
    description: 'Write an automated trading strategy running against Binance API with trailing stop loss.',
    fieldTag: 'Finance',
    goalLinks: [
      { goalId: 'goal-job-dev', fit: 3 },
      { goalId: 'goal-side-income', fit: 3 },
    ],
    impact: 4,
    urgency: 2,
    skillMatch: 3,
    excitement: 4,
    effort: 4,
    hoursPerWeekNeeded: 5,
    confidence: 2,
    priorityScore: 32,
    scoreBreakdown: {} as any,
    bucket: 'later',
    pinnedBucket: null,
    status: 'idea',
    aiReasoning: 'Financial market volatility and capital risk heavily penalize confidence. High time sink relative to the uncertain outcome.',
    nextAction: 'Backtest simple RSI crossover strategy on historical paper data',
    followUpQuestions: [
      'What capital are you willing to allocate to risk testing?',
    ],
    followUpAnswers: [],
    notes: [],
    links: [],
    scoresSource: 'ai',
    userEditedScores: {},
    lastActivityAt: Date.now() - 86400000 * 8,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'idea-stale-example',
    userId: 'demo-user-1',
    title: 'Newsletter on AI developer tools & weekly curated GitHub repos',
    description: 'Weekly Substack roundup reviewing 5 new open-source developer tools with practical usage code snippets.',
    fieldTag: 'Learning',
    goalLinks: [
      { goalId: 'goal-job-dev', fit: 4 },
      { goalId: 'goal-side-income', fit: 4 },
    ],
    impact: 3,
    urgency: 3,
    skillMatch: 4,
    excitement: 4,
    effort: 2,
    hoursPerWeekNeeded: 2,
    confidence: 4,
    priorityScore: 58,
    scoreBreakdown: {} as any,
    bucket: 'next',
    pinnedBucket: null,
    status: 'idea',
    aiReasoning: 'Solid learning and networking vehicle with low weekly commitment. Fits easily once current Now items reach completion.',
    nextAction: 'Publish Issue #0 summarizing top 5 TypeScript libraries of the month',
    followUpQuestions: [],
    followUpAnswers: [],
    notes: [],
    links: [],
    scoresSource: 'ai',
    userEditedScores: {},
    lastActivityAt: Date.now() - 86400000 * 16, // Inactive > 14 days (demonstrates stale flag when in Now)
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 16,
  },
];

export interface UserDataStore {
  profile: UserProfile;
  goals: Goal[];
  ideas: Idea[];
  version?: number;
}

export function loadCurrentUserId(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'demo-user-1';
}

export function saveCurrentUserId(uid: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, uid);
}

export function loadScoringConfig(): ScoringConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCORING_CONFIG);
    if (raw) {
      return { ...DEFAULT_SCORING_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading custom scoring config:', e);
  }
  return DEFAULT_SCORING_CONFIG;
}

export function saveScoringConfig(config: ScoringConfig): void {
  localStorage.setItem(STORAGE_KEYS.SCORING_CONFIG, JSON.stringify(config));
}

export interface DemoUserSummary {
  uid: string;
  displayName: string;
  email: string;
  ideaCount: number;
}

export function listSavedDemoUsers(): DemoUserSummary[] {
  const users: DemoUserSummary[] = [];
  const foundUids = new Set<string>();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.USERS_PREFIX)) {
      const uid = key.slice(STORAGE_KEYS.USERS_PREFIX.length);
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          users.push({
            uid,
            displayName: parsed.profile?.displayName || 'Demo User',
            email: parsed.profile?.email || '',
            ideaCount: Array.isArray(parsed.ideas) ? parsed.ideas.length : 0,
          });
          foundUids.add(uid);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!foundUids.has('demo-user-1')) {
    users.unshift({
      uid: 'demo-user-1',
      displayName: INITIAL_DEMO_PROFILE.displayName,
      email: INITIAL_DEMO_PROFILE.email,
      ideaCount: INITIAL_DEMO_IDEAS.length,
    });
  }

  return users;
}

export function replaceWithSampleData(uid: string): UserDataStore {
  const initialConfig = loadScoringConfig();
  const rankedIdeas = rankAllIdeas(INITIAL_DEMO_IDEAS, INITIAL_DEMO_PROFILE, INITIAL_DEMO_GOALS, initialConfig);
  const store: UserDataStore = {
    profile: { ...INITIAL_DEMO_PROFILE, uid, updatedAt: Date.now() },
    goals: INITIAL_DEMO_GOALS.map((g) => ({ ...g, userId: uid })),
    ideas: rankedIdeas.map((i) => ({ ...i, userId: uid, isAiScoring: false, pinnedBucket: null })),
    version: 2,
  };
  saveUserData(uid, store);
  return store;
}

export function loadUserData(uid: string): UserDataStore {
  const key = `${STORAGE_KEYS.USERS_PREFIX}${uid}`;
  const raw = localStorage.getItem(key);

  if (!raw) {
    if (uid === 'demo-user-1') {
      // Alex Chen sample demo user
      const initialConfig = loadScoringConfig();
      const rankedIdeas = rankAllIdeas(INITIAL_DEMO_IDEAS, INITIAL_DEMO_PROFILE, INITIAL_DEMO_GOALS, initialConfig);
      const store: UserDataStore = {
        profile: { ...INITIAL_DEMO_PROFILE, uid },
        goals: INITIAL_DEMO_GOALS.map((g) => ({ ...g, userId: uid })),
        ideas: rankedIdeas.map((i) => ({ ...i, userId: uid, isAiScoring: false, pinnedBucket: null })),
        version: 2,
      };
      saveUserData(uid, store);
      return store;
    } else {
      // New user gets an EMPTY board: NO demo goals and NO demo ideas
      const newProfile: UserProfile = {
        uid,
        displayName: 'New User',
        email: '',
        aboutMe: '',
        situation: 'employed_full',
        skills: [],
        hoursPerWeek: 10,
        riskAppetite: 'medium',
        onboardingDone: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const store: UserDataStore = {
        profile: newProfile,
        goals: [],
        ideas: [],
        version: 2,
      };
      saveUserData(uid, store);
      return store;
    }
  }

  try {
    const parsed = JSON.parse(raw) as UserDataStore;
    const config = loadScoringConfig();

    // 1. Never load stuck isAiScoring state
    let ideas = (parsed.ideas || []).map((idea) => ({
      ...idea,
      isAiScoring: false,
    }));

    // 2. One-time clean-up on load: set pinnedBucket to null on all existing ideas, recorded via version 2
    const needsPinCleanup = !parsed.version || parsed.version < 2;
    if (needsPinCleanup) {
      ideas = ideas.map((idea) => ({
        ...idea,
        pinnedBucket: null,
      }));
      parsed.version = 2;
    }

    // Ensure all ideas have updated ranks & breakdown
    parsed.ideas = rankAllIdeas(ideas, parsed.profile, parsed.goals, config);

    if (needsPinCleanup) {
      saveUserData(uid, parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Failed to parse user data:', err);
    return {
      profile: { ...INITIAL_DEMO_PROFILE, uid },
      goals: [],
      ideas: [],
      version: 2,
    };
  }
}

export function saveUserData(uid: string, data: UserDataStore): void {
  const key = `${STORAGE_KEYS.USERS_PREFIX}${uid}`;
  // Never save isAiScoring to persistent storage
  const cleanIdeas = (data.ideas || []).map((idea) => {
    const copy = { ...idea };
    delete copy.isAiScoring;
    return copy;
  });

  const payload: UserDataStore = {
    ...data,
    ideas: cleanIdeas,
    version: data.version ?? 2,
  };

  localStorage.setItem(key, JSON.stringify(payload));
}

export function exportUserDataAsJson(uid: string): string {
  const data = loadUserData(uid);
  const config = loadScoringConfig();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    app: 'MessIdea',
    config,
    ...data,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importUserDataFromJson(uid: string, jsonString: string): UserDataStore {
  const parsed = JSON.parse(jsonString);
  if (!parsed.profile || !Array.isArray(parsed.goals) || !Array.isArray(parsed.ideas)) {
    throw new Error('Invalid MessIdea backup file format. Missing profile, goals, or ideas.');
  }

  const profile: UserProfile = {
    ...parsed.profile,
    uid,
    updatedAt: Date.now(),
  };

  const goals: Goal[] = parsed.goals.map((g: Goal) => ({
    ...g,
    userId: uid,
  }));

  const ideas: Idea[] = parsed.ideas.map((i: Idea) => ({
    ...i,
    userId: uid,
  }));

  const config = parsed.config ? { ...DEFAULT_SCORING_CONFIG, ...parsed.config } : loadScoringConfig();
  saveScoringConfig(config);

  const rankedIdeas = rankAllIdeas(ideas, profile, goals, config);
  const store: UserDataStore = {
    profile,
    goals,
    ideas: rankedIdeas,
  };

  saveUserData(uid, store);
  return store;
}

export function deleteUserData(uid: string): void {
  const key = `${STORAGE_KEYS.USERS_PREFIX}${uid}`;
  localStorage.removeItem(key);
}
