/** E3-03 — Executive Budget Planner frontend types (mirrors Pillow PILLOW-EBP-001). */

export type EnterpriseBudget = {
  budgetId: string;
  title: string;
  category: string;
  domain: string;
  purpose: string;
  owner: string;
  businessUnit: string;
  strategicObjective: string;
  allocatedBudget: string;
  currentSpend: string;
  remainingBudget: string;
  expectedRoi: string;
  expectedBusinessValue: string;
  expectedFinancialValue: string;
  riskAssessment: string;
  confidence: number;
  evidence: string[];
  utilization: number;
  variance: string;
  status: string;
};

export type BudgetOverviewEntry = {
  budgetId: string;
  title: string;
  category: string;
  allocatedBudget: string;
  currentSpend: string;
  remainingBudget: string;
  utilization: number;
  status: string;
};

export type BudgetAllocationEntry = {
  domain: string;
  label: string;
  allocated: string;
  spent: string;
  remaining: string;
  utilization: number;
  status: string;
};

export type BudgetVarianceEntry = {
  budgetId: string;
  title: string;
  planned: string;
  actual: string;
  variance: string;
  severity: string;
  status: string;
};

export type BudgetRiskEntry = {
  riskId: string;
  budgetId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type BudgetOptimizationMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveBudgetRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type BudgetPlanningPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowBudgetEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveBudgetPlanner = {
  plannerVersion: string;
  computedAt: string;
  plannerSummary: string;
  plannerHealth: string;
  budgetHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeBudgetCount: number;
  totalBudgetAllocated: string;
  totalCurrentSpend: string;
  totalRemainingBudget: string;
  averageUtilization: number;
  averageVariance: number;
  enterpriseBudgets: EnterpriseBudget[];
  budgetOverview: BudgetOverviewEntry[];
  budgetAllocation: BudgetAllocationEntry[];
  budgetVariance: BudgetVarianceEntry[];
  budgetRisks: BudgetRiskEntry[];
  budgetOptimization: BudgetOptimizationMetric[];
  budgetPlanningPipeline: BudgetPlanningPipelineStep[];
  recommendedActions: ExecutiveBudgetRecommendation[];
  pillowEvaluations: PillowBudgetEvaluationMetric[];
  budgetPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE304: boolean;
};
