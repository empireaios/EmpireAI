/** E3-04 — Investment Evaluation Engine frontend types (mirrors Pillow PILLOW-IEE-001). */

export type EnterpriseInvestment = {
  investmentId: string;
  title: string;
  category: string;
  domain: string;
  purpose: string;
  owner: string;
  businessUnit: string;
  strategicObjective: string;
  requiredCapital: string;
  expectedRevenue: string;
  expectedCost: string;
  expectedProfit: string;
  expectedRoi: string;
  investmentHorizon: string;
  riskAssessment: string;
  confidence: number;
  evidence: string[];
  evaluationScore: number;
  strategicAlignment: string;
  status: string;
};

export type InvestmentPortfolioEntry = {
  investmentId: string;
  title: string;
  category: string;
  requiredCapital: string;
  expectedRoi: string;
  investmentHorizon: string;
  strategicAlignment: string;
  status: string;
};

export type InvestmentAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type InvestmentRiskEntry = {
  riskId: string;
  investmentId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type StrategicAlignmentEntry = {
  investmentId: string;
  title: string;
  visionAlignment: string;
  strategicAlignment: string;
  constitutionalAlignment: string;
  score: number;
  status: string;
};

export type InvestmentEvaluationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type InvestmentEvaluationPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowInvestmentEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type InvestmentEvaluationEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  investmentHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeInvestmentCount: number;
  totalCapitalRequired: string;
  averageExpectedRoi: number;
  averageConfidence: number;
  approvedInvestmentCount: number;
  pendingEvaluationCount: number;
  enterpriseInvestments: EnterpriseInvestment[];
  investmentPipeline: InvestmentEvaluationPipelineStep[];
  investmentPortfolio: InvestmentPortfolioEntry[];
  investmentAnalysis: InvestmentAnalysisMetric[];
  investmentRisks: InvestmentRiskEntry[];
  strategicAlignments: StrategicAlignmentEntry[];
  recommendedActions: InvestmentEvaluationRecommendation[];
  pillowEvaluations: PillowInvestmentEvaluationMetric[];
  investmentPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE305: boolean;
};
