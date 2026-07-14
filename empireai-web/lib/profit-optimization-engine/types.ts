/** E3-07 — Profit Optimization Engine frontend types (mirrors Pillow PILLOW-POE-001). */

export type ProfitAssessment = {
  profitId: string;
  title: string;
  category: string;
  domain: string;
  businessUnit: string;
  strategicObjective: string;
  revenue: string;
  directCost: string;
  indirectCost: string;
  grossProfit: string;
  netProfit: string;
  profitMargin: number;
  expectedGrowth: string;
  optimizationOpportunity: string;
  confidence: number;
  evidence: string[];
  trend: string;
  status: string;
};

export type EnterpriseProfitEntry = {
  profitId: string;
  title: string;
  category: string;
  netProfit: string;
  profitMargin: number;
  expectedGrowth: string;
  trend: string;
  status: string;
};

export type ProfitTrendEntry = {
  period: string;
  enterpriseProfit: string;
  netMargin: number;
  grossMargin: number;
  trend: string;
};

export type OptimizationOpportunityEntry = {
  opportunityId: string;
  title: string;
  capability: string;
  impact: string;
  estimatedGain: string;
  priority: string;
  status: string;
};

export type ProfitRiskEntry = {
  riskId: string;
  profitId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type ProfitAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type FinancialPerformanceEntry = {
  metric: string;
  value: string;
  trend: string;
  status: string;
};

export type ProfitOptimizationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ProfitOptimizationPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowProfitEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ProfitOptimizationEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  profitHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeProfitAssessmentCount: number;
  totalEnterpriseProfit: string;
  totalNetProfit: string;
  grossMarginPercentage: number;
  netMarginPercentage: number;
  operatingMarginPercentage: number;
  profitGrowthRate: number;
  enterpriseProfit: EnterpriseProfitEntry[];
  profitAssessments: ProfitAssessment[];
  profitTrends: ProfitTrendEntry[];
  optimizationOpportunities: OptimizationOpportunityEntry[];
  profitRisks: ProfitRiskEntry[];
  profitAnalysis: ProfitAnalysisMetric[];
  financialPerformance: FinancialPerformanceEntry[];
  profitOptimizationPipeline: ProfitOptimizationPipelineStep[];
  recommendedActions: ProfitOptimizationRecommendation[];
  pillowEvaluations: PillowProfitEvaluationMetric[];
  profitPrinciples: string[];
  governedDomains: string[];
  optimizationCapabilities: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE308: boolean;
};
