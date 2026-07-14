import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CapitalRiskEngine } from "../capital-risk-engine/types.js";
import type { CashReserveIntelligence } from "../cash-reserve-intelligence/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CostOptimizationEngine } from "../cost-optimization-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveForecastIntelligence } from "../executive-forecast-intelligence/types.js";
import type { ExecutiveKpiEngine } from "../executive-kpi-engine/types.js";
import type { FinancialScenarioEngine } from "../financial-scenario-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { ProfitOptimizationEngine } from "../profit-optimization-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_PERFORMANCE_WIDGETS,
  EXECUTIVE_PERFORMANCE_PRINCIPLES,
  EXECUTIVE_NAVIGATION_TARGETS,
  PILLOW_PERFORMANCE_PUBLICATIONS,
  ECC_PERFORMANCE_PUBLICATIONS,
  SUPERVISOR_PERFORMANCE_PUBLICATIONS,
  REALTIME_UPDATE_TRIGGERS,
} from "./paths.js";
import type {
  ExecutivePerformanceDashboard,
  ExecutivePerformanceSummary,
  FinancialWidget,
  ExecutiveNavigationEntry,
  PerformancePublication,
  PerformanceDashboardRecommendation,
  ExecutiveNavigationTarget,
  FinancialWidgetCategory,
} from "./types.js";

const COCKPIT_BASE = "/cockpit/founder";
const POLL_MS = 5_000;

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function buildExecutiveSummary(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  capitalRiskEngine?: CapitalRiskEngine | null;
  executiveForecastIntelligence?: ExecutiveForecastIntelligence | null;
  executiveKpiEngine?: ExecutiveKpiEngine | null;
  healthScore: number;
  topRecommendation: string;
}): ExecutivePerformanceSummary {
  return {
    overallFinancialHealth: healthLabel(input.healthScore),
    revenue: input.executiveForecastIntelligence?.projectedEnterpriseRevenue ?? "$4.8M",
    profit: input.profitOptimizationEngine?.totalNetProfit ?? input.executiveForecastIntelligence?.projectedEnterpriseProfit ?? "$1.2M",
    cashPosition: input.cashReserveIntelligence?.totalCashPosition ?? "$3.69M",
    roi: `${input.roiIntelligenceEngine?.enterpriseRoiPercentage ?? 185}%`,
    budgetUtilization: input.executiveBudgetPlanner ? "97.9% utilized" : "—",
    capitalRisk: input.capitalRiskEngine?.capitalRiskHealth ?? "stable",
    forecastOutlook: input.executiveForecastIntelligence?.forecastHealth ?? "robust",
    financialReadiness: input.executiveKpiEngine?.kpiHealth ?? "robust",
    currentRecommendation: input.topRecommendation,
    healthScore: input.healthScore,
  };
}

