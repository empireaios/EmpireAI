/** PILLOW-RIE-001 — ROI Intelligence Engine types (E3-05). */

import type {
  ROI_PIPELINE,
  ROI_PRINCIPLES,
  GOVERNED_ROI_DOMAINS,
  ROI_CLASSIFICATIONS,
  ROI_ANALYSIS_DOMAINS,
  PILLOW_ROI_EVALUATIONS,
} from "./paths.js";

export type RoiIntelligenceEngineVersion = "E3-05";

export type RoiPipelinePhase = (typeof ROI_PIPELINE)[number];
export type RoiPrinciple = (typeof ROI_PRINCIPLES)[number];
export type GovernedRoiDomain = (typeof GOVERNED_ROI_DOMAINS)[number];
export type RoiClassification = (typeof ROI_CLASSIFICATIONS)[number];
export type RoiAnalysisDomain = (typeof ROI_ANALYSIS_DOMAINS)[number];
export type PillowRoiEvaluation = (typeof PILLOW_ROI_EVALUATIONS)[number];

export type RoiPipelineStep = {
  phase: RoiPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type RoiAssessment = {
  roiId: string;
  title: string;
  category: RoiClassification;
  domain: GovernedRoiDomain;
  businessUnit: string;
  strategicObjective: string;
  investmentCost: string;
  operatingCost: string;
  revenueGenerated: string;
  profitGenerated: string;
  roiPercentage: number;
  paybackPeriod: string;
  businessValue: string;
  strategicValue: string;
  trend: "rising" | "stable" | "declining";
  confidence: number;
  evidence: string[];
  expectedRoi: number;
  variance: string;
  status: string;
};

export type EnterpriseRoiEntry = {
  roiId: string;
  title: string;
  category: string;
  roiPercentage: number;
  profitGenerated: string;
  paybackPeriod: string;
  trend: string;
  status: string;
};

export type BusinessRoiEntry = {
  businessUnit: string;
  title: string;
  roiPercentage: number;
  revenueGenerated: string;
  profitGenerated: string;
  trend: string;
  status: string;
};

export type InvestmentRoiEntry = {
  roiId: string;
  title: string;
  investmentCost: string;
  roiPercentage: number;
  expectedRoi: number;
  variance: string;
  paybackPeriod: string;
  status: string;
};

export type DepartmentRoiEntry = {
  department: string;
  title: string;
  roiPercentage: number;
  operatingCost: string;
  profitGenerated: string;
  trend: string;
  status: string;
};

export type RoiTrendEntry = {
  period: string;
  enterpriseRoi: number;
  businessRoi: number;
  investmentRoi: number;
  trend: string;
};

export type RoiAnalysisMetric = {
  domain: RoiAnalysisDomain;
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

export type RoiIntelligenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowRoiEvaluationMetric = {
  domain: PillowRoiEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type RoiIntelligenceEngine = {
  engineVersion: RoiIntelligenceEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  roiHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRoiAssessmentCount: number;
  enterpriseRoiPercentage: number;
  averageInvestmentRoi: number;
  averagePaybackMonths: number;
  totalRevenueGenerated: string;
  totalProfitGenerated: string;
  roiAssessments: RoiAssessment[];
  enterpriseRoi: EnterpriseRoiEntry[];
  businessRoi: BusinessRoiEntry[];
  investmentRoi: InvestmentRoiEntry[];
  departmentRoi: DepartmentRoiEntry[];
  roiTrends: RoiTrendEntry[];
  roiAnalysis: RoiAnalysisMetric[];
  financialPerformance: FinancialPerformanceEntry[];
  roiPipeline: RoiPipelineStep[];
  recommendedActions: RoiIntelligenceRecommendation[];
  pillowEvaluations: PillowRoiEvaluationMetric[];
  roiPrinciples: RoiPrinciple[];
  governedDomains: GovernedRoiDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveBudgetPlanner: string;
    investmentEvaluationEngine: string;
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE306: boolean;
};
