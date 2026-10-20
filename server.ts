import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

app.use(express.json({ limit: '2mb' }));

// Initialize Google GenAI client (server-side only)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

// In-memory rate limiter: 50 calls per user per day
interface RateLimitBucket {
  count: number;
  dateStr: string;
}
const userCallTracker = new Map<string, RateLimitBucket>();

function checkAndIncrementRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
} {
  const today = new Date().toISOString().slice(0, 10);
  const key = userId || 'anonymous';
  const current = userCallTracker.get(key);

  if (!current || current.dateStr !== today) {
    userCallTracker.set(key, { count: 1, dateStr: today });
    return { allowed: true, remaining: 49 };
  }

  if (current.count >= 50) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: 50 - current.count };
}

app.get('/api/rate-limit-status', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const today = new Date().toISOString().slice(0, 10);
  const current = userCallTracker.get(userId);
  const count = current && current.dateStr === today ? current.count : 0;
  res.json({
    limit: 50,
    used: count,
    remaining: Math.max(0, 50 - count),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';
  const rawMsg = error.message || String(error);
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.message) return parsed.message;
  } catch {}
  return rawMsg;
}

async function generateWithRetry(params: any, retries = 0, delayMs = 1500) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      // Retries are disabled
      throw err;
    }
  }
  throw new Error('Failed to generate content');
}