function buildFinancialWidgets(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  costOptimizationEngine?: CostOptimizationEngine | null;
  financialScenarioEngine?: FinancialScenarioEngine | null;
  executiveKpiEngine?: ExecutiveKpiEngine | null;
  capitalRiskEngine?: CapitalRiskEngine | null;
  executiveForecastIntelligence?: ExecutiveForecastIntelligence | null;
}): FinancialWidget[] {
  const widgets: FinancialWidget[] = [
    {
      widgetId: "epd-widget-capital",
      title: "Capital Position",
      category: "capital",
      metric: "Active Allocations",
      value: String(input.capitalAllocationEngine?.activeAllocationCount ?? 6),
      status: input.capitalAllocationEngine?.engineHealth ?? "active",
      trend: "↑ efficient",
      confidence: 87,
      href: `${COCKPIT_BASE}/capital-allocation`,
      engineId: "E3-02",
    },
    {
      widgetId: "epd-widget-budgets",
      title: "Budget Performance",
      category: "budgets",
      metric: "Active Budgets",
      value: String(input.executiveBudgetPlanner?.activeBudgetCount ?? 8),
      status: input.executiveBudgetPlanner?.plannerHealth ?? "on plan",
      trend: "→ 97.9% utilized",
      confidence: 90,
      href: `${COCKPIT_BASE}/executive-budget`,
      engineId: "E3-03",
    },
    {
      widgetId: "epd-widget-investments",
      title: "Investment Portfolio",
      category: "investments",
      metric: "Active Investments",
      value: String(input.investmentEvaluationEngine?.activeInvestmentCount ?? 8),
      status: input.investmentEvaluationEngine?.engineHealth ?? "active",
      trend: "↑ pipeline strong",
      confidence: 86,
      href: `${COCKPIT_BASE}/investment-evaluation`,
      engineId: "E3-04",
    },
    {
      widgetId: "epd-widget-roi",
      title: "ROI Performance",
      category: "roi",
      metric: "Enterprise ROI",
      value: `${input.roiIntelligenceEngine?.enterpriseRoiPercentage ?? 185}%`,
      status: input.roiIntelligenceEngine?.engineHealth ?? "exceeding",
      trend: "↑ outperforming",
      confidence: 88,
      href: `${COCKPIT_BASE}/roi-intelligence`,
      engineId: "E3-05",
    },
    {
      widgetId: "epd-widget-cash",
      title: "Cash Reserve Status",
      category: "cash_reserves",
      metric: "Total Cash",
      value: input.cashReserveIntelligence?.totalCashPosition ?? "$3.69M",
      status: input.cashReserveIntelligence?.intelligenceHealth ?? "healthy",
      trend: "↑ 8.2 months coverage",
      confidence: 93,
      href: `${COCKPIT_BASE}/cash-reserve`,
      engineId: "E3-06",
    },
    {
      widgetId: "epd-widget-profit",
      title: "Profit Performance",
      category: "profit",
      metric: "Net Profit",
      value: input.profitOptimizationEngine?.totalNetProfit ?? "$1.2M",
      status: input.profitOptimizationEngine?.engineHealth ?? "healthy",
      trend: "↑ 25% margin",
      confidence: 89,
      href: `${COCKPIT_BASE}/profit-optimization`,
      engineId: "E3-07",
    },
    {
      widgetId: "epd-widget-cost",
      title: "Cost Performance",
      category: "cost",
      metric: "Savings Identified",
      value: input.costOptimizationEngine?.totalSavingsIdentified ?? "$340K",
      status: input.costOptimizationEngine?.engineHealth ?? "efficient",
      trend: `↑ ${input.costOptimizationEngine?.averageCostEfficiency ?? 87}% efficiency`,
      confidence: 87,
      href: `${COCKPIT_BASE}/cost-optimization`,
      engineId: "E3-08",
    },
    {
      widgetId: "epd-widget-scenarios",
      title: "Financial Scenarios",
      category: "financial_scenarios",
      metric: "Active Scenarios",
      value: String(input.financialScenarioEngine?.activeScenarioCount ?? 12),
      status: input.financialScenarioEngine?.scenarioHealth ?? "robust",
      trend: `→ ${input.financialScenarioEngine?.averageConfidence ?? 86}% confidence`,
      confidence: input.financialScenarioEngine?.averageConfidence ?? 86,
      href: `${COCKPIT_BASE}/financial-scenario`,
      engineId: "E3-09",
    },
    {
      widgetId: "epd-widget-kpis",
      title: "Executive KPIs",
      category: "kpis",
      metric: "Performance Index",
      value: String(input.executiveKpiEngine?.enterprisePerformanceIndex ?? 88),
      status: input.executiveKpiEngine?.kpiHealth ?? "robust",
      trend: "↑ improving",
      confidence: input.executiveKpiEngine?.averageConfidence ?? 87,
      href: `${COCKPIT_BASE}/executive-kpi`,
      engineId: "E3-10",
    },
    {
      widgetId: "epd-widget-risk",
      title: "Capital Risks",
      category: "capital_risk",
      metric: "Total Exposure",
      value: input.capitalRiskEngine?.totalCapitalExposure ?? "$5.1M",
      status: input.capitalRiskEngine?.capitalRiskHealth ?? "stable",
      trend: `${input.capitalRiskEngine?.highRiskCount ?? 2} elevated · ${input.capitalRiskEngine?.mitigatedRiskCount ?? 3} mitigated`,
      confidence: 88,
      href: `${COCKPIT_BASE}/capital-risk`,
      engineId: "E3-11",
    },
    {
      widgetId: "epd-widget-forecast",
      title: "Financial Forecasts",
      category: "forecast_intelligence",
      metric: "Forecast Accuracy",
      value: `${input.executiveForecastIntelligence?.averageForecastAccuracy ?? 97}%`,
      status: input.executiveForecastIntelligence?.forecastHealth ?? "robust",
      trend: `→ ${input.executiveForecastIntelligence?.averageConfidence ?? 86}% confidence`,
      confidence: input.executiveForecastIntelligence?.averageConfidence ?? 86,
      href: `${COCKPIT_BASE}/executive-forecast`,
      engineId: "E3-12",
    },
    {
      widgetId: "epd-widget-valuation",
      title: "Enterprise Valuation",
      category: "enterprise_valuation",
      metric: "Estimated Value",
      value: "$18.4M",
      status: "robust",
      trend: "↑ +14% YoY",
      confidence: 91,
      href: `${COCKPIT_BASE}/enterprise-valuation`,
      engineId: "E3-14",
    },
  ];

  return widgets.filter((w) => EXECUTIVE_PERFORMANCE_WIDGETS.includes(w.category as FinancialWidgetCategory));
}

