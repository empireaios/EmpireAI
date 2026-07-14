import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CASH_RESERVE_PIPELINE,
  RESERVE_PRINCIPLES,
  GOVERNED_RESERVE_DOMAINS,
  LIQUIDITY_ANALYSIS_DOMAINS,
  PILLOW_RESERVE_EVALUATIONS,
} from "./paths.js";
import type {
  CashReserveIntelligence,
  CashReservePipelineStep,
  CashReservePipelinePhase,
  CashReserve,
  CashPositionEntry,
  ReserveLevelEntry,
  LiquidityStatusEntry,
  CashFlowForecastEntry,
  LiquidityRiskEntry,
  FinancialStabilityEntry,
  LiquidityAnalysisMetric,
  CashReserveRecommendation,
  PillowReserveEvaluationMetric,
  GovernedReserveDomain,
  ReserveClassification,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function mapDomain(category: ReserveClassification): GovernedReserveDomain {
  const map: Record<ReserveClassification, GovernedReserveDomain> = {
    operating_reserve: "operating_cash",
    emergency_reserve: "emergency_reserves",
    strategic_reserve: "strategic_opportunity_reserves",
    growth_reserve: "growth_reserves",
    investment_reserve: "investment_liquidity",
    working_capital_reserve: "working_capital",
    technology_reserve: "enterprise_cash_reserves",
    infrastructure_reserve: "enterprise_cash_reserves",
    commerce_reserve: "business_liquidity",
    future_reserve_classes: "future_reserve_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: CashReservePipelinePhase = "reserve_optimization"): CashReservePipelineStep[] {
  const activeIdx = CASH_RESERVE_PIPELINE.indexOf(activePhase);
  return CASH_RESERVE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildReserves(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): CashReserve[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const allocations = input.capitalAllocationEngine?.currentAllocations ?? [];
  const budgets = input.executiveBudgetPlanner?.enterpriseBudgets ?? [];
  const investments = input.investmentEvaluationEngine?.enterpriseInvestments ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const roiAssessments = input.roiIntelligenceEngine?.roiAssessments ?? [];

  const catalogue: Array<Omit<CashReserve, "domain"> & { category: ReserveClassification }> = [
    {
      reserveId: "cri-enterprise",
      title: "Enterprise Cash Reserve",
      category: "operating_reserve",
      purpose: "Consolidated enterprise liquidity governing all operations and programmes",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      currentBalance: "$2.4M",
      minimumRequired: "$1.8M",
      targetReserve: "$3.0M",
      availableLiquidity: "$2.4M",
      projectedCashFlow: "+$420K next quarter",
      riskExposure: "Low — diversified reserves",
      coveragePeriod: "8 months",
      confidence: 93,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Enterprise liquidity consolidated"],
      utilization: 80,
      status: "healthy",
    },
    {
      reserveId: "cri-operating",
      title: "Operating Cash Reserve",
      category: "operating_reserve",
      purpose: "Day-to-day operational expenditure and payroll coverage",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      currentBalance: "$680K",
      minimumRequired: "$540K",
      targetReserve: "$780K",
      availableLiquidity: "$680K",
      projectedCashFlow: "+$85K next month",
      riskExposure: "Low",
      coveragePeriod: "4 months",
      confidence: 91,
      evidence: [budgets[0]?.title ?? "Enterprise budget", "Operating cash tracked"],
      utilization: 87,
      status: "on_track",
    },
    {
      reserveId: "cri-emergency",
      title: "Emergency Reserve Fund",
      category: "emergency_reserve",
      purpose: "Absorb uncertainty, incidents and business continuity events",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      currentBalance: "$500K",
      minimumRequired: "$400K",
      targetReserve: "$600K",
      availableLiquidity: "$500K",
      projectedCashFlow: "Held — no deployment",
      riskExposure: "Minimal — reserve held",
      coveragePeriod: "6 months burn",
      confidence: 95,
      evidence: [allocations.find((a) => a.title.includes("Reserve"))?.title ?? "E3-02 reserve capital", "Constitutional reserve governance"],
      utilization: 83,
      status: "adequate",
    },
    {
      reserveId: "cri-strategic",
      title: "Strategic Opportunity Reserve",
      category: "strategic_reserve",
      purpose: "Capitalize on strategic opportunities and acquisitions",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      currentBalance: "$850K",
      minimumRequired: "$600K",
      targetReserve: "$1.0M",
      availableLiquidity: "$850K",
      projectedCashFlow: "Opportunistic deployment",
      riskExposure: "Moderate — timing dependent",
      coveragePeriod: "12 months opportunity window",
      confidence: 88,
      evidence: [investments[8]?.title ?? "Acquisition target evaluated", "Strategic reserve governed"],
      utilization: 85,
      status: "ready",
    },
    {
      reserveId: "cri-growth",
      title: "Growth Reserve Fund",
      category: "growth_reserve",
      purpose: "Fund market expansion and business factory growth initiatives",
      owner: "Business Executive",
      businessUnit: "Business Factory",
      currentBalance: "$320K",
      minimumRequired: "$250K",
      targetReserve: "$400K",
      availableLiquidity: "$320K",
      projectedCashFlow: "-$120K deployment planned",
      riskExposure: "Low-Moderate",
      coveragePeriod: "5 months",
      confidence: 86,
      evidence: [roiAssessments[2]?.title ?? "MS-A ROI tracked", allocations[0]?.title ?? "Growth capital"],
      utilization: 80,
      status: "deploying",
    },
    {
      reserveId: "cri-investment",
      title: "Investment Liquidity Reserve",
      category: "investment_reserve",
      purpose: "Liquidity buffer for approved investment deployments",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      currentBalance: "$420K",
      minimumRequired: "$350K",
      targetReserve: "$500K",
      availableLiquidity: "$420K",
      projectedCashFlow: "-$180K E3 programme deployment",
      riskExposure: "Low",
      coveragePeriod: "6 months",
      confidence: 90,
      evidence: [investments[1]?.title ?? "E3 investment", investments[9]?.title ?? "Tech investment"],
      utilization: 84,
      status: "on_track",
    },
    {
      reserveId: "cri-working-capital",
      title: "Working Capital Reserve",
      category: "working_capital_reserve",
      purpose: "Commerce operations, receivables and payables management",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      currentBalance: "$185K",
      minimumRequired: "$150K",
      targetReserve: "$220K",
      availableLiquidity: "$185K",
      projectedCashFlow: "+$45K commerce revenue",
      riskExposure: "Moderate — revenue ramp",
      coveragePeriod: "3 months",
      confidence: 82,
      evidence: [budgets[3]?.title ?? "Commerce budget", roiAssessments[3]?.title ?? "Commerce ROI"],
      utilization: 84,
      status: "monitoring",
    },
    {
      reserveId: "cri-e3-programme",
      title: "E3 Financial Executive Reserve",
      category: "strategic_reserve",
      purpose: "Liquidity for E3 financial intelligence programme delivery",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      currentBalance: "$312K",
      minimumRequired: "$240K",
      targetReserve: "$360K",
      availableLiquidity: "$312K",
      projectedCashFlow: "-$48K monthly burn",
      riskExposure: "Low — phased delivery",
      coveragePeriod: "6 months",
      confidence: 91,
      evidence: [budgets[1]?.title ?? "E3 budget", investments[1]?.title ?? "E3 investment evaluated"],
      utilization: 87,
      status: "healthy",
    },
    {
      reserveId: "cri-technology",
      title: "Technology Reserve Fund",
      category: "technology_reserve",
      purpose: "Platform engineering, infrastructure and technology investments",
      owner: "CTO",
      businessUnit: "Engineering",
      currentBalance: "$240K",
      minimumRequired: "$180K",
      targetReserve: "$280K",
      availableLiquidity: "$240K",
      projectedCashFlow: "-$65K infrastructure spend",
      riskExposure: "Low",
      coveragePeriod: "4 months",
      confidence: 89,
      evidence: [budgets[2]?.title ?? "Engineering budget", allocations[2]?.title ?? "Infrastructure capital"],
      utilization: 86,
      status: "on_track",
    },
    {
      reserveId: "cri-commerce",
      title: "Commerce Liquidity Reserve",
      category: "commerce_reserve",
      purpose: "Commerce MVP launch and early revenue operations liquidity",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      currentBalance: "$95K",
      minimumRequired: "$80K",
      targetReserve: "$120K",
      availableLiquidity: "$95K",
      projectedCashFlow: "+$28K revenue inflow",
      riskExposure: "Moderate — scaling phase",
      coveragePeriod: "2 months",
      confidence: 80,
      evidence: [investments[3]?.title ?? "Commerce investment", recommendations[0]?.title ?? "Executive recommendation"],
      utilization: 79,
      status: "attention",
    },
    {
      reserveId: "cri-programme",
      title: "Programme Liquidity Pool",
      category: "growth_reserve",
      purpose: "Cross-programme liquidity coordination and funding readiness",
      owner: "Operations Executive",
      businessUnit: "Platform",
      currentBalance: "$175K",
      minimumRequired: "$140K",
      targetReserve: "$200K",
      availableLiquidity: "$175K",
      projectedCashFlow: "Neutral — rebalancing",
      riskExposure: "Low",
      coveragePeriod: "4 months",
      confidence: 87,
      evidence: ["ECC financial scheduling", "Programme funding coordination"],
      utilization: 88,
      status: "on_track",
    },
    {
      reserveId: "cri-department",
      title: "Department Liquidity Buffer",
      category: "operating_reserve",
      purpose: "Department-level liquidity for Engineering, Commerce and R&D",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      currentBalance: "$128K",
      minimumRequired: "$100K",
      targetReserve: "$150K",
      availableLiquidity: "$128K",
      projectedCashFlow: "-$22K departmental spend",
      riskExposure: "Low",
      coveragePeriod: "3 months",
      confidence: 85,
      evidence: [objectives[0] ?? "Strategic objective", "Department liquidity tracked"],
      utilization: 85,
      status: "adequate",
    },
  ];

  return catalogue.map((item) => ({
    ...item,
    domain: mapDomain(item.category),
  }));
}

function buildCashPosition(reserves: CashReserve[]): CashPositionEntry[] {
  return [
    { label: "Total Cash Position", balance: "$2.4M", status: "healthy", trend: "stable" },
    { label: "Operating Cash", balance: "$680K", status: "on_track", trend: "rising" },
    { label: "Reserve Balance", balance: "$1.72M", status: "adequate", trend: "stable" },
    { label: "Available Liquidity", balance: "$2.4M", status: "healthy", trend: "stable" },
    { label: "Committed Capital", balance: "$480K", status: "deploying", trend: "stable" },
    { label: "Uncommitted Reserve", balance: "$1.24M", status: "ready", trend: "rising" },
  ];
}

function buildReserveLevels(reserves: CashReserve[]): ReserveLevelEntry[] {
  return reserves.map((r) => ({
    reserveId: r.reserveId,
    title: r.title,
    category: label(r.category),
    currentBalance: r.currentBalance,
    targetReserve: r.targetReserve,
    utilization: r.utilization,
    status: r.status,
  }));
}

function buildLiquidityStatus(reserves: CashReserve[], avgUtil: number): LiquidityStatusEntry[] {
  const attentionCount = reserves.filter((r) => r.status === "attention").length;
  return GOVERNED_RESERVE_DOMAINS.slice(0, 8).map((domain) => {
    const domainReserves = reserves.filter((r) => r.domain === domain);
    const score = domainReserves.length
      ? Math.round(domainReserves.reduce((s, r) => s + r.utilization, 0) / domainReserves.length)
      : avgUtil;
    return {
      domain,
      label: label(domain),
      status: score >= 85 ? "healthy" : score >= 70 ? "adequate" : "attention",
      score,
      summary: domainReserves.length
        ? `${domainReserves.length} reserves · avg utilization ${score}%`
        : "Monitored via enterprise pool",
    };
  }).concat([
    {
      domain: "enterprise_cash_reserves",
      label: "Overall Liquidity",
      status: attentionCount <= 1 ? "healthy" : "attention",
      score: avgUtil,
      summary: `${reserves.length} reserves · ${attentionCount} attention items`,
    },
  ]).slice(0, 8);
}

function buildCashFlowForecast(): CashFlowForecastEntry[] {
  return [
    { period: "Month 1", inflow: "$380K", outflow: "$290K", netCashFlow: "+$90K", endingBalance: "$2.49M", status: "positive" },
    { period: "Month 2", inflow: "$395K", outflow: "$310K", netCashFlow: "+$85K", endingBalance: "$2.58M", status: "positive" },
    { period: "Month 3", inflow: "$420K", outflow: "$340K", netCashFlow: "+$80K", endingBalance: "$2.66M", status: "positive" },
    { period: "Q2", inflow: "$1.2M", outflow: "$980K", netCashFlow: "+$220K", endingBalance: "$2.88M", status: "positive" },
  ];
}

function buildLiquidityRisks(reserves: CashReserve[]): LiquidityRiskEntry[] {
  return reserves
    .filter((r) => r.status === "attention" || r.utilization < 80 || r.confidence < 85)
    .slice(0, 5)
    .map((r) => ({
      riskId: `lrisk-${r.reserveId}`,
      reserveId: r.reserveId,
      title: r.title,
      severity: r.status === "attention" ? "moderate" : "low",
      exposure: `${r.riskExposure} · ${r.coveragePeriod} coverage`,
      mitigation: "Reserve monitoring · cash flow projection · executive review",
      status: r.status === "attention" ? "active_review" : "monitored",
    }));
}

function buildFinancialStability(reserves: CashReserve[], stabilityScore: number): FinancialStabilityEntry[] {
  const attentionCount = reserves.filter((r) => r.status === "attention").length;
  return [
    { metric: "Financial Stability Score", value: `${stabilityScore}/100`, status: stabilityScore >= 85 ? "strong" : "adequate", trend: "stable" },
    { metric: "Reserve Coverage", value: "8 months", status: "healthy", trend: "stable" },
    { metric: "Cash Burn Rate", value: "$290K/month", status: "on_track", trend: "stable" },
    { metric: "Liquidity Ratio", value: "1.4x", status: "healthy", trend: "rising" },
    { metric: "Reserve Adequacy", value: `${reserves.filter((r) => r.utilization >= 80).length}/${reserves.length}`, status: "adequate", trend: "stable" },
    { metric: "Attention Items", value: String(attentionCount), status: attentionCount <= 1 ? "managed" : "attention", trend: "stable" },
  ];
}

function buildLiquidityAnalysis(reserves: CashReserve[], avgUtil: number): LiquidityAnalysisMetric[] {
  const scores: Record<string, { score: number; summary: string }> = {
    cash_position: { score: 88, summary: "Total cash position $2.4M — healthy enterprise liquidity" },
    cash_burn_rate: { score: 84, summary: "Cash burn $290K/month — within operating reserve coverage" },
    operating_liquidity: { score: 87, summary: "Operating cash $680K — 4 months coverage" },
    working_capital: { score: 82, summary: "Working capital $185K — commerce ramp monitored" },
    reserve_coverage: { score: avgUtil, summary: `Avg reserve utilization ${avgUtil}% — target 80-90%` },
    financial_stability: { score: 86, summary: "Financial stability score 86 — resilient position" },
    business_continuity: { score: 90, summary: "Emergency reserve $500K — 6 months burn coverage" },
    strategic_flexibility: { score: 85, summary: "Strategic opportunity reserve $850K — deployment ready" },
    long_term_sustainability: { score: 87, summary: "Sustainability principle governs all reserves" },
  };

  return LIQUIDITY_ANALYSIS_DOMAINS.map((domain) => {
    const s = scores[domain] ?? { score: 80, summary: "Analysis active" };
    return {
      domain,
      label: label(domain),
      score: Math.min(100, s.score),
      status: s.score >= 85 ? "strong" : s.score >= 70 ? "adequate" : "attention",
      summary: s.summary,
    };
  });
}

function buildPillowEvaluations(input: {
  reserveCount: number;
  avgUtil: number;
  riskCount: number;
  liquidityStatus: string;
}): PillowReserveEvaluationMetric[] {
  return PILLOW_RESERVE_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_RESERVE_EVALUATIONS)[number], { status: string; summary: string }> = {
      cash_health: { status: input.liquidityStatus, summary: `${input.reserveCount} reserves · avg utilization ${input.avgUtil}%` },
      liquidity_risks: { status: input.riskCount <= 2 ? "managed" : "attention", summary: `${input.riskCount} liquidity risks monitored` },
      reserve_adequacy: { status: input.avgUtil >= 80 ? "adequate" : "review", summary: "Reserve levels aligned with E3-01 financial framework" },
      growth_readiness: { status: "ready", summary: "Growth reserve $320K · strategic reserve $850K deployment ready" },
      executive_recommendations: { status: "active", summary: "Reserve recommendations via E2-04 · approval via E2-07" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(): CashReserveRecommendation[] {
  return [
    {
      id: "cri-rec-resilience",
      title: "Maintain Enterprise Financial Resilience",
      category: "governance",
      why: "Profitability alone does not guarantee financial stability — reserves sustain operations and absorb uncertainty",
      what: "Govern all reserves through PILLOW-CRI-001 constitutional authority",
      how: "Reserve pipeline · 5s refresh · no liquidity blind spots",
      confidencePercent: 94,
    },
    {
      id: "cri-rec-commerce",
      title: "Strengthen Commerce Liquidity Reserve",
      category: "optimization",
      why: "Commerce liquidity at 79% utilization — below 80% target with 2-month coverage",
      what: "Transfer $25K from growth reserve to commerce liquidity buffer",
      how: "Reserve optimization step · ECC scheduling · executive approval",
      confidencePercent: 86,
    },
    {
      id: "cri-rec-emergency",
      title: "Validate Emergency Reserve Coverage",
      category: "monitoring",
      why: "Emergency reserve at 83% of target — maintain 6-month burn coverage minimum",
      what: "Confirm emergency reserve meets constitutional minimum before growth deployments",
      how: "Reserve requirement analysis · Supervisor monitoring · Guardian integrity",
      confidencePercent: 90,
    },
    {
      id: "cri-rec-e308",
      title: "Proceed to E3-08 Cost Optimization Engine",
      category: "programme",
      why: "E3-07 profit optimization established · cost optimization is next E3 capability",
      what: "Implement Cost Optimization Engine building on POE foundation",
      how: "E3 sequence · integrate EFF · CAE · EBP · IEE · RIE · CRI · profit-cost linkage",
      confidencePercent: 92,
    },
  ];
}

function parseCoverageMonths(coverage: string): number {
  const match = coverage.match(/(\d+)/);
  return match ? Number(match[1]) : 6;
}

export function assembleCashReserveIntelligence(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): CashReserveIntelligence {
  const cashReserves = buildReserves(input);
  const cashPosition = buildCashPosition(cashReserves);
  const reserveLevels = buildReserveLevels(cashReserves);
  const cashFlowForecast = buildCashFlowForecast();
  const liquidityRisks = buildLiquidityRisks(cashReserves);

  const averageUtilization = Math.round(
    cashReserves.reduce((s, r) => s + r.utilization, 0) / Math.max(cashReserves.length, 1),
  );
  const averageCoverageMonths = Math.round(
    cashReserves.reduce((s, r) => s + parseCoverageMonths(r.coveragePeriod), 0) / Math.max(cashReserves.length, 1),
  );

  const liquidityStatusMetrics = buildLiquidityStatus(cashReserves, averageUtilization);
  const liquidityAnalysis = buildLiquidityAnalysis(cashReserves, averageUtilization);

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.roiIntelligenceEngine?.healthScore ?? 85,
    averageUtilization >= 80 ? 90 : averageUtilization >= 70 ? 78 : 68,
    liquidityRisks.length <= 2 ? 92 : 75,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));
  const financialStabilityScore = Math.min(100, clampedHealth + 2);

  const financialStability = buildFinancialStability(cashReserves, financialStabilityScore);
  const liquidityStatusLabel = averageUtilization >= 85 ? "healthy" : averageUtilization >= 75 ? "adequate" : "attention";

  const pillowEvaluations = buildPillowEvaluations({
    reserveCount: cashReserves.length,
    avgUtil: averageUtilization,
    riskCount: liquidityRisks.length,
    liquidityStatus: liquidityStatusLabel,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Cash Reserve Intelligence — constitutional liquidity authority active",
    `${cashReserves.length} reserves · $2.4M cash position · ${averageCoverageMonths} months avg coverage`,
    "No liquidity blind spots · financial resilience enforced",
    "Integrated with E3-01 Finance · E3-02 Capital · E3-03 Budget · E3-04 Investment · E3-05 ROI",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting cash integrity")}`,
    "ECC coordinates reserve planning · Supervisor monitors liquidity position",
    "VIE validates reserve alignment · vision · strategic · constitutional",
  ];

  return {
    intelligenceVersion: "E3-06",
    computedAt: new Date().toISOString(),
    intelligenceSummary:
      "Cash Reserve Intelligence continuously determines the appropriate level of cash reserves required to sustain operations, absorb uncertainty and capitalize on future opportunities. Every business, programme, investment and executive initiative maintains healthy liquidity. The Grand King always understands the Empire's financial resilience.",
    intelligenceHealth: healthLabel(clampedHealth),
    liquidityHealth: liquidityStatusLabel,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeReserveCount: cashReserves.filter((r) => r.status !== "pending").length,
    totalCashPosition: "$2.4M",
    totalReserveBalance: "$1.72M",
    availableLiquidity: "$2.4M",
    averageCoverageMonths,
    cashBurnRate: "$290K/month",
    liquidityStatus: liquidityStatusLabel,
    financialStabilityScore,
    cashReserves,
    cashPosition,
    reserveLevels,
    liquidityStatusMetrics,
    cashFlowForecast,
    liquidityRisks,
    financialStability,
    liquidityAnalysis,
    cashReservePipeline: buildPipeline("reserve_optimization"),
    recommendedActions,
    pillowEvaluations,
    reservePrinciples: [...RESERVE_PRINCIPLES],
    governedDomains: [...GOVERNED_RESERVE_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveFinanceFramework: input.executiveFinanceFramework
        ? `E3-01 · ${input.executiveFinanceFramework.frameworkHealth} · ${input.executiveFinanceFramework.activeFinancialEntityCount} entities`
        : "E3-01 · standby",
      capitalAllocationEngine: input.capitalAllocationEngine
        ? `E3-02 · ${input.capitalAllocationEngine.engineHealth} · ${input.capitalAllocationEngine.activeAllocationCount} allocations`
        : "E3-02 · standby",
      executiveBudgetPlanner: input.executiveBudgetPlanner
        ? `E3-03 · ${input.executiveBudgetPlanner.plannerHealth} · ${input.executiveBudgetPlanner.activeBudgetCount} budgets`
        : "E3-03 · standby",
      investmentEvaluationEngine: input.investmentEvaluationEngine
        ? `E3-04 · ${input.investmentEvaluationEngine.engineHealth} · ${input.investmentEvaluationEngine.activeInvestmentCount} investments`
        : "E3-04 · standby",
      roiIntelligenceEngine: input.roiIntelligenceEngine
        ? `E3-05 · ${input.roiIntelligenceEngine.engineHealth} · ${input.roiIntelligenceEngine.enterpriseRoiPercentage}% enterprise ROI`
        : "E3-05 · standby",
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "cash integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring cash health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "reserve planning coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE307: true,
  };
}

export function buildFallbackCashReserveIntelligence(): CashReserveIntelligence {
  return assembleCashReserveIntelligence({});
}
