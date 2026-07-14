/** PILLOW-FSE-001 — Financial Scenario Engine types (E3-09). */

import type {
  FINANCIAL_SCENARIO_PIPELINE,
  FINANCIAL_SCENARIO_PRINCIPLES,
  GOVERNED_SCENARIO_DOMAINS,
  SCENARIO_CLASSIFICATIONS,
  FINANCIAL_ANALYSIS_DOMAINS,
  PILLOW_SCENARIO_EVALUATIONS,
} from "./paths.js";

export type FinancialScenarioEngineVersion = "E3-09";

export type FinancialScenarioPipelinePhase = (typeof FINANCIAL_SCENARIO_PIPELINE)[number];
export type FinancialScenarioPrinciple = (typeof FINANCIAL_SCENARIO_PRINCIPLES)[number];
export type GovernedScenarioDomain = (typeof GOVERNED_SCENARIO_DOMAINS)[number];
export type ScenarioClassification = (typeof SCENARIO_CLASSIFICATIONS)[number];
export type FinancialAnalysisDomain = (typeof FINANCIAL_ANALYSIS_DOMAINS)[number];
export type PillowScenarioEvaluation = (typeof PILLOW_SCENARIO_EVALUATIONS)[number];

export type FinancialScenarioPipelineStep = {
  phase: FinancialScenarioPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type FinancialScenario = {
  scenarioId: string;
  title: string;
  category: ScenarioClassification;
  domain: GovernedScenarioDomain;
  purpose: string;
  businessUnit: string;
  strategicObjective: string;
  assumptions: string[];
  projectedRevenue: string;
  projectedCost: string;
  projectedProfit: string;
  projectedCashFlow: string;
  expectedRoi: string;
  riskAssessment: string;
  confidence: number;
  evidence: string[];
  simulationScore: number;
  status: string;
};

export type AvailableScenarioEntry = {
  scenarioId: string;
  title: string;
  category: string;
  domain: string;
  projectedProfit: string;
  expectedRoi: string;
  confidence: number;
  status: string;
};

export type RevenueForecastEntry = {
  period: string;
  bestCase: string;
  expectedCase: string;
  worstCase: string;
  trend: string;
};

export type ProfitForecastEntry = {
  period: string;
  bestCase: string;
  expectedCase: string;
  worstCase: string;
  margin: string;
};

export type CashFlowForecastEntry = {
  period: string;
  inflow: string;
  outflow: string;
  netCashFlow: string;
  endingBalance: string;
  scenario: string;
};

export type RoiProjectionEntry = {
  scenarioId: string;
  title: string;
  expectedRoi: string;
  paybackPeriod: string;
  confidence: number;
  status: string;
};

export type FinancialScenarioComparisonEntry = {
  metric: string;
  bestCase: string;
  expectedCase: string;
  worstCase: string;
  variance: string;
};

export type FinancialRiskEntry = {
  riskId: string;
  scenarioId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type FinancialAnalysisMetric = {
  domain: FinancialAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type FinancialScenarioRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowScenarioEvaluationMetric = {
  domain: PillowScenarioEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type FinancialScenarioEngine = {
  engineVersion: FinancialScenarioEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  scenarioHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeScenarioCount: number;
  averageConfidence: number;
  averageExpectedRoi: number;
  projectedEnterpriseRevenue: string;
  projectedEnterpriseProfit: string;
  projectedCashPosition: string;
  financialScenarios: FinancialScenario[];
  availableScenarios: AvailableScenarioEntry[];
  revenueForecast: RevenueForecastEntry[];
  profitForecast: ProfitForecastEntry[];
  cashFlowForecast: CashFlowForecastEntry[];
  roiProjections: RoiProjectionEntry[];
  scenarioComparison: FinancialScenarioComparisonEntry[];
  financialRisks: FinancialRiskEntry[];
  financialAnalysis: FinancialAnalysisMetric[];
  financialScenarioPipeline: FinancialScenarioPipelineStep[];
  recommendedActions: FinancialScenarioRecommendation[];
  pillowEvaluations: PillowScenarioEvaluationMetric[];
  scenarioPrinciples: FinancialScenarioPrinciple[];
  governedDomains: GovernedScenarioDomain[];
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
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE310: boolean;
};
