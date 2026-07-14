/** E2-14 — Executive Confidence Engine frontend types (mirrors Pillow PILLOW-ECFE-001). */

export type ConfidenceAssessment = {
  confidenceId: string;
  decisionId: string;
  title: string;
  category: string;
  domain: string;
  confidenceScore: number;
  confidenceLevel: string;
  evidenceStrength: string;
  historicalAccuracy: number;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskInfluence: string;
  supportingFactors: string[];
  limitingFactors: string[];
  recommendedAction: string;
  trend: string;
  status: string;
};

export type ConfidenceTrendEntry = {
  confidenceId: string;
  decisionId: string;
  title: string;
  previousScore: number;
  currentScore: number;
  trend: string;
  calibrationStatus: string;
};

export type ConfidenceDriverMetric = {
  domain: string;
  label: string;
  score: number;
  influence: string;
  summary: string;
};

export type ConfidenceCalibrationEntry = {
  confidenceId: string;
  title: string;
  predictedConfidence: number;
  actualOutcome: string;
  calibrationDelta: number;
  status: string;
};

export type ExecutiveConfidenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowConfidenceEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ConfidencePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveConfidenceEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  confidenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  assessedDecisionCount: number;
  highConfidenceCount: number;
  moderateConfidenceCount: number;
  lowConfidenceCount: number;
  averageConfidenceScore: number;
  confidenceAssessments: ConfidenceAssessment[];
  confidenceTrends: ConfidenceTrendEntry[];
  confidenceDrivers: ConfidenceDriverMetric[];
  confidenceCalibration: ConfidenceCalibrationEntry[];
  confidencePipeline: ConfidencePipelineStep[];
  recommendedActions: ExecutiveConfidenceRecommendation[];
  pillowEvaluations: PillowConfidenceEvaluationMetric[];
  confidencePrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE215: boolean;
};
