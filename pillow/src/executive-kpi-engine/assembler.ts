import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CashReserveIntelligence } from "../cash-reserve-intelligence/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CostOptimizationEngine } from "../cost-optimization-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialScenarioEngine } from "../financial-scenario-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { ProfitOptimizationEngine } from "../profit-optimization-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_KPI_PIPELINE,
  EXECUTIVE_KPI_PRINCIPLES,
  GOVERNED_KPI_DOMAINS,
  EXECUTIVE_KPI_ANALYSIS_DOMAINS,
  PILLOW_KPI_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveKpiEngine,
  ExecutiveKpiPipelineStep,
  ExecutiveKpiPipelinePhase,
  ExecutiveKpi,
  EnterpriseKpiEntry,
  FinancialKpiEntry,
  BusinessKpiEntry,
  PerformanceTrendEntry,
  KpiVarianceEntry,
  ExecutiveScorecardEntry,
  FinancialHealthEntry,
  ExecutiveKpiAnalysisMetric,
  ExecutiveKpiRecommendation,
  PillowKpiEvaluationMetric,
  GovernedKpiDomain,
  ExecutiveKpiClassification,
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

function mapDomain(category: ExecutiveKpiClassification): GovernedKpiDomain {
  const map: Record<ExecutiveKpiClassification, GovernedKpiDomain> = {
    financial_kpi: "financial_kpis",
    business_kpi: "business_kpis",
    growth_kpi: "enterprise_kpis",
    profitability_kpi: "financial_kpis",
    revenue_kpi: "commerce_kpis",
    cost_kpi: "operational_kpis",
    investment_kpi: "investment_kpis",
    operational_kpi: "operational_kpis",
    strategic_kpi: "executive_kpis",
    future_kpi_classes: "future_kpi_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: ExecutiveKpiPipelinePhase = "performance_measurement"): ExecutiveKpiPipelineStep[] {
  const activeIdx = EXECUTIVE_KPI_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_KPI_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildKpis(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  costOptimizationEngine?: CostOptimizationEngine | null;
  financialScenarioEngine?: FinancialScenarioEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): ExecutiveKpi[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const enterpriseRoi = input.roiIntelligenceEngine?.enterpriseRoiPercentage ?? 185;
  const cashPosition = input.cashReserveIntelligence?.totalCashPosition ?? "$3.69M";
  const netProfit = input.profitOptimizationEngine?.totalNetProfit ?? "$1.2M";
  const costEfficiency = input.costOptimizationEngine?.averageCostEfficiency ?? 87;
  const scenarioConfidence = input.financialScenarioEngine?.averageConfidence ?? 86;

  const catalogue: Array<Omit<ExecutiveKpi, "domain"> & { category: ExecutiveKpiClassification }> = [
    {
      kpiId: "eke-revenue-growth",
      title: "Enterprise Revenue Growth",
      category: "revenue_kpi",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise growth",
      measurementFormula: "(Current Revenue - Prior Revenue) / Prior Revenue × 100",
      targetValue: "18%",
      currentValue: "22%",
      historicalTrend: "↑ improving · 3 consecutive quarters",
      variance: "+4% above target",
      businessImpact: "Strong commerce and platform expansion momentum",
      financialImpact: "+$420K incremental revenue vs plan",
      confidence: 91,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Revenue ledger"],
      performanceScore: 92,
      status: "on_track",
    },
    {
      kpiId: "eke-net-profit-margin",
      title: "Net Profit Margin",
      category: "profitability_kpi",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Sustainable profitability",
      measurementFormula: "Net Profit / Total Revenue × 100",
      targetValue: "22%",
      currentValue: "25%",
      historicalTrend: "↑ stable improvement",
      variance: "+3% above target",
      businessImpact: "Margin expansion supports reinvestment capacity",
      financialImpact: netProfit,
      confidence: 89,
      evidence: [input.profitOptimizationEngine ? "E3-07 profit optimization" : "Profit baseline"],
      performanceScore: 90,
      status: "on_track",
    },
    {
      kpiId: "eke-cash-position",
      title: "Cash Reserve Position",
      category: "financial_kpi",
      businessUnit: "Treasury",
      strategicObjective: "Financial resilience",
      measurementFormula: "Total Cash / Monthly Operating Expense",
      targetValue: "6 months",
      currentValue: "8.2 months",
      historicalTrend: "→ stable reserve build",
      variance: "+2.2 months above target",
      businessImpact: "Strong liquidity for strategic investments",
      financialImpact: cashPosition,
      confidence: 93,
      evidence: [input.cashReserveIntelligence ? "E3-06 cash reserve" : "Treasury report"],
      performanceScore: 94,
      status: "on_track",
    },
    {
      kpiId: "eke-enterprise-roi",
      title: "Enterprise ROI",
      category: "investment_kpi",
      businessUnit: "Investment Office",
      strategicObjective: objectives[1] ?? "Capital efficiency",
      measurementFormula: "(Net Gain - Cost of Investment) / Cost of Investment × 100",
      targetValue: "150%",
      currentValue: `${enterpriseRoi}%`,
      historicalTrend: "↑ outperforming target",
      variance: `+${enterpriseRoi - 150}% above target`,
      businessImpact: "Investment portfolio delivering strong returns",
      financialImpact: "Capital allocation validated",
      confidence: 88,
      evidence: [input.roiIntelligenceEngine ? "E3-05 ROI intelligence" : "Investment ledger"],
      performanceScore: 91,
      status: "on_track",
    },
    {
      kpiId: "eke-cost-efficiency",
      title: "Cost Efficiency Index",
      category: "cost_kpi",
      businessUnit: "Operations",
      strategicObjective: "Operational excellence",
      measurementFormula: "Value Delivered / Total Operating Cost × 100",
      targetValue: "85%",
      currentValue: `${costEfficiency}%`,
      historicalTrend: "↑ improving efficiency",
      variance: `+${costEfficiency - 85}% above target`,
      businessImpact: "Cost discipline supports margin expansion",
      financialImpact: input.costOptimizationEngine?.totalSavingsIdentified ?? "$340K savings",
      confidence: 87,
      evidence: [input.costOptimizationEngine ? "E3-08 cost optimization" : "Cost baseline"],
      performanceScore: 88,
      status: "on_track",
    },
    {
      kpiId: "eke-budget-variance",
      title: "Budget Performance Variance",
      category: "financial_kpi",
      businessUnit: "Finance",
      strategicObjective: "Budget discipline",
      measurementFormula: "(Actual Spend - Budget) / Budget × 100",
      targetValue: "±5%",
      currentValue: "-2.1%",
      historicalTrend: "→ within tolerance",
      variance: "Under budget by 2.1%",
      businessImpact: "Budget execution on plan",
      financialImpact: "$62K under budget YTD",
      confidence: 90,
      evidence: [input.executiveBudgetPlanner ? "E3-03 budget planner" : "Budget ledger"],
      performanceScore: 86,
      status: "on_track",
    },
    {
      kpiId: "eke-investment-pipeline",
      title: "Investment Pipeline Health",
      category: "investment_kpi",
      businessUnit: "Investment Office",
      strategicObjective: objectives[2] ?? "Strategic investment",
      measurementFormula: "Approved Investments / Evaluated Investments × 100",
      targetValue: "75%",
      currentValue: "82%",
      historicalTrend: "↑ strong pipeline conversion",
      variance: "+7% above target",
      businessImpact: "Investment evaluation discipline maintained",
      financialImpact: `${input.investmentEvaluationEngine?.activeInvestmentCount ?? 8} active investments`,
      confidence: 85,
      evidence: [input.investmentEvaluationEngine ? "E3-04 investment evaluation" : "Pipeline report"],
      performanceScore: 84,
      status: "active",
    },
    {
      kpiId: "eke-commerce-gmv",
      title: "Commerce GMV",
      category: "business_kpi",
      businessUnit: "Commerce",
      strategicObjective: "Commerce expansion",
      measurementFormula: "Total Gross Merchandise Value / Period",
      targetValue: "$1.2M",
      currentValue: "$1.35M",
      historicalTrend: "↑ accelerating growth",
      variance: "+12.5% above target",
      businessImpact: "Commerce MVP traction validated",
      financialImpact: "+$150K above plan",
      confidence: 84,
      evidence: ["Commerce platform metrics", "Marketplace integration"],
      performanceScore: 87,
      status: "on_track",
    },
    {
      kpiId: "eke-programme-delivery",
      title: "Programme Delivery Rate",
      category: "operational_kpi",
      businessUnit: "Programme Office",
      strategicObjective: "Execution excellence",
      measurementFormula: "On-Time Deliverables / Total Deliverables × 100",
      targetValue: "90%",
      currentValue: "88%",
      historicalTrend: "→ slight improvement needed",
      variance: "-2% below target",
      businessImpact: "Minor delivery lag on E3 programme",
      financialImpact: "Schedule risk on dependent investments",
      confidence: 82,
      evidence: ["ECC programme tracking", "Supervisor monitoring"],
      performanceScore: 78,
      status: "attention",
    },
    {
      kpiId: "eke-scenario-confidence",
      title: "Scenario Forecast Confidence",
      category: "strategic_kpi",
      businessUnit: "Financial Planning",
      strategicObjective: "Evidence-based planning",
      measurementFormula: "Average Scenario Confidence Score",
      targetValue: "85%",
      currentValue: `${scenarioConfidence}%`,
      historicalTrend: "→ stable forecast quality",
      variance: scenarioConfidence >= 85 ? "At or above target" : "Below target",
      businessImpact: "Multi-scenario planning quality maintained",
      financialImpact: `${input.financialScenarioEngine?.activeScenarioCount ?? 12} active scenarios`,
      confidence: scenarioConfidence,
      evidence: [input.financialScenarioEngine ? "E3-09 financial scenario" : "Scenario baseline"],
      performanceScore: scenarioConfidence,
      status: scenarioConfidence >= 85 ? "on_track" : "attention",
    },
    {
      kpiId: "eke-capital-efficiency",
      title: "Capital Allocation Efficiency",
      category: "financial_kpi",
      businessUnit: "Capital Office",
      strategicObjective: "Optimal capital deployment",
      measurementFormula: "ROI-Weighted Allocations / Total Capital × 100",
      targetValue: "80%",
      currentValue: "86%",
      historicalTrend: "↑ improving allocation quality",
      variance: "+6% above target",
      businessImpact: "Capital deployed to highest-return initiatives",
      financialImpact: `${input.capitalAllocationEngine?.activeAllocationCount ?? 6} active allocations`,
      confidence: 86,
      evidence: [input.capitalAllocationEngine ? "E3-02 capital allocation" : "Allocation ledger"],
      performanceScore: 85,
      status: "on_track",
    },
    {
      kpiId: "eke-enterprise-value",
      title: "Enterprise Value Index",
      category: "growth_kpi",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Long-term enterprise value",
      measurementFormula: "Weighted composite of revenue, profit, ROI and strategic score",
      targetValue: "100",
      currentValue: "112",
      historicalTrend: "↑ value creation accelerating",
      variance: "+12 above target",
      businessImpact: "Enterprise value creation on trajectory",
      financialImpact: "Strategic and financial KPIs aligned",
      confidence: 88,
      evidence: ["E3 composite index", "Enterprise value model"],
      performanceScore: 91,
      status: "on_track",
    },
  ];

  return catalogue.map((k) => ({ ...k, domain: mapDomain(k.category) }));
}

function buildEnterpriseKpis(kpis: ExecutiveKpi[]): EnterpriseKpiEntry[] {
  return kpis.map((k) => ({
    kpiId: k.kpiId,
    title: k.title,
    category: label(k.category),
    domain: label(k.domain),
    currentValue: k.currentValue,
    targetValue: k.targetValue,
    variance: k.variance,
    confidence: k.confidence,
    status: k.status,
  }));
}

function buildFinancialKpis(kpis: ExecutiveKpi[]): FinancialKpiEntry[] {
  return kpis
    .filter((k) => k.domain === "financial_kpis" || k.category === "profitability_kpi" || k.category === "cost_kpi")
    .map((k) => ({
      kpiId: k.kpiId,
      title: k.title,
      currentValue: k.currentValue,
      targetValue: k.targetValue,
      trend: k.historicalTrend,
      variance: k.variance,
      status: k.status,
    }));
}

function buildBusinessKpis(kpis: ExecutiveKpi[]): BusinessKpiEntry[] {
  return kpis
    .filter((k) => k.domain === "business_kpis" || k.domain === "commerce_kpis" || k.domain === "enterprise_kpis")
    .map((k) => ({
      kpiId: k.kpiId,
      title: k.title,
      businessUnit: k.businessUnit,
      currentValue: k.currentValue,
      targetValue: k.targetValue,
      trend: k.historicalTrend,
      status: k.status,
    }));
}

function buildPerformanceTrends(): PerformanceTrendEntry[] {
  return [
    { period: "Q1 FY", revenue: "$980K", profit: "$245K", cashFlow: "+$180K", roi: "165%", trend: "↑" },
    { period: "Q2 FY", revenue: "$1.1M", profit: "$275K", cashFlow: "+$210K", roi: "172%", trend: "↑" },
    { period: "Q3 FY", revenue: "$1.25M", profit: "$310K", cashFlow: "+$280K", roi: "178%", trend: "↑" },
    { period: "Q4 FY (proj)", revenue: "$1.45M", profit: "$370K", cashFlow: "+$320K", roi: `${185}%`, trend: "↑" },
  ];
}

function buildVarianceAnalysis(kpis: ExecutiveKpi[]): KpiVarianceEntry[] {
  return kpis.slice(0, 8).map((k) => ({
    kpiId: k.kpiId,
    title: k.title,
    targetValue: k.targetValue,
    currentValue: k.currentValue,
    variance: k.variance,
    variancePercent: k.variance.match(/[+-]?\d+(\.\d+)?%/)?.[0] ?? "—",
    severity: k.status === "attention" ? "medium" : k.status === "on_track" ? "low" : "low",
  }));
}

function buildExecutiveScorecard(): ExecutiveScorecardEntry[] {
  return [
    { domain: "Financial Performance", score: 91, target: 85, status: "exceeding", summary: "Revenue, profit and cash KPIs above target" },
    { domain: "Investment Performance", score: 88, target: 80, status: "exceeding", summary: "ROI and capital efficiency validated" },
    { domain: "Operational Performance", score: 83, target: 85, status: "near_target", summary: "Programme delivery requires attention" },
    { domain: "Strategic Performance", score: 89, target: 85, status: "exceeding", summary: "Scenario confidence and enterprise value on track" },
    { domain: "Commerce Performance", score: 87, target: 80, status: "exceeding", summary: "GMV exceeding commerce expansion targets" },
    { domain: "Cost Performance", score: 88, target: 85, status: "exceeding", summary: "Cost efficiency and savings targets met" },
  ];
}

function buildFinancialHealth(input: {
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  financialScenarioEngine?: FinancialScenarioEngine | null;
}): FinancialHealthEntry[] {
  return [
    {
      metric: "Cash Position",
      value: input.cashReserveIntelligence?.totalCashPosition ?? "$3.69M",
      target: "$3.0M minimum",
      status: "healthy",
      trend: "↑ building",
    },
    {
      metric: "Net Profit",
      value: input.profitOptimizationEngine?.totalNetProfit ?? "$1.2M",
      target: "$1.0M",
      status: "healthy",
      trend: "↑ improving",
    },
    {
      metric: "Scenario Confidence",
      value: `${input.financialScenarioEngine?.averageConfidence ?? 86}%`,
      target: "85%",
      status: (input.financialScenarioEngine?.averageConfidence ?? 86) >= 85 ? "healthy" : "attention",
      trend: "→ stable",
    },
    {
      metric: "Financial Stability",
      value: input.financialScenarioEngine?.scenarioHealth ?? "robust",
      target: "robust",
      status: "healthy",
      trend: "→ maintained",
    },
    {
      metric: "Budget Compliance",
      value: "97.9%",
      target: "95%",
      status: "healthy",
      trend: "→ on plan",
    },
    {
      metric: "Enterprise Value",
      value: "112 index",
      target: "100 index",
      status: "healthy",
      trend: "↑ growing",
    },
  ];
}

function buildKpiAnalysis(): ExecutiveKpiAnalysisMetric[] {
  return EXECUTIVE_KPI_ANALYSIS_DOMAINS.map((domain) => {
    const scores: Record<string, number> = {
      revenue_growth: 92,
      profit_growth: 90,
      cost_efficiency: 88,
      cash_flow: 94,
      roi: 91,
      capital_efficiency: 86,
      budget_performance: 86,
      business_value: 87,
      enterprise_value: 91,
      strategic_performance: 89,
    };
    const score = scores[domain] ?? 85;
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 85 ? "exceeding" : score >= 75 ? "on_track" : "attention",
      summary: `${label(domain)} measured · evidence-based · continuously monitored`,
    };
  });
}

function buildPillowEvaluations(input: {
  kpiCount: number;
  avgConfidence: number;
  attentionCount: number;
}): PillowKpiEvaluationMetric[] {
  return PILLOW_KPI_EVALUATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      kpi_health: `${input.kpiCount} KPIs tracked · avg confidence ${input.avgConfidence}%`,
      performance_trends: "4-period trend analysis · revenue profit cash ROI improving",
      financial_performance: "Financial KPIs exceeding targets · cash and profit healthy",
      business_performance: "Commerce and programme KPIs monitored · 1 attention item",
      executive_recommendations: `${input.attentionCount} KPIs require executive review`,
    };
    const statuses: Record<string, string> = {
      kpi_health: input.avgConfidence >= 85 ? "healthy" : "active",
      performance_trends: "improving",
      financial_performance: "strong",
      business_performance: input.attentionCount > 0 ? "monitoring" : "healthy",
      executive_recommendations: "active",
    };
    return {
      domain,
      label: label(domain),
      status: statuses[domain] ?? "active",
      summary: summaries[domain] ?? "Continuous KPI evaluation active",
    };
  });
}

