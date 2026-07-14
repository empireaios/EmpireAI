/** E4-09 — Executive Prediction Engine frontend types (mirrors Pillow PILLOW-EPE-001). */

export type PredictionRecord = {
  predictionId: string;
  title: string;
  category: string;
  domain: string;
  predictionHorizon: string;
  subject: string;
  predictedOutcome: string;
  probability: number;
  confidence: number;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  recommendedActions: string;
  evidence: string[];
  lastUpdated: string;
};

export type FutureOutlookEntry = {
  outlookId: string;
  predictionId: string;
  title: string;
  horizon: string;
  predictedOutcome: string;
  probability: number;
  status: string;
};

export type ProbabilityScoreEntry = {
  scoreId: string;
  predictionId: string;
  title: string;
  probability: number;
  confidence: number;
  trend: string;
  status: string;
};

export type PredictionConfidenceEntry = {
  confidenceId: string;
  predictionId: string;
  title: string;
  confidence: number;
  evidenceQuality: string;
  validationStatus: string;
};

export type EmergingRiskPredictionEntry = {
  riskId: string;
  predictionId: string;
  title: string;
  probability: number;
  severity: string;
  horizon: string;
  status: string;
};

export type EmergingOpportunityPredictionEntry = {
  opportunityId: string;
  predictionId: string;
  title: string;
  probability: number;
  strategicValue: string;
  horizon: string;
  status: string;
};

export type StrategicForecastEntry = {
  forecastId: string;
  predictionId: string;
  title: string;
  predictedOutcome: string;
  strategicImpact: string;
  probability: number;
  horizon: string;
};

export type PredictionAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutivePredictionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPredictionEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type PredictionPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutivePredictionEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  predictionIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activePredictionCount: number;
  highProbabilityCount: number;
  strategicForecastCount: number;
  averagePredictionConfidence: number;
  predictionDashboard: PredictionRecord[];
  futureOutlook: FutureOutlookEntry[];
  probabilityScores: ProbabilityScoreEntry[];
  predictionConfidence: PredictionConfidenceEntry[];
  emergingRisks: EmergingRiskPredictionEntry[];
  emergingOpportunities: EmergingOpportunityPredictionEntry[];
  strategicForecasts: StrategicForecastEntry[];
  predictionAnalysis: PredictionAnalysisMetric[];
  predictionPipeline: PredictionPipelineStep[];
  recommendedActions: ExecutivePredictionRecommendation[];
  pillowEvaluations: PillowPredictionEvaluationMetric[];
  predictionPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE410: boolean;
};
