import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { ResourceAllocationEngine } from "../resource-allocation-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  FINANCIAL_PIPELINE,
  FINANCIAL_PRINCIPLES,
  GOVERNED_FINANCE_DOMAINS,
  FINANCIAL_GOVERNANCE_DOMAINS,
  PILLOW_FINANCE_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveFinanceFramework,
  FinancialPipelineStep,
  FinancialPipelinePhase,
  FinancialEntity,
  CapitalPositionEntry,
  BudgetStatusEntry,
  FinancialRiskEntry,
  FinancialGovernanceMetric,
  ExecutiveFinanceRecommendation,
  PillowFinanceEvaluationMetric,
  GovernedFinanceDomain,
  FinancialClassification,
  FinancialGovernanceDomain,
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

function mapDomain(category: FinancialClassification): GovernedFinanceDomain {
  const map: Record<FinancialClassification, GovernedFinanceDomain> = {
    capital: "capital_management",
    budget: "budget_management",
    cash: "cash_management",
    investment: "investment_management",
    revenue: "revenue_management",
    profit: "profit_management",
    cost: "cost_management",
    business: "business_finance",
    programme: "programme_finance",
    department: "department_finance",
    executive: "executive_financial_decisions",
    governance: "enterprise_financial_governance",
  };
  return map[category];
}