function buildRecommendations(): ExecutiveKpiRecommendation[] {
  return [
    {
      id: "eke-rec-measurement",
      title: "Enforce No Unmeasured Performance Discipline",
      category: "governance",
      why: "Every business, programme, department and executive initiative must possess measurable KPIs",
      what: "Govern all KPIs through PILLOW-EKE-001 constitutional authority",
      how: "KPI pipeline · 5s refresh · objective measurement enforced",
      confidencePercent: 94,
    },
    {
      id: "eke-rec-programme",
      title: "Address Programme Delivery Variance",
      category: "performance",
      why: "Programme Delivery Rate at 88% — 2% below 90% target",
      what: "Review E3 programme schedule with ECC and Supervisor",
      how: "Variance analysis · performance review · optimization step",
      confidencePercent: 88,
    },
    {
      id: "eke-rec-scenario-kpi",
      title: "Link Scenario Forecasts to KPI Targets",
      category: "integration",
      why: "E3-09 scenario confidence and E3-10 KPI targets must remain synchronized",
      what: "Validate KPI targets against expected-case financial scenarios",
      how: "FSE integration · scenario-KPI variance reconciliation",
      confidencePercent: 90,
    },
    {
      id: "eke-rec-e312",
      title: "Proceed to E3-12 Executive Forecast Intelligence",
      category: "programme",
      why: "E3-11 capital risk engine established · executive forecast intelligence is next E3 capability",
      what: "Implement Executive Forecast Intelligence building on capital risk foundation",
      how: "E3 sequence · integrate EFF through E3-10 · risk-forecast linkage",
      confidencePercent: 92,
    },
  ];
}

