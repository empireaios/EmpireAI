/** E3-12 — Executive Forecast Intelligence frontend types (mirrors Pillow PILLOW-EFI-001). */

export type ExecutiveForecast = {
  forecastId: string;
  title: string;
  category: string;
  domain: string;
  businessUnit: string;
  strategicObjective: string;
  forecastPeriod: string;
  projectedRevenue: string;
  projectedCost: string;
  projectedProfit: string;
  projectedCashFlow: string;
  projectedRoi: string;
  forecastConfidence: number;
  riskAdjustment: string;
  businessImpact: string;
  evidence: string[];
  forecastScore: number;
  status: string;
};

export type ExecutiveForecastRevenueEntry = {
  period: string;
  projected: string;
  priorActual: string;
  growth: string;
  confidence: number;
  trend: string;
};

export type ExecutiveForecastProfitEntry = {
  period: string;
  projected: string;
  margin: string;
  priorActual: string;
  growth: string;
  confidence: number;
};

export type ExecutiveForecastCashFlowEntry = {
  period: string;
  inflow: string;
  outflow: string;
  netCashFlow: string;
  endingBalance: string;
  confidence: number;
};

export type ExecutiveForecastGrowthEntry = {
  domain: string;
  currentValue: string;
  projectedValue: string;
  growthRate: string;
  confidence: number;
  horizon: string;
};

export type ForecastAccuracyEntry = {
  forecastId: string;
  title: string;
  period: string;
  projected: string;
  actual: string;
  variance: string;
  accuracyPercent: number;
  status: string;
};

export type ExecutiveForecastRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ExecutiveForecastIntelligence = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  forecastHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeForecastCount: number;
  averageConfidence: number;
  averageForecastAccuracy: number;
  projectedEnterpriseRevenue: string;
  projectedEnterpriseProfit: string;
  projectedCashPosition: string;
  executiveForecasts: ExecutiveForecast[];
  revenueForecast: ExecutiveForecastRevenueEntry[];
  profitForecast: ExecutiveForecastProfitEntry[];
  cashFlowForecast: ExecutiveForecastCashFlowEntry[];
  growthForecast: ExecutiveForecastGrowthEntry[];
  forecastAccuracy: ForecastAccuracyEntry[];
  financialTrends: Array<{ metric: string; current: string; trend: string; forecast: string; direction: string; confidence: number }>;
  strategicOutlook: Array<{ domain: string; outlook: string; horizon: string; confidence: number; riskFactor: string; status: string }>;
  forecastAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  executiveForecastPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: ExecutiveForecastRecommendation[];
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  forecastPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE313: boolean;
};
