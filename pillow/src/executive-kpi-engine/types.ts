/** PILLOW-EKE-001 — Executive KPI Engine types (E3-10). */

import type {
  EXECUTIVE_KPI_PIPELINE,
  EXECUTIVE_KPI_PRINCIPLES,
  GOVERNED_KPI_DOMAINS,
  EXECUTIVE_KPI_CLASSIFICATIONS,
  EXECUTIVE_KPI_ANALYSIS_DOMAINS,
  PILLOW_KPI_EVALUATIONS,
} from "./paths.js";

export type ExecutiveKpiEngineVersion = "E3-10";

export type ExecutiveKpiPipelinePhase = (typeof EXECUTIVE_KPI_PIPELINE)[number];
export type ExecutiveKpiPrinciple = (typeof EXECUTIVE_KPI_PRINCIPLES)[number];
export type GovernedKpiDomain = (typeof GOVERNED_KPI_DOMAINS)[number];
export type ExecutiveKpiClassification = (typeof EXECUTIVE_KPI_CLASSIFICATIONS)[number];
export type ExecutiveKpiAnalysisDomain = (typeof EXECUTIVE_KPI_ANALYSIS_DOMAINS)[number];
export type PillowKpiEvaluation = (typeof PILLOW_KPI_EVALUATIONS)[number];

export type ExecutiveKpiPipelineStep = {
  phase: ExecutiveKpiPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveKpi = {
  kpiId: string;
  title: string;
  category: ExecutiveKpiClassification;
  domain: GovernedKpiDomain;
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

export type ExecutiveKpiAnalysisMetric = {
  domain: ExecutiveKpiAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
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

export type PillowKpiEvaluationMetric = {
  domain: PillowKpiEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveKpiEngine = {
  engineVersion: ExecutiveKpiEngineVersion;
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
  kpiAnalysis: ExecutiveKpiAnalysisMetric[];
  executiveKpiPipeline: ExecutiveKpiPipelineStep[];
  recommendedActions: ExecutiveKpiRecommendation[];
  pillowEvaluations: PillowKpiEvaluationMetric[];
  kpiPrinciples: ExecutiveKpiPrinciple[];
  governedDomains: GovernedKpiDomain[];
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
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE311: boolean;
};
