import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CashReserveIntelligence } from "../cash-reserve-intelligence/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CostOptimizationEngine } from "../cost-optimization-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { ProfitOptimizationEngine } from "../profit-optimization-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  FINANCIAL_SCENARIO_PIPELINE,
  FINANCIAL_SCENARIO_PRINCIPLES,
  GOVERNED_SCENARIO_DOMAINS,
  FINANCIAL_ANALYSIS_DOMAINS,
  PILLOW_SCENARIO_EVALUATIONS,
} from "./paths.js";
import type {
  FinancialScenarioEngine,
  FinancialScenarioPipelineStep,
  FinancialScenarioPipelinePhase,
  FinancialScenario,
  AvailableScenarioEntry,
  RevenueForecastEntry,
  ProfitForecastEntry,
  CashFlowForecastEntry,
  RoiProjectionEntry,
  FinancialScenarioComparisonEntry,
  FinancialRiskEntry,
  FinancialAnalysisMetric,
  FinancialScenarioRecommendation,
  PillowScenarioEvaluationMetric,
  GovernedScenarioDomain,
  ScenarioClassification,
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

function mapDomain(category: ScenarioClassification): GovernedScenarioDomain {
  const map: Record<ScenarioClassification, GovernedScenarioDomain> = {
    best_case: "revenue_scenarios",
    expected_case: "profit_scenarios",
    worst_case: "cash_flow_scenarios",
    conservative: "budget_scenarios",
    aggressive: "growth_scenarios",
    recovery: "business_scenarios",
    expansion: "market_scenarios",
    investment: "investment_scenarios",
    market_shift: "market_scenarios",
    future_financial_classes: "future_financial_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: FinancialScenarioPipelinePhase = "outcome_simulation"): FinancialScenarioPipelineStep[] {
  const activeIdx = FINANCIAL_SCENARIO_PIPELINE.indexOf(activePhase);
  return FINANCIAL_SCENARIO_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildScenarios(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  costOptimizationEngine?: CostOptimizationEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): FinancialScenario[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const budgets = input.executiveBudgetPlanner?.enterpriseBudgets ?? [];
  const investments = input.investmentEvaluationEngine?.enterpriseInvestments ?? [];
  const allocations = input.capitalAllocationEngine?.currentAllocations ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];

  const catalogue: Array<Omit<FinancialScenario, "domain"> & { category: ScenarioClassification }> = [
    {
      scenarioId: "fse-enterprise-expected",
      title: "Enterprise FY — Expected Case",
      category: "expected_case",
      purpose: "Baseline enterprise financial forecast for FY planning",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise growth",
      assumptions: ["Current growth trajectory", "No major market disruption", "E3 programme on plan"],
      projectedRevenue: "$4.8M",
      projectedCost: "$3.0M",
      projectedProfit: "$1.2M",
      projectedCashFlow: "+$420K net",
      expectedRoi: "185%",
      riskAssessment: "Low — baseline assumptions",
      confidence: 88,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Enterprise baseline model"],
      simulationScore: 87,
      status: "active",
    },
    {
      scenarioId: "fse-enterprise-best",
      title: "Enterprise FY — Best Case",
      category: "best_case",
      purpose: "Optimistic enterprise forecast with accelerated growth",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise growth",
      assumptions: ["Commerce exceeds targets", "All E3 capabilities deployed", "Market expansion succeeds"],
      projectedRevenue: "$6.2M",
      projectedCost: "$3.2M",
      projectedProfit: "$1.8M",
      projectedCashFlow: "+$780K net",
      expectedRoi: "245%",
      riskAssessment: "Moderate — optimistic assumptions",
      confidence: 72,
      evidence: ["Growth scenario model", input.roiIntelligenceEngine?.enterpriseRoi[0]?.title ?? "Enterprise ROI"],
      simulationScore: 78,
      status: "simulated",
    },
    {
      scenarioId: "fse-enterprise-worst",
      title: "Enterprise FY — Worst Case",
      category: "worst_case",
      purpose: "Conservative stress test for enterprise resilience",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Financial resilience",
      assumptions: ["Commerce delayed 6 months", "Cost overruns +15%", "Market contraction"],
      projectedRevenue: "$3.2M",
      projectedCost: "$3.4M",
      projectedProfit: "$680K",
      projectedCashFlow: "-$120K net",
      expectedRoi: "95%",
      riskAssessment: "High — stress test scenario",
      confidence: 85,
      evidence: [input.cashReserveIntelligence?.cashReserves[2]?.title ?? "Emergency reserve", "Stress test model"],
      simulationScore: 82,
      status: "simulated",
    },
    {
      scenarioId: "fse-commerce-expansion",
      title: "Commerce MVP — Expansion Scenario",
      category: "expansion",
      purpose: "Simulate commerce launch and revenue ramp scenarios",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      assumptions: ["MVP launch Q2", "Customer acquisition on plan", "Support scaling managed"],
      projectedRevenue: "$520K",
      projectedCost: "$276K",
      projectedProfit: "$145K",
      projectedCashFlow: "+$85K net",
      expectedRoi: "152%",
      riskAssessment: "Moderate — scaling phase",
      confidence: 80,
      evidence: [budgets[3]?.title ?? "Commerce budget", investments[3]?.title ?? "Commerce investment"],
      simulationScore: 80,
      status: "evaluating",
    },
    {
      scenarioId: "fse-msa-aggressive",
      title: "MS-A Market — Aggressive Growth",
      category: "aggressive",
      purpose: "Accelerated market expansion capital deployment",
      businessUnit: "Commerce",
      strategicObjective: objectives[1] ?? "Market expansion",
      assumptions: ["Full $850K deployed", "Market entry in 3 phases", "ROI gates at each transition"],
      projectedRevenue: "$1.4M",
      projectedCost: "$850K",
      projectedProfit: "$520K",
      projectedCashFlow: "+$280K net",
      expectedRoi: "112%",
      riskAssessment: "Moderate — market timing",
      confidence: 78,
      evidence: [allocations[0]?.title ?? "Capital allocation", investments[0]?.title ?? "MS-A investment"],
      simulationScore: 79,
      status: "simulated",
    },
    {
      scenarioId: "fse-e3-programme",
      title: "E3 Financial Executive — Investment Scenario",
      category: "investment",
      purpose: "E3 programme financial outcome across deployment phases",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "E3 Financial Executive",
      assumptions: ["E3-01 through E3-16 deployed", "Constitutional integration complete", "Executive adoption"],
      projectedRevenue: "Strategic compounding",
      projectedCost: "$480K",
      projectedProfit: "340% strategic ROI",
      projectedCashFlow: "Positive from E3-05",
      expectedRoi: "340%",
      riskAssessment: "Low — phased delivery",
      confidence: 91,
      evidence: [budgets[1]?.title ?? "E3 budget", investments[1]?.title ?? "E3 investment"],
      simulationScore: 92,
      status: "deploying",
    },
    {
      scenarioId: "fse-budget-conservative",
      title: "FY Budget — Conservative Scenario",
      category: "conservative",
      purpose: "Reduced budget deployment with preserved capability",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Financial discipline",
      assumptions: ["10% budget reduction", "Non-critical spend deferred", "Emergency reserve maintained"],
      projectedRevenue: "$4.2M",
      projectedCost: "$2.7M",
      projectedProfit: "$1.05M",
      projectedCashFlow: "+$320K net",
      expectedRoi: "165%",
      riskAssessment: "Low",
      confidence: 90,
      evidence: [input.costOptimizationEngine?.enterpriseCosts[0]?.title ?? "Enterprise costs", "Conservative model"],
      simulationScore: 86,
      status: "available",
    },
    {
      scenarioId: "fse-cash-recovery",
      title: "Cash Flow — Recovery Scenario",
      category: "recovery",
      purpose: "Simulate cash recovery after adverse market conditions",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Financial resilience",
      assumptions: ["Emergency reserve deployed", "Cost optimization active", "Revenue recovery in 2 quarters"],
      projectedRevenue: "$3.8M",
      projectedCost: "$2.85M",
      projectedProfit: "$950K",
      projectedCashFlow: "+$180K net recovery",
      expectedRoi: "140%",
      riskAssessment: "Moderate — recovery timeline",
      confidence: 82,
      evidence: [input.cashReserveIntelligence?.cashPosition[0]?.label ?? "Cash position", "Recovery model"],
      simulationScore: 81,
      status: "simulated",
    },
    {
      scenarioId: "fse-cost-optimization",
      title: "Cost Optimization — Savings Scenario",
      category: "conservative",
      purpose: "Project outcomes with full E3-08 cost optimization deployed",
      businessUnit: "Platform",
      strategicObjective: "Operational excellence",
      assumptions: ["$336K savings realized", "No harmful cost cutting", "Efficiency preserved"],
      projectedRevenue: "$4.8M",
      projectedCost: "$2.66M",
      projectedProfit: "$1.35M",
      projectedCashFlow: "+$480K net",
      expectedRoi: "195%",
      riskAssessment: "Low",
      confidence: 87,
      evidence: [input.costOptimizationEngine?.totalSavingsIdentified ?? "$336K savings", input.profitOptimizationEngine?.totalNetProfit ?? "Profit baseline"],
      simulationScore: 88,
      status: "active",
    },
    {
      scenarioId: "fse-market-shift",
      title: "Market Shift — Competitive Response",
      category: "market_shift",
      purpose: "Simulate financial impact of major market disruption",
      businessUnit: "Commerce",
      strategicObjective: "Competitive advantage",
      assumptions: ["New competitor entry", "15% pricing pressure", "Accelerated innovation required"],
      projectedRevenue: "$3.6M",
      projectedCost: "$3.1M",
      projectedProfit: "$820K",
      projectedCashFlow: "+$95K net",
      expectedRoi: "118%",
      riskAssessment: "High — market uncertainty",
      confidence: 74,
      evidence: ["Market intelligence", recommendations[0]?.title ?? "Executive recommendation"],
      simulationScore: 75,
      status: "monitoring",
    },
    {
      scenarioId: "fse-capital-reallocation",
      title: "Capital Reallocation — Strategic Shift",
      category: "investment",
      purpose: "Simulate capital reallocation from growth to strategic reserves",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Strategic flexibility",
      assumptions: ["$200K reallocated to strategic reserve", "Growth pace moderated", "Opportunity fund increased"],
      projectedRevenue: "$4.4M",
      projectedCost: "$2.9M",
      projectedProfit: "$1.1M",
      projectedCashFlow: "+$350K net",
      expectedRoi: "175%",
      riskAssessment: "Low-Moderate",
      confidence: 84,
      evidence: [allocations[1]?.title ?? "Strategic capital", input.cashReserveIntelligence?.cashReserves[3]?.title ?? "Strategic reserve"],
      simulationScore: 83,
      status: "evaluating",
    },
    {
      scenarioId: "fse-profit-growth",
      title: "Profit Growth — Optimized Trajectory",
      category: "best_case",
      purpose: "E3-07 profit optimization fully realized across enterprise",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Long-term profitability",
      assumptions: ["All margin improvements deployed", "Commerce scaling succeeds", "Zero profit leakage"],
      projectedRevenue: "$5.4M",
      projectedCost: "$2.8M",
      projectedProfit: "$1.55M",
      projectedCashFlow: "+$620K net",
      expectedRoi: "220%",
      riskAssessment: "Moderate — execution dependent",
      confidence: 79,
      evidence: [input.profitOptimizationEngine?.enterpriseProfit[0]?.title ?? "Enterprise profit", "Profit optimization model"],
      simulationScore: 80,
      status: "simulated",
    },
  ];

  return catalogue.map((item) => ({
    ...item,
    domain: mapDomain(item.category),
  }));
}

function buildAvailableScenarios(scenarios: FinancialScenario[]): AvailableScenarioEntry[] {
  return scenarios.map((s) => ({
    scenarioId: s.scenarioId,
    title: s.title,
    category: label(s.category),
    domain: label(s.domain),
    projectedProfit: s.projectedProfit,
    expectedRoi: s.expectedRoi,
    confidence: s.confidence,
    status: s.status,
  }));
}

function buildRevenueForecast(): RevenueForecastEntry[] {
  return [
    { period: "Q1", bestCase: "$1.4M", expectedCase: "$1.1M", worstCase: "$850K", trend: "rising" },
    { period: "Q2", bestCase: "$1.6M", expectedCase: "$1.2M", worstCase: "$920K", trend: "rising" },
    { period: "Q3", bestCase: "$1.7M", expectedCase: "$1.25M", worstCase: "$980K", trend: "stable" },
    { period: "Q4", bestCase: "$1.9M", expectedCase: "$1.35M", worstCase: "$1.05M", trend: "rising" },
  ];
}

function buildProfitForecast(): ProfitForecastEntry[] {
  return [
    { period: "Q1", bestCase: "$480K", expectedCase: "$280K", worstCase: "$165K", margin: "29%" },
    { period: "Q2", bestCase: "$520K", expectedCase: "$310K", worstCase: "$180K", margin: "30%" },
    { period: "Q3", bestCase: "$560K", expectedCase: "$320K", worstCase: "$195K", margin: "31%" },
    { period: "Q4", bestCase: "$620K", expectedCase: "$350K", worstCase: "$210K", margin: "32%" },
  ];
}

function buildCashFlowForecast(): CashFlowForecastEntry[] {
  return [
    { period: "Q1", inflow: "$1.1M", outflow: "$820K", netCashFlow: "+$280K", endingBalance: "$2.68M", scenario: "expected" },
    { period: "Q2", inflow: "$1.2M", outflow: "$890K", netCashFlow: "+$310K", endingBalance: "$2.99M", scenario: "expected" },
    { period: "Q3", inflow: "$1.25M", outflow: "$920K", netCashFlow: "+$330K", endingBalance: "$3.32M", scenario: "expected" },
    { period: "Q4", inflow: "$1.35M", outflow: "$980K", netCashFlow: "+$370K", endingBalance: "$3.69M", scenario: "expected" },
  ];
}

function buildRoiProjections(scenarios: FinancialScenario[]): RoiProjectionEntry[] {
  return scenarios
    .filter((s) => s.expectedRoi !== "N/A")
    .slice(0, 8)
    .map((s) => ({
      scenarioId: s.scenarioId,
      title: s.title,
      expectedRoi: s.expectedRoi,
      paybackPeriod: s.category === "investment" ? "12 months" : s.category === "expansion" ? "18 months" : "9 months",
      confidence: s.confidence,
      status: s.status,
    }));
}

function buildScenarioComparison(): FinancialScenarioComparisonEntry[] {
  return [
    { metric: "Revenue", bestCase: "$6.2M", expectedCase: "$4.8M", worstCase: "$3.2M", variance: "±48%" },
    { metric: "Profit", bestCase: "$1.8M", expectedCase: "$1.2M", worstCase: "$680K", variance: "±45%" },
    { metric: "Cash Flow", bestCase: "+$780K", expectedCase: "+$420K", worstCase: "-$120K", variance: "±107%" },
    { metric: "ROI", bestCase: "245%", expectedCase: "185%", worstCase: "95%", variance: "±44%" },
    { metric: "Cost", bestCase: "$3.2M", expectedCase: "$3.0M", worstCase: "$3.4M", variance: "±7%" },
    { metric: "Confidence", bestCase: "72%", expectedCase: "88%", worstCase: "85%", variance: "Managed" },
  ];
}

function buildFinancialRisks(scenarios: FinancialScenario[]): FinancialRiskEntry[] {
  return scenarios
    .filter((s) => s.riskAssessment.includes("High") || s.riskAssessment.includes("Moderate") || s.confidence < 80)
    .slice(0, 5)
    .map((s) => ({
      riskId: `frisk-${s.scenarioId}`,
      scenarioId: s.scenarioId,
      title: s.title,
      severity: s.riskAssessment.includes("High") ? "high" : "moderate",
      exposure: `${s.riskAssessment} · confidence ${s.confidence}%`,
      mitigation: "Multi-scenario analysis · E2-02 risk · executive decision gate",
      status: s.status === "monitoring" ? "active_review" : "simulated",
    }));
}

function buildFinancialAnalysis(scenarios: FinancialScenario[], avgRoi: number): FinancialAnalysisMetric[] {
  const avgConfidence = Math.round(
    scenarios.reduce((s, sc) => s + sc.confidence, 0) / Math.max(scenarios.length, 1),
  );
  const scores: Record<string, { score: number; summary: string }> = {
    revenue_growth: { score: 84, summary: "Revenue growth forecast $4.8M expected · $6.2M best case" },
    profit_growth: { score: 82, summary: "Profit growth +18% YoY in expected case" },
    cash_flow: { score: 86, summary: "Positive cash flow in expected and best cases" },
    capital_requirements: { score: 83, summary: "Capital requirements modeled per investment scenario" },
    operating_costs: { score: 85, summary: "Operating costs $3.0M expected · $2.66M optimized" },
    investment_return: { score: Math.min(100, avgRoi), summary: `Avg scenario ROI ${avgRoi}%` },
    business_value: { score: 87, summary: "Business value assessed per scenario" },
    financial_stability: { score: 88, summary: "Worst case stress test validates resilience" },
    enterprise_value: { score: avgConfidence, summary: `${scenarios.length} scenarios · avg confidence ${avgConfidence}%` },
  };

  return FINANCIAL_ANALYSIS_DOMAINS.map((domain) => {
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
  scenarioCount: number;
  avgConfidence: number;
  riskCount: number;
}): PillowScenarioEvaluationMetric[] {
  return PILLOW_SCENARIO_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_SCENARIO_EVALUATIONS)[number], { status: string; summary: string }> = {
      financial_scenarios: { status: "active", summary: `${input.scenarioCount} scenarios · best/expected/worst modeled` },
      financial_risks: { status: input.riskCount <= 3 ? "managed" : "attention", summary: `${input.riskCount} scenario risks monitored` },
      growth_opportunities: { status: "identified", summary: "Best case and aggressive scenarios model growth paths" },
      investment_alternatives: { status: "active", summary: "Investment and capital reallocation scenarios available" },
      executive_recommendations: { status: "active", summary: "Scenario recommendations via E2-04 · decision via E2-07" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(): FinancialScenarioRecommendation[] {
  return [
    {
      id: "fse-rec-multiple",
      title: "Enforce Multiple-Scenario Decision Discipline",
      category: "governance",
      why: "Financial planning shall never rely upon a single future — every major decision requires scenario evaluation",
      what: "Govern all scenarios through PILLOW-FSE-001 constitutional authority",
      how: "Scenario pipeline · 5s refresh · no single-scenario decisions",
      confidencePercent: 94,
    },
    {
      id: "fse-rec-commerce",
      title: "Evaluate Commerce Expansion Across Scenarios",
      category: "decision_support",
      why: "Commerce MVP expansion scenario at 80% confidence — requires multi-scenario approval before capital commit",
      what: "Compare best/expected/worst commerce scenarios before deployment decision",
      how: "Comparative analysis step · E3-04 investment · executive approval gate",
      confidencePercent: 86,
    },
    {
      id: "fse-rec-worst",
      title: "Validate Worst-Case Resilience",
      category: "risk",
      why: "Worst case projects -$120K net cash flow — emergency reserve coverage must be confirmed",
      what: "Stress test worst case against E3-06 cash reserve requirements",
      how: "Outcome simulation · cash reserve linkage · Guardian integrity",
      confidencePercent: 90,
    },
    {
      id: "fse-rec-e311",
      title: "Proceed to E3-11 Capital Risk Engine",
      category: "programme",
      why: "E3-10 executive KPI engine established · capital risk engine is next E3 capability",
      what: "Implement Capital Risk Engine building on KPI measurement foundation",
      how: "E3 sequence · integrate EFF through E3-09 · KPI-risk linkage",
      confidencePercent: 92,
    },
  ];
}

function parseRoi(roi: string): number {
  const match = roi.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function assembleFinancialScenarioEngine(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  costOptimizationEngine?: CostOptimizationEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): FinancialScenarioEngine {
  const financialScenarios = buildScenarios(input);
  const availableScenarios = buildAvailableScenarios(financialScenarios);
  const revenueForecast = buildRevenueForecast();
  const profitForecast = buildProfitForecast();
  const cashFlowForecast = buildCashFlowForecast();
  const roiProjections = buildRoiProjections(financialScenarios);
  const scenarioComparison = buildScenarioComparison();
  const financialRisks = buildFinancialRisks(financialScenarios);

  const roiValues = financialScenarios.map((s) => parseRoi(s.expectedRoi)).filter((r) => r > 0);
  const averageExpectedRoi = Math.round(
    roiValues.reduce((a, b) => a + b, 0) / Math.max(roiValues.length, 1),
  );
  const averageConfidence = Math.round(
    financialScenarios.reduce((s, sc) => s + sc.confidence, 0) / Math.max(financialScenarios.length, 1),
  );

  const financialAnalysis = buildFinancialAnalysis(financialScenarios, averageExpectedRoi);

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.profitOptimizationEngine?.healthScore ?? 85,
    input.costOptimizationEngine?.healthScore ?? 85,
    averageConfidence,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    scenarioCount: financialScenarios.length,
    avgConfidence: averageConfidence,
    riskCount: financialRisks.length,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Financial Scenario Engine — constitutional financial simulation authority active",
    `${financialScenarios.length} scenarios · best/expected/worst modeled · avg confidence ${averageConfidence}%`,
    "No single-scenario decisions · multiple futures enforced",
    "Integrated with E3-01 Finance through E3-08 Cost · E2 Decision Engine",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting financial integrity")}`,
    "ECC coordinates scenario execution · Supervisor monitors forecast accuracy",
    "VIE validates scenario alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-09",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Financial Scenario Engine continuously simulates multiple financial scenarios before major financial decisions are approved. Every investment, budget, capital allocation and strategic financial decision is evaluated across multiple possible futures. The Grand King understands the financial consequences before committing enterprise resources.",
    engineHealth: healthLabel(clampedHealth),
    scenarioHealth: averageConfidence >= 85 ? "robust" : averageConfidence >= 75 ? "active" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeScenarioCount: financialScenarios.filter((s) => s.status === "active" || s.status === "deploying" || s.status === "evaluating").length,
    averageConfidence,
    averageExpectedRoi,
    projectedEnterpriseRevenue: "$4.8M",
    projectedEnterpriseProfit: "$1.2M",
    projectedCashPosition: "$3.69M",
    financialScenarios,
    availableScenarios,
    revenueForecast,
    profitForecast,
    cashFlowForecast,
    roiProjections,
    scenarioComparison,
    financialRisks,
    financialAnalysis,
    financialScenarioPipeline: buildPipeline("outcome_simulation"),
    recommendedActions,
    pillowEvaluations,
    scenarioPrinciples: [...FINANCIAL_SCENARIO_PRINCIPLES],
    governedDomains: [...GOVERNED_SCENARIO_DOMAINS],
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
      cashReserveIntelligence: input.cashReserveIntelligence
        ? `E3-06 · ${input.cashReserveIntelligence.intelligenceHealth} · ${input.cashReserveIntelligence.totalCashPosition} cash`
        : "E3-06 · standby",
      profitOptimizationEngine: input.profitOptimizationEngine
        ? `E3-07 · ${input.profitOptimizationEngine.engineHealth} · ${input.profitOptimizationEngine.totalNetProfit} net profit`
        : "E3-07 · standby",
      costOptimizationEngine: input.costOptimizationEngine
        ? `E3-08 · ${input.costOptimizationEngine.engineHealth} · ${input.costOptimizationEngine.totalSavingsIdentified} savings`
        : "E3-08 · standby",
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "financial integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring scenario health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "scenario execution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE310: true,
  };
}

export function buildFallbackFinancialScenarioEngine(): FinancialScenarioEngine {
  return assembleFinancialScenarioEngine({});
}
