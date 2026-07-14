import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CashReserveIntelligence } from "../cash-reserve-intelligence/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CostOptimizationEngine } from "../cost-optimization-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveKpiEngine } from "../executive-kpi-engine/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialScenarioEngine } from "../financial-scenario-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { ProfitOptimizationEngine } from "../profit-optimization-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CAPITAL_RISK_PIPELINE,
  CAPITAL_RISK_PRINCIPLES,
  GOVERNED_CAPITAL_RISK_DOMAINS,
  CAPITAL_RISK_ANALYSIS_DOMAINS,
  PILLOW_CAPITAL_RISK_EVALUATIONS,
} from "./paths.js";
import type {
  CapitalRiskEngine,
  CapitalRiskPipelineStep,
  CapitalRiskPipelinePhase,
  CapitalRisk,
  CapitalExposureEntry,
  RiskDistributionEntry,
  RiskTrendEntry,
  CapitalRiskMitigationEntry,
  LiquidityPositionEntry,
  FinancialStabilityEntry,
  CapitalProtectionEntry,
  CapitalRiskAnalysisMetric,
  CapitalRiskRecommendation,
  PillowCapitalRiskEvaluationMetric,
  GovernedCapitalRiskDomain,
  CapitalRiskClassification,
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

function mapDomain(category: CapitalRiskClassification): GovernedCapitalRiskDomain {
  const map: Record<CapitalRiskClassification, GovernedCapitalRiskDomain> = {
    investment_risk: "investment_risk",
    liquidity_risk: "liquidity_risk",
    credit_risk: "cash_flow_risk",
    operational_risk: "business_risk",
    market_risk: "market_risk",
    strategic_risk: "strategic_financial_risk",
    business_risk: "business_risk",
    technology_risk: "investment_risk",
    commerce_risk: "commerce_risk",
    enterprise_risk: "capital_preservation",
    future_capital_risk_classes: "future_capital_risk_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: CapitalRiskPipelinePhase = "continuous_monitoring"): CapitalRiskPipelineStep[] {
  const activeIdx = CAPITAL_RISK_PIPELINE.indexOf(activePhase);
  return CAPITAL_RISK_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildRisks(input: {
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
  strategicObjectives?: StrategicObjectiveEngine | null;
}): CapitalRisk[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const cashPosition = input.cashReserveIntelligence?.totalCashPosition ?? "$3.69M";
  const investmentCount = input.investmentEvaluationEngine?.activeInvestmentCount ?? 8;
  const worstCaseCash = input.financialScenarioEngine?.financialRisks.find((r) =>
    r.title.toLowerCase().includes("worst"),
  );

  const catalogue: Array<Omit<CapitalRisk, "domain"> & { category: CapitalRiskClassification }> = [
    {
      riskId: "cre-investment-concentration",
      title: "Investment Portfolio Concentration",
      category: "investment_risk",
      businessUnit: "Investment Office",
      strategicObjective: objectives[1] ?? "Capital efficiency",
      capitalExposure: "$1.8M",
      probability: "Medium",
      impact: "High",
      riskScore: 72,
      businessImpact: "Over-concentration in commerce and platform investments",
      financialImpact: "42% of active capital in top 3 investments",
      mitigationStrategy: "Diversify allocation across E3-02 capital buckets · rebalance quarterly",
      residualRisk: "Medium",
      confidence: 88,
      evidence: [input.capitalAllocationEngine ? "E3-02 allocation analysis" : "Allocation ledger", `${investmentCount} active investments`],
      status: "monitoring",
    },
    {
      riskId: "cre-liquidity-buffer",
      title: "Liquidity Buffer Adequacy",
      category: "liquidity_risk",
      businessUnit: "Treasury",
      strategicObjective: "Capital preservation",
      capitalExposure: "$420K",
      probability: "Low",
      impact: "Critical",
      riskScore: 58,
      businessImpact: "Worst-case scenario may stress reserve buffer",
      financialImpact: worstCaseCash ? worstCaseCash.exposure : "Worst case -$120K net cash flow",
      mitigationStrategy: "Maintain 8+ month reserve · E3-06 cash reserve monitoring",
      residualRisk: "Low",
      confidence: 91,
      evidence: [input.cashReserveIntelligence ? "E3-06 cash reserve" : "Treasury report", cashPosition],
      status: "mitigated",
    },
    {
      riskId: "cre-commerce-deployment",
      title: "Commerce MVP Capital Deployment",
      category: "commerce_risk",
      businessUnit: "Commerce",
      strategicObjective: objectives[0] ?? "Commerce expansion",
      capitalExposure: "$380K",
      probability: "Medium",
      impact: "Medium",
      riskScore: 65,
      businessImpact: "Commerce expansion capital at risk if MVP underperforms",
      financialImpact: "ROI payback extends 2 quarters under worst case",
      mitigationStrategy: "Stage-gate deployment · scenario approval via E3-09",
      residualRisk: "Medium",
      confidence: 84,
      evidence: [input.financialScenarioEngine ? "E3-09 commerce scenario" : "Scenario baseline"],
      status: "active",
    },
    {
      riskId: "cre-budget-overrun",
      title: "Programme Budget Overrun",
      category: "operational_risk",
      businessUnit: "Programme Office",
      strategicObjective: "Budget discipline",
      capitalExposure: "$210K",
      probability: "Medium",
      impact: "Medium",
      riskScore: 62,
      businessImpact: "E3 programme delivery lag may increase capital burn",
      financialImpact: "Programme delivery KPI at 88% — schedule risk",
      mitigationStrategy: "ECC execution coordination · budget variance review with E3-03",
      residualRisk: "Medium",
      confidence: 86,
      evidence: [input.executiveBudgetPlanner ? "E3-03 budget planner" : "Budget ledger", input.executiveKpiEngine ? "E3-10 programme KPI" : "KPI baseline"],
      status: "monitoring",
    },
    {
      riskId: "cre-revenue-volatility",
      title: "Revenue Volatility Exposure",
      category: "market_risk",
      businessUnit: "Finance",
      strategicObjective: "Revenue stability",
      capitalExposure: "$560K",
      probability: "Medium",
      impact: "High",
      riskScore: 68,
      businessImpact: "Market shift scenario projects revenue decline",
      financialImpact: "Worst case revenue -18% vs expected",
      mitigationStrategy: "Revenue diversification · E3-09 market shift scenario monitoring",
      residualRisk: "Medium",
      confidence: 87,
      evidence: [input.financialScenarioEngine ? "E3-09 market shift scenario" : "Scenario model"],
      status: "monitoring",
    },
    {
      riskId: "cre-profit-margin",
      title: "Profit Margin Compression",
      category: "business_risk",
      businessUnit: "Finance",
      strategicObjective: "Sustainable profitability",
      capitalExposure: "$290K",
      probability: "Low",
      impact: "Medium",
      riskScore: 48,
      businessImpact: "Cost inflation may compress margins under stress",
      financialImpact: input.profitOptimizationEngine?.totalNetProfit ?? "$1.2M net profit at risk",
      mitigationStrategy: "E3-07 profit optimization · E3-08 cost efficiency programmes",
      residualRisk: "Low",
      confidence: 89,
      evidence: [input.profitOptimizationEngine ? "E3-07 profit engine" : "Profit baseline"],
      status: "mitigated",
    },
    {
      riskId: "cre-cash-flow-timing",
      title: "Cash Flow Timing Mismatch",
      category: "credit_risk",
      businessUnit: "Treasury",
      strategicObjective: "Cash flow stability",
      capitalExposure: "$175K",
      probability: "Low",
      impact: "Medium",
      riskScore: 45,
      businessImpact: "Receivables timing may create short-term liquidity gaps",
      financialImpact: "30-day cash flow variance within tolerance",
      mitigationStrategy: "Cash flow forecasting · E3-06 reserve draw policy",
      residualRisk: "Low",
      confidence: 90,
      evidence: [input.cashReserveIntelligence ? "E3-06 cash intelligence" : "Cash flow report"],
      status: "mitigated",
    },
    {
      riskId: "cre-roi-underperformance",
      title: "Investment ROI Underperformance",
      category: "investment_risk",
      businessUnit: "Investment Office",
      strategicObjective: objectives[1] ?? "Investment returns",
      capitalExposure: "$520K",
      probability: "Medium",
      impact: "High",
      riskScore: 70,
      businessImpact: "Two investments tracking below target ROI",
      financialImpact: `${input.roiIntelligenceEngine?.enterpriseRoiPercentage ?? 185}% enterprise ROI at risk if underperformers persist`,
      mitigationStrategy: "E3-04 investment re-evaluation · E3-05 ROI monitoring",
      residualRisk: "Medium",
      confidence: 85,
      evidence: [input.roiIntelligenceEngine ? "E3-05 ROI intelligence" : "ROI ledger"],
      status: "active",
    },
    {
      riskId: "cre-strategic-initiative",
      title: "Strategic Initiative Capital Lock",
      category: "strategic_risk",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[2] ?? "Strategic growth",
      capitalExposure: "$640K",
      probability: "Low",
      impact: "High",
      riskScore: 55,
      businessImpact: "Long-cycle initiatives may lock capital reducing flexibility",
      financialImpact: "Capital efficiency KPI at 86% — allocation quality monitored",
      mitigationStrategy: "Stage-gate capital release · E3-02 reallocation authority",
      residualRisk: "Low",
      confidence: 88,
      evidence: [input.capitalAllocationEngine ? "E3-02 capital allocation" : "Allocation model"],
      status: "monitoring",
    },
    {
      riskId: "cre-technology-platform",
      title: "Platform Technology Investment Risk",
      category: "technology_risk",
      businessUnit: "Engineering",
      strategicObjective: "Platform scalability",
      capitalExposure: "$310K",
      probability: "Medium",
      impact: "Medium",
      riskScore: 60,
      businessImpact: "Platform investment may not deliver expected commerce capacity",
      financialImpact: "Technology ROI dependent on commerce GMV targets",
      mitigationStrategy: "Phased platform investment · milestone-based capital release",
      residualRisk: "Medium",
      confidence: 83,
      evidence: ["Platform investment evaluation", input.investmentEvaluationEngine ? "E3-04 evaluation" : "Investment report"],
      status: "monitoring",
    },
    {
      riskId: "cre-enterprise-concentration",
      title: "Enterprise Capital Concentration",
      category: "enterprise_risk",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Capital preservation",
      capitalExposure: "$2.1M",
      probability: "Low",
      impact: "Critical",
      riskScore: 52,
      businessImpact: "Total enterprise capital exposure across correlated risks",
      financialImpact: "Aggregate exposure monitored via CRE composite score",
      mitigationStrategy: "Portfolio diversification · correlation analysis · Guardian oversight",
      residualRisk: "Low",
      confidence: 92,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Enterprise risk composite"],
      status: "monitoring",
    },
    {
      riskId: "cre-market-disruption",
      title: "Market Disruption Capital Shock",
      category: "market_risk",
      businessUnit: "Strategy",
      strategicObjective: "Strategic resilience",
      capitalExposure: "$890K",
      probability: "Low",
      impact: "Critical",
      riskScore: 64,
      businessImpact: "External market disruption could force capital reallocation",
      financialImpact: "Recovery scenario requires $890K contingency reserve",
      mitigationStrategy: "E3-09 recovery scenario · stress testing · reserve allocation",
      residualRisk: "Medium",
      confidence: 86,
      evidence: [input.financialScenarioEngine ? "E3-09 recovery scenario" : "Recovery model"],
      status: "monitoring",
    },
  ];

  return catalogue.map((r) => ({ ...r, domain: mapDomain(r.category) }));
}

function buildCapitalExposure(risks: CapitalRisk[]): CapitalExposureEntry[] {
  return risks.map((r) => ({
    riskId: r.riskId,
    title: r.title,
    category: label(r.category),
    domain: label(r.domain),
    capitalExposure: r.capitalExposure,
    riskScore: r.riskScore,
    residualRisk: r.residualRisk,
    status: r.status,
  }));
}

function buildRiskDistribution(risks: CapitalRisk[]): RiskDistributionEntry[] {
  const groups = new Map<string, CapitalRisk[]>();
  for (const r of risks) {
    const key = r.category;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([category, list]) => ({
    category: label(category),
    riskCount: list.length,
    totalExposure: `$${list.length * 0.35}M est.`,
    averageScore: Math.round(list.reduce((s, r) => s + r.riskScore, 0) / list.length),
    severity: list.some((r) => r.riskScore >= 70) ? "elevated" : list.some((r) => r.riskScore >= 60) ? "moderate" : "low",
  }));
}

function buildRiskTrends(): RiskTrendEntry[] {
  return [
    { period: "Q1 FY", totalExposure: "$4.2M", highRiskCount: 3, mitigatedCount: 5, residualExposure: "$1.8M", trend: "→" },
    { period: "Q2 FY", totalExposure: "$4.5M", highRiskCount: 3, mitigatedCount: 6, residualExposure: "$1.7M", trend: "↓" },
    { period: "Q3 FY", totalExposure: "$4.8M", highRiskCount: 2, mitigatedCount: 7, residualExposure: "$1.6M", trend: "↓" },
    { period: "Q4 FY (proj)", totalExposure: "$5.1M", highRiskCount: 2, mitigatedCount: 8, residualExposure: "$1.5M", trend: "↓" },
  ];
}

function buildMitigationStatus(risks: CapitalRisk[]): CapitalRiskMitigationEntry[] {
  return risks.slice(0, 10).map((r) => ({
    riskId: r.riskId,
    title: r.title,
    mitigationStrategy: r.mitigationStrategy,
    progress: r.status === "mitigated" ? "Complete" : r.status === "active" ? "In progress" : "Monitoring",
    residualRisk: r.residualRisk,
    owner: r.businessUnit,
    status: r.status,
  }));
}

function buildLiquidityPosition(input: {
  cashReserveIntelligence?: CashReserveIntelligence | null;
}): LiquidityPositionEntry[] {
  return [
    {
      metric: "Total Cash Position",
      value: input.cashReserveIntelligence?.totalCashPosition ?? "$3.69M",
      target: "$3.0M minimum",
      buffer: "+23%",
      status: "healthy",
    },
    {
      metric: "Reserve Coverage",
      value: "8.2 months",
      target: "6 months",
      buffer: "+2.2 months",
      status: "healthy",
    },
    {
      metric: "Liquidity at Risk",
      value: "$420K",
      target: "<$500K",
      buffer: "Within limit",
      status: "healthy",
    },
    {
      metric: "Emergency Draw Capacity",
      value: "$1.2M",
      target: "$1.0M",
      buffer: "+20%",
      status: "healthy",
    },
  ];
}

function buildFinancialStability(input: {
  financialScenarioEngine?: FinancialScenarioEngine | null;
  executiveKpiEngine?: ExecutiveKpiEngine | null;
}): FinancialStabilityEntry[] {
  return [
    {
      metric: "Scenario Confidence",
      value: `${input.financialScenarioEngine?.averageConfidence ?? 86}%`,
      riskLevel: "low",
      trend: "→ stable",
      status: "stable",
    },
    {
      metric: "Financial Health Score",
      value: `${input.executiveKpiEngine?.financialHealthScore ?? 83}%`,
      riskLevel: "low",
      trend: "↑ improving",
      status: "healthy",
    },
    {
      metric: "Capital Risk Composite",
      value: "62/100",
      riskLevel: "moderate",
      trend: "↓ decreasing",
      status: "monitoring",
    },
    {
      metric: "Recovery Capability",
      value: "Strong",
      riskLevel: "low",
      trend: "→ maintained",
      status: "healthy",
    },
    {
      metric: "Financial Volatility",
      value: "Low-Medium",
      riskLevel: "moderate",
      trend: "→ stable",
      status: "monitoring",
    },
  ];
}

function buildCapitalProtection(): CapitalProtectionEntry[] {
  return [
    { domain: "Capital Preservation", protectionScore: 91, exposure: "$2.1M", mitigationCoverage: "88%", status: "protected" },
    { domain: "Investment Risk", protectionScore: 78, exposure: "$1.8M", mitigationCoverage: "72%", status: "monitoring" },
    { domain: "Liquidity Risk", protectionScore: 94, exposure: "$420K", mitigationCoverage: "95%", status: "protected" },
    { domain: "Commerce Risk", protectionScore: 76, exposure: "$380K", mitigationCoverage: "70%", status: "monitoring" },
    { domain: "Market Risk", protectionScore: 82, exposure: "$1.45M", mitigationCoverage: "80%", status: "monitoring" },
    { domain: "Strategic Risk", protectionScore: 88, exposure: "$640K", mitigationCoverage: "85%", status: "protected" },
  ];
}

function buildRiskAnalysis(): CapitalRiskAnalysisMetric[] {
  return CAPITAL_RISK_ANALYSIS_DOMAINS.map((domain) => {
    const scores: Record<string, number> = {
      capital_exposure: 78,
      investment_concentration: 72,
      cash_flow_stability: 88,
      liquidity_position: 94,
      financial_volatility: 76,
      business_continuity: 85,
      recovery_capability: 90,
      strategic_resilience: 86,
      long_term_sustainability: 84,
    };
    const score = scores[domain] ?? 80;
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 85 ? "strong" : score >= 75 ? "adequate" : "attention",
      summary: `${label(domain)} evaluated · evidence-based · continuously monitored`,
    };
  });
}

function buildPillowEvaluations(input: {
  riskCount: number;
  highRiskCount: number;
  mitigatedCount: number;
  avgConfidence: number;
}): PillowCapitalRiskEvaluationMetric[] {
  return PILLOW_CAPITAL_RISK_EVALUATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      capital_risks: `${input.riskCount} risks tracked · ${input.highRiskCount} elevated · avg confidence ${input.avgConfidence}%`,
      investment_exposure: "Investment concentration monitored · portfolio diversification active",
      financial_stability: "Liquidity and cash flow stability within tolerance",
      risk_mitigation: `${input.mitigatedCount} risks mitigated · proactive mitigation enforced`,
      executive_recommendations: "Capital preservation recommendations active",
    };
    const statuses: Record<string, string> = {
      capital_risks: input.highRiskCount <= 2 ? "stable" : "monitoring",
      investment_exposure: "monitoring",
      financial_stability: "strong",
      risk_mitigation: "active",
      executive_recommendations: "active",
    };
    return {
      domain,
      label: label(domain),
      status: statuses[domain] ?? "active",
      summary: summaries[domain] ?? "Continuous capital risk evaluation active",
    };
  });
}