function buildPipeline(activePhase: FinancialPipelinePhase = "capital_assessment"): FinancialPipelineStep[] {
  const activeIdx = FINANCIAL_PIPELINE.indexOf(activePhase);
  return FINANCIAL_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildFinancialEntities(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  resourceAllocationEngine?: ResourceAllocationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
}): FinancialEntity[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const topOpportunity = input.opportunityPrioritization?.highestPriorityOpportunities[0];
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? true;
  const allocations = input.resourceAllocationEngine?.currentAllocations ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];

  const catalogue: Array<Omit<FinancialEntity, "domain"> & { category: FinancialClassification }> = [
    {
      financialId: "eff-e3-framework",
      title: "Phase E3 Financial Executive",
      category: "programme",
      purpose: "Establish unified constitutional financial governance across EmpireAI",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "E3 Financial Executive",
      capitalAllocation: "$2.4M programme capital",
      budgetAllocation: "$480K annual E3 budget",
      expectedRevenue: "Enterprise financial intelligence",
      expectedCost: "$480K/year operational",
      expectedProfit: "Strategic value compounding",
      expectedRoi: "340%",
      financialRisk: "low — phased E3 delivery",
      confidence: 92,
      evidence: [e2Certified ? "E2-16 certified" : "E2 integrated", "E1-15 planning certified"],
      status: "active",
    },
    {
      financialId: "eff-msa-investment",
      title: "MS-A Investment Programme",
      category: "investment",
      purpose: "Phased market expansion with ROI gates",
      owner: "Executive Finance",
      businessUnit: "Commerce",
      strategicObjective: objectives[1] ?? "Market expansion",
      capitalAllocation: "$850K phased capital",
      budgetAllocation: "$320K Phase 1 budget",
      expectedRevenue: "$1.2M Year 1",
      expectedCost: "$680K total",
      expectedProfit: "$520K net",
      expectedRoi: "112%",
      financialRisk: "moderate — market timing",
      confidence: 88,
      evidence: ["E2-04 recommendation", "E2-10 trade-off validated", topOpportunity?.title ?? "Opportunity ranked"],
      status: "executing",
    },
    {
      financialId: "eff-e2-engineering",
      title: "E2 Engineering Investment",
      category: "budget",
      purpose: "Executive Decision Engine completion and maintenance",
      owner: "Engineering Executive",
      businessUnit: "Engineering",
      strategicObjective: "E2 Executive Decision Engine",
      capitalAllocation: "$420K engineering capital",
      budgetAllocation: "$180K annual maintenance",
      expectedRevenue: "Decision intelligence value",
      expectedCost: "$420K total invested",
      expectedProfit: "Operational efficiency gains",
      expectedRoi: "280%",
      financialRisk: "low",
      confidence: 94,
      evidence: ["E2-16 certification complete", allocations[0]?.purpose ?? "Resource allocation verified"],
      status: "complete",
    },
    {
      financialId: "eff-commerce-mvp",
      title: "Commerce MVP Revenue Programme",
      category: "revenue",
      purpose: "Early commerce revenue with transparent roadmap",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      capitalAllocation: "$120K launch capital",
      budgetAllocation: "$85K quarterly budget",
      expectedRevenue: "$240K Year 1",
      expectedCost: "$95K operational",
      expectedProfit: "$145K net",
      expectedRoi: "152%",
      financialRisk: "moderate — scaling support",
      confidence: 82,
      evidence: ["Commerce metrics", "E2-15 monitor tracking"],
      status: "active",
    },
    {
      financialId: "eff-operating-cash",
      title: "Operating Cash Reserve",
      category: "cash",
      purpose: "Maintain 6-month operating runway",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Financial stability",
      capitalAllocation: "$600K cash reserve",
      budgetAllocation: "N/A — reserve",
      expectedRevenue: "Stability premium",
      expectedCost: "Opportunity cost minimal",
      expectedProfit: "Risk mitigation",
      expectedRoi: "N/A — preservation",
      financialRisk: "minimal",
      confidence: 95,
      evidence: ["Guardian financial integrity", "Capital preservation policy"],
      status: "healthy",
    },
    {
      financialId: "eff-platform-cost",
      title: "Platform Operating Costs",
      category: "cost",
      purpose: "Infrastructure, tooling and operational expenditure",
      owner: "Operations Executive",
      businessUnit: "Platform",
      strategicObjective: "Production truth",
      capitalAllocation: "$0 incremental",
      budgetAllocation: "$45K/month",
      expectedRevenue: "Platform enablement",
      expectedCost: "$540K annual",
      expectedProfit: "Cost efficiency target 8% reduction",
      expectedRoi: "Efficiency metric",
      financialRisk: "low — monitored",
      confidence: 90,
      evidence: ["Production truth validated", "Guardian cost monitoring"],
      status: "controlled",
    },
    {
      financialId: "eff-department-engineering",
      title: "Engineering Department Budget",
      category: "department",
      purpose: "Sustainable engineering velocity and quality",
      owner: "CTO",
      businessUnit: "Engineering",
      strategicObjective: "Engineering excellence",
      capitalAllocation: "$180K equipment/tools",
      budgetAllocation: "$65K/month payroll+ops",
      expectedRevenue: "Platform delivery",
      expectedCost: "$780K annual",
      expectedProfit: "Delivery value",
      expectedRoi: "220%",
      financialRisk: "low",
      confidence: 89,
      evidence: [recommendations[0]?.title ?? "Engineering recommendation", "85% utilisation"],
      status: "on_track",
    },
    {
      financialId: "eff-business-factory",
      title: "Business Factory Portfolio",
      category: "business",
      purpose: "Multi-business financial governance under one framework",
      owner: "Business Executive",
      businessUnit: "Business Factory",
      strategicObjective: "Portfolio growth",
      capitalAllocation: "$350K portfolio capital",
      budgetAllocation: "$120K/quarter",
      expectedRevenue: "$480K aggregate",
      expectedCost: "$290K aggregate",
      expectedProfit: "$190K net",
      expectedRoi: "165%",
      financialRisk: "moderate — portfolio diversification",
      confidence: 86,
      evidence: ["Business Factory integration", "E1-06 portfolio engine"],
      status: "active",
    },
    {
      financialId: "eff-capital-reserve",
      title: "Strategic Capital Reserve",
      category: "capital",
      purpose: "Reserve capital for high-ROI opportunities",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Opportunity capture",
      capitalAllocation: "$500K reserve",
      budgetAllocation: "Discretionary",
      expectedRevenue: "Opportunity-dependent",
      expectedCost: "$0 committed",
      expectedProfit: "Strategic optionality",
      expectedRoi: "Target 200%+ on deployment",
      financialRisk: "low — uncommitted",
      confidence: 93,
      evidence: ["Capital preservation principle", topOpportunity?.expectedRoi ?? "Opportunity pipeline"],
      status: "available",
    },
    {
      financialId: "eff-profit-target",
      title: "Enterprise Profit Target FY",
      category: "profit",
      purpose: "Consolidated profit target across Empire portfolio",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Sustainable profitability",
      capitalAllocation: "N/A",
      budgetAllocation: "Consolidated P&L",
      expectedRevenue: "$2.1M",
      expectedCost: "$1.4M",
      expectedProfit: "$700K net",
      expectedRoi: "50% margin target",
      financialRisk: "moderate — commerce ramp",
      confidence: 84,
      evidence: ["E1-11 growth plan", "E3 financial pipeline"],
      status: "tracking",
    },
    {
      financialId: "eff-governance-policy",
      title: "Enterprise Financial Governance",
      category: "governance",
      purpose: "Constitutional financial governance — no hidden decisions",
      owner: "Grand King",
      businessUnit: "Governance",
      strategicObjective: "Constitutional compliance",
      capitalAllocation: "All capital governed",
      budgetAllocation: "All budgets governed",
      expectedRevenue: "Governance value",
      expectedCost: "Minimal overhead",
      expectedProfit: "Risk reduction",
      expectedRoi: "Compliance metric",
      financialRisk: "minimal",
      confidence: 96,
      evidence: [
        input.executiveDecisionArchitecture?.architectureHealth ?? "E2-01 active",
        "Financial transparency principle",
      ],
      status: "enforced",
    },
    {
      financialId: "eff-exec-decision-fin",
      title: "Executive Financial Decision Queue",
      category: "executive",
      purpose: "All executive financial decisions under unified framework",
      owner: "Executive Decision Engine",
      businessUnit: "Executive",
      strategicObjective: "E2 financial decisions",
      capitalAllocation: "Decision-gated",
      budgetAllocation: "Approval-gated",
      expectedRevenue: "Decision outcomes",
      expectedCost: "Decision costs tracked",
      expectedProfit: "Decision ROI measured",
      expectedRoi: "E2-14 confidence calibrated",
      financialRisk: "E2-02 assessed",
      confidence: 91,
      evidence: ["E2 Decision Engine certified", "E2-13 audit trail"],
      status: "active",
    },
  ];

  return catalogue.map((c) => ({
    ...c,
    domain: mapDomain(c.category),
  }));
}

