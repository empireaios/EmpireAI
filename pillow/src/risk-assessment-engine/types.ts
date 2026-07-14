/** PILLOW-RAE-001 — Risk Assessment Engine types (E2-02). */

import type {
  RISK_PIPELINE,
  RISK_PRINCIPLES,
  GOVERNED_RISK_DOMAINS,
  RISK_CLASSIFICATIONS,
  RISK_LEVELS,
  RISK_SCORING_DIMENSIONS,
  PILLOW_RISK_EVALUATIONS,
} from "./paths.js";

export type RiskAssessmentEngineVersion = "E2-02";

export type RiskPipelinePhase = (typeof RISK_PIPELINE)[number];
export type RiskPrinciple = (typeof RISK_PRINCIPLES)[number];
export type GovernedRiskDomain = (typeof GOVERNED_RISK_DOMAINS)[number];
export type RiskClassification = (typeof RISK_CLASSIFICATIONS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type RiskScoringDimension = (typeof RISK_SCORING_DIMENSIONS)[number];
export type PillowRiskEvaluation = (typeof PILLOW_RISK_EVALUATIONS)[number];

export type RiskPipelineStep = {
  phase: RiskPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterpriseRisk = {
  riskId: string;
  title: string;
  description: string;
  category: RiskClassification;
  domain: GovernedRiskDomain;
  source: string;
  probability: number;
  impact: number;
  overallRiskScore: number;
  severity: RiskLevel;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  dependencies: string[];
  mitigationPlan: string;
  residualRisk: string;
  confidence: number;
  evidence: string[];
  status: RiskLevel;
  trend: "rising" | "stable" | "declining";
};

export type RiskScoreMetric = {
  dimension: RiskScoringDimension;
  label: string;
  score: number;
  status: string;
};

export type CriticalRiskItem = {
  order: number;
  riskId: string;
  title: string;
  severity: RiskLevel;
  overallRiskScore: number;
  mitigationStatus: string;
  owner: string;
};

export type MitigationStatusEntry = {
  riskId: string;
  title: string;
  mitigationPlan: string;
  status: string;
  residualRisk: string;
  progress: number;
};

export type RiskTrendEntry = {
  period: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  overallScore: number;
};

export type RiskAssessmentRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowRiskEvaluationMetric = {
  domain: PillowRiskEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type RiskAssessmentEngine = {
  engineVersion: RiskAssessmentEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRiskCount: number;
  criticalRiskCount: number;
  currentRisks: EnterpriseRisk[];
  criticalRisks: CriticalRiskItem[];
  riskScores: RiskScoreMetric[];
  riskTrends: RiskTrendEntry[];
  mitigationStatus: MitigationStatusEntry[];
  riskPipeline: RiskPipelineStep[];
  recommendedActions: RiskAssessmentRecommendation[];
  pillowEvaluations: PillowRiskEvaluationMetric[];
  riskPrinciples: RiskPrinciple[];
  governedDomains: GovernedRiskDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE203: boolean;
};