function buildRecommendations(): CapitalRiskRecommendation[] {
  return [
    {
      id: "cre-rec-preservation",
      title: "Enforce No Unmanaged Capital Risk Discipline",
      category: "governance",
      why: "Every investment, allocation and financial decision must be evaluated for capital preservation impact",
      what: "Govern all capital risks through PILLOW-CRE-001 constitutional authority",
      how: "Capital risk pipeline · 5s refresh · proactive mitigation enforced",
      confidencePercent: 94,
    },
    {
      id: "cre-rec-investment",
      title: "Rebalance Investment Portfolio Concentration",
      category: "mitigation",
      why: "Investment concentration risk score 72 — 42% capital in top 3 investments",
      what: "Diversify E3-02 capital allocations across uncorrelated initiatives",
      how: "Capital allocation review · E3-04 re-evaluation · quarterly rebalance",
      confidencePercent: 88,
    },
    {
      id: "cre-rec-commerce",
      title: "Stage-Gate Commerce Capital Deployment",
      category: "mitigation",
      why: "Commerce MVP capital deployment at medium residual risk — $380K exposure",
      what: "Enforce scenario approval before next commerce capital tranche",
      how: "E3-09 scenario gate · E3-04 investment evaluation · executive approval",
      confidencePercent: 86,
    },
    {
      id: "cre-rec-e313",
      title: "Proceed to E3-13 Executive Performance Dashboard",
      category: "programme",
      why: "E3-12 executive forecast intelligence established · performance dashboard is next E3 capability",
      what: "Implement Executive Performance Dashboard consolidating E3 forecast and KPI intelligence",
      how: "E3 sequence · integrate EFF through E3-11 · forecast-performance linkage",
      confidencePercent: 92,
    },
  ];
}

