/** E3-05 — ROI Intelligence Engine frontend types (mirrors Pillow PILLOW-RIE-001). */

export type RoiAssessment = {
  roiId: string;
  title: string;
  category: string;
  domain: string;
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
  trend: string;
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

export type RoiIntelligenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type RoiPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowRoiEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type RoiIntelligenceEngine = {
  engineVersion: string;
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
  roiPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE306: boolean;
};
