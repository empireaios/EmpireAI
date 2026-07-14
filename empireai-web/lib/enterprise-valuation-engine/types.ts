/** E3-14 — Enterprise Valuation Engine frontend types (mirrors Pillow PILLOW-EVE-001). */

export type EnterpriseValuationRecord = {
  valuationId: string;
  title: string;
  category: string;
  domain: string;
  businessUnit: string;
  strategicObjective: string;
  valuationDate: string;
  estimatedEnterpriseValue: string;
  revenueContribution: string;
  profitContribution: string;
  assetContribution: string;
  growthContribution: string;
  riskAdjustment: string;
  valuationMethod: string;
  confidence: number;
  evidence: string[];
  valuationScore: number;
  status: string;
};

export type EnterpriseValuationDriverEntry = {
  driverId: string;
  title: string;
  category: string;
  contribution: string;
  impact: string;
  trend: string;
  confidence: number;
  status: string;
};

export type EnterpriseValuationRevenueContributionEntry = {
  domain: string;
  revenue: string;
  contributionPercent: number;
  growthRate: string;
  status: string;
};

export type EnterpriseValuationProfitContributionEntry = {
  domain: string;
  profit: string;
  contributionPercent: number;
  margin: string;
  status: string;
};

export type EnterpriseValuationRiskAdjustmentEntry = {
  factor: string;
  adjustment: string;
  impact: string;
  severity: string;
  status: string;
};

export type EnterpriseValuationGrowthTrendEntry = {
  period: string;
  enterpriseValue: string;
  growthRate: string;
  trend: string;
  confidence: number;
};

export type EnterpriseValuationAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EnterpriseValuationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type EnterpriseValuationEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  valuationHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeValuationCount: number;
  averageConfidence: number;
  estimatedEnterpriseValue: string;
  businessValue: string;
  growthTrend: string;
  totalRiskAdjustment: string;
  enterpriseValuations: EnterpriseValuationRecord[];
  valuationDrivers: EnterpriseValuationDriverEntry[];
  revenueContribution: EnterpriseValuationRevenueContributionEntry[];
  profitContribution: EnterpriseValuationProfitContributionEntry[];
  riskAdjustments: EnterpriseValuationRiskAdjustmentEntry[];
  growthTrends: EnterpriseValuationGrowthTrendEntry[];
  valuationAnalysis: EnterpriseValuationAnalysisMetric[];
  valuationPipeline: { phase: string; label: string; order: number; status: string }[];
  recommendedActions: EnterpriseValuationRecommendation[];
  pillowEvaluations: { domain: string; label: string; status: string; summary: string }[];
  valuationPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE315: boolean;
};
