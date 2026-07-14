import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CapitalRiskEngine } from "../capital-risk-engine/types.js";
import type { CashReserveIntelligence } from "../cash-reserve-intelligence/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CostOptimizationEngine } from "../cost-optimization-engine/types.js";
import type { EnterpriseValuationEngine } from "../enterprise-valuation-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveForecastIntelligence } from "../executive-forecast-intelligence/types.js";
import type { ExecutiveKpiEngine } from "../executive-kpi-engine/types.js";
import type { ExecutivePerformanceDashboard } from "../executive-performance-dashboard/types.js";
import type { FinancialScenarioEngine } from "../financial-scenario-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { ProfitOptimizationEngine } from "../profit-optimization-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_CAPITAL_STRATEGY_PIPELINE,
  EXECUTIVE_CAPITAL_STRATEGY_PRINCIPLES,
  GOVERNED_CAPITAL_STRATEGY_DOMAINS,
  CAPITAL_STRATEGY_ANALYSIS_DOMAINS,
  INVESTMENT_HORIZONS,
  PRESERVATION_GROWTH_BANDS,
  PILLOW_CAPITAL_STRATEGY_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveCapitalStrategy,
  ExecutiveCapitalStrategyPipelineStep,
  ExecutiveCapitalStrategyPipelinePhase,
  ExecutiveCapitalStrategyEntry,
  ExecutiveCapitalAllocationPriority,
  ExecutiveCapitalInvestmentHorizonEntry,
  ExecutiveCapitalPreservationGrowthEntry,
  ExecutiveCapitalStrategicDeploymentEntry,
  ExecutiveCapitalStrategyAnalysisMetric,
  ExecutiveCapitalStrategyRecommendation,
  PillowCapitalStrategyEvaluationMetric,
  ExecutiveCapitalStrategySummary,
  ExecutiveCapitalPreservationGrowthBand,
  GovernedCapitalStrategyDomain,
  CapitalStrategyClassification,
  ExecutiveCapitalInvestmentHorizon,
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

function mapDomain(category: CapitalStrategyClassification): GovernedCapitalStrategyDomain {
  const map: Record<CapitalStrategyClassification, GovernedCapitalStrategyDomain> = {
    preservation_priority: "preservation_vs_growth",
    balanced_strategy: "long_term_capital_strategy",
    growth_priority: "strategic_deployment",
    strategic_deployment: "strategic_deployment",
    investment_acceleration: "investment_horizons",
    liquidity_buffer: "liquidity_management",
    value_creation: "enterprise_value_creation",
    risk_mitigation: "risk_adjusted_capital",
    enterprise_expansion: "capital_allocation_priorities",
    future_strategy_classes: "future_capital_strategy_categories",
  };
  return map[category];
}

