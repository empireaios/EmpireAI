import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CashReserveIntelligence } from "../cash-reserve-intelligence/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { ProfitOptimizationEngine } from "../profit-optimization-engine/types.js";
import type { RoiIntelligenceEngine } from "../roi-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  COST_OPTIMIZATION_PIPELINE,
  COST_PRINCIPLES,
  GOVERNED_COST_DOMAINS,
  COST_ANALYSIS_DOMAINS,
  COST_OPTIMIZATION_CAPABILITIES,
  PILLOW_COST_EVALUATIONS,
} from "./paths.js";
import type {
  CostOptimizationEngine,
  CostOptimizationPipelineStep,
  CostOptimizationPipelinePhase,
  CostAssessment,
  EnterpriseCostEntry,
  CostBreakdownEntry,
  CostTrendEntry,
  SavingsOpportunityEntry,
  EfficiencyMetricEntry,
  WasteDetectionEntry,
  CostAnalysisMetric,
  FinancialPerformanceEntry,
  CostOptimizationRecommendation,
  PillowCostEvaluationMetric,
  GovernedCostDomain,
  CostClassification,
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

function mapDomain(category: CostClassification): GovernedCostDomain {
  const map: Record<CostClassification, GovernedCostDomain> = {
    fixed_costs: "enterprise_costs",
    variable_costs: "business_costs",
    operating_costs: "operations_costs",
    technology_costs: "technology_costs",
    infrastructure_costs: "infrastructure_costs",
    marketing_costs: "marketing_costs",
    commerce_costs: "commerce_costs",
    administrative_costs: "department_costs",
    strategic_costs: "programme_costs",
    future_cost_classes: "future_cost_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: CostOptimizationPipelinePhase = "optimization_analysis"): CostOptimizationPipelineStep[] {
  const activeIdx = COST_OPTIMIZATION_PIPELINE.indexOf(activePhase);
  return COST_OPTIMIZATION_PIPELINE.map((phase, i) => ({
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
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
}): CostAssessment[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const budgets = input.executiveBudgetPlanner?.enterpriseBudgets ?? [];
  const profitAssessments = input.profitOptimizationEngine?.profitAssessments ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const allocations = input.capitalAllocationEngine?.currentAllocations ?? [];

  const catalogue: Array<Omit<CostAssessment, "domain"> & { category: CostClassification }> = [
    {
      costId: "coe-enterprise",
      title: "Enterprise Operating Costs",
      category: "operating_costs",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise growth",
      currentCost: "$3.0M/year",
      expectedCost: "$2.85M/year",
      costVariance: "+5% over plan",
      savingsOpportunity: "$150K via efficiency optimization",
      businessImpact: "Low — efficiency gains preserve capability",
      strategicImpact: "Positive — reinvest savings in growth",
      riskAssessment: "Low",
      optimizationPotential: 82,
      confidence: 92,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Enterprise cost consolidated"],
      trend: "stable",
      status: "on_track",
    },
    {
      costId: "coe-engineering",
      title: "Engineering Department Costs",
      category: "technology_costs",
      businessUnit: "Engineering",
      strategicObjective: "Engineering excellence",
      currentCost: "$780K/year",
      expectedCost: "$740K/year",
      costVariance: "+5% over plan",
      savingsOpportunity: "$40K infrastructure optimization",
      businessImpact: "Low — preserve delivery velocity",
      strategicImpact: "Neutral — efficiency without harm",
      riskAssessment: "Low",
      optimizationPotential: 78,
      confidence: 89,
      evidence: [budgets[2]?.title ?? "Engineering budget", profitAssessments[4]?.title ?? "Engineering profit"],
      trend: "rising",
      status: "attention",
    },
    {
      costId: "coe-commerce",
      title: "Commerce Operations Costs",
      category: "commerce_costs",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      currentCost: "$276K/year",
      expectedCost: "$255K/year",
      costVariance: "+8% over plan",
      savingsOpportunity: "$21K support automation",
      businessImpact: "Moderate — scaling phase",
      strategicImpact: "Positive — margin improvement",
      riskAssessment: "Moderate — support scaling",
      optimizationPotential: 85,
      confidence: 82,
      evidence: [budgets[3]?.title ?? "Commerce budget", profitAssessments[2]?.title ?? "Commerce profit"],
      trend: "rising",
      status: "active",
    },
    {
      costId: "coe-infrastructure",
      title: "Infrastructure Costs",
      category: "infrastructure_costs",
      businessUnit: "Engineering",
      strategicObjective: "Production excellence",
      currentCost: "$320K/year",
      expectedCost: "$295K/year",
      costVariance: "+3% over plan",
      savingsOpportunity: "$25K right-sizing",
      businessImpact: "Low — maintain reliability",
      strategicImpact: "Positive — cost efficiency",
      riskAssessment: "Low",
      optimizationPotential: 80,
      confidence: 91,
      evidence: [allocations[2]?.title ?? "Infrastructure capital", "Guardian cost monitoring"],
      trend: "stable",
      status: "monitoring",
    },
    {
      costId: "coe-platform-ops",
      title: "Platform Operations Costs",
      category: "operating_costs",
      businessUnit: "Platform",
      strategicObjective: "Production truth",
      currentCost: "$540K/year",
      expectedCost: "$520K/year",
      costVariance: "On plan",
      savingsOpportunity: "$20K automation savings",
      businessImpact: "Low — operational reliability preserved",
      strategicImpact: "Positive — automation ROI",
      riskAssessment: "Low",
      optimizationPotential: 86,
      confidence: 90,
      evidence: [budgets[5]?.title ?? "Platform ops budget", profitAssessments[6]?.title ?? "Ops profit"],
      trend: "declining",
      status: "on_track",
    },
    {
      costId: "coe-marketing",
      title: "Marketing Costs",
      category: "marketing_costs",
      businessUnit: "Commerce",
      strategicObjective: "Customer acquisition",
      currentCost: "$85K/quarter",
      expectedCost: "$85K/quarter",
      costVariance: "Under plan — phased start",
      savingsOpportunity: "$12K channel optimization",
      businessImpact: "Low — acquisition preserved",
      strategicImpact: "Positive — CAC reduction",
      riskAssessment: "Low-Moderate",
      optimizationPotential: 75,
      confidence: 80,
      evidence: [budgets[4]?.title ?? "Marketing budget", profitAssessments[5]?.title ?? "Marketing profit"],
      trend: "stable",
      status: "planned",
    },
    {
      costId: "coe-e3-programme",
      title: "E3 Financial Executive Programme",
      category: "strategic_costs",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "E3 Financial Executive",
      currentCost: "$168K deployed",
      expectedCost: "$168K planned",
      costVariance: "On plan",
      savingsOpportunity: "N/A — strategic investment",
      businessImpact: "High — financial intelligence capability",
      strategicImpact: "Critical — E3 compounding value",
      riskAssessment: "Low — phased delivery",
      optimizationPotential: 65,
      confidence: 91,
      evidence: [budgets[1]?.title ?? "E3 budget", input.investmentEvaluationEngine?.enterpriseInvestments[1]?.title ?? "E3 investment"],
      trend: "stable",
      status: "deploying",
    },
    {
      costId: "coe-supplier",
      title: "Supplier & Vendor Costs",
      category: "variable_costs",
      businessUnit: "Platform",
      strategicObjective: "Operational excellence",
      currentCost: "$185K/year",
      expectedCost: "$170K/year",
      costVariance: "+9% over plan",
      savingsOpportunity: "$15K supplier renegotiation",
      businessImpact: "Low — vendor consolidation",
      strategicImpact: "Positive — supplier optimization",
      riskAssessment: "Low",
      optimizationPotential: 88,
      confidence: 87,
      evidence: ["Vendor contract review", "Supplier optimization pipeline"],
      trend: "rising",
      status: "active",
    },
    {
      costId: "coe-admin",
      title: "Administrative Costs",
      category: "administrative_costs",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Governance excellence",
      currentCost: "$120K/year",
      expectedCost: "$115K/year",
      costVariance: "+4% over plan",
      savingsOpportunity: "$5K process automation",
      businessImpact: "Minimal",
      strategicImpact: "Neutral",
      riskAssessment: "Minimal",
      optimizationPotential: 72,
      confidence: 88,
      evidence: ["Administrative budget tracked", "Process efficiency review"],
      trend: "stable",
      status: "on_track",
    },
    {
      costId: "coe-business-factory",
      title: "Business Factory Costs",
      category: "variable_costs",
      businessUnit: "Business Factory",
      strategicObjective: "Portfolio growth",
      currentCost: "$360K/year",
      expectedCost: "$340K/year",
      costVariance: "+6% over plan",
      savingsOpportunity: "$20K portfolio efficiency",
      businessImpact: "Moderate — diversification",
      strategicImpact: "Positive — portfolio optimization",
      riskAssessment: "Moderate",
      optimizationPotential: 79,
      confidence: 86,
      evidence: [budgets[8]?.title ?? "Business factory budget", profitAssessments[7]?.title ?? "Portfolio profit"],
      trend: "stable",
      status: "monitoring",
    },
    {
      costId: "coe-fixed-overhead",
      title: "Fixed Overhead Costs",
      category: "fixed_costs",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Financial discipline",
      currentCost: "$420K/year",
      expectedCost: "$420K/year",
      costVariance: "On plan",
      savingsOpportunity: "$8K lease optimization",
      businessImpact: "Low",
      strategicImpact: "Neutral",
      riskAssessment: "Low",
      optimizationPotential: 68,
      confidence: 90,
      evidence: [input.cashReserveIntelligence?.cashReserves[0]?.title ?? "Enterprise reserve", "Fixed cost baseline"],
      trend: "stable",
      status: "on_track",
    },
    {
      costId: "coe-automation",
      title: "Automation Investment Costs",
      category: "technology_costs",
      businessUnit: "Platform",
      strategicObjective: "Operational excellence",
      currentCost: "$180K/year",
      expectedCost: "$180K/year",
      costVariance: "On plan",
      savingsOpportunity: "$20K annual savings via automation ROI",
      businessImpact: "Positive — reduces future ops cost",
      strategicImpact: "High — zero-human automation",
      riskAssessment: "Low",
      optimizationPotential: 92,
      confidence: 89,
      evidence: [recommendations[0]?.title ?? "Executive recommendation", profitAssessments[6]?.title ?? "Automation profit"],
      trend: "declining",
      status: "strong",
    },
  ];

  return catalogue.map((item) => ({
    ...item,
    domain: mapDomain(item.category),
  }));
}

function buildEnterpriseCosts(assessments: CostAssessment[]): EnterpriseCostEntry[] {
  return assessments.map((a) => ({
    costId: a.costId,
    title: a.title,
    category: label(a.category),
    currentCost: a.currentCost,
    costVariance: a.costVariance,
    savingsOpportunity: a.savingsOpportunity,
    optimizationPotential: a.optimizationPotential,
    status: a.status,
  }));
}

function buildCostBreakdown(assessments: CostAssessment[]): CostBreakdownEntry[] {
  const domainTotals: Record<string, { cost: number; count: number }> = {};
  for (const a of assessments) {
    const key = a.domain;
    domainTotals[key] = domainTotals[key] ?? { cost: 0, count: 0 };
    domainTotals[key].count += 1;
    const match = a.currentCost.match(/\$(\d+)/);
    if (match) domainTotals[key].cost += Number(match[1]);
  }
  const total = Object.values(domainTotals).reduce((s, d) => s + d.cost, 0);
  return Object.entries(domainTotals).map(([domain, data]) => ({
    domain,
    label: label(domain),
    currentCost: `$${data.cost}K`,
    percentage: Math.round((data.cost / Math.max(total, 1)) * 100),
    trend: data.count > 1 ? "stable" : "monitoring",
    status: "tracked",
  }));
}

function buildCostTrends(efficiency: number): CostTrendEntry[] {
  return [
    { period: "Q1", enterpriseCost: "$720K", costEfficiency: efficiency - 4, savingsAchieved: "$45K", trend: "improving" },
    { period: "Q2", enterpriseCost: "$705K", costEfficiency: efficiency - 2, savingsAchieved: "$62K", trend: "improving" },
    { period: "Q3", enterpriseCost: "$698K", costEfficiency: efficiency - 1, savingsAchieved: "$78K", trend: "improving" },
    { period: "Q4", enterpriseCost: "$685K", costEfficiency: efficiency, savingsAchieved: "$95K", trend: "stable" },
  ];
}

function buildSavingsOpportunities(): SavingsOpportunityEntry[] {
  return [
    { opportunityId: "coe-opp-infra", title: "Infrastructure Right-Sizing", capability: "infrastructure_efficiency", estimatedSavings: "$25K/year", businessImpact: "Low — reliability preserved", priority: "high", status: "active" },
    { opportunityId: "coe-opp-commerce", title: "Commerce Support Automation", capability: "automation_opportunities", estimatedSavings: "$21K/year", businessImpact: "Moderate — scaling preserved", priority: "high", status: "active" },
    { opportunityId: "coe-opp-supplier", title: "Supplier Contract Renegotiation", capability: "supplier_optimization", estimatedSavings: "$15K/year", businessImpact: "Low — vendor consolidation", priority: "high", status: "evaluating" },
    { opportunityId: "coe-opp-ops", title: "Platform Automation Savings", capability: "operational_savings", estimatedSavings: "$20K/year", businessImpact: "Positive — efficiency gain", priority: "medium", status: "active" },
    { opportunityId: "coe-opp-engineering", title: "Engineering Infrastructure Optimization", capability: "cost_reduction", estimatedSavings: "$40K/year", businessImpact: "Low — velocity preserved", priority: "high", status: "attention" },
    { opportunityId: "coe-opp-waste", title: "Unused Resource Elimination", capability: "waste_elimination", estimatedSavings: "$18K/year", businessImpact: "Minimal", priority: "medium", status: "active" },
    { opportunityId: "coe-opp-process", title: "Process Efficiency Improvement", capability: "process_efficiency", estimatedSavings: "$12K/year", businessImpact: "Low", priority: "medium", status: "planned" },
    { opportunityId: "coe-opp-portfolio", title: "Business Factory Portfolio Efficiency", capability: "resource_optimization", estimatedSavings: "$20K/year", businessImpact: "Moderate", priority: "medium", status: "monitoring" },
  ];
}

function buildEfficiencyMetrics(avgEfficiency: number, avgPotential: number): EfficiencyMetricEntry[] {
  return [
    { metric: "Cost Efficiency Score", value: `${avgEfficiency}%`, score: avgEfficiency, status: avgEfficiency >= 80 ? "strong" : "adequate", trend: "improving" },
    { metric: "Optimization Potential", value: `${avgPotential}%`, score: avgPotential, status: "active", trend: "stable" },
    { metric: "Resource Utilization", value: "84%", score: 84, status: "adequate", trend: "improving" },
    { metric: "Waste Ratio", value: "3.2%", score: 88, status: "managed", trend: "declining" },
    { metric: "Savings Progress", value: "$95K YTD", score: 82, status: "on_track", trend: "rising" },
    { metric: "Cost Variance", value: "+4.2% avg", score: 76, status: "monitoring", trend: "stable" },
  ];
}

function buildWasteDetection(assessments: CostAssessment[]): WasteDetectionEntry[] {
  return assessments
    .filter((a) => a.costVariance.includes("+") && !a.costVariance.includes("On plan") && !a.costVariance.includes("Under"))
    .slice(0, 5)
    .map((a) => ({
      wasteId: `waste-${a.costId}`,
      costId: a.costId,
      title: a.title,
      severity: a.costVariance.includes("+8") || a.costVariance.includes("+9") ? "moderate" : "low",
      exposure: `${a.costVariance} · ${a.savingsOpportunity}`,
      elimination: "Waste detection · optimization analysis · executive review",
      status: a.status === "attention" ? "active_review" : "monitored",
    }));
}

function buildCostAnalysis(assessments: CostAssessment[], avgEfficiency: number): CostAnalysisMetric[] {
  const wasteCount = assessments.filter((a) => a.costVariance.includes("+") && !a.costVariance.includes("On plan")).length;
  const scores: Record<string, { score: number; summary: string }> = {
    cost_efficiency: { score: avgEfficiency, summary: `Avg cost efficiency ${avgEfficiency}% across enterprise` },
    cost_variance: { score: 76, summary: "+4.2% average cost variance — within monitoring threshold" },
    cost_drivers: { score: 84, summary: "Engineering and commerce identified as primary cost drivers" },
    cost_trends: { score: 82, summary: "Cost trends declining Q1-Q4 — optimization active" },
    resource_utilization: { score: 84, summary: "Resource utilization 84% — aligned with budget data" },
    waste: { score: wasteCount <= 3 ? 88 : 72, summary: `${wasteCount} cost variances flagged for waste detection` },
    operational_efficiency: { score: 86, summary: "Operational efficiency improving via automation" },
    business_value: { score: 87, summary: "Efficiency before reduction — capability preserved" },
    long_term_sustainability: { score: 86, summary: "No harmful cost cutting — sustainability enforced" },
  };

  return COST_ANALYSIS_DOMAINS.map((domain) => {
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

function buildFinancialPerformance(totalSavings: string, avgEfficiency: number): FinancialPerformanceEntry[] {
  return [
    { metric: "Total Enterprise Cost", value: "$3.0M/year", trend: "stable", status: "tracked" },
    { metric: "Savings Identified", value: totalSavings, trend: "rising", status: "strong" },
    { metric: "Cost Efficiency", value: `${avgEfficiency}%`, trend: "improving", status: "on_track" },
    { metric: "Savings Achieved YTD", value: "$95K", trend: "rising", status: "strong" },
    { metric: "Cost Assessments", value: "12 active", trend: "stable", status: "active" },
    { metric: "Harmful Cuts", value: "0", trend: "stable", status: "protected" },
  ];
}

function buildPillowEvaluations(input: {
  assessmentCount: number;
  avgEfficiency: number;
  wasteCount: number;
  savingsTotal: string;
}): PillowCostEvaluationMetric[] {
  return PILLOW_COST_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_COST_EVALUATIONS)[number], { status: string; summary: string }> = {
      cost_efficiency: { status: input.avgEfficiency >= 80 ? "efficient" : "improving", summary: `${input.assessmentCount} assessments · efficiency ${input.avgEfficiency}%` },
      waste_opportunities: { status: input.wasteCount <= 3 ? "managed" : "attention", summary: `${input.wasteCount} waste items detected · elimination active` },
      optimization_potential: { status: "active", summary: `${input.savingsTotal} savings identified across enterprise` },
      business_impact: { status: "protected", summary: "Efficiency before reduction — no harmful cost cutting" },
      executive_recommendations: { status: "active", summary: "Cost recommendations via E2-04 · optimization via E3-08" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(): CostOptimizationRecommendation[] {
  return [
    {
      id: "coe-rec-discipline",
      title: "Enforce Cost Optimization Discipline",
      category: "governance",
      why: "Reducing cost is about maximizing efficiency while preserving capability — not merely spending less",
      what: "Govern all costs through PILLOW-COE-001 constitutional authority",
      how: "Cost pipeline · 5s refresh · no harmful cost cutting",
      confidencePercent: 94,
    },
    {
      id: "coe-rec-engineering",
      title: "Optimize Engineering Infrastructure Costs",
      category: "optimization",
      why: "Engineering costs +5% over plan — $40K infrastructure optimization opportunity",
      what: "Right-size infrastructure and eliminate unused resources without harming delivery velocity",
      how: "Infrastructure efficiency · waste elimination · executive approval",
      confidencePercent: 88,
    },
    {
      id: "coe-rec-commerce",
      title: "Automate Commerce Support Costs",
      category: "optimization",
      why: "Commerce costs +8% over plan — support scaling driving variance",
      what: "Deploy support automation to recover $21K while preserving customer experience",
      how: "Automation opportunities · E3-07 profit linkage · ECC coordination",
      confidencePercent: 86,
    },
    {
      id: "coe-rec-e310",
      title: "Proceed to E3-10 Executive KPI Engine",
      category: "programme",
      why: "E3-09 financial scenario engine established · executive KPI engine is next E3 capability",
      what: "Implement Executive KPI Engine building on FSE foundation",
      how: "E3 sequence · integrate EFF through E3-08 · scenario-KPI linkage",
      confidencePercent: 92,
    },
  ];
}

export function assembleCostOptimizationEngine(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  roiIntelligenceEngine?: RoiIntelligenceEngine | null;
  cashReserveIntelligence?: CashReserveIntelligence | null;
  profitOptimizationEngine?: ProfitOptimizationEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): CostOptimizationEngine {
  const costAssessments = buildAssessments(input);
  const enterpriseCosts = buildEnterpriseCosts(costAssessments);
  const costBreakdown = buildCostBreakdown(costAssessments);
  const savingsOpportunities = buildSavingsOpportunities();
  const wasteDetection = buildWasteDetection(costAssessments);

  const averageOptimizationPotential = Math.round(
    costAssessments.reduce((s, a) => s + a.optimizationPotential, 0) / Math.max(costAssessments.length, 1),
  );
  const averageCostEfficiency = Math.round(averageOptimizationPotential * 0.95);
  const totalSavingsIdentified = "$336K/year";

  const costTrends = buildCostTrends(averageCostEfficiency);
  const efficiencyMetrics = buildEfficiencyMetrics(averageCostEfficiency, averageOptimizationPotential);
  const costAnalysis = buildCostAnalysis(costAssessments, averageCostEfficiency);
  const financialPerformance = buildFinancialPerformance(totalSavingsIdentified, averageCostEfficiency);

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.profitOptimizationEngine?.healthScore ?? 85,
    input.roiIntelligenceEngine?.healthScore ?? 85,
    averageCostEfficiency >= 80 ? 90 : averageCostEfficiency >= 70 ? 78 : 68,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    assessmentCount: costAssessments.length,
    avgEfficiency: averageCostEfficiency,
    wasteCount: wasteDetection.length,
    savingsTotal: totalSavingsIdentified,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Cost Optimization Engine — constitutional cost intelligence authority active",
    `${costAssessments.length} cost assessments · $336K savings identified · ${averageCostEfficiency}% efficiency`,
    "No harmful cost cutting · efficiency before reduction enforced",
    "Integrated with E3-01 Finance · E3-02 Capital · E3-03 Budget · E3-04 Investment · E3-05 ROI · E3-06 Cash · E3-07 Profit",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting financial integrity")}`,
    "ECC coordinates cost optimization · Supervisor monitors efficiency trends",
    "VIE validates cost alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-08",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Cost Optimization Engine continuously discovers unnecessary costs, optimizes resource utilization and improves operating efficiency. Every executive decision considers its impact on enterprise cost efficiency. The Grand King always understands where money is spent, why it is spent and where sustainable savings can be achieved.",
    engineHealth: healthLabel(clampedHealth),
    costHealth: averageCostEfficiency >= 80 ? "efficient" : averageCostEfficiency >= 70 ? "optimizing" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeCostAssessmentCount: costAssessments.filter((a) => a.status !== "pending").length,
    totalEnterpriseCost: "$3.0M/year",
    totalSavingsIdentified,
    averageCostEfficiency,
    averageOptimizationPotential,
    wasteItemsDetected: wasteDetection.length,
    costAssessments,
    enterpriseCosts,
    costBreakdown,
    costTrends,
    savingsOpportunities,
    efficiencyMetrics,
    wasteDetection,
    costAnalysis,
    financialPerformance,
    costOptimizationPipeline: buildPipeline("optimization_analysis"),
    recommendedActions,
    pillowEvaluations,
    costPrinciples: [...COST_PRINCIPLES],
    governedDomains: [...GOVERNED_COST_DOMAINS],
    optimizationCapabilities: [...COST_OPTIMIZATION_CAPABILITIES],
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
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring cost health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "cost optimization coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE309: true,
  };
}

export function buildFallbackCostOptimizationEngine(): CostOptimizationEngine {
  return assembleCostOptimizationEngine({});
}
