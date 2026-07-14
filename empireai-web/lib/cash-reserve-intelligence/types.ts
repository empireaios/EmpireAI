/** E3-06 — Cash Reserve Intelligence frontend types (mirrors Pillow PILLOW-CRI-001). */

export type CashReserve = {
  reserveId: string;
  title: string;
  category: string;
  domain: string;
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
  domain: string;
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

export type CashReservePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowReserveEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CashReserveIntelligence = {
  intelligenceVersion: string;
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
  reservePrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE307: boolean;
};