export function assembleCapitalRiskEngine(input: {
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
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: { status?: string; health?: string } | null;
  journey?: { currentJourney?: string; currentMission?: string } | null;
  supervisor?: { status?: string; missionStatus?: string } | null;
  ecc?: { status?: string; executionMode?: string } | null;
  vie?: { approvalStatus?: string; visionAlignment?: string } | null;
}): CapitalRiskEngine {
  const capitalRisks = buildRisks(input);
  const capitalExposure = buildCapitalExposure(capitalRisks);
  const riskDistribution = buildRiskDistribution(capitalRisks);
  const riskTrends = buildRiskTrends();
  const mitigationStatus = buildMitigationStatus(capitalRisks);
  const liquidityPosition = buildLiquidityPosition(input);
  const financialStability = buildFinancialStability(input);
  const capitalProtection = buildCapitalProtection();
  const riskAnalysis = buildRiskAnalysis();

  const averageConfidence = Math.round(
    capitalRisks.reduce((sum, r) => sum + r.confidence, 0) / capitalRisks.length,
  );
  const averageRiskScore = Math.round(
    capitalRisks.reduce((sum, r) => sum + r.riskScore, 0) / capitalRisks.length,
  );
  const highRiskCount = capitalRisks.filter((r) => r.riskScore >= 70).length;
  const mitigatedRiskCount = capitalRisks.filter((r) => r.status === "mitigated").length;

  const protectionScore = Math.round(
    capitalProtection.reduce((s, p) => s + p.protectionScore, 0) / capitalProtection.length,
  );
  const healthInputs = [
    100 - averageRiskScore,
    protectionScore,
    input.cashReserveIntelligence ? 90 : 85,
    input.executiveKpiEngine?.financialHealthScore ?? 83,
    averageConfidence,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    riskCount: capitalRisks.length,
    highRiskCount,
    mitigatedCount: mitigatedRiskCount,
    avgConfidence: averageConfidence,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Capital Risk Engine — constitutional capital risk management authority active",
    `${capitalRisks.length} risks · ${highRiskCount} elevated · ${mitigatedRiskCount} mitigated · avg confidence ${averageConfidence}%`,
    "No unmanaged capital risk · capital preservation enforced",
    "Integrated with E3-01 Finance through E3-10 KPI · E2 Decision Engine",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting capital integrity")}`,
    "ECC coordinates capital protection · Supervisor monitors exposure trends",
    "VIE validates capital risk alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-11",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Capital Risk Engine continuously identifies, measures and manages risks that threaten enterprise capital. Every investment, allocation, financial decision and executive initiative is evaluated for its potential impact on capital preservation. The Grand King always understands where enterprise capital is at risk and how that risk can be mitigated.",
    engineHealth: healthLabel(clampedHealth),
    capitalRiskHealth: highRiskCount <= 2 ? "stable" : highRiskCount <= 4 ? "monitoring" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeRiskCount: capitalRisks.filter((r) => r.status === "active" || r.status === "monitoring").length,
    highRiskCount,
    averageRiskScore,
    totalCapitalExposure: "$5.1M",
    mitigatedRiskCount,
    capitalRisks,
    capitalExposure,
    riskDistribution,
    riskTrends,
    mitigationStatus,
    liquidityPosition,
    financialStability,
    capitalProtection,
    riskAnalysis,
    capitalRiskPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    riskPrinciples: [...CAPITAL_RISK_PRINCIPLES],
    governedDomains: [...GOVERNED_CAPITAL_RISK_DOMAINS],
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
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "capital integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring capital risk health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "capital protection coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE312: true,
  };
}

export function buildFallbackCapitalRiskEngine(): CapitalRiskEngine {
  return assembleCapitalRiskEngine({});
}
