import React, { useState } from 'react';
import {
  UserProfile,
  Goal,
  Situation,
  RiskAppetite,
  Horizon,
} from '../types';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
  Sparkles,
  Target,
  Clock,
  Shield,
  Briefcase,
  X,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile, goals: Goal[]) => void;
  initialProfile: UserProfile;
  initialGoals: Goal[];
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialProfile,
  initialGoals,
}) => {
  const [step, setStep] = useState(1);
  const [aboutMe, setAboutMe] = useState(initialProfile.aboutMe || '');
  const [situation, setSituation] = useState<Situation>(
    initialProfile.situation || 'employed_full'
  );
  const [skills, setSkills] = useState<string[]>(
    initialProfile.skills?.length ? initialProfile.skills : ['TypeScript', 'Design']
  );
  const [skillInput, setSkillInput] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(
    initialProfile.hoursPerWeek || 8
  );
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>(
    initialProfile.riskAppetite || 'medium'
  );

  const [goalsList, setGoalsList] = useState<
    Array<{
      id: string;
      title: string;
      horizon: Horizon;
      importance: number;
      description?: string;
    }>
  >(
    initialGoals.length > 0
      ? initialGoals.map((g) => ({
          id: g.id,
          title: g.title,
          horizon: g.horizon,
          importance: g.importance,
          description: g.description,
        }))
      : [
          {
            id: 'g-1',
            title: 'Land a software developer job',
            horizon: '3m',
            importance: 5,
            description: 'Transition into engineering within 6 months',
          },
        ]
  );

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalHorizon, setNewGoalHorizon] = useState<Horizon>('3m');
  const [newGoalImportance, setNewGoalImportance] = useState(5);

  if (!isOpen) return null;

  const totalSteps = 6;

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddGoal = () => {
    if (!newGoalTitle.trim() || goalsList.length >= 5) return;
    setGoalsList([
      ...goalsList,
      {
        id: `g-${Date.now()}`,
        title: newGoalTitle.trim(),
        horizon: newGoalHorizon,
        importance: newGoalImportance,
      },
    ]);
    setNewGoalTitle('');
    setNewGoalHorizon('1y');
    setNewGoalImportance(4);
  };

  const handleRemoveGoal = (id: string) => {
    if (goalsList.length <= 1) {
      alert('You must have at least one active goal for IdeaBoard to prioritize.');
      return;
    }
    setGoalsList(goalsList.filter((g) => g.id !== id));
  };

  const handleFinish = () => {
    if (goalsList.length === 0) {
      alert('Please define at least one goal to complete onboarding.');
      return;
    }

    const updatedProfile: UserProfile = {
      ...initialProfile,
      aboutMe,
      situation,
      skills,
      hoursPerWeek,
      riskAppetite,
      onboardingDone: true,
      updatedAt: Date.now(),
    };

    const updatedGoals: Goal[] = goalsList.map((g) => ({
      id: g.id,
      userId: initialProfile.uid,
      title: g.title,
      description: g.description || '',
      horizon: g.horizon,
      importance: g.importance,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    onComplete(updatedProfile, updatedGoals);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header & Progress */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ~3 minutes setup
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Step Container */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {/* STEP 1: About you */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Tell us a bit about you
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  A short paragraph about what you do, what you are good at, and what drives you.
                </p>
              </div>

              <textarea
                rows={4}
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="e.g. I am a frontend developer learning backend architecture. I love building practical web tools and SaaS prototypes, and want to build a career in software engineering..."
                className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* STEP 2: Current Situation */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  What is your current situation?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This helps calibrate your realistic energy and career constraints.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'student', label: 'Student', desc: 'In school or university' },
                  { id: 'employed_full', label: 'Employed Full-time', desc: 'Working 35-45 hours a week' },
                  { id: 'employed_part', label: 'Employed Part-time', desc: 'Working flexible or reduced hours' },
                  { id: 'self_employed', label: 'Self-employed / Freelancer', desc: 'Running own business or contracts' },
                  { id: 'between_jobs', label: 'Between Jobs', desc: 'Dedicated focus on learning or transition' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSituation(item.id as Situation)}
                    className={`flex items-start text-left p-3.5 rounded-xl border transition-all ${
                      situation === item.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    {situation === item.id && (
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  What skills do you already have?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ideas matching your current skills score higher on execution speed.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[100px]">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type skill & press Enter (e.g. Python, UI Design, Sales)..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    className="flex-1 min-w-[200px] bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none p-1"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Tip: Press Enter to add tags. You can add more later in Profile.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Hours per week */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Hours per week you can give to side ideas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  The "Now" column enforces this limit so you never overcommit and burn out.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                  {hoursPerWeek} <span className="text-base font-normal text-slate-500">hours / week</span>
                </div>

                <input
                  type="range"
                  min={2}
                  max={40}
                  step={1}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />

                <p className="text-xs text-slate-500">
                  {hoursPerWeek <= 5
                    ? 'Tight focus: 1 small project at a time.'
                    : hoursPerWeek <= 12
                    ? 'Balanced: Room for 1 primary project and a small experiment.'
                    : 'Substantial side hours: Can tackle ambitious builds.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Risk Appetite */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  What is your risk appetite?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Controls how heavily vague or uncertain ideas are penalised by the formula.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: 'low',
                    label: 'Low Risk Appetite (Cautious)',
                    desc: 'Penalises uncertainty heavily (r = 0.40). Vague ideas sink straight to Parked until validated.',
                  },
                  {
                    id: 'medium',
                    label: 'Medium Risk Appetite (Balanced)',
                    desc: 'Standard calibration (r = 0.30). Weighs confidence reasonably without shutting down exploration.',
                  },
                  {
                    id: 'high',
                    label: 'High Risk Appetite (Bold)',
                    desc: 'Minimal uncertainty penalty (r = 0.15). Willing to bet on high-payoff ideas even with early ambiguity.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRiskAppetite(item.id as RiskAppetite)}
                    className={`flex items-start text-left p-4 rounded-xl border transition-all ${
                      riskAppetite === item.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    {riskAppetite === item.id && (
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Goals (1 to 5 goals) */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Define 1 to 5 Core Goals
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ideas must serve these goals. Goal alignment makes up 40% of every idea score.
                </p>
              </div>

              {/* Goal List */}
              <div className="space-y-2">
                {goalsList.map((g, idx) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {idx + 1}. {g.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Horizon: {g.horizon} • Importance: {g.importance}★
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(g.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Goal Subform */}
              {goalsList.length < 5 && (
                <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Add another goal ({goalsList.length}/5)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Build a $1,000/mo side income"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={newGoalHorizon}
                      onChange={(e) => setNewGoalHorizon(e.target.value as Horizon)}
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="3m">3 Months</option>
                      <option value="1y">1 Year</option>
                      <option value="3y_plus">3+ Years</option>
                    </select>

                    <select
                      value={newGoalImportance}
                      onChange={(e) => setNewGoalImportance(Number(e.target.value))}
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value={5}>5★ Critical</option>
                      <option value={4}>4★ High</option>
                      <option value={3}>3★ Medium</option>
                      <option value={2}>2★ Low</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddGoal}
                      disabled={!newGoalTitle.trim()}
                      className="ml-auto px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white disabled:opacity-50"
                    >
                      Add Goal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <CheckCircle className="w-4 h-4" />
              Finish Setup & Launch Board
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
