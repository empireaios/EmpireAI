/** E3-01 — Executive Finance Framework frontend types (mirrors Pillow PILLOW-EFF-001). */

export type FinancialEntity = {
  financialId: string;
  title: string;
  category: string;
  domain: string;
  purpose: string;
  owner: string;
  businessUnit: string;
  strategicObjective: string;
  capitalAllocation: string;
  budgetAllocation: string;
  expectedRevenue: string;
  expectedCost: string;
  expectedProfit: string;
  expectedRoi: string;
  financialRisk: string;
  confidence: number;
  evidence: string[];
  status: string;
};

export type CapitalPositionEntry = {
  domain: string;
  label: string;
  amount: string;
  trend: string;
  status: string;
  summary: string;
};

export type BudgetStatusEntry = {
  budgetId: string;
  title: string;
  allocated: string;
  spent: string;
  remaining: string;
  utilisation: number;
  status: string;
};

export type FinancialRiskEntry = {
  riskId: string;
  title: string;
  category: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type FinancialGovernanceMetric = {
  domain: string;
  label: string;
  value: string;
  status: string;
  summary: string;
};

export type ExecutiveFinanceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type FinancialPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowFinanceEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveFinanceFramework = {
  frameworkVersion: string;
  computedAt: string;
  frameworkSummary: string;
  frameworkHealth: string;
  financialHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeFinancialEntityCount: number;
  totalCapitalAllocated: string;
  totalBudgetAllocated: string;
  totalExpectedRevenue: string;
  totalExpectedCost: string;
  totalExpectedProfit: string;
  averageRoi: number;
  financialEntities: FinancialEntity[];
  capitalPosition: CapitalPositionEntry[];
  budgetStatus: BudgetStatusEntry[];
  financialRisks: FinancialRiskEntry[];
  financialGovernance: FinancialGovernanceMetric[];
  financialPipeline: FinancialPipelineStep[];
  recommendedActions: ExecutiveFinanceRecommendation[];
  pillowEvaluations: PillowFinanceEvaluationMetric[];
  financialPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE302: boolean;
};
