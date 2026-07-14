/** PILLOW-ECFE-001 — Executive Confidence Engine types (E2-14). */

import type {
  CONFIDENCE_PIPELINE,
  CONFIDENCE_PRINCIPLES,
  GOVERNED_CONFIDENCE_DOMAINS,
  CONFIDENCE_CLASSIFICATIONS,
  CONFIDENCE_LEVELS,
  CONFIDENCE_CALCULATION_DOMAINS,
  PILLOW_CONFIDENCE_EVALUATIONS,
} from "./paths.js";

export type ExecutiveConfidenceEngineVersion = "E2-14";

export type ConfidencePipelinePhase = (typeof CONFIDENCE_PIPELINE)[number];
export type ConfidencePrinciple = (typeof CONFIDENCE_PRINCIPLES)[number];
export type GovernedConfidenceDomain = (typeof GOVERNED_CONFIDENCE_DOMAINS)[number];
export type ConfidenceClassification = (typeof CONFIDENCE_CLASSIFICATIONS)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type ConfidenceCalculationDomain = (typeof CONFIDENCE_CALCULATION_DOMAINS)[number];
export type PillowConfidenceEvaluation = (typeof PILLOW_CONFIDENCE_EVALUATIONS)[number];

export type ConfidencePipelineStep = {
  phase: ConfidencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ConfidenceAssessment = {
  confidenceId: string;
  decisionId: string;
  title: string;
  category: ConfidenceClassification;
  domain: GovernedConfidenceDomain;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
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
  domain: ConfidenceCalculationDomain;
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
  domain: PillowConfidenceEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveConfidenceEngine = {
  engineVersion: ExecutiveConfidenceEngineVersion;
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
  confidencePrinciples: ConfidencePrinciple[];
  governedDomains: GovernedConfidenceDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    decisionAuditEngine: string;
    executiveRecommendationEngine: string;
    decisionSimulationEngine: string;
    riskAssessmentEngine: string;
    knowledgeEvolution: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE215: boolean;
};
