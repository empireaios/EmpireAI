/** PILLOW-EBP-001 — Executive Budget Planner types (E3-03). */

import type {
  BUDGET_PLANNING_PIPELINE,
  BUDGET_PRINCIPLES,
  GOVERNED_BUDGET_DOMAINS,
  BUDGET_CLASSIFICATIONS,
  BUDGET_OPTIMIZATION_DOMAINS,
  PILLOW_BUDGET_EVALUATIONS,
} from "./paths.js";

export type ExecutiveBudgetPlannerVersion = "E3-03";

export type BudgetPlanningPipelinePhase = (typeof BUDGET_PLANNING_PIPELINE)[number];
export type BudgetPrinciple = (typeof BUDGET_PRINCIPLES)[number];
export type GovernedBudgetDomain = (typeof GOVERNED_BUDGET_DOMAINS)[number];
export type BudgetClassification = (typeof BUDGET_CLASSIFICATIONS)[number];
export type BudgetOptimizationDomain = (typeof BUDGET_OPTIMIZATION_DOMAINS)[number];
export type PillowBudgetEvaluation = (typeof PILLOW_BUDGET_EVALUATIONS)[number];

export type BudgetPlanningPipelineStep = {
  phase: BudgetPlanningPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterpriseBudget = {
  budgetId: string;
  title: string;
  category: BudgetClassification;
  domain: GovernedBudgetDomain;
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
  domain: GovernedBudgetDomain;
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
  domain: BudgetOptimizationDomain;
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

export type PillowBudgetEvaluationMetric = {
  domain: PillowBudgetEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveBudgetPlanner = {
  plannerVersion: ExecutiveBudgetPlannerVersion;
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
  budgetPrinciples: BudgetPrinciple[];
  governedDomains: GovernedBudgetDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE304: boolean;
};
