import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CashReserveIntelligence } from "../cash-reserve-intelligence/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  PROFIT_OPTIMIZATION_PIPELINE,
  PROFIT_PRINCIPLES,
  GOVERNED_PROFIT_DOMAINS,
  PROFIT_ANALYSIS_DOMAINS,
  OPTIMIZATION_CAPABILITIES,
  PILLOW_PROFIT_EVALUATIONS,
} from "./paths.js";
import type {
  ProfitOptimizationEngine,
  ProfitOptimizationPipelineStep,
  ProfitOptimizationPipelinePhase,
  ProfitAssessment,
  EnterpriseProfitEntry,
  ProfitTrendEntry,
  OptimizationOpportunityEntry,
  ProfitRiskEntry,
  ProfitAnalysisMetric,
  FinancialPerformanceEntry,
  ProfitOptimizationRecommendation,
  PillowProfitEvaluationMetric,
  GovernedProfitDomain,
  ProfitClassification,
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

function mapDomain(category: ProfitClassification): GovernedProfitDomain {
  const map: Record<ProfitClassification, GovernedProfitDomain> = {
    enterprise_profit: "enterprise_profit",
    business_profit: "business_profit",
    commerce_profit: "commerce_profit",
    operational_profit: "operational_profitability",
    investment_profit: "investment_profitability",
    technology_profit: "department_profit",
    marketing_profit: "marketing_profitability",
    product_profit: "product_profit",
    service_profit: "service_profit",
    future_profit_classes: "future_profit_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: ProfitOptimizationPipelinePhase = "optimization_analysis"): ProfitOptimizationPipelineStep[] {
  const activeIdx = PROFIT_OPTIMIZATION_PIPELINE.indexOf(activePhase);
  return PROFIT_OPTIMIZATION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildAssessments(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): ProfitAssessment[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const budgets = input.executiveBudgetPlanner?.enterpriseBudgets ?? [];
  const investments = input.investmentEvaluationEngine?.enterpriseInvestments ?? [];
  const roiAssessments = input.roiIntelligenceEngine?.roiAssessments ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const allocations = input.capitalAllocationEngine?.currentAllocations ?? [];

  const catalogue: Array<Omit<ProfitAssessment, "domain"> & { category: ProfitClassification }> = [
    {
      profitId: "poe-enterprise",
      title: "Enterprise Profit",
      category: "enterprise_profit",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise growth",
      revenue: "$4.2M",
      directCost: "$2.1M",
      indirectCost: "$900K",
      grossProfit: "$2.1M",
      netProfit: "$1.2M",
      profitMargin: 29,
      expectedGrowth: "+18% YoY",
      optimizationOpportunity: "Margin expansion via cost efficiency",
      confidence: 92,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Enterprise consolidated profit"],
      trend: "rising",
      status: "on_track",
    },
    {
      profitId: "poe-e3-programme",
      title: "E3 Financial Executive Programme",
      category: "investment_profit",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "E3 Financial Executive",
      revenue: "Strategic compounding",
      directCost: "$168K",
      indirectCost: "$42K",
      grossProfit: "Enterprise value",
      netProfit: "Strategic ROI 340%",
      profitMargin: 65,
      expectedGrowth: "+340% strategic return",
      optimizationOpportunity: "Accelerate E3 delivery for compounding value",
      confidence: 91,
      evidence: [budgets[1]?.title ?? "E3 budget", investments[1]?.title ?? "E3 investment"],
      trend: "rising",
      status: "deploying",
    },
    {
      profitId: "poe-commerce",
      title: "Commerce Profit",
      category: "commerce_profit",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      revenue: "$390K",
      directCost: "$198K",
      indirectCost: "$78K",
      grossProfit: "$192K",
      netProfit: "$114K",
      profitMargin: 29,
      expectedGrowth: "+42% YoY",
      optimizationOpportunity: "Reduce support scaling cost — $15K margin gain",
      confidence: 82,
      evidence: [budgets[3]?.title ?? "Commerce budget", roiAssessments[3]?.title ?? "Commerce ROI"],
      trend: "rising",
      status: "active",
    },
    {
      profitId: "poe-msa-expansion",
      title: "MS-A Market Expansion",
      category: "business_profit",
      businessUnit: "Commerce",
      strategicObjective: objectives[1] ?? "Market expansion",
      revenue: "$1.1M",
      directCost: "$420K",
      indirectCost: "$200K",
      grossProfit: "$680K",
      netProfit: "$480K",
      profitMargin: 44,
      expectedGrowth: "+28% YoY",
      optimizationOpportunity: "Pricing optimization — 3% margin uplift",
      confidence: 88,
      evidence: [allocations[0]?.title ?? "Capital deployed", investments[0]?.title ?? "Investment evaluated"],
      trend: "rising",
      status: "monitoring",
    },
    {
      profitId: "poe-engineering",
      title: "Engineering Department Profit",
      category: "technology_profit",
      businessUnit: "Engineering",
      strategicObjective: "Engineering excellence",
      revenue: "Delivery value",
      directCost: "$640K",
      indirectCost: "$140K",
      grossProfit: "Platform capability",
      netProfit: "Efficiency metric",
      profitMargin: 22,
      expectedGrowth: "+12% efficiency",
      optimizationOpportunity: "Reduce infrastructure overspend — $25K savings",
      confidence: 89,
      evidence: [budgets[2]?.title ?? "Engineering budget", "85% utilization"],
      trend: "stable",
      status: "attention",
    },
    {
      profitId: "poe-marketing",
      title: "Marketing Profitability",
      category: "marketing_profit",
      businessUnit: "Commerce",
      strategicObjective: "Customer acquisition",
      revenue: "$190K",
      directCost: "$62K",
      indirectCost: "$42K",
      grossProfit: "$128K",
      netProfit: "$86K",
      profitMargin: 45,
      expectedGrowth: "+55% pipeline",
      optimizationOpportunity: "Channel mix optimization — 5% CAC reduction",
      confidence: 80,
      evidence: [investments[4]?.title ?? "Marketing investment", "Acquisition funnel tracked"],
      trend: "rising",
      status: "active",
    },
    {
      profitId: "poe-platform-ops",
      title: "Operational Profitability",
      category: "operational_profit",
      businessUnit: "Platform",
      strategicObjective: "Production truth",
      revenue: "Efficiency gains",
      directCost: "$405K",
      indirectCost: "$95K",
      grossProfit: "Operational reliability",
      netProfit: "$85K savings",
      profitMargin: 18,
      expectedGrowth: "+8% cost reduction",
      optimizationOpportunity: "Automation stack ROI — $20K annual savings",
      confidence: 90,
      evidence: [budgets[5]?.title ?? "Platform ops budget", investments[5]?.title ?? "Automation investment"],
      trend: "rising",
      status: "on_track",
    },
    {
      profitId: "poe-business-factory",
      title: "Business Factory Profit",
      category: "business_profit",
      businessUnit: "Business Factory",
      strategicObjective: "Portfolio growth",
      revenue: "$550K",
      directCost: "$280K",
      indirectCost: "$30K",
      grossProfit: "$270K",
      netProfit: "$240K",
      profitMargin: 44,
      expectedGrowth: "+22% YoY",
      optimizationOpportunity: "Portfolio rebalancing — high-margin focus",
      confidence: 86,
      evidence: [budgets[8]?.title ?? "Business factory budget", roiAssessments[9]?.title ?? "Portfolio ROI"],
      trend: "stable",
      status: "on_track",
    },
    {
      profitId: "poe-rd-innovation",
      title: "Innovation Profitability",
      category: "investment_profit",
      businessUnit: "R&D",
      strategicObjective: "Long-term advantage",
      revenue: "Future product value",
      directCost: "$90K",
      indirectCost: "$35K",
      grossProfit: "Innovation pipeline",
      netProfit: "Long-term ROI 280%",
      profitMargin: 55,
      expectedGrowth: "+280% long-term",
      optimizationOpportunity: "Focus R&D on highest-ROI innovation paths",
      confidence: 85,
      evidence: [investments[6]?.title ?? "Innovation investment", "P9 knowledge evolution"],
      trend: "rising",
      status: "active",
    },
    {
      profitId: "poe-product-platform",
      title: "Executive Intelligence Platform",
      category: "product_profit",
      businessUnit: "Engineering",
      strategicObjective: "Executive intelligence",
      revenue: "Platform value",
      directCost: "$310K",
      indirectCost: "$110K",
      grossProfit: "Strategic moat",
      netProfit: "Platform ROI 238%",
      profitMargin: 48,
      expectedGrowth: "+245% strategic return",
      optimizationOpportunity: "Consolidate tooling — $18K margin improvement",
      confidence: 90,
      evidence: [investments[9]?.title ?? "Tech investment", "Pillow canonical"],
      trend: "rising",
      status: "deploying",
    },
    {
      profitId: "poe-service-commerce",
      title: "Commerce Service Profit",
      category: "service_profit",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      revenue: "$145K",
      directCost: "$88K",
      indirectCost: "$22K",
      grossProfit: "$57K",
      netProfit: "$35K",
      profitMargin: 24,
      expectedGrowth: "+35% YoY",
      optimizationOpportunity: "Support automation — reduce service cost 12%",
      confidence: 78,
      evidence: [recommendations[0]?.title ?? "Executive recommendation", "Commerce MVP scaling"],
      trend: "rising",
      status: "monitoring",
    },
    {
      profitId: "poe-executive-initiative",
      title: "Executive Decision Intelligence",
      category: "enterprise_profit",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Executive intelligence",
      revenue: "Decision quality value",
      directCost: "$185K",
      indirectCost: "$55K",
      grossProfit: "Risk avoidance",
      netProfit: "312% initiative ROI",
      profitMargin: 58,
      expectedGrowth: "+300% decision quality",
      optimizationOpportunity: "Expand decision intelligence to all programmes",
      confidence: 93,
      evidence: [recommendations[1]?.title ?? "Executive recommendation", roiAssessments[11]?.title ?? "Initiative ROI"],
      trend: "rising",
      status: "strong",
    },
  ];

  return catalogue.map((item) => ({
    ...item,
    domain: mapDomain(item.category),
  }));
}

function buildEnterpriseProfit(assessments: ProfitAssessment[]): EnterpriseProfitEntry[] {
  return assessments.map((a) => ({
    profitId: a.profitId,
    title: a.title,
    category: label(a.category),
    netProfit: a.netProfit,
    profitMargin: a.profitMargin,
    expectedGrowth: a.expectedGrowth,
    trend: a.trend,
    status: a.status,
  }));
}

function buildProfitTrends(netMargin: number, grossMargin: number): ProfitTrendEntry[] {
  return [
    { period: "Q1", enterpriseProfit: "$980K", netMargin: netMargin - 4, grossMargin: grossMargin - 3, trend: "rising" },
    { period: "Q2", enterpriseProfit: "$1.05M", netMargin: netMargin - 2, grossMargin: grossMargin - 1, trend: "rising" },
    { period: "Q3", enterpriseProfit: "$1.12M", netMargin: netMargin - 1, grossMargin: grossMargin, trend: "rising" },
    { period: "Q4", enterpriseProfit: "$1.2M", netMargin, grossMargin, trend: "stable" },
  ];
}

function buildOptimizationOpportunities(): OptimizationOpportunityEntry[] {
  return [
    { opportunityId: "poe-opp-margin", title: "Enterprise Margin Expansion", capability: "margin_improvement", impact: "high", estimatedGain: "+2% net margin", priority: "high", status: "active" },
    { opportunityId: "poe-opp-commerce", title: "Commerce Support Cost Reduction", capability: "cost_reduction", impact: "moderate", estimatedGain: "$15K annual", priority: "high", status: "active" },
    { opportunityId: "poe-opp-pricing", title: "MS-A Pricing Optimization", capability: "pricing_opportunities", impact: "moderate", estimatedGain: "+3% margin", priority: "medium", status: "evaluating" },
    { opportunityId: "poe-opp-revenue", title: "Commerce Revenue Expansion", capability: "revenue_expansion", impact: "high", estimatedGain: "+$85K revenue", priority: "high", status: "active" },
    { opportunityId: "poe-opp-ops", title: "Platform Operational Efficiency", capability: "operational_efficiency", impact: "moderate", estimatedGain: "$20K savings", priority: "medium", status: "active" },
    { opportunityId: "poe-opp-invest", title: "High-ROI Investment Focus", capability: "investment_improvements", impact: "high", estimatedGain: "+15% portfolio ROI", priority: "high", status: "monitoring" },
    { opportunityId: "poe-opp-expand", title: "Business Factory Expansion", capability: "business_expansion", impact: "moderate", estimatedGain: "+$120K profit", priority: "medium", status: "planned" },
    { opportunityId: "poe-opp-risk", title: "Engineering Cost Leakage", capability: "profit_risks", impact: "moderate", estimatedGain: "Prevent $25K loss", priority: "high", status: "attention" },
  ];
}

function buildProfitRisks(assessments: ProfitAssessment[]): ProfitRiskEntry[] {
  return assessments
    .filter((a) => a.status === "attention" || a.profitMargin < 25 || a.confidence < 85)
    .slice(0, 5)
    .map((a) => ({
      riskId: `prisk-${a.profitId}`,
      profitId: a.profitId,
      title: a.title,
      severity: a.profitMargin < 22 ? "moderate" : "low",
      exposure: `${a.profitMargin}% margin · ${a.optimizationOpportunity}`,
      mitigation: "Profit optimization · margin analysis · executive review",
      status: a.status === "attention" ? "active_review" : "monitored",
    }));
}

function buildProfitAnalysis(assessments: ProfitAssessment[], avgMargin: number): ProfitAnalysisMetric[] {
  const risingCount = assessments.filter((a) => a.trend === "rising").length;
  const scores: Record<string, { score: number; summary: string }> = {
    gross_margin: { score: 52, summary: "Gross margin 52% — healthy enterprise level" },
    net_margin: { score: avgMargin, summary: `Net margin ${avgMargin}% — target 30%+` },
    operating_margin: { score: 24, summary: "Operating margin 24% — efficiency improving" },
    revenue_efficiency: { score: 84, summary: "Revenue efficiency tracked per business unit" },
    cost_efficiency: { score: 82, summary: "Cost efficiency linked to E3-03 budget utilization" },
    profit_growth: { score: 86, summary: "+18% YoY enterprise profit growth" },
    business_value: { score: 87, summary: "Business value measured per profit assessment" },
    strategic_value: { score: 88, summary: "Strategic value linked to objectives" },
    long_term_sustainability: { score: 86, summary: "Sustainability principle governs all profit optimization" },
    enterprise_value: { score: Math.min(100, avgMargin + 55), summary: `${risingCount} rising profit trends · enterprise value compounding` },
  };

  return PROFIT_ANALYSIS_DOMAINS.map((domain) => {
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

function buildFinancialPerformance(netMargin: number, grossMargin: number, profitGrowth: number): FinancialPerformanceEntry[] {
  return [
    { metric: "Total Net Profit", value: "$1.2M", trend: "rising", status: "strong" },
    { metric: "Gross Margin", value: `${grossMargin}%`, trend: "stable", status: "healthy" },
    { metric: "Net Margin", value: `${netMargin}%`, trend: "rising", status: "on_track" },
    { metric: "Operating Margin", value: "24%", trend: "rising", status: "adequate" },
    { metric: "Profit Growth", value: `+${profitGrowth}% YoY`, trend: "rising", status: "strong" },
    { metric: "Profit Assessments", value: "12 active", trend: "stable", status: "active" },
  ];
}

function buildPillowEvaluations(input: {
  assessmentCount: number;
  avgMargin: number;
  riskCount: number;
  opportunityCount: number;
}): PillowProfitEvaluationMetric[] {
  return PILLOW_PROFIT_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_PROFIT_EVALUATIONS)[number], { status: string; summary: string }> = {
      profit_health: { status: input.avgMargin >= 25 ? "healthy" : "attention", summary: `${input.assessmentCount} assessments · avg margin ${input.avgMargin}%` },
      margin_performance: { status: input.avgMargin >= 30 ? "strong" : "adequate", summary: "Gross 52% · Net 29% · Operating 24%" },
      growth_opportunities: { status: "active", summary: `${input.opportunityCount} optimization opportunities identified` },
      profit_risks: { status: input.riskCount <= 2 ? "managed" : "attention", summary: `${input.riskCount} profit risks monitored` },
      executive_recommendations: { status: "active", summary: "Profit recommendations via E2-04 · optimization via E3-07" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(): ProfitOptimizationRecommendation[] {
  return [
    {
      id: "poe-rec-discipline",
      title: "Enforce Profit Optimization Discipline",
      category: "governance",
      why: "Revenue alone does not create enterprise value — profit sustains and expands the Empire",
      what: "Govern all profitability through PILLOW-POE-001 constitutional authority",
      how: "Profit pipeline · 5s refresh · no hidden profit leakage",
      confidencePercent: 94,
    },
    {
      id: "poe-rec-commerce",
      title: "Reduce Commerce Support Cost Leakage",
      category: "optimization",
      why: "Commerce support scaling at 29% margin — $15K optimization opportunity identified",
      what: "Automate support workflows and reallocate $15K to margin improvement",
      how: "Cost reduction capability · E3-03 budget review · executive approval",
      confidencePercent: 86,
    },
    {
      id: "poe-rec-engineering",
      title: "Address Engineering Infrastructure Overspend",
      category: "risk",
      why: "Engineering department at 22% margin — infrastructure overspend detected",
      what: "Review infrastructure spend and recover $25K margin leakage",
      how: "Profit risk mitigation · Guardian monitoring · budget variance review",
      confidencePercent: 88,
    },
    {
      id: "poe-rec-e309",
      title: "Proceed to E3-09 Financial Scenario Engine",
      category: "programme",
      why: "E3-08 cost optimization established · financial scenario engine is next E3 capability",
      what: "Implement Financial Scenario Engine building on COE foundation",
      how: "E3 sequence · integrate EFF through E3-07 · cost-scenario linkage",
      confidencePercent: 92,
    },
  ];
}

export function assembleProfitOptimizationEngine(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ProfitOptimizationEngine {
  const profitAssessments = buildAssessments(input);
  const enterpriseProfit = buildEnterpriseProfit(profitAssessments);
  const optimizationOpportunities = buildOptimizationOpportunities();
  const profitRisks = buildProfitRisks(profitAssessments);

  const grossMarginPercentage = 52;
  const netMarginPercentage = Math.round(
    profitAssessments.filter((a) => typeof a.profitMargin === "number" && a.profitMargin > 0 && a.profitMargin < 100)
      .reduce((s, a) => s + a.profitMargin, 0) /
      Math.max(profitAssessments.filter((a) => a.profitMargin > 0 && a.profitMargin < 100).length, 1),
  );
  const operatingMarginPercentage = 24;
  const profitGrowthRate = 18;

  const profitTrends = buildProfitTrends(netMarginPercentage, grossMarginPercentage);
  const profitAnalysis = buildProfitAnalysis(profitAssessments, netMarginPercentage);
  const financialPerformance = buildFinancialPerformance(netMarginPercentage, grossMarginPercentage, profitGrowthRate);

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.roiIntelligenceEngine?.healthScore ?? 85,
    input.cashReserveIntelligence?.healthScore ?? 85,
    netMarginPercentage >= 25 ? 90 : netMarginPercentage >= 20 ? 78 : 68,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    assessmentCount: profitAssessments.length,
    avgMargin: netMarginPercentage,
    riskCount: profitRisks.length,
    opportunityCount: optimizationOpportunities.length,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Profit Optimization Engine — constitutional profitability authority active",
    `${profitAssessments.length} profit assessments · $1.2M net profit · ${netMarginPercentage}% net margin`,
    "No hidden profit leakage · long-term profitability enforced",
    "Integrated with E3-01 Finance · E3-02 Capital · E3-03 Budget · E3-04 Investment · E3-05 ROI · E3-06 Cash",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting profit integrity")}`,
    "ECC coordinates profit improvement · Supervisor monitors margin trends",
    "VIE validates profit alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-07",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Profit Optimization Engine continuously optimizes profitability across every business, programme, department and executive initiative. Every executive decision considers its impact on long-term profitability. The Grand King always understands where profit is created, where profit is lost and how profitability can be improved.",
    engineHealth: healthLabel(clampedHealth),
    profitHealth: netMarginPercentage >= 25 ? "healthy" : netMarginPercentage >= 20 ? "active" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeProfitAssessmentCount: profitAssessments.filter((a) => a.status !== "pending").length,
    totalEnterpriseProfit: "$2.1M gross",
    totalNetProfit: "$1.2M",
    grossMarginPercentage,
    netMarginPercentage,
    operatingMarginPercentage,
    profitGrowthRate,
    enterpriseProfit,
    profitAssessments,
    profitTrends,
    optimizationOpportunities,
    profitRisks,
    profitAnalysis,
    financialPerformance,
    profitOptimizationPipeline: buildPipeline("optimization_analysis"),
    recommendedActions,
    pillowEvaluations,
    profitPrinciples: [...PROFIT_PRINCIPLES],
    governedDomains: [...GOVERNED_PROFIT_DOMAINS],
    optimizationCapabilities: [...OPTIMIZATION_CAPABILITIES],
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
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "profit integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring profit health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "profit improvement coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE308: true,
  };
}

export function buildFallbackProfitOptimizationEngine(): ProfitOptimizationEngine {
  return assembleProfitOptimizationEngine({});
}
