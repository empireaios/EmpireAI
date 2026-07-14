/** PILLOW-CRE-001 — Capital Risk Engine types (E3-11). */

import type {
  CAPITAL_RISK_PIPELINE,
  CAPITAL_RISK_PRINCIPLES,
  GOVERNED_CAPITAL_RISK_DOMAINS,
  CAPITAL_RISK_CLASSIFICATIONS,
  CAPITAL_RISK_ANALYSIS_DOMAINS,
  PILLOW_CAPITAL_RISK_EVALUATIONS,
} from "./paths.js";

export type CapitalRiskEngineVersion = "E3-11";

export type CapitalRiskPipelinePhase = (typeof CAPITAL_RISK_PIPELINE)[number];
export type CapitalRiskPrinciple = (typeof CAPITAL_RISK_PRINCIPLES)[number];
export type GovernedCapitalRiskDomain = (typeof GOVERNED_CAPITAL_RISK_DOMAINS)[number];
export type CapitalRiskClassification = (typeof CAPITAL_RISK_CLASSIFICATIONS)[number];
export type CapitalRiskAnalysisDomain = (typeof CAPITAL_RISK_ANALYSIS_DOMAINS)[number];
export type PillowCapitalRiskEvaluation = (typeof PILLOW_CAPITAL_RISK_EVALUATIONS)[number];

export type CapitalRiskPipelineStep = {
  phase: CapitalRiskPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CapitalRisk = {
  riskId: string;
  title: string;
  category: CapitalRiskClassification;
  domain: GovernedCapitalRiskDomain;
  businessUnit: string;
  strategicObjective: string;
  capitalExposure: string;
  probability: string;
  impact: string;
  riskScore: number;
  businessImpact: string;
  financialImpact: string;
  mitigationStrategy: string;
  residualRisk: string;
  confidence: number;
  evidence: string[];
  status: string;
};

export type CapitalExposureEntry = {
  riskId: string;
  title: string;
  category: string;
  domain: string;
  capitalExposure: string;
  riskScore: number;
  residualRisk: string;
  status: string;
};

export type RiskDistributionEntry = {
  category: string;
  riskCount: number;
  totalExposure: string;
  averageScore: number;
  severity: string;
};

export type RiskTrendEntry = {
  period: string;
  totalExposure: string;
  highRiskCount: number;
  mitigatedCount: number;
  residualExposure: string;
  trend: string;
};

export type CapitalRiskMitigationEntry = {
  riskId: string;
  title: string;
  mitigationStrategy: string;
  progress: string;
  residualRisk: string;
  owner: string;
  status: string;
};

export type LiquidityPositionEntry = {
  metric: string;
  value: string;
  target: string;
  buffer: string;
  status: string;
};

export type FinancialStabilityEntry = {
  metric: string;
  value: string;
  riskLevel: string;
  trend: string;
  status: string;
};

export type CapitalProtectionEntry = {
  domain: string;
  protectionScore: number;
  exposure: string;
  mitigationCoverage: string;
  status: string;
};

export type CapitalRiskAnalysisMetric = {
  domain: CapitalRiskAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CapitalRiskRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCapitalRiskEvaluationMetric = {
  domain: PillowCapitalRiskEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CapitalRiskEngine = {
  engineVersion: CapitalRiskEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  capitalRiskHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRiskCount: number;
  highRiskCount: number;
  averageRiskScore: number;
  totalCapitalExposure: string;
  mitigatedRiskCount: number;
  capitalRisks: CapitalRisk[];
  capitalExposure: CapitalExposureEntry[];
  riskDistribution: RiskDistributionEntry[];
  riskTrends: RiskTrendEntry[];
  mitigationStatus: CapitalRiskMitigationEntry[];
  liquidityPosition: LiquidityPositionEntry[];
  financialStability: FinancialStabilityEntry[];
  capitalProtection: CapitalProtectionEntry[];
  riskAnalysis: CapitalRiskAnalysisMetric[];
  capitalRiskPipeline: CapitalRiskPipelineStep[];
  recommendedActions: CapitalRiskRecommendation[];
  pillowEvaluations: PillowCapitalRiskEvaluationMetric[];
  riskPrinciples: CapitalRiskPrinciple[];
  governedDomains: GovernedCapitalRiskDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveBudgetPlanner: string;
    investmentEvaluationEngine: string;
    roiIntelligenceEngine: string;
    cashReserveIntelligence: string;
    profitOptimizationEngine: string;
    costOptimizationEngine: string;
    financialScenarioEngine: string;
    executiveKpiEngine: string;
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE312: boolean;
};