function buildPipeline(
  activePhase: ExecutiveCapitalStrategyPipelinePhase = "continuous_monitoring",
): ExecutiveCapitalStrategyPipelineStep[] {
  const activeIdx = EXECUTIVE_CAPITAL_STRATEGY_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_CAPITAL_STRATEGY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildCapitalStrategies(input: {
  enterpriseValuationEngine?: EnterpriseValuationEngine | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
}): ExecutiveCapitalStrategyEntry[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "Long-term enterprise value",
    ];
  const enterpriseValue = input.enterpriseValuationEngine?.estimatedEnterpriseValue ?? "$42.5M";
  const cashPosition = input.cashReserveIntelligence?.totalCashPosition ?? "$3.69M";
  const allocationCount = input.capitalAllocationEngine?.activeAllocationCount ?? 6;
  const investmentCount = input.investmentEvaluationEngine?.activeInvestmentCount ?? 8;

  const catalogue: Array<Omit<ExecutiveCapitalStrategyEntry, "domain"> & { category: CapitalStrategyClassification }> = [
    {
      strategyId: "ecs-long-term-core",
      title: "Long-Term Enterprise Capital Strategy",
      category: "balanced_strategy",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise value creation",
      horizon: "long_term",
      capitalAllocation: "$12.4M under strategy",
      preservationWeight: 45,
      growthWeight: 55,
      expectedReturn: "185% ROI trajectory",
      riskAdjustment: input.enterpriseValuationEngine?.totalRiskAdjustment ?? "-$2.1M risk-adjusted",
      deploymentPriority: "critical",
      confidence: 90,
      evidence: [input.enterpriseValuationEngine ? "E3-14 enterprise valuation" : "Valuation baseline", enterpriseValue],
      strategyScore: 90,
      status: "active",
    },
    {
      strategyId: "ecs-preservation-buffer",
      title: "Capital Preservation Buffer",
      category: "preservation_priority",
      businessUnit: "Treasury",
      strategicObjective: "Capital preservation · liquidity resilience",
      horizon: "immediate",
      capitalAllocation: cashPosition,
      preservationWeight: 75,
      growthWeight: 25,
      expectedReturn: "8.2 months coverage",
      riskAdjustment: "E3-11 risk-adjusted reserve policy",
      deploymentPriority: "critical",
      confidence: 93,
      evidence: [input.cashReserveIntelligence ? "E3-06 cash reserve" : "Treasury model", "Liquidity buffer enforced"],
      strategyScore: 92,
      status: "active",
    },
    {
      strategyId: "ecs-growth-deployment",
      title: "Strategic Growth Deployment",
      category: "growth_priority",
      businessUnit: "Strategy",
      strategicObjective: objectives[0] ?? "Commerce expansion",
      horizon: "medium_term",
      capitalAllocation: "$4.2M growth capital",
      preservationWeight: 30,
      growthWeight: 70,
      expectedReturn: "+28% value creation",
      riskAdjustment: "Stage-gate deployment · E3-09 scenario approval",
      deploymentPriority: "high",
      confidence: 86,
      evidence: ["E3-02 capital allocation", `${allocationCount} active allocations`],
      strategyScore: 87,
      status: "active",
    },
    {
      strategyId: "ecs-investment-horizon",
      title: "Investment Horizon Strategy",
      category: "investment_acceleration",
      businessUnit: "Finance",
      strategicObjective: "Portfolio value maximization",
      horizon: "medium_term",
      capitalAllocation: "$3.8M investment capital",
      preservationWeight: 35,
      growthWeight: 65,
      expectedReturn: "210% portfolio ROI",
      riskAdjustment: "E3-04 investment evaluation gate",
      deploymentPriority: "high",
      confidence: 88,
      evidence: [input.investmentEvaluationEngine ? "E3-04 evaluation" : "Investment baseline", `${investmentCount} investments`],
      strategyScore: 88,
      status: "active",
    },
    {
      strategyId: "ecs-commerce-expansion",
      title: "Commerce Strategic Deployment",
      category: "strategic_deployment",
      businessUnit: "Commerce",
      strategicObjective: "Commerce platform scaling",
      horizon: "short_term",
      capitalAllocation: "$1.8M deployment capital",
      preservationWeight: 25,
      growthWeight: 75,
      expectedReturn: "+33% GMV trajectory",
      riskAdjustment: "Commerce deployment risk managed via E3-11",
      deploymentPriority: "high",
      confidence: 84,
      evidence: ["Commerce MVP metrics", input.enterpriseValuationEngine ? "E3-14 commerce valuation" : "Valuation model"],
      strategyScore: 85,
      status: "active",
    },
    {
      strategyId: "ecs-liquidity-management",
      title: "Liquidity Management Strategy",
      category: "liquidity_buffer",
      businessUnit: "Treasury",
      strategicObjective: "Cash flow stability",
      horizon: "immediate",
      capitalAllocation: "$2.1M operational liquidity",
      preservationWeight: 80,
      growthWeight: 20,
      expectedReturn: "Stable cash generation",
      riskAdjustment: "E3-06 reserve draw policy",
      deploymentPriority: "critical",
      confidence: 91,
      evidence: ["Cash flow forecast", cashPosition],
      strategyScore: 91,
      status: "active",
    },
    {
      strategyId: "ecs-value-creation",
      title: "Enterprise Value Creation Strategy",
      category: "value_creation",
      businessUnit: "Executive",
      strategicObjective: "Enterprise value anchor alignment",
      horizon: "long_term",
      capitalAllocation: "$6.8M value creation capital",
      preservationWeight: 40,
      growthWeight: 60,
      expectedReturn: "+14% enterprise value growth",
      riskAdjustment: input.enterpriseValuationEngine?.totalRiskAdjustment ?? "Risk-adjusted deployment",
      deploymentPriority: "critical",
      confidence: 89,
      evidence: [input.enterpriseValuationEngine ? `E3-14 · ${enterpriseValue}` : "Valuation anchor", "Strategic objectives"],
      strategyScore: 89,
      status: "active",
    },
    {
      strategyId: "ecs-risk-adjusted",
      title: "Risk-Adjusted Capital Strategy",
      category: "risk_mitigation",
      businessUnit: "Finance",
      strategicObjective: "Capital preservation under risk",
      horizon: "short_term",
      capitalAllocation: "$1.4M risk buffer",
      preservationWeight: 65,
      growthWeight: 35,
      expectedReturn: "Risk-adjusted 165% ROI",
      riskAdjustment: "E3-11 capital risk mitigation integrated",
      deploymentPriority: "medium",
      confidence: 87,
      evidence: ["Capital risk engine", "Mitigation programmes active"],
      strategyScore: 86,
      status: "monitoring",
    },
    {
      strategyId: "ecs-enterprise-expansion",
      title: "Enterprise Expansion Capital Plan",
      category: "enterprise_expansion",
      businessUnit: "Operations",
      strategicObjective: "Operational scale investment",
      horizon: "generational",
      capitalAllocation: "$8.6M expansion reserve",
      preservationWeight: 50,
      growthWeight: 50,
      expectedReturn: "+60% 3-year trajectory",
      riskAdjustment: "Long-term scenario stress tested via E3-09",
      deploymentPriority: "medium",
      confidence: 82,
      evidence: ["Long-term growth planner", input.enterpriseValuationEngine?.growthTrend ?? "+14% growth trend"],
      strategyScore: 83,
      status: "active",
    },
    {
      strategyId: "ecs-platform-investment",
      title: "Platform Technology Investment Strategy",
      category: "strategic_deployment",
      businessUnit: "Platform",
      strategicObjective: "Platform differentiation investment",
      horizon: "long_term",
      capitalAllocation: "$2.6M platform capital",
      preservationWeight: 35,
      growthWeight: 65,
      expectedReturn: "+22% capability ROI",
      riskAdjustment: "Technical debt risk factored",
      deploymentPriority: "high",
      confidence: 85,
      evidence: ["Repository evolution", "Pillow architecture investment"],
      strategyScore: 86,
      status: "active",
    },
  ];

  return catalogue.map((s) => ({ ...s, domain: mapDomain(s.category) }));
}