// 1. Idea Scoring endpoint
app.post('/api/score-idea', async (req: Request, res: Response): Promise<void> => {
  try {
    const { profile, activeGoals, idea } = req.body;

    if (!idea || !idea.title) {
      res.status(400).json({ error: 'Idea with title is required' });
      return;
    }

    if (!ai) {
      // If no key configured, report clean error so client stays unscored with manual scoring option
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please attach an API key in Secrets to enable automatic AI scoring.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const userId = profile?.uid || idea?.userId || 'anonymous';
    const rateCheck = checkAndIncrementRateLimit(userId);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error:
          'Daily AI scoring limit reached (50 calls per day). Please adjust scores manually or try again tomorrow.',
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
      });
      return;
    }

    const systemInstruction = `You are the scoring assistant inside MessIdea, an app that helps one person decide which of their ideas to work on.
You receive the person's profile, their active goals, and one idea.
Score the idea honestly against THIS person's goals, skills and available time — not against an average person.
Rules:
- Use the 1–5 scales exactly as defined. Be calibrated: most ideas are 2–4 on most scales; reserve 5 for exceptional cases.
- goalLinks: include every active goal, with fit 1 (does not help) to 5 (directly achieves it).
- Do NOT score excitement; that belongs to the person.
- If the idea is vague or lacks critical detail, lower confidence and ask at most 3 short, targeted follow-up questions that would most change the scores. NEVER repeat any questions or topics that have already been answered in 'Answers to earlier follow-up questions'. If no further clarification is needed, return an empty list [].
- nextAction: one concrete step that takes under 2 hours.
- nextSteps: 3 to 5 short strings, in sequential order, each doable in under 2 hours, based on the idea, notes, follow-up answers, profile and goals.
- reasoning: 2–4 plain sentences on how the idea serves (or doesn't serve) their goals and the main trade-off. Do not mention numeric scores.
- Return only JSON matching the schema.`;

    const goalsText =
      Array.isArray(activeGoals) && activeGoals.length > 0
        ? activeGoals
            .map(
              (g: any) =>
                `- ID: "${g.id}" | Title: "${g.title}" | Horizon: ${g.horizon} | Importance: ${g.importance}/5 | Description: ${g.description || 'None'}`
            )
            .join('\n')
        : 'None specified';

    const recentNotes =
      Array.isArray(idea.notes) && idea.notes.length > 0
        ? idea.notes
            .slice(-5)
            .map((n: any) => `* ${n.text}`)
            .join('\n')
        : 'None';

    const answersText =
      Array.isArray(idea.followUpAnswers) && idea.followUpAnswers.length > 0
        ? idea.followUpAnswers
            .map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`)
            .join('\n')
        : 'None';

    const userPrompt = `PROFILE
About: ${profile?.aboutMe || 'Not provided'}
Situation: ${profile?.situation || 'not specified'}
Skills: ${Array.isArray(profile?.skills) ? profile.skills.join(', ') : 'Not provided'}
Hours per week available: ${profile?.hoursPerWeek ?? 10}

ACTIVE GOALS
${goalsText}

IDEA
Title: ${idea.title}
Description: ${idea.description || 'No description provided'}
Notes so far:
${recentNotes}
Answers to earlier follow-up questions:
${answersText}

SCALES
impact: size of payoff if it works (1 tiny, 5 life-changing)
urgency: time-sensitivity (1 can wait indefinitely, 5 window closes within weeks)
skillMatch: fit with current skills (1 mostly new skills, 5 already skilled)
effort: total work (1 a weekend, 3 a few weeks, 5 many months)
confidence: how sure you are of these scores (1 guessing, 5 very sure)`;

    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'fieldTag',
            'goalLinks',
            'impact',
            'urgency',
            'skillMatch',
            'effort',
            'hoursPerWeekNeeded',
            'confidence',
            'nextAction',
            'nextSteps',
            'followUpQuestions',
            'reasoning',
          ],
          properties: {
            fieldTag: {
              type: Type.STRING,
              enum: [
                'Tech',
                'Business',
                'Finance',
                'Creative',
                'Health',
                'Learning',
                'Social',
                'Other',
              ],
            },
            goalLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['goalId', 'fit'],
                properties: {
                  goalId: { type: Type.STRING },
                  fit: { type: Type.INTEGER },
                },
              },
            },
            impact: { type: Type.INTEGER },
            urgency: { type: Type.INTEGER },
            skillMatch: { type: Type.INTEGER },
            effort: { type: Type.INTEGER },
            hoursPerWeekNeeded: { type: Type.NUMBER },
            confidence: { type: Type.INTEGER },
            nextAction: { type: Type.STRING },
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 short actionable steps in order, each under 2 hours',
            },
            followUpQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            reasoning: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from model');
    }

    const parsed = JSON.parse(text);

    // Validate bounds and filter goalLinks to active goals only
    const validGoalIds = new Set(
      Array.isArray(activeGoals) ? activeGoals.map((g: any) => g.id) : []
    );

    const safeGoalLinks = Array.isArray(parsed.goalLinks)
      ? parsed.goalLinks
          .filter((gl: any) => validGoalIds.has(gl.goalId))
          .map((gl: any) => ({
            goalId: gl.goalId,
            fit: Math.min(5, Math.max(1, Math.round(Number(gl.fit) || 1))),
          }))
      : [];

    const clamped = {
      fieldTag: parsed.fieldTag || 'Other',
      goalLinks: safeGoalLinks,
      impact: Math.min(5, Math.max(1, Math.round(Number(parsed.impact) || 3))),
      urgency: Math.min(5, Math.max(1, Math.round(Number(parsed.urgency) || 2))),
      skillMatch: Math.min(5, Math.max(1, Math.round(Number(parsed.skillMatch) || 3))),
      effort: Math.min(5, Math.max(1, Math.round(Number(parsed.effort) || 3))),
      hoursPerWeekNeeded: Math.max(
        0,
        Math.min(60, Math.round((Number(parsed.hoursPerWeekNeeded) || 4) * 2) / 2)
      ),
      confidence: Math.min(5, Math.max(1, Math.round(Number(parsed.confidence) || 3))),
      nextAction: parsed.nextAction?.trim() || 'Identify first small experiment',
      nextSteps:
        Array.isArray(parsed.nextSteps) && parsed.nextSteps.length > 0
          ? parsed.nextSteps.slice(0, 5).map((s: any) => String(s).trim()).filter(Boolean)
          : [parsed.nextAction?.trim() || 'Identify first small experiment'],
      followUpQuestions: Array.isArray(parsed.followUpQuestions)
        ? parsed.followUpQuestions.slice(0, 3)
        : [],
      reasoning: parsed.reasoning?.trim() || '',
    };

    res.json({
      success: true,
      data: clamped,
      remainingDailyCalls: rateCheck.remaining,
    });
  } catch (error: any) {
    console.error('Error during AI scoring:', error);
    const msg = formatErrorMessage(error);
    const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted');
    const isBusy = msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('high demand') || error?.status === 503;
    const finalError = isBusy ? 'Gemini is busy, try again in a minute.' : (isQuota ? 'Daily AI limit reached. It resets at 8am UK time. You can still set scores yourself.' : msg);
    res.status(500).json({
      error: finalError,
      code: 'SCORING_FAILED',
    });
  }
});

// Endpoint: Suggest 3 to 5 new next steps when previous steps are completed
app.post('/api/suggest-next-steps', async (req: Request, res: Response): Promise<void> => {
  try {
    const { profile, activeGoals, idea, completedSteps } = req.body;

    if (!idea || !idea.title) {
      res.status(400).json({ error: 'Idea with title is required' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const userId = profile?.uid || idea?.userId || 'anonymous';
    const rateCheck = checkAndIncrementRateLimit(userId);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: 'Daily AI limit reached (50 calls per day). Please try again tomorrow.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    const systemInstruction = `You are an execution coach for MessIdea.
The user has completed previous action steps for their idea.
Suggest 3 to 5 NEW concrete next steps, in sequential order, each doable in under 2 hours.
Rules:
- Each step must be concise, practical, and take under 2 hours.
- Build upon the completed steps, existing notes, and answers.
- Return only JSON: { "nextSteps": string[] } (3 to 5 items).`;

    const completedText =
      Array.isArray(completedSteps) && completedSteps.length > 0
        ? completedSteps.map((s: any) => `✓ ${s}`).join('\n')
        : 'All initial steps completed';

    const recentNotes =
      Array.isArray(idea.notes) && idea.notes.length > 0
        ? idea.notes.slice(-5).map((n: any) => `* ${n.text}`).join('\n')
        : 'None';

    const answersText =
      Array.isArray(idea.followUpAnswers) && idea.followUpAnswers.length > 0
        ? idea.followUpAnswers.map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n')
        : 'None';

    const goalsText =
      Array.isArray(activeGoals) && activeGoals.length > 0
        ? activeGoals.map((g: any) => `- ${g.title}`).join('\n')
        : 'None';

    const prompt = `IDEA: ${idea.title}
DESCRIPTION: ${idea.description || 'None'}
ACTIVE GOALS:
${goalsText}
COMPLETED STEPS:
${completedText}
RECENT NOTES:
${recentNotes}
ANSWERS TO CLARIFYING QUESTIONS:
${answersText}
HOURS PER WEEK AVAILABLE: ${profile?.hoursPerWeek ?? 10}`;

    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['nextSteps'],
          properties: {
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const steps = Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 5)
      : [];

    res.json({
      success: true,
      data: {
        nextSteps: steps.length > 0 ? steps : ['Plan the next phase of development'],
      },
      remainingDailyCalls: rateCheck.remaining,
    });
  } catch (err: any) {
    console.error('Error in suggest-next-steps:', err);
    const msg = formatErrorMessage(err);
    const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted');
    const isBusy = msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('high demand') || err?.status === 503;
    const finalError = isBusy ? 'Gemini is busy, try again in a minute.' : (isQuota ? 'Daily AI limit reached. It resets at 8am UK time. You can still set scores yourself.' : msg);
    res.status(500).json({
      error: finalError,
      code: 'SUGGEST_STEPS_FAILED',
    });
  }
});

// 2. Weekly Review endpoint (Phase 3)
app.post('/api/weekly-review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { profile, activeGoals, nowIdeas, nextIdeas, staleIdeas, moves } =
      req.body;

    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const userId = profile?.uid || 'anonymous';
    const rateCheck = checkAndIncrementRateLimit(userId);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: 'Daily AI limit reached. Please try again tomorrow.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    const systemInstruction = `You are writing a short weekly review for one MessIdea user.
Input: their goals, the ideas in Now and Next with scores and statuses, ideas that changed bucket this week, and stale ideas (no activity in 14+ days).
Write at most 120 words: what moved, what is stuck, and the ONE idea to focus on next week and why, tied to a goal.
Be direct. No praise, no filler. Return JSON: { "summary": string, "focusIdeaId": string }.`;

    const goalsSummary =
      Array.isArray(activeGoals) && activeGoals.length > 0
        ? activeGoals
            .map((g: any) => `Goal "${g.title}" (Importance ${g.importance}/5, Horizon ${g.horizon})`)
            .join('; ')
        : 'None';

    const nowSummary =
      Array.isArray(nowIdeas) && nowIdeas.length > 0
        ? nowIdeas
            .map((i: any) => `[ID: ${i.id}] "${i.title}" (Score: ${i.priorityScore}, Next: ${i.nextAction || 'none'})`)
            .join('; ')
        : 'None';

    const nextSummary =
      Array.isArray(nextIdeas) && nextIdeas.length > 0
        ? nextIdeas
            .slice(0, 5)
            .map((i: any) => `[ID: ${i.id}] "${i.title}" (Score: ${i.priorityScore})`)
            .join('; ')
        : 'None';

    const staleSummary =
      Array.isArray(staleIdeas) && staleIdeas.length > 0
        ? staleIdeas.map((i: any) => `"${i.title}" (${i.daysInactive} days inactive)`).join('; ')
        : 'None';

    const movesSummary =
      Array.isArray(moves) && moves.length > 0 ? moves.join('; ') : 'No recent bucket shifts';

    const prompt = `GOALS: ${goalsSummary}
IDEAS IN NOW: ${nowSummary}
TOP IDEAS IN NEXT: ${nextSummary}
STALE IDEAS: ${staleSummary}
RECENT SHIFTS: ${movesSummary}`;

    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['summary', 'focusIdeaId'],
          properties: {
            summary: { type: Type.STRING },
            focusIdeaId: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      data: {
        summary: parsed.summary || 'Review completed. Focus on your top-priority Now item.',
        focusIdeaId: parsed.focusIdeaId || (nowIdeas?.[0]?.id ?? ''),
      },
      remainingDailyCalls: rateCheck.remaining,
    });
  } catch (err: any) {
    console.error('Error in weekly review:', err);
    const msg = formatErrorMessage(err);
    const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted');
    const isBusy = msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('high demand') || err?.status === 503;
    const finalError = isBusy ? 'Gemini is busy, try again in a minute.' : (isQuota ? 'Daily AI limit reached. It resets at 8am UK time. You can still set scores yourself.' : msg);
    res.status(500).json({
      error: finalError,
      code: 'WEEKLY_REVIEW_FAILED',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MessIdea server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
