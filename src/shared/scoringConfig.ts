import { ScoringConfig } from '../types';

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  goalFitWeight: 0.40,
  impactWeight: 0.20,
  urgencyWeight: 0.15,
  skillMatchWeight: 0.15,
  excitementWeight: 0.10,
  effortPenaltyWeight: 0.35,
  riskFactors: {
    low: 0.40,
    medium: 0.30,
    high: 0.15,
  },
  horizonWeights: {
    '3m': 1.0,
    '1y': 0.9,
    '3y_plus': 0.8,
  },
  thresholds: {
    goalFitCutoff: 0.20,
    nowScoreMin: 55,
    maxNowCount: 3,
    nextScoreMin: 40,
    laterScoreMin: 20,
  },
};
