/** PILLOW-EPE-001 — Executive Prediction Engine types (E4-09). */

import type {
  PREDICTION_PIPELINE,
  PREDICTION_PRINCIPLES,
  GOVERNED_PREDICTION_DOMAINS,
  PREDICTION_CLASSIFICATIONS,
  PREDICTION_ANALYSIS_DOMAINS,
  PILLOW_PREDICTION_EVALUATIONS,
} from "./paths.js";

export type ExecutivePredictionEngineVersion = "E4-09";

export type PredictionPipelinePhase = (typeof PREDICTION_PIPELINE)[number];
export type PredictionPrinciple = (typeof PREDICTION_PRINCIPLES)[number];
export type GovernedPredictionDomain = (typeof GOVERNED_PREDICTION_DOMAINS)[number];
export type PredictionClassification = (typeof PREDICTION_CLASSIFICATIONS)[number];
export type PredictionAnalysisDomain = (typeof PREDICTION_ANALYSIS_DOMAINS)[number];
export type PillowPredictionEvaluation = (typeof PILLOW_PREDICTION_EVALUATIONS)[number];

export type PredictionPipelineStep = {
  phase: PredictionPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PredictionRecord = {
  predictionId: string;
  title: string;
  category: PredictionClassification;
  domain: GovernedPredictionDomain;
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
  domain: PredictionAnalysisDomain;
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
  domain: PillowPredictionEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutivePredictionEngine = {
  engineVersion: ExecutivePredictionEngineVersion;
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
  predictionPrinciples: PredictionPrinciple[];
  governedDomains: GovernedPredictionDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    opportunityDiscoveryEngine: string;
    threatDetectionEngine: string;
    industryIntelligenceEngine: string;
    customerBehaviourIntelligence: string;
    innovationIntelligenceEngine: string;
    executiveKnowledgeGraph: string;
    financialExecutiveCertification: string;
    executiveDecisionCertification: string;
    corporateVisionEngine: string;
    executiveRecommendationEngine: string;
    knowledgeEvolution: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE410: boolean;
};
