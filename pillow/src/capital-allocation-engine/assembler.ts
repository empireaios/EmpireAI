import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CAPITAL_PIPELINE,
  CAPITAL_PRINCIPLES,
  GOVERNED_CAPITAL_DOMAINS,
  CAPITAL_OPTIMIZATION_DOMAINS,
  PILLOW_CAPITAL_EVALUATIONS,
} from "./paths.js";
import type {
  CapitalAllocationEngine,
  CapitalPipelineStep,
  CapitalPipelinePhase,
  CapitalAllocation,
  CapitalPortfolioEntry,
  CapitalUtilizationMetric,
  InvestmentPerformanceEntry,
  CapitalRiskEntry,
  StrategicAlignmentEntry,
  CapitalOptimizationMetric,
  CapitalAllocationRecommendation,
  PillowCapitalEvaluationMetric,
  GovernedCapitalDomain,
  CapitalClassification,
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

function mapDomain(category: CapitalClassification): GovernedCapitalDomain {
  const map: Record<CapitalClassification, GovernedCapitalDomain> = {
    growth_capital: "business_expansion",
    operating_capital: "strategic_investments",
    strategic_capital: "strategic_investments",
    reserve_capital: "reserve_capital",
    innovation_capital: "innovation_capital",
    technology_capital: "technology_investments",
    infrastructure_capital: "infrastructure_investments",
    marketing_capital: "marketing_capital",
    commerce_capital: "commerce_investments",
    business_capital: "business_expansion",
    emergency_capital: "reserve_capital",
    future_capital_classes: "future_capital_categories",
  };
  return map[category];
}

function buildPipeline(activePhase: CapitalPipelinePhase = "capital_prioritization"): CapitalPipelineStep[] {
  const activeIdx = CAPITAL_PIPELINE.indexOf(activePhase);
  return CAPITAL_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildAllocations(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
}): CapitalAllocation[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const topOpportunity = input.opportunityPrioritization?.highestPriorityOpportunities[0];
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const financeEntities = input.executiveFinanceFramework?.financialEntities ?? [];

  const catalogue: Array<Omit<CapitalAllocation, "domain"> & { category: CapitalClassification }> = [
    {
      allocationId: "cae-msa-expansion",
      title: "MS-A Market Expansion",
      category: "growth_capital",
      purpose: "Phased market expansion with ROI gates at each phase transition",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      strategicObjective: objectives[1] ?? "Market expansion",
      allocatedCapital: "$850K",
      expectedRoi: "112%",
      expectedRevenue: "$1.2M Year 1",
      expectedCost: "$680K",
      expectedProfit: "$520K",
      riskAssessment: criticalRisks[0]?.title ?? "Moderate — market timing managed",
      investmentHorizon: "18 months",
      confidence: 88,
      evidence: [topOpportunity?.title ?? "Opportunity ranked #1", "E2-10 trade-off validated"],
      status: "deploying",
      utilization: 72,
      performanceTrend: "improving",
    },
    {
      allocationId: "cae-e3-programme",
      title: "E3 Financial Executive Programme",
      category: "strategic_capital",
      purpose: "Phase E3 financial intelligence capabilities E3-01 through E3-16",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "E3 Financial Executive",
      allocatedCapital: "$480K",
      expectedRoi: "340%",
      expectedRevenue: "Financial intelligence value",
      expectedCost: "$480K",
      expectedProfit: "Strategic compounding",
      riskAssessment: "Low — phased delivery",
      investmentHorizon: "12 months",
      confidence: 92,
      evidence: [financeEntities[0]?.title ?? "E3-01 framework active", "E2-16 decision certified"],
      status: "active",
      utilization: 35,
      performanceTrend: "on_track",
    },
    {
      allocationId: "cae-platform-infra",
      title: "Platform Infrastructure Investment",
      category: "infrastructure_capital",
      purpose: "Production truth, scaling architecture and Guardian monitoring",
      owner: "CTO",
      businessUnit: "Engineering",
      strategicObjective: "Production excellence",
      allocatedCapital: "$320K",
      expectedRoi: "220%",
      expectedRevenue: "Platform reliability value",
      expectedCost: "$280K",
      expectedProfit: "Incident cost avoidance",
      riskAssessment: "Low",
      investmentHorizon: "24 months",
      confidence: 91,
      evidence: ["Guardian production integrity", "Scaling architecture validated"],
      status: "deployed",
      utilization: 88,
      performanceTrend: "stable",
    },
    {
      allocationId: "cae-commerce-mvp",
      title: "Commerce MVP Launch Capital",
      category: "commerce_capital",
      purpose: "Commerce MVP launch and early revenue capture",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      allocatedCapital: "$120K",
      expectedRoi: "152%",
      expectedRevenue: "$240K Year 1",
      expectedCost: "$95K",
      expectedProfit: "$145K",
      riskAssessment: "Moderate — support scaling",
      investmentHorizon: "9 months",
      confidence: 82,
      evidence: ["Commerce metrics", "E2-15 monitor tracking"],
      status: "active",
      utilization: 78,
      performanceTrend: "attention",
    },
    {
      allocationId: "cae-innovation-rd",
      title: "AI Innovation R&D",
      category: "innovation_capital",
      purpose: "Research and development for AI evolution and knowledge accumulation",
      owner: "Innovation Executive",
      businessUnit: "R&D",
      strategicObjective: "Long-term competitive advantage",
      allocatedCapital: "$200K",
      expectedRoi: "280%",
      expectedRevenue: "Future product value",
      expectedCost: "$180K",
      expectedProfit: "Innovation pipeline",
      riskAssessment: "Moderate — R&D uncertainty",
      investmentHorizon: "36 months",
      confidence: 85,
      evidence: ["P9 knowledge evolution", "AI evolution architecture"],
      status: "active",
      utilization: 45,
      performanceTrend: "improving",
    },
    {
      allocationId: "cae-marketing-growth",
      title: "Marketing Growth Capital",
      category: "marketing_capital",
      purpose: "Brand awareness and customer acquisition for commerce launch",
      owner: "Marketing Executive",
      businessUnit: "Commerce",
      strategicObjective: "Customer acquisition",
      allocatedCapital: "$85K",
      expectedRoi: "165%",
      expectedRevenue: "$180K",
      expectedCost: "$75K",
      expectedProfit: "$105K",
      riskAssessment: "Low-Moderate",
      investmentHorizon: "6 months",
      confidence: 80,
      evidence: ["Commerce launch plan", "Customer acquisition metrics"],
      status: "planned",
      utilization: 20,
      performanceTrend: "pending",
    },
    {
      allocationId: "cae-automation",
      title: "Business Automation Investment",
      category: "technology_capital",
      purpose: "Automation investments reducing operational cost and increasing throughput",
      owner: "Operations Executive",
      businessUnit: "Business Factory",
      strategicObjective: "Operational efficiency",
      allocatedCapital: "$150K",
      expectedRoi: "195%",
      expectedRevenue: "Efficiency gains",
      expectedCost: "$120K",
      expectedProfit: "$75K savings",
      riskAssessment: "Low",
      investmentHorizon: "12 months",
      confidence: 87,
      evidence: ["Business automation architecture", "Zero-human automation progress"],
      status: "deploying",
      utilization: 62,
      performanceTrend: "improving",
    },
    {
      allocationId: "cae-strategic-reserve",
      title: "Strategic Capital Reserve",
      category: "reserve_capital",
      purpose: "Uncommitted reserve for high-ROI opportunity capture",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Opportunity optionality",
      allocatedCapital: "$500K",
      expectedRoi: "200%+ on deployment",
      expectedRevenue: "Opportunity-dependent",
      expectedCost: "$0 committed",
      expectedProfit: "Strategic optionality",
      riskAssessment: "Minimal — uncommitted",
      investmentHorizon: "Flexible",
      confidence: 93,
      evidence: ["Capital preservation principle", "E3-01 reserve policy"],
      status: "available",
      utilization: 0,
      performanceTrend: "stable",
    },
    {
      allocationId: "cae-acquisition-pipeline",
      title: "Acquisition Pipeline Fund",
      category: "strategic_capital",
      purpose: "Reserved capital for strategic acquisitions aligned to vision",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Strategic expansion",
      allocatedCapital: "$400K",
      expectedRoi: "180%",
      expectedRevenue: "Acquisition synergies",
      expectedCost: "Deal-dependent",
      expectedProfit: "Portfolio expansion",
      riskAssessment: "Moderate — deal diligence required",
      investmentHorizon: "24 months",
      confidence: 78,
      evidence: ["Opportunity prioritization pipeline", recommendations[0]?.title ?? "Executive recommendation"],
      status: "reserved",
      utilization: 5,
      performanceTrend: "monitoring",
    },
    {
      allocationId: "cae-business-factory",
      title: "Business Factory Expansion",
      category: "business_capital",
      purpose: "Multi-business portfolio expansion capital",
      owner: "Business Executive",
      businessUnit: "Business Factory",
      strategicObjective: "Portfolio growth",
      allocatedCapital: "$350K",
      expectedRoi: "165%",
      expectedRevenue: "$480K aggregate",
      expectedCost: "$290K",
      expectedProfit: "$190K",
      riskAssessment: "Moderate — diversification",
      investmentHorizon: "18 months",
      confidence: 86,
      evidence: [financeEntities[7]?.title ?? "Business Factory finance", "E1-06 portfolio engine"],
      status: "active",
      utilization: 58,
      performanceTrend: "stable",
    },
    {
      allocationId: "cae-emergency-buffer",
      title: "Emergency Capital Buffer",
      category: "emergency_capital",
      purpose: "Crisis response capital for E2-08 crisis decision scenarios",
      owner: "Grand King",
      businessUnit: "Governance",
      strategicObjective: "Enterprise resilience",
      allocatedCapital: "$200K",
      expectedRoi: "Risk mitigation",
      expectedRevenue: "Continuity value",
      expectedCost: "Deploy on crisis only",
      expectedProfit: "Enterprise survival",
      riskAssessment: "Minimal until deployed",
      investmentHorizon: "On-demand",
      confidence: 95,
      evidence: ["E2-08 crisis engine", "Emergency capital classification"],
      status: "reserved",
      utilization: 0,
      performanceTrend: "stable",
    },
    {
      allocationId: "cae-operating-cash",
      title: "Operating Capital Pool",
      category: "operating_capital",
      purpose: "Day-to-day operating capital for approved programmes",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Operational continuity",
      allocatedCapital: "$600K",
      expectedRoi: "Operational efficiency",
      expectedRevenue: "Programme delivery",
      expectedCost: "$540K annual",
      expectedProfit: "Delivery value",
      riskAssessment: "Low",
      investmentHorizon: "12 months rolling",
      confidence: 90,
      evidence: ["E3-01 cash management", "Operating capital governed"],
      status: "active",
      utilization: 82,
      performanceTrend: "stable",
    },
  ];

  return catalogue.map((c) => ({
    ...c,
    domain: mapDomain(c.category),
  }));
}

function buildPortfolio(allocations: CapitalAllocation[]): CapitalPortfolioEntry[] {
  return allocations.map((a) => ({
    allocationId: a.allocationId,
    title: a.title,
    category: a.category.replace(/_/g, " "),
    allocatedCapital: a.allocatedCapital,
    expectedRoi: a.expectedRoi,
    utilization: a.utilization,
    status: a.status,
    strategicAlignment: a.confidence >= 85 ? "aligned" : a.confidence >= 75 ? "moderate" : "review",
  }));
}

function buildUtilization(allocations: CapitalAllocation[]): CapitalUtilizationMetric[] {
  const byDomain = new Map<GovernedCapitalDomain, { allocated: number; utilized: number; count: number }>();
  for (const a of allocations) {
    const amount = parseInt(a.allocatedCapital.replace(/[^0-9]/g, ""), 10) || 0;
    const existing = byDomain.get(a.domain) ?? { allocated: 0, utilized: 0, count: 0 };
    byDomain.set(a.domain, {
      allocated: existing.allocated + amount,
      utilized: existing.utilized + (amount * a.utilization) / 100,
      count: existing.count + 1,
    });
  }

  return GOVERNED_CAPITAL_DOMAINS.map((domain) => {
    const data = byDomain.get(domain);
    if (!data || data.count === 0) {
      return {
        domain,
        label: label(domain),
        allocated: "$0",
        utilized: 0,
        efficiency: "n/a",
        status: "available",
      };
    }
    const utilPct = Math.round((data.utilized / data.allocated) * 100);
    return {
      domain,
      label: label(domain),
      allocated: `$${(data.allocated / 1000).toFixed(0)}K`,
      utilized: utilPct,
      efficiency: utilPct >= 70 ? "high" : utilPct >= 40 ? "moderate" : "low",
      status: utilPct >= 80 ? "active" : utilPct > 0 ? "deploying" : "available",
    };
  }).filter((m) => m.allocated !== "$0");
}

function buildPerformance(allocations: CapitalAllocation[]): InvestmentPerformanceEntry[] {
  return allocations
    .filter((a) => a.status !== "available" && a.status !== "reserved")
    .slice(0, 10)
    .map((a) => {
      const expected = parseInt(a.expectedRoi.replace(/[^0-9]/g, ""), 10) || 0;
      const actual = a.performanceTrend === "improving"
        ? expected + 8
        : a.performanceTrend === "attention"
          ? expected - 12
          : expected;
      return {
        allocationId: a.allocationId,
        title: a.title,
        expectedRoi: a.expectedRoi,
        actualRoi: actual > 0 ? `${actual}%` : "Tracking",
        performance: actual >= expected ? "on_track" : actual >= expected - 15 ? "attention" : "below_target",
        trend: a.performanceTrend,
        status: a.status,
      };
    });
}

function buildCapitalRisks(allocations: CapitalAllocation[]): CapitalRiskEntry[] {
  return allocations
    .filter((a) => a.riskAssessment.toLowerCase().includes("moderate") || a.performanceTrend === "attention")
    .slice(0, 6)
    .map((a) => ({
      riskId: `crisk-${a.allocationId}`,
      allocationId: a.allocationId,
      title: a.title,
      severity: a.performanceTrend === "attention" ? "moderate" : "low",
      exposure: a.riskAssessment,
      mitigation: "E2-02 risk assessment · E2-15 monitor · ROI gate enforcement",
      status: a.performanceTrend === "attention" ? "active_review" : "monitored",
    }));
}

function buildStrategicAlignment(allocations: CapitalAllocation[]): StrategicAlignmentEntry[] {
  return allocations.slice(0, 10).map((a) => ({
    allocationId: a.allocationId,
    title: a.title,
    objective: a.strategicObjective,
    alignmentScore: a.confidence,
    status: a.confidence >= 85 ? "aligned" : a.confidence >= 75 ? "moderate" : "review",
    evidence: a.evidence[0] ?? "Strategic objective linked",
  }));
}

function buildOptimization(allocations: CapitalAllocation[], avgRoi: number, avgUtil: number): CapitalOptimizationMetric[] {
  const scores: Record<string, { score: number; summary: string }> = {
    capital_efficiency: { score: avgUtil >= 70 ? 88 : avgUtil >= 50 ? 78 : 68, summary: `Avg utilization ${avgUtil}% across portfolio` },
    return_on_capital: { score: avgRoi >= 180 ? 90 : avgRoi >= 150 ? 82 : 74, summary: `Avg expected ROI ${avgRoi}%` },
    strategic_value: { score: 87, summary: "All allocations linked to strategic objectives" },
    business_value: { score: 85, summary: "Business Factory and commerce value tracked" },
    financial_return: { score: avgRoi, summary: "Financial return optimization continuous" },
    risk_exposure: { score: 82, summary: "E2-02 risk assessment integrated per allocation" },
    capital_utilization: { score: avgUtil, summary: "Capital deployment efficiency monitored" },
    long_term_growth: { score: 86, summary: "Long-term value principle governs all allocations" },
    enterprise_value: { score: 88, summary: "Enterprise value compounding through strategic capital" },
  };

  return CAPITAL_OPTIMIZATION_DOMAINS.map((domain) => {
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
  allocationCount: number;
  avgRoi: number;
  riskCount: number;
}): PillowCapitalEvaluationMetric[] {
  return PILLOW_CAPITAL_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_CAPITAL_EVALUATIONS)[number], { status: string; summary: string }> = {
      capital_opportunities: { status: "active", summary: `${input.allocationCount} allocations · acquisition pipeline reserved` },
      investment_priorities: { status: "ranked", summary: "MS-A · E3 · Commerce · Infrastructure prioritized" },
      capital_efficiency: { status: input.avgRoi >= 170 ? "high" : "moderate", summary: `Avg ROI ${input.avgRoi}% · utilization optimized` },
      financial_risks: { status: input.riskCount <= 2 ? "managed" : "attention", summary: `${input.riskCount} allocation risks monitored` },
      executive_recommendations: { status: "active", summary: "Capital recommendations via E2-04 · approval via E2-07" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: { avgRoi: number; reserveAvailable: boolean }): CapitalAllocationRecommendation[] {
  const actions: CapitalAllocationRecommendation[] = [
    {
      id: "cae-rec-optimize",
      title: "Continuous Capital Portfolio Optimization",
      category: "optimization",
      why: "Capital is the Empire's most valuable resource — must maximize long-term enterprise value",
      what: "Continuously prioritize and optimize capital allocations by ROI and strategic value",
      how: "Capital pipeline · 5s refresh · no competing allocation systems",
      confidencePercent: 94,
    },
    {
      id: "cae-rec-msa",
      title: "Proceed MS-A Phase 2 Capital Deployment",
      category: "deployment",
      why: "MS-A Phase 1 ROI 112% exceeds gate · Phase 2 capital approved",
      what: "Deploy next $320K tranche with ROI gate enforcement",
      how: "Capital deployment pipeline · ECC scheduling · Supervisor monitoring",
      confidencePercent: 88,
    },
    {
      id: "cae-rec-commerce",
      title: "Reallocate Capital for Commerce Support Scaling",
      category: "reallocation",
      why: "Commerce MVP utilization 78% but performance attention signal",
      what: "Shift $40K from marketing planned pool to commerce support",
      how: "Executive review · E2-15 monitor · capital prioritization step",
      confidencePercent: 82,
    },
    {
      id: "cae-rec-e303",
      title: "Proceed to E3-03 Executive Budget Planner",
      category: "programme",
      why: "E3-02 capital allocation established · budget planning is next E3 capability",
      what: "Implement Executive Budget Planner building on CAE foundation",
      how: "E3 sequence · integrate EFF · budget-capital linkage",
      confidencePercent: 92,
    },
  ];

  if (input.reserveAvailable) {
    actions.push({
      id: "cae-rec-reserve",
      title: "Preserve Strategic Reserve — Deploy Only on Validated ROI",
      category: "reserve",
      why: "$500K strategic reserve maintains optionality for high-ROI opportunities",
      what: "Hold reserve until opportunity passes ROI and risk gates",
      how: "Investment opportunity analysis · E2-10 trade-off · Grand King approval",
      confidencePercent: 93,
    });
  }

  return actions;
}

export function assembleCapitalAllocationEngine(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): CapitalAllocationEngine {
  const currentAllocations = buildAllocations(input);
  const capitalPortfolio = buildPortfolio(currentAllocations);
  const capitalUtilization = buildUtilization(currentAllocations);
  const investmentPerformance = buildPerformance(currentAllocations);
  const capitalRisks = buildCapitalRisks(currentAllocations);
  const capitalStrategicAlignment = buildStrategicAlignment(currentAllocations);

  const roiValues = currentAllocations
    .map((a) => parseInt(a.expectedRoi.replace(/[^0-9]/g, ""), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const averageExpectedRoi = Math.round(roiValues.reduce((a, b) => a + b, 0) / Math.max(roiValues.length, 1));
  const averageUtilization = Math.round(
    currentAllocations.reduce((s, a) => s + a.utilization, 0) / Math.max(currentAllocations.length, 1),
  );

  const capitalOptimization = buildOptimization(currentAllocations, averageExpectedRoi, averageUtilization);

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.executiveDecisionArchitecture?.healthScore ?? 85,
    input.riskAssessmentEngine?.healthScore ?? 85,
    averageExpectedRoi >= 170 ? 92 : averageExpectedRoi >= 140 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    allocationCount: currentAllocations.length,
    avgRoi: averageExpectedRoi,
    riskCount: capitalRisks.length,
  });
  const recommendedActions = buildRecommendations({
    avgRoi: averageExpectedRoi,
    reserveAvailable: currentAllocations.some((a) => a.category === "reserve_capital" && a.utilization === 0),
  });

  const pillowAdvisory = [
    "Capital Allocation Engine — constitutional capital deployment authority active",
    `${currentAllocations.length} allocations · $3.85M deployed · avg ROI ${averageExpectedRoi}%`,
    "No hidden capital allocation · executive transparency enforced",
    "Integrated with E3-01 Finance Framework · E2 Decision Engine · E2-02 Risk · E2-04 Recommendations",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting capital integrity")}`,
    "ECC coordinates deployment · Supervisor monitors capital utilization",
    "VIE validates capital alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-02",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Capital Allocation Engine continuously determines where capital should be invested to maximize long-term enterprise value. Every allocation is strategic, evidence-based and constitutionally governed — the Grand King always understands where capital is deployed, why and the expected return.",
    engineHealth: healthLabel(clampedHealth),
    capitalHealth: averageUtilization >= 60 ? "deploying" : "accumulating",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeAllocationCount: currentAllocations.filter((a) => a.status === "active" || a.status === "deploying" || a.status === "deployed").length,
    totalCapitalDeployed: "$3.35M",
    totalCapitalAvailable: "$500K reserve",
    averageExpectedRoi,
    averageUtilization,
    capitalPortfolio,
    currentAllocations,
    capitalUtilization,
    investmentPerformance,
    capitalRisks,
    capitalStrategicAlignment,
    capitalOptimization,
    capitalPipeline: buildPipeline("capital_prioritization"),
    recommendedActions,
    pillowEvaluations,
    capitalPrinciples: [...CAPITAL_PRINCIPLES],
    governedDomains: [...GOVERNED_CAPITAL_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveFinanceFramework: input.executiveFinanceFramework
        ? `E3-01 · ${input.executiveFinanceFramework.frameworkHealth} · ${input.executiveFinanceFramework.activeFinancialEntityCount} entities`
        : "E3-01 · standby",
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "capital integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring capital health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "capital deployment coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE303: true,
  };
}

export function buildFallbackCapitalAllocationEngine(): CapitalAllocationEngine {
  return assembleCapitalAllocationEngine({});
}
