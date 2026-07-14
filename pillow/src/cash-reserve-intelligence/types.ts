/** PILLOW-CRI-001 — Cash Reserve Intelligence types (E3-06). */

import type {
  CASH_RESERVE_PIPELINE,
  RESERVE_PRINCIPLES,
  GOVERNED_RESERVE_DOMAINS,
  RESERVE_CLASSIFICATIONS,
  LIQUIDITY_ANALYSIS_DOMAINS,
  PILLOW_RESERVE_EVALUATIONS,
} from "./paths.js";

export type CashReserveIntelligenceVersion = "E3-06";

export type CashReservePipelinePhase = (typeof CASH_RESERVE_PIPELINE)[number];
export type ReservePrinciple = (typeof RESERVE_PRINCIPLES)[number];
export type GovernedReserveDomain = (typeof GOVERNED_RESERVE_DOMAINS)[number];
export type ReserveClassification = (typeof RESERVE_CLASSIFICATIONS)[number];
export type LiquidityAnalysisDomain = (typeof LIQUIDITY_ANALYSIS_DOMAINS)[number];
export type PillowReserveEvaluation = (typeof PILLOW_RESERVE_EVALUATIONS)[number];

export type CashReservePipelineStep = {
  phase: CashReservePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CashReserve = {
  reserveId: string;
  title: string;
  category: ReserveClassification;
  domain: GovernedReserveDomain;
  purpose: string;
  owner: string;
  businessUnit: string;
  currentBalance: string;
  minimumRequired: string;
  targetReserve: string;
  availableLiquidity: string;
  projectedCashFlow: string;
  riskExposure: string;
  coveragePeriod: string;
  confidence: number;
  evidence: string[];
  utilization: number;
  status: string;
};

export type CashPositionEntry = {
  label: string;
  balance: string;
  status: string;
  trend: string;
};

export type ReserveLevelEntry = {
  reserveId: string;
  title: string;
  category: string;
  currentBalance: string;
  targetReserve: string;
  utilization: number;
  status: string;
};

export type LiquidityStatusEntry = {
  domain: string;
  label: string;
  status: string;
  score: number;
  summary: string;
};

export type CashFlowForecastEntry = {
  period: string;
  inflow: string;
  outflow: string;
  netCashFlow: string;
  endingBalance: string;
  status: string;
};

export type LiquidityRiskEntry = {
  riskId: string;
  reserveId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type FinancialStabilityEntry = {
  metric: string;
  value: string;
  status: string;
  trend: string;
};

export type LiquidityAnalysisMetric = {
  domain: LiquidityAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CashReserveRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowReserveEvaluationMetric = {
  domain: PillowReserveEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CashReserveIntelligence = {
  intelligenceVersion: CashReserveIntelligenceVersion;
  computedAt: string;
  intelligenceSummary: string;
  intelligenceHealth: string;
  liquidityHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeReserveCount: number;
  totalCashPosition: string;
  totalReserveBalance: string;
  availableLiquidity: string;
  averageCoverageMonths: number;
  cashBurnRate: string;
  liquidityStatus: string;
  financialStabilityScore: number;
  cashReserves: CashReserve[];
  cashPosition: CashPositionEntry[];
  reserveLevels: ReserveLevelEntry[];
  liquidityStatusMetrics: LiquidityStatusEntry[];
  cashFlowForecast: CashFlowForecastEntry[];
  liquidityRisks: LiquidityRiskEntry[];
  financialStability: FinancialStabilityEntry[];
  liquidityAnalysis: LiquidityAnalysisMetric[];
  cashReservePipeline: CashReservePipelineStep[];
  recommendedActions: CashReserveRecommendation[];
  pillowEvaluations: PillowReserveEvaluationMetric[];
  reservePrinciples: ReservePrinciple[];
  governedDomains: GovernedReserveDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveBudgetPlanner: string;
    investmentEvaluationEngine: string;
    roiIntelligenceEngine: string;
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE307: boolean;
};