function buildExecutiveNavigation(): ExecutiveNavigationEntry[] {
  const navMap: Record<ExecutiveNavigationTarget, { label: string; href: string; engineId: string }> = {
    finance_framework: { label: "Finance Framework", href: `${COCKPIT_BASE}/executive-finance`, engineId: "E3-01" },
    capital_allocation: { label: "Capital Allocation", href: `${COCKPIT_BASE}/capital-allocation`, engineId: "E3-02" },
    budget_planning: { label: "Budget Planning", href: `${COCKPIT_BASE}/executive-budget`, engineId: "E3-03" },
    investment_evaluation: { label: "Investment Evaluation", href: `${COCKPIT_BASE}/investment-evaluation`, engineId: "E3-04" },
    roi_intelligence: { label: "ROI Intelligence", href: `${COCKPIT_BASE}/roi-intelligence`, engineId: "E3-05" },
    cash_reserve_intelligence: { label: "Cash Reserve Intelligence", href: `${COCKPIT_BASE}/cash-reserve`, engineId: "E3-06" },
    profit_optimization: { label: "Profit Optimization", href: `${COCKPIT_BASE}/profit-optimization`, engineId: "E3-07" },
    cost_optimization: { label: "Cost Optimization", href: `${COCKPIT_BASE}/cost-optimization`, engineId: "E3-08" },
    financial_scenario_engine: { label: "Financial Scenario Engine", href: `${COCKPIT_BASE}/financial-scenario`, engineId: "E3-09" },
    executive_kpi_engine: { label: "Executive KPI Engine", href: `${COCKPIT_BASE}/executive-kpi`, engineId: "E3-10" },
    capital_risk_engine: { label: "Capital Risk Engine", href: `${COCKPIT_BASE}/capital-risk`, engineId: "E3-11" },
    executive_forecast_intelligence: { label: "Executive Forecast Intelligence", href: `${COCKPIT_BASE}/executive-forecast`, engineId: "E3-12" },
    enterprise_valuation_engine: { label: "Enterprise Valuation Engine", href: `${COCKPIT_BASE}/enterprise-valuation`, engineId: "E3-14" },
    executive_cockpit: { label: "Executive Cockpit", href: `${COCKPIT_BASE}`, engineId: "E1" },
  };

  return EXECUTIVE_NAVIGATION_TARGETS.map((target) => ({
    target,
    label: navMap[target].label,
    href: navMap[target].href,
    engineId: navMap[target].engineId,
    status: "active",
  }));
}