function buildAllocationPriorities(input: {
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
}): ExecutiveCapitalAllocationPriority[] {
  const allocationCount = input.capitalAllocationEngine?.activeAllocationCount ?? 6;
  return [
    {
      priorityId: "cap-priority-1",
      title: "Liquidity & Cash Reserve",
      category: "preservation",
      domain: "liquidity_management",
      capitalAmount: "$3.69M",
      allocationPercent: 30,
      priorityRank: 1,
      horizon: "immediate",
      rationale: "Capital preservation · 8.2 months coverage · E3-06 enforced",
      status: "active",
    },
    {
      priorityId: "cap-priority-2",
      title: "Commerce Platform Scaling",
      category: "growth",
      domain: "strategic_deployment",
      capitalAmount: "$1.8M",
      allocationPercent: 15,
      priorityRank: 2,
      horizon: "short_term",
      rationale: "Highest ROI growth trajectory · E3-02 allocation approved",
      status: "active",
    },
    {
      priorityId: "cap-priority-3",
      title: "Investment Portfolio",
      category: "investment",
      domain: "investment_horizons",
      capitalAmount: "$3.8M",
      allocationPercent: 31,
      priorityRank: 3,
      horizon: "medium_term",
      rationale: `${input.investmentEvaluationEngine?.activeInvestmentCount ?? 8} investments · E3-04 evaluated`,
      status: "active",
    },
    {
      priorityId: "cap-priority-4",
      title: "Platform & Technology",
      category: "strategic",
      domain: "enterprise_value_creation",
      capitalAmount: "$2.6M",
      allocationPercent: 21,
      priorityRank: 4,
      horizon: "long_term",
      rationale: "Platform differentiation · long-term value creation",
      status: "active",
    },
    {
      priorityId: "cap-priority-5",
      title: "Risk Buffer & Contingency",
      category: "preservation",
      domain: "risk_adjusted_capital",
      capitalAmount: "$1.4M",
      allocationPercent: 11,
      priorityRank: 5,
      horizon: "immediate",
      rationale: `${allocationCount} allocations monitored · E3-11 risk buffer`,
      status: "active",
    },
  ];
}