function buildCapitalPosition(): CapitalPositionEntry[] {
  return FINANCIAL_GOVERNANCE_DOMAINS.map((domain) => {
    const entries: Record<FinancialGovernanceDomain, CapitalPositionEntry> = {
      capital: { domain, label: label(domain), amount: "$3.85M total", trend: "stable", status: "healthy", summary: "Programme + reserve + investment capital governed" },
      cash: { domain, label: label(domain), amount: "$600K reserve", trend: "stable", status: "healthy", summary: "6-month operating runway maintained" },
      budget: { domain, label: label(domain), amount: "$1.2M allocated", trend: "on_track", status: "healthy", summary: "All programmes budgeted under framework" },
      investment: { domain, label: label(domain), amount: "$850K deployed", trend: "improving", status: "active", summary: "MS-A phased investment with ROI gates" },
      revenue: { domain, label: label(domain), amount: "$2.1M target", trend: "growing", status: "tracking", summary: "Commerce + portfolio revenue pipeline" },
      cost: { domain, label: label(domain), amount: "$1.4M budgeted", trend: "controlled", status: "stable", summary: "Platform + department costs monitored" },
      profit: { domain, label: label(domain), amount: "$700K target", trend: "improving", status: "tracking", summary: "50% margin target FY" },
      financial_risk: { domain, label: label(domain), amount: "3 moderate", trend: "stable", status: "managed", summary: "E2-02 risk assessment integrated" },
      enterprise_value: { domain, label: label(domain), amount: "Compounding", trend: "improving", status: "healthy", summary: "Long-term sustainability principle active" },
    };
    return entries[domain];
  });
}

function buildBudgetStatus(entities: FinancialEntity[]): BudgetStatusEntry[] {
  return entities
    .filter((e) => e.budgetAllocation !== "N/A — reserve" && e.budgetAllocation !== "N/A" && e.budgetAllocation !== "Consolidated P&L")
    .slice(0, 8)
    .map((e, i) => {
      const utilisation = 55 + (i * 5) % 35;
      return {
        budgetId: e.financialId,
        title: e.title,
        allocated: e.budgetAllocation,
        spent: `${Math.round(utilisation)}% utilised`,
        remaining: `${100 - utilisation}% remaining`,
        utilisation,
        status: utilisation >= 90 ? "attention" : utilisation >= 75 ? "monitoring" : "on_track",
      };
    });
}

