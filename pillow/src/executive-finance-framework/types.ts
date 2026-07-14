/** PILLOW-EFF-001 — Executive Finance Framework types (E3-01). */

import type {
  FINANCIAL_PIPELINE,
  FINANCIAL_PRINCIPLES,
  GOVERNED_FINANCE_DOMAINS,
  FINANCIAL_CLASSIFICATIONS,
  FINANCIAL_GOVERNANCE_DOMAINS,
  PILLOW_FINANCE_EVALUATIONS,
} from "./paths.js";

export type ExecutiveFinanceFrameworkVersion = "E3-01";

export type FinancialPipelinePhase = (typeof FINANCIAL_PIPELINE)[number];
export type FinancialPrinciple = (typeof FINANCIAL_PRINCIPLES)[number];
export type GovernedFinanceDomain = (typeof GOVERNED_FINANCE_DOMAINS)[number];
export type FinancialClassification = (typeof FINANCIAL_CLASSIFICATIONS)[number];
export type FinancialGovernanceDomain = (typeof FINANCIAL_GOVERNANCE_DOMAINS)[number];
export type PillowFinanceEvaluation = (typeof PILLOW_FINANCE_EVALUATIONS)[number];

export type FinancialPipelineStep = {
  phase: FinancialPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type FinancialEntity = {
  financialId: string;
  title: string;
  category: FinancialClassification;
  domain: GovernedFinanceDomain;
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
  domain: FinancialGovernanceDomain;
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
  domain: FinancialGovernanceDomain;
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

export type PillowFinanceEvaluationMetric = {
  domain: PillowFinanceEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveFinanceFramework = {
  frameworkVersion: ExecutiveFinanceFrameworkVersion;
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
  financialPrinciples: FinancialPrinciple[];
  governedDomains: GovernedFinanceDomain[];
  pillowAdvisory: string[];
  integrations: {
    executivePlanningProgramme: string;
    executiveDecisionEngine: string;
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    resourceAllocationEngine: string;
    executiveRecommendationEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE302: boolean;
};