function buildInvestmentHorizons(): ExecutiveCapitalInvestmentHorizonEntry[] {
  return INVESTMENT_HORIZONS.map((horizon, i) => {
    const data: Record<
      ExecutiveCapitalInvestmentHorizon,
      { capital: string; count: number; ret: string; risk: string }
    > = {
      immediate: { capital: "$5.09M", count: 3, ret: "Liquidity yield", risk: "low" },
      short_term: { capital: "$1.8M", count: 2, ret: "+33% GMV ROI", risk: "medium" },
      medium_term: { capital: "$3.8M", count: 4, ret: "210% portfolio ROI", risk: "medium" },
      long_term: { capital: "$6.8M", count: 3, ret: "+14% value growth", risk: "managed" },
      generational: { capital: "$8.6M", count: 1, ret: "+60% 3Y trajectory", risk: "strategic" },
    };
    const entry = data[horizon];
    return {
      horizon,
      label: label(horizon),
      capitalAllocated: entry.capital,
      investmentCount: entry.count,
      expectedReturn: entry.ret,
      riskLevel: entry.risk,
      status: i <= 3 ? "active" : "planning",
    };
  });
}

function buildPreservationGrowthProfiles(): ExecutiveCapitalPreservationGrowthEntry[] {
  return PRESERVATION_GROWTH_BANDS.map((band) => {
    const profiles: Record<
      ExecutiveCapitalPreservationGrowthBand,
      { p: number; g: number; preserved: string; deployed: string; rationale: string }
    > = {
      preservation_dominant: { p: 80, g: 20, preserved: "$9.9M", deployed: "$2.5M", rationale: "Crisis resilience · maximum capital protection" },
      preservation_leaning: { p: 65, g: 35, preserved: "$8.0M", deployed: "$4.3M", rationale: "Risk-adjusted preservation with selective growth" },
      balanced: { p: 50, g: 50, preserved: "$6.2M", deployed: "$6.2M", rationale: "Constitutional balanced capital strategy · current posture" },
      growth_leaning: { p: 35, g: 65, preserved: "$4.3M", deployed: "$8.0M", rationale: "Growth acceleration with maintained liquidity buffer" },
      growth_dominant: { p: 20, g: 80, preserved: "$2.5M", deployed: "$9.9M", rationale: "Maximum growth deployment · high conviction expansion" },
    };
    const profile = profiles[band];
    return {
      band,
      label: label(band),
      preservationPercent: profile.p,
      growthPercent: profile.g,
      capitalPreserved: profile.preserved,
      capitalDeployed: profile.deployed,
      rationale: profile.rationale,
      status: band === "balanced" ? "active" : "available",
    };
  });
}

