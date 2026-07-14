/** E3-09 — Financial Scenario Engine frontend types (mirrors Pillow PILLOW-FSE-001). */

export type FinancialScenario = {
  scenarioId: string;
  title: string;
  category: string;
  domain: string;
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

export type ScenarioComparisonEntry = {
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
  domain: string;
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

export type FinancialScenarioPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowScenarioEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type FinancialScenarioEngine = {
  engineVersion: string;
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
  scenarioComparison: ScenarioComparisonEntry[];
  financialRisks: FinancialRiskEntry[];
  financialAnalysis: FinancialAnalysisMetric[];
  financialScenarioPipeline: FinancialScenarioPipelineStep[];
  recommendedActions: FinancialScenarioRecommendation[];
  pillowEvaluations: PillowScenarioEvaluationMetric[];
  scenarioPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE310: boolean;
};