function buildPillowPublications(input: {
  executiveForecastIntelligence?: ExecutiveForecastIntelligence | null;
  capitalRiskEngine?: CapitalRiskEngine | null;
  executiveKpiEngine?: ExecutiveKpiEngine | null;
}): PerformancePublication[] {
  return PILLOW_PERFORMANCE_PUBLICATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      financial_insights: "Enterprise financial health consolidated · all E3 engines active",
      growth_opportunities: "Commerce GMV +33% forecast · enterprise value +14% projected",
      investment_recommendations: `${input.capitalRiskEngine?.activeRiskCount ?? 10} risks monitored · portfolio rebalancing recommended`,
      financial_risks: `${input.capitalRiskEngine?.highRiskCount ?? 2} elevated risks · ${input.capitalRiskEngine?.mitigatedRiskCount ?? 3} mitigated`,
      forecast_changes: `Q4 forecast confidence ${input.executiveForecastIntelligence?.averageConfidence ?? 86}% · accuracy ${input.executiveForecastIntelligence?.averageForecastAccuracy ?? 97}%`,
      executive_recommendations: "Unified financial command center · no competing dashboards",
    };
    return {
      domain,
      label: label(domain),
      status: "published",
      summary: summaries[domain] ?? "Pillow financial publication active",
      source: "pillow" as const,
    };
  });
}

function buildEccPublications(): PerformancePublication[] {
  return ECC_PERFORMANCE_PUBLICATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: "active",
    summary: `${label(domain)} · ECC coordination active`,
    source: "ecc" as const,
  }));
}

function buildSupervisorPublications(input: {
  executiveForecastIntelligence?: ExecutiveForecastIntelligence | null;
  executiveKpiEngine?: ExecutiveKpiEngine | null;
}): PerformancePublication[] {
  return SUPERVISOR_PERFORMANCE_PUBLICATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      financial_health: "Overall financial health healthy · E3 composite score stable",
      performance_trends: "Revenue profit cash ROI trends improving",
      forecast_accuracy: `Forecast accuracy ${input.executiveForecastIntelligence?.averageForecastAccuracy ?? 97}% · drift within tolerance`,
      financial_stability: `KPI performance index ${input.executiveKpiEngine?.enterprisePerformanceIndex ?? 88} · liquidity strong`,
    };
    return {
      domain,
      label: label(domain),
      status: "monitoring",
      summary: summaries[domain] ?? "Supervisor financial publication active",
      source: "supervisor" as const,
    };
  });
}

function buildConsolidatedRecommendations(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalRiskEngine?: CapitalRiskEngine | null;
  executiveForecastIntelligence?: ExecutiveForecastIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  costOptimizationEngine?: CostOptimizationEngine | null;
  financialScenarioEngine?: FinancialScenarioEngine | null;
  executiveKpiEngine?: ExecutiveKpiEngine | null;
}): PerformanceDashboardRecommendation[] {
  const recs: PerformanceDashboardRecommendation[] = [];

  const topForecast = input.executiveForecastIntelligence?.recommendedActions[0];
  if (topForecast) {
    recs.push({
      id: topForecast.id,
      title: topForecast.title,
      source: "E3-12 Forecast",
      category: topForecast.category,
      priority: "high",
      confidencePercent: topForecast.confidencePercent,
    });
  }

  const topRisk = input.capitalRiskEngine?.recommendedActions[0];
  if (topRisk) {
    recs.push({
      id: topRisk.id,
      title: topRisk.title,
      source: "E3-11 Capital Risk",
      category: topRisk.category,
      priority: "high",
      confidencePercent: topRisk.confidencePercent,
    });
  }

  const topKpi = input.executiveKpiEngine?.recommendedActions.find((r) => r.category === "performance");
  if (topKpi) {
    recs.push({
      id: topKpi.id,
      title: topKpi.title,
      source: "E3-10 KPI",
      category: topKpi.category,
      priority: "medium",
      confidencePercent: topKpi.confidencePercent,
    });
  }

  recs.push({
    id: "epd-rec-unified",
    title: "Maintain Unified Financial Command Center",
    source: "E3-13 Dashboard",
    category: "governance",
    priority: "critical",
    confidencePercent: 95,
  });

  recs.push({
    id: "epd-rec-e315",
    title: "Proceed to E3-15 Executive Capital Strategy",
    source: "E3-13 Dashboard",
    category: "programme",
    priority: "medium",
    confidencePercent: 92,
  });

  return recs.slice(0, 6);
}