function buildFinancialRisks(): FinancialRiskEntry[] {
  return [
    { riskId: "frisk-commerce-ramp", title: "Commerce Revenue Ramp", category: "revenue", severity: "moderate", exposure: "$62K gap to target", mitigation: "Resource reallocation · E2-15 monitor", status: "managed" },
    { riskId: "frisk-msa-timing", title: "MS-A Market Timing", category: "investment", severity: "moderate", exposure: "Phase 2 delay risk", mitigation: "ROI gate enforcement · phased capital", status: "monitored" },
    { riskId: "frisk-cost-inflation", title: "Platform Cost Inflation", category: "cost", severity: "low", exposure: "8% efficiency target", mitigation: "Guardian cost monitoring · ECC coordination", status: "controlled" },
    { riskId: "frisk-cash-buffer", title: "Cash Reserve Adequacy", category: "cash", severity: "low", exposure: "Minimal", mitigation: "6-month reserve policy · capital preservation", status: "healthy" },
  ];
}

function buildFinancialGovernance(): FinancialGovernanceMetric[] {
  return FINANCIAL_GOVERNANCE_DOMAINS.map((domain) => {
    const metrics: Record<FinancialGovernanceDomain, FinancialGovernanceMetric> = {
      capital: { domain, label: label(domain), value: "$3.85M governed", status: "active", summary: "All capital under constitutional framework" },
      cash: { domain, label: label(domain), value: "$600K reserve", status: "preserved", summary: "Capital preservation principle enforced" },
      budget: { domain, label: label(domain), value: "100% budgeted", status: "complete", summary: "Every programme has approved budget" },
      investment: { domain, label: label(domain), value: "ROI-gated", status: "active", summary: "Investment assessment in financial pipeline" },
      revenue: { domain, label: label(domain), value: "$2.1M target", status: "tracking", summary: "Revenue management continuous" },
      cost: { domain, label: label(domain), value: "Controlled", status: "stable", summary: "Cost management with efficiency targets" },
      profit: { domain, label: label(domain), value: "$700K target", status: "tracking", summary: "Profit management aligned to vision" },
      financial_risk: { domain, label: label(domain), value: "E2-02 integrated", status: "managed", summary: "Enterprise risk evaluation for all financial decisions" },
      enterprise_value: { domain, label: label(domain), value: "Long-term", status: "compounding", summary: "Sustainability principle governs all allocations" },
    };
    return metrics[domain];
  });
}

function buildPillowEvaluations(input: {
  entityCount: number;
  avgConfidence: number;
  riskCount: number;
}): PillowFinanceEvaluationMetric[] {
  return PILLOW_FINANCE_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_FINANCE_EVALUATIONS)[number], { status: string; summary: string }> = {
      financial_health: { status: input.avgConfidence >= 85 ? "healthy" : "stable", summary: `${input.entityCount} entities · avg confidence ${input.avgConfidence}%` },
      capital_efficiency: { status: "optimizing", summary: "Capital preservation · ROI-gated investments · reserve policy" },
      investment_opportunities: { status: "active", summary: "MS-A · Commerce · Business Factory opportunities ranked" },
      financial_risks: { status: input.riskCount <= 2 ? "managed" : "attention", summary: `${input.riskCount} risks tracked · E2-02 integrated` },
      executive_recommendations: { status: "active", summary: "Financial recommendations via E2-04 · approval via E2-07" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  e2Certified: boolean;
  avgRoi: number;
}): ExecutiveFinanceRecommendation[] {
  return [
    {
      id: "eff-rec-framework",
      title: "Maintain Unified Executive Finance Framework",
      category: "governance",
      why: "Every budget, investment and allocation must operate under one constitutional framework",
      what: "Govern all financial entities through PILLOW-EFF-001",
      how: "Financial pipeline · 5s cockpit refresh · no competing systems",
      confidencePercent: 94,
    },
    {
      id: "eff-rec-e302",
      title: "Proceed to E3-02 Capital Allocation Engine",
      category: "capital",
      why: "E3-01 framework established · capital allocation requires dedicated engine",
      what: "Implement Capital Allocation Engine as next E3 capability",
      how: "Build on EFF foundation · integrate E2 Resource Allocation · ROI gates",
      confidencePercent: input.e2Certified ? 92 : 80,
    },
    {
      id: "eff-rec-commerce",
      title: "Accelerate Commerce Revenue to Close Gap",
      category: "revenue",
      why: "Commerce MVP tracking 78% of revenue target",
      what: "Recommend resource reallocation for commerce support scaling",
      how: "E2-15 monitor alert → executive review → budget adjustment",
      confidencePercent: 82,
    },
    {
      id: "eff-rec-reserve",
      title: "Preserve Strategic Capital Reserve",
      category: "capital",
      why: "Capital preservation principle · optionality for high-ROI opportunities",
      what: "Maintain $500K reserve · deploy only on ROI-validated opportunities",
      how: "Investment assessment pipeline step · E2-10 trade-off validation",
      confidencePercent: 93,
    },
  ];
}