function buildStrategicDeployments(input: {
  enterpriseValuationEngine?: EnterpriseValuationEngine | null;
}): ExecutiveCapitalStrategicDeploymentEntry[] {
  const enterpriseValue = input.enterpriseValuationEngine?.estimatedEnterpriseValue ?? "$42.5M";
  return [
    {
      deploymentId: "deploy-commerce-mvp",
      title: "Commerce MVP Scale Deployment",
      category: "commerce",
      capitalRequired: "$1.8M",
      deploymentPhase: "Phase 2 scaling",
      expectedValue: "+$12.8M commerce valuation",
      roiProjection: "210%",
      riskLevel: "medium",
      priority: "critical",
      status: "active",
    },
    {
      deploymentId: "deploy-platform-evolution",
      title: "Platform Evolution Investment",
      category: "technology",
      capitalRequired: "$2.6M",
      deploymentPhase: "Continuous evolution",
      expectedValue: "+$9.6M technology valuation",
      roiProjection: "185%",
      riskLevel: "managed",
      priority: "high",
      status: "active",
    },
    {
      deploymentId: "deploy-investment-acceleration",
      title: "Investment Portfolio Acceleration",
      category: "investment",
      capitalRequired: "$1.4M",
      deploymentPhase: "Q4 deployment wave",
      expectedValue: "+$7.4M portfolio value",
      roiProjection: "192%",
      riskLevel: "medium",
      priority: "high",
      status: "planning",
    },
    {
      deploymentId: "deploy-value-anchor",
      title: "Enterprise Value Anchor Reinforcement",
      category: "strategic",
      capitalRequired: "$2.2M",
      deploymentPhase: "Value creation programme",
      expectedValue: enterpriseValue,
      roiProjection: "+14% enterprise value",
      riskLevel: "low",
      priority: "critical",
      status: "active",
    },
  ];
}

function buildRecommendations(): ExecutiveCapitalStrategyRecommendation[] {
  return [
    {
      id: "ecs-rec-balanced",
      title: "Maintain Balanced Preservation-Growth Posture",
      category: "strategy",
      why: "Enterprise valuation supports balanced capital deployment with preserved liquidity",
      what: "50/50 preservation-growth balance · 8.2 months cash coverage maintained",
      how: "E3-06 reserve policy · E3-14 valuation anchor · quarterly strategy review",
      confidencePercent: 92,
    },
    {
      id: "ecs-rec-commerce",
      title: "Prioritize Commerce Strategic Deployment",
      category: "deployment",
      why: "Commerce scaling delivers highest near-term ROI and enterprise value contribution",
      what: "Deploy $1.8M commerce capital with stage-gate approval",
      how: "E3-02 allocation · E3-04 evaluation · E3-09 scenario gate",
      confidencePercent: 88,
    },
    {
      id: "ecs-rec-e316",
      title: "Proceed to E3-16 Financial Governance Framework",
      category: "programme",
      why: "Executive capital strategy established · financial governance is next E3 capability",
      what: "Activate constitutional financial governance using capital strategy foundation",
      how: "E3 sequence · integrate EFF through E3-15 · strategy-governance linkage",
      confidencePercent: 91,
    },
  ];
}

function buildStrategySummary(input: {
  enterpriseValuationEngine?: EnterpriseValuationEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  allocationPriorities: ExecutiveCapitalAllocationPriority[];
  healthScore: number;
  topRecommendation: string;
}): ExecutiveCapitalStrategySummary {
  return {
    longTermStrategy: "Balanced preservation-growth capital strategy anchored to enterprise valuation",
    preservationGrowthBalance: "balanced",
    totalCapitalUnderStrategy: "$12.4M",
    enterpriseValueAnchor: input.enterpriseValuationEngine?.estimatedEnterpriseValue ?? "$42.5M",
    liquidityCoverage: input.cashReserveIntelligence ? "8.2 months" : "—",
    strategicDeploymentReadiness: "ready",
    topPriority: input.allocationPriorities[0]?.title ?? "Liquidity & Cash Reserve",
    healthScore: input.healthScore,
  };
}