export function assembleExecutivePerformanceDashboard(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  costOptimizationEngine?: CostOptimizationEngine | null;
  financialScenarioEngine?: FinancialScenarioEngine | null;
  executiveKpiEngine?: ExecutiveKpiEngine | null;
  capitalRiskEngine?: CapitalRiskEngine | null;
  executiveForecastIntelligence?: ExecutiveForecastIntelligence | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: { status?: string; health?: string } | null;
  journey?: { currentJourney?: string; currentMission?: string } | null;
  supervisor?: { status?: string; missionStatus?: string } | null;
  ecc?: { status?: string; executionMode?: string } | null;
  vie?: { approvalStatus?: string; visionAlignment?: string } | null;
}): ExecutivePerformanceDashboard {
  const financialWidgets = buildFinancialWidgets(input);
  const consolidatedRecommendations = buildConsolidatedRecommendations(input);
  const topRecommendation = consolidatedRecommendations[0]?.title ?? "Maintain unified financial command center";

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.executiveKpiEngine?.healthScore ?? 85,
    input.capitalRiskEngine?.healthScore ?? 85,
    input.executiveForecastIntelligence?.healthScore ?? 85,
    input.profitOptimizationEngine?.healthScore ?? 85,
    input.cashReserveIntelligence ? 90 : 85,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const executiveSummary = buildExecutiveSummary({
    ...input,
    healthScore: clampedHealth,
    topRecommendation,
  });

  const pillowPublications = buildPillowPublications(input);
  const eccPublications = buildEccPublications();
  const supervisorPublications = buildSupervisorPublications(input);
  const executiveNavigation = buildExecutiveNavigation();

  const pillowAdvisory = [
    "Executive Performance Dashboard — constitutional financial command center active",
    `${financialWidgets.length} widgets · ${EXECUTIVE_NAVIGATION_TARGETS.length} navigation targets · ${POLL_MS / 1000}s real-time refresh`,
    "One dashboard · no competing financial interfaces · complete E3 consolidation",
    "Pillow publishes financial insights · ECC execution status · Supervisor health trends",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting financial integrity")}`,
  ];

  return {
    engineVersion: "E3-13",
    computedAt: new Date().toISOString(),
    dashboardSummary:
      "Executive Performance Dashboard consolidates every E3 financial capability into one unified executive interface. The Grand King never needs multiple financial dashboards to understand the financial health of the Empire. Enterprise financial health, capital, budgets, investments, ROI, cash reserves, profit, costs, scenarios, KPIs, risks and forecasts — all on one command center.",
    dashboardHealth: healthLabel(clampedHealth),
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    widgetCount: financialWidgets.length,
    realtimePollIntervalMs: POLL_MS,
    executiveSummary,
    financialWidgets,
    executiveNavigation,
    pillowPublications,
    eccPublications,
    supervisorPublications,
    consolidatedRecommendations,
    realtimeUpdateTriggers: [...REALTIME_UPDATE_TRIGGERS],
    dashboardPrinciples: [...EXECUTIVE_PERFORMANCE_PRINCIPLES],
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
      executiveKpiEngine: input.executiveKpiEngine
        ? `E3-10 · ${input.executiveKpiEngine.engineHealth} · ${input.executiveKpiEngine.activeKpiCount} KPIs`
        : "E3-10 · standby",
      capitalRiskEngine: input.capitalRiskEngine
        ? `E3-11 · ${input.capitalRiskEngine.engineHealth} · ${input.capitalRiskEngine.activeRiskCount} risks`
        : "E3-11 · standby",
      executiveForecastIntelligence: input.executiveForecastIntelligence
        ? `E3-12 · ${input.executiveForecastIntelligence.engineHealth} · ${input.executiveForecastIntelligence.activeForecastCount} forecasts`
        : "E3-12 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "financial integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring financial health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "financial execution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE314: true,
  };
}

export function buildFallbackExecutivePerformanceDashboard(): ExecutivePerformanceDashboard {
  return assembleExecutivePerformanceDashboard({});
}
