/** PILLOW-IEE-001 — Investment Evaluation Engine types (E3-04). */

import type {
  INVESTMENT_EVALUATION_PIPELINE,
  INVESTMENT_PRINCIPLES,
  GOVERNED_INVESTMENT_DOMAINS,
  INVESTMENT_CLASSIFICATIONS,
  INVESTMENT_ANALYSIS_DOMAINS,
  PILLOW_INVESTMENT_EVALUATIONS,
} from "./paths.js";

export type InvestmentEvaluationEngineVersion = "E3-04";

export type InvestmentEvaluationPipelinePhase = (typeof INVESTMENT_EVALUATION_PIPELINE)[number];
export type InvestmentPrinciple = (typeof INVESTMENT_PRINCIPLES)[number];
export type GovernedInvestmentDomain = (typeof GOVERNED_INVESTMENT_DOMAINS)[number];
export type InvestmentClassification = (typeof INVESTMENT_CLASSIFICATIONS)[number];
export type InvestmentAnalysisDomain = (typeof INVESTMENT_ANALYSIS_DOMAINS)[number];
export type PillowInvestmentEvaluation = (typeof PILLOW_INVESTMENT_EVALUATIONS)[number];

export type InvestmentEvaluationPipelineStep = {
  phase: InvestmentEvaluationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterpriseInvestment = {
  investmentId: string;
  title: string;
  category: InvestmentClassification;
  domain: GovernedInvestmentDomain;
  purpose: string;
  owner: string;
  businessUnit: string;
  strategicObjective: string;
  requiredCapital: string;
  expectedRevenue: string;
  expectedCost: string;
  expectedProfit: string;
  expectedRoi: string;
  investmentHorizon: string;
  riskAssessment: string;
  confidence: number;
  evidence: string[];
  evaluationScore: number;
  strategicAlignment: string;
  status: string;
};

export type InvestmentPortfolioEntry = {
  investmentId: string;
  title: string;
  category: string;
  requiredCapital: string;
  expectedRoi: string;
  investmentHorizon: string;
  strategicAlignment: string;
  status: string;
};

export type InvestmentAnalysisMetric = {
  domain: InvestmentAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type InvestmentRiskEntry = {
  riskId: string;
  investmentId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type StrategicAlignmentEntry = {
  investmentId: string;
  title: string;
  visionAlignment: string;
  strategicAlignment: string;
  constitutionalAlignment: string;
  score: number;
  status: string;
};

export type InvestmentEvaluationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowInvestmentEvaluationMetric = {
  domain: PillowInvestmentEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type InvestmentEvaluationEngine = {
  engineVersion: InvestmentEvaluationEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  investmentHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeInvestmentCount: number;
  totalCapitalRequired: string;
  averageExpectedRoi: number;
  averageConfidence: number;
  approvedInvestmentCount: number;
  pendingEvaluationCount: number;
  enterpriseInvestments: EnterpriseInvestment[];
  investmentPipeline: InvestmentEvaluationPipelineStep[];
  investmentPortfolio: InvestmentPortfolioEntry[];
  investmentAnalysis: InvestmentAnalysisMetric[];
  investmentRisks: InvestmentRiskEntry[];
  strategicAlignments: StrategicAlignmentEntry[];
  recommendedActions: InvestmentEvaluationRecommendation[];
  pillowEvaluations: PillowInvestmentEvaluationMetric[];
  investmentPrinciples: InvestmentPrinciple[];
  governedDomains: GovernedInvestmentDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveBudgetPlanner: string;
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    tradeOffAnalysisEngine: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE305: boolean;
};