export function assembleExecutiveCapitalStrategy(input: {
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
  executivePerformanceDashboard?: ExecutivePerformanceDashboard | null;
  enterpriseValuationEngine?: EnterpriseValuationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: { status?: string; health?: string } | null;
  journey?: { currentJourney?: string; currentMission?: string } | null;
  supervisor?: { status?: string; missionStatus?: string } | null;
  ecc?: { status?: string; executionMode?: string } | null;
  vie?: { approvalStatus?: string; visionAlignment?: string } | null;
}): ExecutiveCapitalStrategy {
  const capitalStrategies = buildCapitalStrategies(input);
  const allocationPriorities = buildAllocationPriorities(input);
  const investmentHorizons = buildInvestmentHorizons();
  const preservationGrowthProfiles = buildPreservationGrowthProfiles();
  const strategicDeployments = buildStrategicDeployments(input);
  const recommendedActions = buildRecommendations();
  const topRecommendation = recommendedActions[0]?.title ?? "Maintain balanced capital strategy";

  const averageConfidence = Math.round(
    capitalStrategies.reduce((s, c) => s + c.confidence, 0) / capitalStrategies.length,
  );

  const healthInputs = [
    averageConfidence,
    input.enterpriseValuationEngine?.healthScore ?? 85,
    input.cashReserveIntelligence ? 90 : 85,
    input.capitalRiskEngine?.healthScore ?? 85,
    input.executiveKpiEngine?.healthScore ?? 85,
  ];
  const healthScore = Math.min(100, Math.max(0, Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length)));

  const strategySummary = buildStrategySummary({
    ...input,
    allocationPriorities,
    healthScore,
    topRecommendation,
  });

  const strategyAnalysis: ExecutiveCapitalStrategyAnalysisMetric[] = CAPITAL_STRATEGY_ANALYSIS_DOMAINS.map(
    (domain) => ({
      domain,
      label: label(domain),
      score: 80 + CAPITAL_STRATEGY_ANALYSIS_DOMAINS.indexOf(domain),
      status: "active",
      summary: `${label(domain)} · capital strategy analysis active`,
    }),
  );

  const pillowEvaluations: PillowCapitalStrategyEvaluationMetric[] = PILLOW_CAPITAL_STRATEGY_EVALUATIONS.map(
    (domain) => ({
      domain,
      label: label(domain),
      status: "evaluated",
      summary: `${label(domain)} · Pillow capital strategy evaluation complete`,
    }),
  );

  const pillowAdvisory = [
    "Executive Capital Strategy — constitutional long-term capital authority active",
    `${capitalStrategies.length} strategies · ${allocationPriorities.length} allocation priorities · avg confidence ${averageConfidence}%`,
    "Preservation-growth balance enforced · no unmanaged capital strategy",
    "Integrated with E3-01 Finance through E3-14 Enterprise Valuation",
    `Enterprise value anchor: ${input.enterpriseValuationEngine?.estimatedEnterpriseValue ?? "$42.5M"}`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting capital strategy integrity")}`,
  ];

  return {
    engineVersion: "E3-15",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Capital Strategy governs long-term capital strategy across EmpireAI — capital allocation priorities, investment horizons, preservation vs growth balance and strategic deployment. Anchored to enterprise valuation, the Grand King always understands how capital will be preserved, deployed and grown over the long term.",
    engineHealth: healthLabel(healthScore),
    strategyHealth: "robust",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activeStrategyCount: capitalStrategies.length,
    averageConfidence,
    preservationGrowthBand: "balanced",
    totalCapitalUnderStrategy: "$12.4M",
    enterpriseValueAnchor: input.enterpriseValuationEngine?.estimatedEnterpriseValue ?? "$42.5M",
    strategySummary,
    capitalStrategies,
    allocationPriorities,
    investmentHorizons,
    preservationGrowthProfiles,
    strategicDeployments,
    strategyAnalysis,
    capitalStrategyPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    strategyPrinciples: [...EXECUTIVE_CAPITAL_STRATEGY_PRINCIPLES],
    governedDomains: [...GOVERNED_CAPITAL_STRATEGY_DOMAINS],
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
      executivePerformanceDashboard: input.executivePerformanceDashboard
        ? `E3-13 · ${input.executivePerformanceDashboard.dashboardHealth} · ${input.executivePerformanceDashboard.widgetCount} widgets`
        : "E3-13 · standby",
      enterpriseValuationEngine: input.enterpriseValuationEngine
        ? `E3-14 · ${input.enterpriseValuationEngine.valuationHealth} · ${input.enterpriseValuationEngine.estimatedEnterpriseValue} enterprise value`
        : "E3-14 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "capital strategy integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring capital strategy"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "capital strategy coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE316: true,
  };
}

export function buildFallbackExecutiveCapitalStrategy(): ExecutiveCapitalStrategy {
  return assembleExecutiveCapitalStrategy({});
}
