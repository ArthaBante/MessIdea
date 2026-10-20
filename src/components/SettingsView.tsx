import React, { useState } from 'react';
import {
  UserProfile,
  ScoringConfig,
  Situation,
  RiskAppetite,
} from '../types';
import {
  Settings,
  User,
  Sliders,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  RefreshCw,
  FlaskConical,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_SCORING_CONFIG } from '../shared/scoringConfig';
import { verifyWorkedExample } from '../shared/scoring';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  profile: UserProfile;
  scoringConfig: ScoringConfig;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateScoringConfig: (config: ScoringConfig) => void;
  onExportJson: () => void;
  onImportJson: (jsonStr: string) => void;
  onResetData: () => void;
  onRestartOnboarding: () => void;
  aiEnabled: boolean;
  onToggleAi: (enabled: boolean) => void;
  onDone?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  scoringConfig,
  onUpdateProfile,
  onUpdateScoringConfig,
  onExportJson,
  onImportJson,
  onResetData,
  onRestartOnboarding,
  aiEnabled,
  onToggleAi,
  onDone,
}) => {
  const [profileForm, setProfileForm] = useState<UserProfile>(profile);
  const [skillInput, setSkillInput] = useState('');
  const [configForm, setConfigForm] = useState<ScoringConfig>(scoringConfig);
  const [testResult, setTestResult] = useState<ReturnType<typeof verifyWorkedExample> | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleGoalFitWeightChange = (newGoalFit: number) => {
    const currentOthersSum =
      configForm.impactWeight +
      configForm.urgencyWeight +
      configForm.skillMatchWeight +
      configForm.excitementWeight;

    const targetOthersSum = Math.max(0, 1 - newGoalFit);
    let updated: ScoringConfig;

    if (currentOthersSum > 0) {
      const factor = targetOthersSum / currentOthersSum;
      updated = {
        ...configForm,
        goalFitWeight: newGoalFit,
        impactWeight: configForm.impactWeight * factor,
        urgencyWeight: configForm.urgencyWeight * factor,
        skillMatchWeight: configForm.skillMatchWeight * factor,
        excitementWeight: configForm.excitementWeight * factor,
      };
    } else {
      const each = targetOthersSum / 4;
      updated = {
        ...configForm,
        goalFitWeight: newGoalFit,
        impactWeight: each,
        urgencyWeight: each,
        skillMatchWeight: each,
        excitementWeight: each,
      };
    }
    setConfigForm(updated);
    onUpdateScoringConfig(updated);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profileForm,
      updatedAt: Date.now(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onDone?.();
    }, 800);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!profileForm.skills.includes(skillInput.trim())) {
        setProfileForm({
          ...profileForm,
          skills: [...profileForm.skills, skillInput.trim()],
        });
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileForm({
      ...profileForm,
      skills: profileForm.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleConfigChange = (key: keyof ScoringConfig, value: any) => {
    const updated = {
      ...configForm,
      [key]: value,
    };
    setConfigForm(updated);
    onUpdateScoringConfig(updated);
  };

  const handleResetConfig = () => {
    setConfigForm(DEFAULT_SCORING_CONFIG);
    onUpdateScoringConfig(DEFAULT_SCORING_CONFIG);
  };

  const handleRunTest = () => {
    const res = verifyWorkedExample();
    setTestResult(res);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          onImportJson(text);
          setImportStatus('Data imported successfully!');
          setTimeout(() => setImportStatus(null), 3000);
        } catch (err: any) {
          setImportStatus('Failed to import JSON: ' + (err?.message || 'Invalid format'));
          setTimeout(() => setImportStatus(null), 4000);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Profile & Formula Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal context, tune prioritization weights, and export data backups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">AI Features</span>
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => onToggleAi(e.target.checked)}
              className="w-8 h-4 bg-slate-200 rounded-full appearance-none checked:bg-blue-600 transition-colors cursor-pointer"
            />
          </label>
          <button
            onClick={onRestartOnboarding}
            className="text-xs font-semibold px-4 py-2 min-h-[44px] rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 transition-colors flex items-center justify-center"
          >
            Re-run Onboarding
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-blue-500" />
          Personal Profile & Calibration Inputs
        </h3>

        <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={profileForm.displayName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, displayName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current Situation
              </label>
              <select
                value={profileForm.situation}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    situation: e.target.value as Situation,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="employed_full">Employed Full-time</option>
                <option value="employed_part">Employed Part-time</option>
                <option value="self_employed">Self-employed / Freelancer</option>
                <option value="between_jobs">Between Jobs</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              About You (Free-text paragraph)
            </label>
            <textarea
              rows={3}
              value={profileForm.aboutMe}
              onChange={(e) =>
                setProfileForm({ ...profileForm, aboutMe: e.target.value })
              }
              placeholder="What do you do, what are you great at, and what are you trying to accomplish?"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Skills Tag input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Skills & Expertise (Press Enter to add tag)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-2">
              {profileForm.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add skill tag..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none px-1 py-0.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hours Per Week for Side Ideas
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={profileForm.hoursPerWeek}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      hoursPerWeek: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-blue-600"
                />
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400 w-16">
                  {profileForm.hoursPerWeek} h/wk
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Formula Verification & Tunable Weights */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Prioritisation Engine Verification & Calibration
            </h3>
          </div>
          <button
            onClick={handleRunTest}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Run Worked Example Test
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              testResult.passed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>
                {testResult.passed
                  ? 'Spec Formula Unit Test PASSED with 100% Precision'
                  : 'Test FAILED'}
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              {testResult.details}
            </p>
          </div>
        )}

        {/* Advanced scoring weights collapsible */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 py-2 cursor-pointer"
          >
            <span>Advanced: scoring weights</span>
            <span>{advancedOpen ? '▴' : '▾'}</span>
          </button>

          {advancedOpen && (
            <div className="pt-3 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Goal Fit Weight: {(configForm.goalFitWeight * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={configForm.goalFitWeight}
                  onChange={(e) =>
                    handleGoalFitWeightChange(parseFloat(e.target.value))
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Impact Weight:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{(configForm.impactWeight * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Urgency Weight:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{(configForm.urgencyWeight * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Skill Match Weight:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{(configForm.skillMatchWeight * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Excitement Weight:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{(configForm.excitementWeight * 100).toFixed(0)}%</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Effort Penalty Weight: {(configForm.effortPenaltyWeight * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.6}
                  step={0.05}
                  value={configForm.effortPenaltyWeight}
                  onChange={(e) =>
                    handleConfigChange('effortPenaltyWeight', parseFloat(e.target.value))
                  }
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleResetConfig}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Formula Weights to Default
          </button>
        </div>
      </div>

      {/* Data Management: Export / Import / Clear */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-500" />
          Data Backup & Account Management
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export JSON */}
          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data as JSON
          </button>

          {/* Import JSON */}
          <label className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import / Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          {/* Replace Board with Sample Data */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors sm:ml-auto cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Replace my board with sample data
          </button>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {saveSuccess ? (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Saved! Returning to board...
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            Changes to your profile and hours will re-rank your idea board.
          </span>
        )}

        <button
          type="submit"
          form="profile-form"
          className="w-full sm:w-auto px-6 py-3 min-h-[44px] text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center justify-center transition-colors cursor-pointer"
        >
          Save Profile Changes
        </button>
      </div>

      {/* Confirmation dialog for replacing board */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Replace my board with sample data?"
        message="Your current ideas and goals will be lost."
        confirmLabel="Replace"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetData();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
