/** E3-10 — Executive KPI Engine frontend types (mirrors Pillow PILLOW-EKE-001). */

export type ExecutiveKpi = {
  kpiId: string;
  title: string;
  category: string;
  domain: string;
  businessUnit: string;
  strategicObjective: string;
  measurementFormula: string;
  targetValue: string;
  currentValue: string;
  historicalTrend: string;
  variance: string;
  businessImpact: string;
  financialImpact: string;
  confidence: number;
  evidence: string[];
  performanceScore: number;
  status: string;
};

export type EnterpriseKpiEntry = {
  kpiId: string;
  title: string;
  category: string;
  domain: string;
  currentValue: string;
  targetValue: string;
  variance: string;
  confidence: number;
  status: string;
};

export type FinancialKpiEntry = {
  kpiId: string;
  title: string;
  currentValue: string;
  targetValue: string;
  trend: string;
  variance: string;
  status: string;
};

export type BusinessKpiEntry = {
  kpiId: string;
  title: string;
  businessUnit: string;
  currentValue: string;
  targetValue: string;
  trend: string;
  status: string;
};

export type PerformanceTrendEntry = {
  period: string;
  revenue: string;
  profit: string;
  cashFlow: string;
  roi: string;
  trend: string;
};

export type KpiVarianceEntry = {
  kpiId: string;
  title: string;
  targetValue: string;
  currentValue: string;
  variance: string;
  variancePercent: string;
  severity: string;
};

export type ExecutiveScorecardEntry = {
  domain: string;
  score: number;
  target: number;
  status: string;
  summary: string;
};

export type FinancialHealthEntry = {
  metric: string;
  value: string;
  target: string;
  status: string;
  trend: string;
};

export type ExecutiveKpiRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ExecutiveKpiEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  kpiHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeKpiCount: number;
  averageConfidence: number;
  averagePerformanceScore: number;
  enterprisePerformanceIndex: number;
  financialHealthScore: number;
  executiveKpis: ExecutiveKpi[];
  enterpriseKpis: EnterpriseKpiEntry[];
  financialKpis: FinancialKpiEntry[];
  businessKpis: BusinessKpiEntry[];
  performanceTrends: PerformanceTrendEntry[];
  varianceAnalysis: KpiVarianceEntry[];
  executiveScorecard: ExecutiveScorecardEntry[];
  financialHealth: FinancialHealthEntry[];
  kpiAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  executiveKpiPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: ExecutiveKpiRecommendation[];
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  kpiPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE311: boolean;
};
