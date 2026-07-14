/** E3-08 — Cost Optimization Engine frontend types (mirrors Pillow PILLOW-COE-001). */

export type CostAssessment = {
  costId: string;
  title: string;
  category: string;
  domain: string;
  businessUnit: string;
  strategicObjective: string;
  currentCost: string;
  expectedCost: string;
  costVariance: string;
  savingsOpportunity: string;
  businessImpact: string;
  strategicImpact: string;
  riskAssessment: string;
  optimizationPotential: number;
  confidence: number;
  evidence: string[];
  trend: string;
  status: string;
};

export type EnterpriseCostEntry = {
  costId: string;
  title: string;
  category: string;
  currentCost: string;
  costVariance: string;
  savingsOpportunity: string;
  optimizationPotential: number;
  status: string;
};

export type CostBreakdownEntry = {
  domain: string;
  label: string;
  currentCost: string;
  percentage: number;
  trend: string;
  status: string;
};

export type CostTrendEntry = {
  period: string;
  enterpriseCost: string;
  costEfficiency: number;
  savingsAchieved: string;
  trend: string;
};

export type SavingsOpportunityEntry = {
  opportunityId: string;
  title: string;
  capability: string;
  estimatedSavings: string;
  businessImpact: string;
  priority: string;
  status: string;
};

export type EfficiencyMetricEntry = {
  metric: string;
  value: string;
  score: number;
  status: string;
  trend: string;
};

export type WasteDetectionEntry = {
  wasteId: string;
  costId: string;
  title: string;
  severity: string;
  exposure: string;
  elimination: string;
  status: string;
};

export type CostAnalysisMetric = {
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

export type CostOptimizationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type CostOptimizationPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowCostEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CostOptimizationEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  costHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeCostAssessmentCount: number;
  totalEnterpriseCost: string;
  totalSavingsIdentified: string;
  averageCostEfficiency: number;
  averageOptimizationPotential: number;
  wasteItemsDetected: number;
  costAssessments: CostAssessment[];
  enterpriseCosts: EnterpriseCostEntry[];
  costBreakdown: CostBreakdownEntry[];
  costTrends: CostTrendEntry[];
  savingsOpportunities: SavingsOpportunityEntry[];
  efficiencyMetrics: EfficiencyMetricEntry[];
  wasteDetection: WasteDetectionEntry[];
  costAnalysis: CostAnalysisMetric[];
  financialPerformance: FinancialPerformanceEntry[];
  costOptimizationPipeline: CostOptimizationPipelineStep[];
  recommendedActions: CostOptimizationRecommendation[];
  pillowEvaluations: PillowCostEvaluationMetric[];
  costPrinciples: string[];
  governedDomains: string[];
  optimizationCapabilities: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE309: boolean;
};
