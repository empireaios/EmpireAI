/** PILLOW-TOAE-001 — Trade-off Analysis Engine types (E2-10). */

import type {
  TRADEOFF_PIPELINE,
  TRADEOFF_PRINCIPLES,
  GOVERNED_TRADEOFF_DOMAINS,
  TRADEOFF_CLASSIFICATIONS,
  TRADEOFF_DIMENSIONS,
  PILLOW_TRADEOFF_EVALUATIONS,
} from "./paths.js";

export type TradeOffAnalysisEngineVersion = "E2-10";

export type TradeOffPipelinePhase = (typeof TRADEOFF_PIPELINE)[number];
export type TradeOffPrinciple = (typeof TRADEOFF_PRINCIPLES)[number];
export type GovernedTradeOffDomain = (typeof GOVERNED_TRADEOFF_DOMAINS)[number];
export type TradeOffClassification = (typeof TRADEOFF_CLASSIFICATIONS)[number];
export type TradeOffDimension = (typeof TRADEOFF_DIMENSIONS)[number];
export type PillowTradeOffEvaluation = (typeof PILLOW_TRADEOFF_EVALUATIONS)[number];

export type TradeOffPipelineStep = {
  phase: TradeOffPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type DecisionAlternative = {
  alternativeId: string;
  tradeOffId: string;
  label: string;
  description: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  operationalImpact: string;
  expectedBenefits: string[];
  expectedCosts: string[];
  riskAssessment: string;
  tradeOffScore: number;
  expectedRoi: string;
  confidence: number;
  evidence: string[];
  recommended: boolean;
};

export type TradeOffAnalysis = {
  tradeOffId: string;
  decisionId: string;
  title: string;
  description: string;
  category: TradeOffClassification;
  domain: GovernedTradeOffDomain;
  alternatives: string[];
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  operationalImpact: string;
  dependencies: string[];
  expectedBenefits: string[];
  expectedCosts: string[];
  riskAssessment: string;
  tradeOffScore: number;
  confidence: number;
  evidence: string[];
  recommendedOption: string;
  status: string;
};

export type TradeOffComparisonEntry = {
  tradeOffId: string;
  title: string;
  dimension: TradeOffDimension;
  bestAlternative: string;
  score: number;
  summary: string;
};

export type TradeOffScoringMetric = {
  tradeOffId: string;
  title: string;
  alternativeId: string;
  alternativeLabel: string;
  tradeOffScore: number;
  expectedRoi: string;
  riskLevel: string;
  strategicAlignment: string;
  recommended: boolean;
};

export type TradeOffAnalysisRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowTradeOffEvaluationMetric = {
  domain: PillowTradeOffEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type TradeOffAnalysisEngine = {
  engineVersion: TradeOffAnalysisEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  tradeOffHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeTradeOffCount: number;
  pendingDecisionCount: number;
  recommendedOptionCount: number;
  tradeOffAnalyses: TradeOffAnalysis[];
  decisionAlternatives: DecisionAlternative[];
  tradeOffComparisons: TradeOffComparisonEntry[];
  tradeOffScoring: TradeOffScoringMetric[];
  tradeOffPipeline: TradeOffPipelineStep[];
  recommendedActions: TradeOffAnalysisRecommendation[];
  pillowEvaluations: PillowTradeOffEvaluationMetric[];
  tradeOffPrinciples: TradeOffPrinciple[];
  governedDomains: GovernedTradeOffDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    decisionSimulationEngine: string;
    executiveRecommendationEngine: string;
    executiveEscalationEngine: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE211: boolean;
};
