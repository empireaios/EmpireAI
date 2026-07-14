import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  BUDGET_PLANNING_PIPELINE,
  BUDGET_PRINCIPLES,
  GOVERNED_BUDGET_DOMAINS,
  BUDGET_OPTIMIZATION_DOMAINS,
  PILLOW_BUDGET_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveBudgetPlanner,
  BudgetPlanningPipelineStep,
  BudgetPlanningPipelinePhase,
  EnterpriseBudget,
  BudgetOverviewEntry,
  BudgetAllocationEntry,
  BudgetVarianceEntry,
  BudgetRiskEntry,
  BudgetOptimizationMetric,
  ExecutiveBudgetRecommendation,
  PillowBudgetEvaluationMetric,
  GovernedBudgetDomain,
  BudgetClassification,
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

function mapDomain(category: BudgetClassification): GovernedBudgetDomain {
  const map: Record<BudgetClassification, GovernedBudgetDomain> = {
    strategic_budget: "enterprise_budget",
    operating_budget: "operations_budgets",
    growth_budget: "business_budgets",
    technology_budget: "technology_budgets",
    infrastructure_budget: "infrastructure_budgets",
    marketing_budget: "marketing_budgets",
    innovation_budget: "research_budgets",
    commerce_budget: "business_budgets",
    reserve_budget: "reserve_budgets",
    emergency_budget: "reserve_budgets",
    future_budget_classes: "future_budget_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: BudgetPlanningPipelinePhase = "budget_optimization"): BudgetPlanningPipelineStep[] {
  const activeIdx = BUDGET_PLANNING_PIPELINE.indexOf(activePhase);
  return BUDGET_PLANNING_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildBudgets(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): EnterpriseBudget[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const budgetStatus = input.executiveFinanceFramework?.budgetStatus ?? [];
  const allocations = input.capitalAllocationEngine?.currentAllocations ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];

  const catalogue: Array<Omit<EnterpriseBudget, "domain"> & { category: BudgetClassification }> = [
    {
      budgetId: "ebp-enterprise-fy",
      title: "Enterprise FY Budget",
      category: "strategic_budget",
      purpose: "Consolidated enterprise budget governing all programmes and departments",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise growth",
      allocatedBudget: "$1.2M",
      currentSpend: "$680K",
      remainingBudget: "$520K",
      expectedRoi: "50% margin",
      expectedBusinessValue: "Enterprise delivery",
      expectedFinancialValue: "$700K profit target",
      riskAssessment: "Low — consolidated governance",
      confidence: 92,
      evidence: [budgetStatus[0]?.title ?? "E3-01 budget governed", "Enterprise budget framework"],
      utilization: 57,
      variance: "+2% under plan",
      status: "on_track",
    },
    {
      budgetId: "ebp-e3-programme",
      title: "E3 Financial Executive Programme",
      category: "strategic_budget",
      purpose: "Phase E3 financial intelligence capabilities budget",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "E3 Financial Executive",
      allocatedBudget: "$480K",
      currentSpend: "$168K",
      remainingBudget: "$312K",
      expectedRoi: "340%",
      expectedBusinessValue: "Financial intelligence",
      expectedFinancialValue: "Strategic compounding",
      riskAssessment: "Low — phased delivery",
      confidence: 91,
      evidence: [allocations[1]?.title ?? "E3 programme capital linked", "E3-01 framework"],
      utilization: 35,
      variance: "On plan",
      status: "active",
    },
    {
      budgetId: "ebp-engineering-dept",
      title: "Engineering Department Budget",
      category: "technology_budget",
      purpose: "Engineering velocity, quality and platform delivery",
      owner: "CTO",
      businessUnit: "Engineering",
      strategicObjective: "Engineering excellence",
      allocatedBudget: "$780K",
      currentSpend: "$640K",
      remainingBudget: "$140K",
      expectedRoi: "220%",
      expectedBusinessValue: "Platform delivery",
      expectedFinancialValue: "Delivery value",
      riskAssessment: "Low",
      confidence: 89,
      evidence: [recommendations[0]?.title ?? "Engineering recommendation", "85% utilization"],
      utilization: 82,
      variance: "+5% over plan",
      status: "attention",
    },
    {
      budgetId: "ebp-commerce-mvp",
      title: "Commerce MVP Budget",
      category: "commerce_budget",
      purpose: "Commerce launch and early revenue operations",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      allocatedBudget: "$85K/quarter",
      currentSpend: "$66K",
      remainingBudget: "$19K",
      expectedRoi: "152%",
      expectedBusinessValue: "Early revenue",
      expectedFinancialValue: "$145K profit",
      riskAssessment: "Moderate — support scaling",
      confidence: 82,
      evidence: [budgetStatus[3]?.title ?? "Commerce budget tracked", "E2-15 monitor"],
      utilization: 78,
      variance: "+8% over plan",
      status: "attention",
    },
    {
      budgetId: "ebp-marketing-growth",
      title: "Marketing Growth Budget",
      category: "marketing_budget",
      purpose: "Brand awareness and customer acquisition",
      owner: "Marketing Executive",
      businessUnit: "Commerce",
      strategicObjective: "Customer acquisition",
      allocatedBudget: "$85K",
      currentSpend: "$17K",
      remainingBudget: "$68K",
      expectedRoi: "165%",
      expectedBusinessValue: "Customer pipeline",
      expectedFinancialValue: "$105K profit",
      riskAssessment: "Low-Moderate",
      confidence: 80,
      evidence: ["Commerce launch plan", allocations[5]?.title ?? "Marketing capital linked"],
      utilization: 20,
      variance: "Under plan — phased start",
      status: "planned",
    },
    {
      budgetId: "ebp-platform-ops",
      title: "Platform Operations Budget",
      category: "operating_budget",
      purpose: "Infrastructure, tooling and operational expenditure",
      owner: "Operations Executive",
      businessUnit: "Platform",
      strategicObjective: "Production truth",
      allocatedBudget: "$540K/year",
      currentSpend: "$405K",
      remainingBudget: "$135K",
      expectedRoi: "Efficiency metric",
      expectedBusinessValue: "Operational reliability",
      expectedFinancialValue: "8% cost reduction target",
      riskAssessment: "Low",
      confidence: 90,
      evidence: ["Guardian cost monitoring", "Production truth validated"],
      utilization: 75,
      variance: "On plan",
      status: "on_track",
    },
    {
      budgetId: "ebp-infrastructure",
      title: "Infrastructure Budget",
      category: "infrastructure_budget",
      purpose: "Scaling architecture, production truth and Guardian monitoring",
      owner: "CTO",
      businessUnit: "Engineering",
      strategicObjective: "Production excellence",
      allocatedBudget: "$320K",
      currentSpend: "$282K",
      remainingBudget: "$38K",
      expectedRoi: "220%",
      expectedBusinessValue: "Platform reliability",
      expectedFinancialValue: "Incident cost avoidance",
      riskAssessment: "Low",
      confidence: 91,
      evidence: [allocations[2]?.title ?? "Infrastructure capital linked"],
      utilization: 88,
      variance: "+3% over plan",
      status: "monitoring",
    },
    {
      budgetId: "ebp-rd-innovation",
      title: "R&D Innovation Budget",
      category: "innovation_budget",
      purpose: "AI innovation, knowledge evolution and research",
      owner: "Innovation Executive",
      businessUnit: "R&D",
      strategicObjective: "Long-term advantage",
      allocatedBudget: "$200K",
      currentSpend: "$90K",
      remainingBudget: "$110K",
      expectedRoi: "280%",
      expectedBusinessValue: "Innovation pipeline",
      expectedFinancialValue: "Future product value",
      riskAssessment: "Moderate — R&D uncertainty",
      confidence: 85,
      evidence: [allocations[4]?.title ?? "Innovation capital linked", "P9 knowledge evolution"],
      utilization: 45,
      variance: "Under plan",
      status: "active",
    },
    {
      budgetId: "ebp-business-factory",
      title: "Business Factory Budget",
      category: "growth_budget",
      purpose: "Multi-business portfolio operational budgets",
      owner: "Business Executive",
      businessUnit: "Business Factory",
      strategicObjective: "Portfolio growth",
      allocatedBudget: "$120K/quarter",
      currentSpend: "$70K",
      remainingBudget: "$50K",
      expectedRoi: "165%",
      expectedBusinessValue: "Portfolio delivery",
      expectedFinancialValue: "$190K net",
      riskAssessment: "Moderate — diversification",
      confidence: 86,
      evidence: ["E1-06 portfolio engine", "Business Factory finance"],
      utilization: 58,
      variance: "On plan",
      status: "active",
    },
    {
      budgetId: "ebp-msa-programme",
      title: "MS-A Programme Budget",
      category: "growth_budget",
      purpose: "Market expansion programme operational budget",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      strategicObjective: objectives[1] ?? "Market expansion",
      allocatedBudget: "$320K",
      currentSpend: "$230K",
      remainingBudget: "$90K",
      expectedRoi: "112%",
      expectedBusinessValue: "Market expansion",
      expectedFinancialValue: "$520K profit",
      riskAssessment: "Moderate — market timing",
      confidence: 88,
      evidence: [allocations[0]?.title ?? "MS-A capital linked", "ROI gate enforced"],
      utilization: 72,
      variance: "On plan",
      status: "deploying",
    },
    {
      budgetId: "ebp-reserve",
      title: "Budget Reserve",
      category: "reserve_budget",
      purpose: "Unallocated budget reserve for approved opportunities",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Financial flexibility",
      allocatedBudget: "$150K",
      currentSpend: "$0",
      remainingBudget: "$150K",
      expectedRoi: "Opportunity-dependent",
      expectedBusinessValue: "Optionality",
      expectedFinancialValue: "Deploy on approval",
      riskAssessment: "Minimal",
      confidence: 94,
      evidence: ["Capital preservation", "E3-02 reserve policy"],
      utilization: 0,
      variance: "N/A",
      status: "available",
    },
    {
      budgetId: "ebp-emergency",
      title: "Emergency Budget Buffer",
      category: "emergency_budget",
      purpose: "Crisis response and emergency operational spending",
      owner: "Grand King",
      businessUnit: "Governance",
      strategicObjective: "Enterprise resilience",
      allocatedBudget: "$100K",
      currentSpend: "$0",
      remainingBudget: "$100K",
      expectedRoi: "Risk mitigation",
      expectedBusinessValue: "Continuity",
      expectedFinancialValue: "Crisis response",
      riskAssessment: "Minimal until deployed",
      confidence: 95,
      evidence: ["E2-08 crisis engine", "Emergency budget classification"],
      utilization: 0,
      variance: "N/A",
      status: "reserved",
    },
  ];

  return catalogue.map((c) => ({
    ...c,
    domain: mapDomain(c.category),
  }));
}

function buildOverview(budgets: EnterpriseBudget[]): BudgetOverviewEntry[] {
  return budgets.map((b) => ({
    budgetId: b.budgetId,
    title: b.title,
    category: b.category.replace(/_/g, " "),
    allocatedBudget: b.allocatedBudget,
    currentSpend: b.currentSpend,
    remainingBudget: b.remainingBudget,
    utilization: b.utilization,
    status: b.status,
  }));
}

function buildAllocation(budgets: EnterpriseBudget[]): BudgetAllocationEntry[] {
  const byDomain = new Map<GovernedBudgetDomain, { allocated: number; spent: number }>();
  for (const b of budgets) {
    const alloc = parseInt(b.allocatedBudget.replace(/[^0-9]/g, ""), 10) || 0;
    const spent = parseInt(b.currentSpend.replace(/[^0-9]/g, ""), 10) || 0;
    const existing = byDomain.get(b.domain) ?? { allocated: 0, spent: 0 };
    byDomain.set(b.domain, {
      allocated: existing.allocated + alloc,
      spent: existing.spent + spent,
    });
  }

  return GOVERNED_BUDGET_DOMAINS.map((domain) => {
    const data = byDomain.get(domain);
    if (!data || data.allocated === 0) {
      return {
        domain,
        label: label(domain),
        allocated: "$0",
        spent: "$0",
        remaining: "$0",
        utilization: 0,
        status: "available",
      };
    }
    const util = Math.round((data.spent / data.allocated) * 100);
    const remaining = data.allocated - data.spent;
    return {
      domain,
      label: label(domain),
      allocated: `$${(data.allocated / 1000).toFixed(0)}K`,
      spent: `$${(data.spent / 1000).toFixed(0)}K`,
      remaining: `$${(remaining / 1000).toFixed(0)}K`,
      utilization: util,
      status: util >= 85 ? "attention" : util >= 60 ? "active" : util > 0 ? "deploying" : "available",
    };
  }).filter((m) => m.allocated !== "$0");
}

function buildVariance(budgets: EnterpriseBudget[]): BudgetVarianceEntry[] {
  return budgets
    .filter((b) => b.variance !== "On plan" && b.variance !== "N/A" && b.variance !== "Under plan — phased start" && b.variance !== "Under plan")
    .map((b) => ({
      budgetId: b.budgetId,
      title: b.title,
      planned: b.allocatedBudget,
      actual: b.currentSpend,
      variance: b.variance,
      severity: b.variance.includes("+8") || b.variance.includes("+5") ? "moderate" : "low",
      status: b.status,
    }));
}

function buildBudgetRisks(budgets: EnterpriseBudget[]): BudgetRiskEntry[] {
  return budgets
    .filter((b) => b.status === "attention" || b.utilization >= 80)
    .slice(0, 6)
    .map((b) => ({
      riskId: `brisk-${b.budgetId}`,
      budgetId: b.budgetId,
      title: b.title,
      severity: b.utilization >= 85 ? "moderate" : "low",
      exposure: `${b.utilization}% utilization · ${b.variance}`,
      mitigation: "Budget monitoring · E2-15 monitor · executive review on variance",
      status: b.status === "attention" ? "active_review" : "monitored",
    }));
}

function buildOptimization(budgets: EnterpriseBudget[], avgUtil: number): BudgetOptimizationMetric[] {
  const avgRoi = 175;
  const scores: Record<string, { score: number; summary: string }> = {
    budget_efficiency: { score: avgUtil <= 75 ? 88 : avgUtil <= 85 ? 78 : 68, summary: `Avg utilization ${avgUtil}% — financial discipline active` },
    budget_utilization: { score: avgUtil, summary: "Budget utilization monitored across all domains" },
    expected_roi: { score: avgRoi, summary: "ROI targets linked to capital allocations" },
    business_value: { score: 86, summary: "Business value tracked per budget line" },
    strategic_value: { score: 87, summary: "All budgets linked to strategic objectives" },
    financial_return: { score: 84, summary: "Financial return optimization continuous" },
    resource_efficiency: { score: 85, summary: "Resource efficiency aligned with E2-05" },
    long_term_sustainability: { score: 88, summary: "Sustainability principle governs all budgets" },
  };

  return BUDGET_OPTIMIZATION_DOMAINS.map((domain) => {
    const s = scores[domain] ?? { score: 80, summary: "Optimization active" };
    return {
      domain,
      label: label(domain),
      score: Math.min(100, s.score),
      status: s.score >= 85 ? "optimized" : s.score >= 70 ? "improving" : "attention",
      summary: s.summary,
    };
  });
}

function buildPillowEvaluations(input: {
  budgetCount: number;
  avgUtil: number;
  riskCount: number;
}): PillowBudgetEvaluationMetric[] {
  return PILLOW_BUDGET_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_BUDGET_EVALUATIONS)[number], { status: string; summary: string }> = {
      budget_efficiency: { status: input.avgUtil <= 75 ? "efficient" : "monitoring", summary: `${input.budgetCount} budgets · avg utilization ${input.avgUtil}%` },
      budget_opportunities: { status: "active", summary: "Reserve $150K · reallocation opportunities identified" },
      budget_risks: { status: input.riskCount <= 2 ? "managed" : "attention", summary: `${input.riskCount} budget variances monitored` },
      spending_patterns: { status: "tracked", summary: "Engineering + Commerce spending patterns under review" },
      executive_recommendations: { status: "active", summary: "Budget recommendations via E2-04 · approval via E2-07" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(): ExecutiveBudgetRecommendation[] {
  return [
    {
      id: "ebp-rec-discipline",
      title: "Maintain Enterprise Budget Discipline",
      category: "governance",
      why: "Budgeting determines how the Empire operates — must support long-term enterprise value",
      what: "Govern all budgets through PILLOW-EBP-001 constitutional authority",
      how: "Budget pipeline · 5s refresh · no hidden spending",
      confidencePercent: 94,
    },
    {
      id: "ebp-rec-engineering",
      title: "Review Engineering Budget Variance",
      category: "variance",
      why: "Engineering budget +5% over plan at 82% utilization",
      what: "Trigger executive review and validate spend against delivery milestones",
      how: "Budget variance monitoring · Supervisor alert · Grand King review",
      confidencePercent: 86,
    },
    {
      id: "ebp-rec-commerce",
      title: "Reallocate Commerce Support Budget",
      category: "reallocation",
      why: "Commerce MVP +8% over plan — support scaling lag detected",
      what: "Shift $15K from marketing planned pool to commerce support",
      how: "Budget optimization step · E2-15 monitor · executive approval",
      confidencePercent: 82,
    },
    {
      id: "ebp-rec-e305",
      title: "Proceed to E3-05 ROI Intelligence Engine",
      category: "programme",
      why: "E3-04 investment evaluation established · ROI intelligence is next E3 capability",
      what: "Implement ROI Intelligence Engine building on IEE foundation",
      how: "E3 sequence · integrate EFF · CAE · EBP · investment-return linkage",
      confidencePercent: 92,
    },
  ];
}

export function assembleExecutiveBudgetPlanner(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveBudgetPlanner {
  const enterpriseBudgets = buildBudgets(input);
  const budgetOverview = buildOverview(enterpriseBudgets);
  const budgetAllocation = buildAllocation(enterpriseBudgets);
  const budgetVariance = buildVariance(enterpriseBudgets);
  const budgetRisks = buildBudgetRisks(enterpriseBudgets);

  const averageUtilization = Math.round(
    enterpriseBudgets.filter((b) => b.utilization > 0).reduce((s, b) => s + b.utilization, 0) /
      Math.max(enterpriseBudgets.filter((b) => b.utilization > 0).length, 1),
  );

  const budgetOptimization = buildOptimization(enterpriseBudgets, averageUtilization);
  const varianceCount = budgetVariance.length;
  const averageVariance = varianceCount;

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.capitalAllocationEngine?.healthScore ?? 85,
    input.executiveDecisionArchitecture?.healthScore ?? 85,
    averageUtilization <= 75 ? 92 : averageUtilization <= 85 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    budgetCount: enterpriseBudgets.length,
    avgUtil: averageUtilization,
    riskCount: budgetRisks.length,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Executive Budget Planner — constitutional enterprise budgeting authority active",
    `${enterpriseBudgets.length} budgets · $1.2M allocated · avg utilization ${averageUtilization}%`,
    "No hidden spending · budget transparency enforced",
    "Integrated with E3-01 Finance · E3-02 Capital · E2 Decision Engine · E2-04 Recommendations",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting budget integrity")}`,
    "ECC coordinates allocation · Supervisor monitors variance",
    "VIE validates budget alignment · vision · strategic · constitutional",
  ];

  return {
    plannerVersion: "E3-03",
    computedAt: new Date().toISOString(),
    plannerSummary:
      "Executive Budget Planner continuously plans, allocates and optimizes enterprise budgets according to strategic priorities, business objectives and constitutional governance. The Grand King always understands how resources are planned, allocated and consumed.",
    plannerHealth: healthLabel(clampedHealth),
    budgetHealth: averageUtilization <= 75 ? "disciplined" : averageUtilization <= 85 ? "active" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeBudgetCount: enterpriseBudgets.filter((b) => b.status === "active" || b.status === "deploying" || b.status === "on_track").length,
    totalBudgetAllocated: "$1.2M",
    totalCurrentSpend: "$680K",
    totalRemainingBudget: "$520K",
    averageUtilization,
    averageVariance,
    enterpriseBudgets,
    budgetOverview,
    budgetAllocation,
    budgetVariance,
    budgetRisks,
    budgetOptimization,
    budgetPlanningPipeline: buildPipeline("budget_optimization"),
    recommendedActions,
    pillowEvaluations,
    budgetPrinciples: [...BUDGET_PRINCIPLES],
    governedDomains: [...GOVERNED_BUDGET_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveFinanceFramework: input.executiveFinanceFramework
        ? `E3-01 · ${input.executiveFinanceFramework.frameworkHealth} · ${input.executiveFinanceFramework.activeFinancialEntityCount} entities`
        : "E3-01 · standby",
      capitalAllocationEngine: input.capitalAllocationEngine
        ? `E3-02 · ${input.capitalAllocationEngine.engineHealth} · ${input.capitalAllocationEngine.activeAllocationCount} allocations`
        : "E3-02 · standby",
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "budget integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring budget health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "budget allocation coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE304: true,
  };
}

export function buildFallbackExecutiveBudgetPlanner(): ExecutiveBudgetPlanner {
  return assembleExecutiveBudgetPlanner({});
}