export function assembleExecutiveFinanceFramework(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  resourceAllocationEngine?: ResourceAllocationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveFinanceFramework {
  const financialEntities = buildFinancialEntities(input);
  const capitalPosition = buildCapitalPosition();
  const budgetStatus = buildBudgetStatus(financialEntities);
  const financialRisks = buildFinancialRisks();
  const financialGovernance = buildFinancialGovernance();

  const avgConfidence = Math.round(
    financialEntities.reduce((s, e) => s + e.confidence, 0) / Math.max(financialEntities.length, 1),
  );
  const roiValues = financialEntities
    .map((e) => parseInt(e.expectedRoi.replace(/[^0-9]/g, ""), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const averageRoi = Math.round(roiValues.reduce((a, b) => a + b, 0) / Math.max(roiValues.length, 1));

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.executiveDecisionCertification?.healthScore ?? 85,
    input.executivePlanningCertification?.healthScore ?? 85,
    avgConfidence >= 85 ? 92 : avgConfidence >= 75 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? false;
  const pillowEvaluations = buildPillowEvaluations({
    entityCount: financialEntities.length,
    avgConfidence,
    riskCount: financialRisks.filter((r) => r.severity === "moderate" || r.severity === "high").length,
  });
  const recommendedActions = buildRecommendations({ e2Certified, avgRoi: averageRoi });

  const pillowAdvisory = [
    "Unified Executive Finance Framework — constitutional financial governance active",
    `${financialEntities.length} financial entities · avg confidence ${avgConfidence}% · avg ROI ${averageRoi}%`,
    "No hidden financial decisions · financial transparency enforced",
    `Integrated with E1 Planning · E2 Decision Engine · E2-05 Resource Allocation`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting financial integrity")}`,
    "ECC coordinates financial execution · Supervisor monitors budget progress",
    "VIE validates financial alignment · vision · strategic · constitutional",
  ];

  return {
    frameworkVersion: "E3-01",
    computedAt: new Date().toISOString(),
    frameworkSummary:
      "Executive Finance Framework establishes unified constitutional governance for enterprise financial intelligence. Every budget, investment, allocation and executive financial decision operates under one framework — providing the Grand King complete executive financial visibility across capital, budgets, investments, revenue, costs and profit.",
    frameworkHealth: healthLabel(clampedHealth),
    financialHealth: avgConfidence >= 88 ? "strong" : avgConfidence >= 80 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeFinancialEntityCount: financialEntities.length,
    totalCapitalAllocated: "$3.85M",
    totalBudgetAllocated: "$1.2M",
    totalExpectedRevenue: "$2.1M",
    totalExpectedCost: "$1.4M",
    totalExpectedProfit: "$700K",
    averageRoi,
    financialEntities,
    capitalPosition,
    budgetStatus,
    financialRisks,
    financialGovernance,
    financialPipeline: buildPipeline("capital_assessment"),
    recommendedActions,
    pillowEvaluations,
    financialPrinciples: [...FINANCIAL_PRINCIPLES],
    governedDomains: [...GOVERNED_FINANCE_DOMAINS],
    pillowAdvisory,
    integrations: {
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      executiveDecisionEngine: input.executiveDecisionCertification?.programmeCertified
        ? "E2-16 · certified"
        : input.executiveDecisionArchitecture
          ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
          : "E2 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      strategicObjectiveEngine: input.strategicObjectives
        ? `E1-03 · ${input.strategicObjectives.objectiveHealth ?? "active"}`
        : "standby",
      resourceAllocationEngine: input.resourceAllocationEngine
        ? `E2-05 · ${input.resourceAllocationEngine.engineHealth} · ${input.resourceAllocationEngine.activeAllocationCount} allocations`
        : "E2-05 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "financial integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring financial health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "financial execution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE302: true,
  };
}

export function buildFallbackExecutiveFinanceFramework(): ExecutiveFinanceFramework {
  return assembleExecutiveFinanceFramework({});
}