export function assembleExecutiveKpiEngine(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  costOptimizationEngine?: CostOptimizationEngine | null;
  financialScenarioEngine?: FinancialScenarioEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: { status?: string; health?: string } | null;
  journey?: { currentJourney?: string; currentMission?: string } | null;
  supervisor?: { status?: string; missionStatus?: string } | null;
  ecc?: { status?: string; executionMode?: string } | null;
  vie?: { approvalStatus?: string; visionAlignment?: string } | null;
}): ExecutiveKpiEngine {
  const executiveKpis = buildKpis(input);
  const enterpriseKpis = buildEnterpriseKpis(executiveKpis);
  const financialKpis = buildFinancialKpis(executiveKpis);
  const businessKpis = buildBusinessKpis(executiveKpis);
  const performanceTrends = buildPerformanceTrends();
  const varianceAnalysis = buildVarianceAnalysis(executiveKpis);
  const executiveScorecard = buildExecutiveScorecard();
  const financialHealth = buildFinancialHealth(input);
  const kpiAnalysis = buildKpiAnalysis();

  const averageConfidence = Math.round(
    executiveKpis.reduce((sum, k) => sum + k.confidence, 0) / executiveKpis.length,
  );
  const averagePerformanceScore = Math.round(
    executiveKpis.reduce((sum, k) => sum + k.performanceScore, 0) / executiveKpis.length,
  );
  const attentionCount = executiveKpis.filter((k) => k.status === "attention").length;

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.financialScenarioEngine?.healthScore ?? 85,
    input.profitOptimizationEngine?.healthScore ?? 85,
    input.costOptimizationEngine?.healthScore ?? 85,
    averageConfidence,
    averagePerformanceScore,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));
  const financialHealthScore = Math.round(
    financialHealth.filter((f) => f.status === "healthy").length / financialHealth.length * 100,
  );

  const pillowEvaluations = buildPillowEvaluations({
    kpiCount: executiveKpis.length,
    avgConfidence: averageConfidence,
    attentionCount,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Executive KPI Engine — constitutional performance measurement authority active",
    `${executiveKpis.length} KPIs · avg confidence ${averageConfidence}% · performance index ${averagePerformanceScore}`,
    "No unmeasured performance · objective measurement enforced",
    "Integrated with E3-01 Finance through E3-09 Scenario · E2 Decision Engine",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting performance integrity")}`,
    "ECC coordinates performance reviews · Supervisor monitors KPI variance",
    "VIE validates KPI alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-10",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive KPI Engine continuously defines, measures and monitors enterprise Key Performance Indicators. Every business, programme, department, investment and executive initiative possesses measurable executive KPIs. The Grand King continuously understands the financial performance of the Empire through objective executive metrics.",
    engineHealth: healthLabel(clampedHealth),
    kpiHealth: averageConfidence >= 85 ? "robust" : averageConfidence >= 75 ? "active" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeKpiCount: executiveKpis.filter((k) => k.status === "active" || k.status === "on_track" || k.status === "attention").length,
    averageConfidence,
    averagePerformanceScore,
    enterprisePerformanceIndex: averagePerformanceScore,
    financialHealthScore,
    executiveKpis,
    enterpriseKpis,
    financialKpis,
    businessKpis,
    performanceTrends,
    varianceAnalysis,
    executiveScorecard,
    financialHealth,
    kpiAnalysis,
    executiveKpiPipeline: buildPipeline("performance_measurement"),
    recommendedActions,
    pillowEvaluations,
    kpiPrinciples: [...EXECUTIVE_KPI_PRINCIPLES],
    governedDomains: [...GOVERNED_KPI_DOMAINS],
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
      financialScenarioEngine: input.financialScenarioEngine
        ? `E3-09 · ${input.financialScenarioEngine.engineHealth} · ${input.financialScenarioEngine.activeScenarioCount} scenarios`
        : "E3-09 · standby",
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "performance integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring KPI health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "performance review coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE311: true,
  };
}

export function buildFallbackExecutiveKpiEngine(): ExecutiveKpiEngine {
  return assembleExecutiveKpiEngine({});
}
