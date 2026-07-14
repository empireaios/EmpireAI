import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { LongTermGrowthPlanner } from "../long-term-growth-planner/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  OPPORTUNITY_PIPELINE,
  OPPORTUNITY_PRINCIPLES,
  GOVERNED_OPPORTUNITY_DOMAINS,
  PRIORITIZATION_MODEL_DOMAINS,
  PILLOW_OPPORTUNITY_EVALUATIONS,
} from "./paths.js";
import type {
  OpportunityPrioritizationEngine,
  OpportunityPipelineStep,
  OpportunityPipelinePhase,
  RankedOpportunity,
  PrioritizationScoreBreakdown,
  OpportunityQueueItem,
  OpportunityPrioritizationRecommendation,
  PillowOpportunityEvaluationMetric,
  GovernedOpportunityDomain,
  OpportunityClassification,
  OpportunitySource,
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

const PRIORITIZATION_WEIGHTS: Record<string, number> = {
  strategic_value: 12,
  business_value: 10,
  commercial_value: 9,
  financial_return: 10,
  expected_roi: 10,
  engineering_complexity: 6,
  time_to_value: 8,
  dependencies: 7,
  risk: 7,
  capacity: 6,
  vision_alignment: 12,
  long_term_value: 8,
};

function computeScoreBreakdown(factors: Partial<Record<string, number>>): PrioritizationScoreBreakdown[] {
  return PRIORITIZATION_MODEL_DOMAINS.map((domain) => {
    const score = Math.min(100, Math.max(0, factors[domain] ?? 60));
    const weight = PRIORITIZATION_WEIGHTS[domain] ?? 5;
    return {
      domain,
      label: label(domain),
      score,
      weight,
      weightedScore: Math.round((score * weight) / 100),
    };
  });
}

function computeTotalScore(breakdown: PrioritizationScoreBreakdown[]): number {
  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);
  const weighted = breakdown.reduce((s, b) => s + b.score * b.weight, 0);
  return Math.round(weighted / Math.max(1, totalWeight));
}

function buildPipeline(activePhase: OpportunityPipelinePhase = "priority_scoring"): OpportunityPipelineStep[] {
  const activeIdx = OPPORTUNITY_PIPELINE.indexOf(activePhase);
  return OPPORTUNITY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildOpportunities(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
}): RankedOpportunity[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];
  const growthOpps = input.longTermGrowthPlanner?.strategicOpportunities ?? [];
  const priorities = input.priorityManagement?.currentPriorities ?? [];

  type CatalogueEntry = {
    id: string;
    title: string;
    description: string;
    category: OpportunityClassification;
    domain: GovernedOpportunityDomain;
    source: OpportunitySource;
    strategicObjective: string;
    businessValue: string;
    financialValue: string;
    engineeringValue: string;
    commercialValue: string;
    riskLevel: string;
    effort: string;
    deps: string[];
    roi: string;
    factors: Partial<Record<string, number>>;
    confidence: number;
    evidence: string[];
  };

  const catalogue: CatalogueEntry[] = [
    {
      id: "ope-e1-complete",
      title: "Complete E1 Executive Planning Programme",
      description: "Finish E1-12 through E1 programme completion before major expansion",
      category: "strategic",
      domain: "strategic_opportunities",
      source: "executive_roadmap",
      strategicObjective: objectives[0] ?? "E1 Executive Planning",
      businessValue: "critical",
      financialValue: "high strategic ROI",
      engineeringValue: "high",
      commercialValue: "moderate",
      riskLevel: "low",
      effort: "medium · sequential missions",
      deps: ["E1-01 through E1-11 complete"],
      roi: "very high · constitutional foundation",
      factors: {
        strategic_value: 95,
        business_value: 90,
        vision_alignment: 95,
        long_term_value: 92,
        expected_roi: 88,
        financial_return: 85,
        time_to_value: 80,
        risk: 85,
      },
      confidence: 92,
      evidence: ["E1 programme progress", "Executive architecture validated"],
    },
    {
      id: "ope-ms-a",
      title: "MS-A USD 100k Net Profit",
      description: "Achieve primary financial milestone through constitutional commerce execution",
      category: "revenue_growth",
      domain: "revenue_opportunities",
      source: "growth_planner",
      strategicObjective: "MS-A Financial Milestone",
      businessValue: "critical",
      financialValue: "USD 100k+ net profit",
      engineeringValue: "moderate",
      commercialValue: "critical",
      riskLevel: "medium",
      effort: "high · 18–36 months",
      deps: ["P8 Commerce", "Business Factory", "Grand King Account"],
      roi: "high · primary financial milestone",
      factors: {
        financial_return: 92,
        commercial_value: 90,
        expected_roi: 85,
        business_value: 88,
        strategic_value: 85,
        time_to_value: 55,
        risk: 60,
        engineering_complexity: 65,
      },
      confidence: 68,
      evidence: [
        growthOpps.find((g) => g.title.includes("MS-A"))?.expectedValue ?? "Growth planner · Scenario analysis",
      ],
    },
    {
      id: "ope-p8-commerce",
      title: "P8 Commerce Operating Model Acceleration",
      description: "Accelerate sell · fulfil · advertise · revenue · growth under constitutional governance",
      category: "commerce",
      domain: "commerce_opportunities",
      source: "pillow_discovery",
      strategicObjective: objectives[1] ?? "Commerce Growth",
      businessValue: "high",
      financialValue: "high",
      engineeringValue: "moderate",
      commercialValue: "critical",
      riskLevel: "medium",
      effort: "medium · ongoing",
      deps: ["Marketplace Integration", "Business Factory"],
      roi: "high · direct revenue path",
      factors: {
        commercial_value: 92,
        financial_return: 88,
        business_value: 85,
        expected_roi: 82,
        time_to_value: 70,
        strategic_value: 78,
      },
      confidence: 75,
      evidence: ["P8 programme active", "Commerce intelligence"],
    },
    {
      id: "ope-p9-evolution",
      title: "P9 Continuous Evolution Investment",
      description: "Compound capability through repository, knowledge, architecture and AI evolution",
      category: "technology",
      domain: "technology_opportunities",
      source: "growth_planner",
      strategicObjective: "P9 Empire Evolution",
      businessValue: "high",
      financialValue: "moderate",
      engineeringValue: "critical",
      commercialValue: "moderate",
      riskLevel: "low",
      effort: "medium · perpetual",
      deps: ["P9-01 Repository", "P9-03 Architecture", "P9-04 AI Evolution"],
      roi: "high · compounding long-term value",
      factors: {
        long_term_value: 92,
        engineering_complexity: 75,
        strategic_value: 88,
        vision_alignment: 90,
        expected_roi: 80,
        time_to_value: 65,
      },
      confidence: 82,
      evidence: ["P9 evolution engines", "Architecture health"],
    },
    {
      id: "ope-automation",
      title: "Zero-Human Automation Expansion",
      description: "Expand constitutionally governed automation across commerce and operations",
      category: "automation",
      domain: "automation_opportunities",
      source: "pillow_discovery",
      strategicObjective: "Operational Efficiency",
      businessValue: "high",
      financialValue: "moderate",
      engineeringValue: "high",
      commercialValue: "high",
      riskLevel: "low",
      effort: "medium",
      deps: ["Zero-Human Automation", "ECC", "Supervisor"],
      roi: "high · cost reduction + velocity",
      factors: {
        expected_roi: 85,
        business_value: 82,
        commercial_value: 80,
        engineering_complexity: 70,
        time_to_value: 75,
        financial_return: 82,
      },
      confidence: 78,
      evidence: ["Automation doctrine", "Production truth"],
    },
    {
      id: "ope-cost-reduction",
      title: "Infrastructure Cost Optimization",
      description: "Reduce operational costs through scaling architecture and guardian monitoring",
      category: "cost_reduction",
      domain: "cost_reduction_opportunities",
      source: "supervisor",
      strategicObjective: "Operational Efficiency",
      businessValue: "moderate",
      financialValue: "high · direct savings",
      engineeringValue: "moderate",
      commercialValue: "low",
      riskLevel: "low",
      effort: "low · incremental",
      deps: ["Guardian", "Infrastructure Commander", "Scaling Architecture"],
      roi: "moderate · immediate savings",
      factors: {
        financial_return: 78,
        expected_roi: 75,
        time_to_value: 85,
        risk: 90,
        engineering_complexity: 55,
        capacity: 80,
      },
      confidence: 80,
      evidence: ["Infrastructure health", "Guardian monitoring"],
    },
    {
      id: "ope-market-expansion",
      title: "Multi-Market Commerce Expansion",
      description: "Expand to additional markets and channels post MS-A foundation",
      category: "growth",
      domain: "market_opportunities",
      source: "growth_planner",
      strategicObjective: "Market Expansion",
      businessValue: "high",
      financialValue: "high",
      engineeringValue: "moderate",
      commercialValue: "critical",
      riskLevel: "medium",
      effort: "high · post MS-A",
      deps: ["MS-A foundation", "Marketplace integration"],
      roi: "high · revenue diversification",
      factors: {
        commercial_value: 88,
        business_value: 85,
        financial_return: 82,
        expected_roi: 78,
        time_to_value: 45,
        risk: 55,
        dependencies: 60,
      },
      confidence: 58,
      evidence: [
        growthOpps.find((g) => g.domain.includes("market"))?.expectedValue ?? "Growth planner analysis",
      ],
    },
    {
      id: "ope-innovation",
      title: "AI-Native Innovation Pipeline",
      description: "Evidence-backed innovation experiments aligned with vision and constitution",
      category: "innovation",
      domain: "innovation_opportunities",
      source: "pillow_discovery",
      strategicObjective: objectives[2] ?? "Innovation",
      businessValue: "moderate",
      financialValue: "moderate",
      engineeringValue: "high",
      commercialValue: "high",
      riskLevel: "medium",
      effort: "medium · experimental",
      deps: ["AI Evolution", "Knowledge Evolution", "Scenario Planner"],
      roi: "moderate · high upside",
      factors: {
        long_term_value: 85,
        strategic_value: 80,
        engineering_complexity: 72,
        expected_roi: 70,
        vision_alignment: 82,
        risk: 55,
      },
      confidence: 65,
      evidence: ["Innovation planning", "Scenario simulations"],
    },
    {
      id: "ope-architecture",
      title: "Architecture Consolidation Opportunity",
      description: "Consolidate competing systems into canonical architecture under E1 programme",
      category: "architecture",
      domain: "architecture_opportunities",
      source: "executive_roadmap",
      strategicObjective: "Canonical Architecture",
      businessValue: "high",
      financialValue: "moderate",
      engineeringValue: "critical",
      commercialValue: "low",
      riskLevel: "low",
      effort: "medium · ongoing",
      deps: ["E1 Executive Planning", "Architecture Evolution"],
      roi: "high · reduced complexity",
      factors: {
        engineering_complexity: 88,
        strategic_value: 85,
        long_term_value: 90,
        vision_alignment: 88,
        risk: 85,
        time_to_value: 70,
      },
      confidence: 88,
      evidence: ["No competing systems doctrine", "E1 consolidation"],
    },
    {
      id: "ope-engineering",
      title: "Builder Velocity Enhancement",
      description: "Increase Builder execution velocity through ETA engine and recovery doctrine",
      category: "engineering",
      domain: "engineering_opportunities",
      source: "supervisor",
      strategicObjective: "Execution Velocity",
      businessValue: "high",
      financialValue: "moderate",
      engineeringValue: "critical",
      commercialValue: "moderate",
      riskLevel: "low",
      effort: "medium",
      deps: ["Builder", "ETA Engine", "Recovery Doctrine"],
      roi: "high · faster mission completion",
      factors: {
        business_value: 82,
        engineering_complexity: 78,
        time_to_value: 88,
        expected_roi: 80,
        capacity: 75,
        strategic_value: 78,
      },
      confidence: 84,
      evidence: ["Builder monitor", "Supervisor status"],
    },
  ];

  for (const pri of priorities.slice(0, 3)) {
    if (catalogue.some((c) => c.title === pri.title)) continue;
    catalogue.push({
      id: `ope-pri-${pri.priorityId}`,
      title: pri.title,
      description: pri.purpose,
      category: "strategic",
      domain: "strategic_opportunities",
      source: "priority_management",
      strategicObjective: objectives[0] ?? "E1 Executive Planning",
      businessValue: pri.businessImpact,
      financialValue: pri.financialImpact,
      engineeringValue: pri.engineeringImpact,
      commercialValue: pri.commercialImpact,
      riskLevel: pri.riskLevel,
      effort: pri.urgency,
      deps: pri.dependencies,
      roi: pri.currentScore >= 80 ? "high" : "moderate",
      factors: {
        strategic_value: pri.currentScore,
        business_value: pri.currentScore - 5,
        expected_roi: pri.currentScore - 10,
        vision_alignment: pri.currentScore,
      },
      confidence: pri.confidence,
      evidence: pri.supportingEvidence,
    });
  }

  const opportunities = catalogue.map((c) => {
    const scoreBreakdown = computeScoreBreakdown(c.factors);
    const priorityScore = computeTotalScore(scoreBreakdown);
    return {
      opportunityId: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      domain: c.domain,
      source: c.source,
      strategicObjective: c.strategicObjective,
      expectedBusinessValue: c.businessValue,
      expectedFinancialValue: c.financialValue,
      expectedEngineeringValue: c.engineeringValue,
      expectedCommercialValue: c.commercialValue,
      riskLevel: c.riskLevel,
      estimatedEffort: c.effort,
      dependencies: c.deps,
      expectedRoi: c.roi,
      priorityScore,
      confidence: c.confidence,
      evidence: c.evidence,
      scoreBreakdown,
      recommendedOrder: 0,
      strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "aligned"),
    };
  });

  return opportunities
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((o, i) => ({ ...o, recommendedOrder: i + 1 }));
}

function buildQueue(opportunities: RankedOpportunity[]): OpportunityQueueItem[] {
  return opportunities.slice(0, 8).map((o) => ({
    order: o.recommendedOrder,
    opportunityId: o.opportunityId,
    title: o.title,
    category: o.category,
    priorityScore: o.priorityScore,
    expectedRoi: o.expectedRoi,
    owner: o.source === "supervisor" ? "Supervisor" : o.source === "ecc" ? "ECC" : "Executive",
    eta: o.estimatedEffort.includes("month") ? o.estimatedEffort : "ongoing",
  }));
}

function buildRecommendations(input: {
  opportunities: RankedOpportunity[];
  corporateVision?: CorporateVisionEngine | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
}): OpportunityPrioritizationRecommendation[] {
  const top = input.opportunities[0];
  const highRoi = input.opportunities.filter((o) => o.priorityScore >= 80).slice(0, 3);

  return [
    {
      id: "ope-rec-1",
      title: top ? `Pursue highest-value opportunity: ${top.title}` : "Evaluate opportunity queue",
      category: "highest_roi",
      why: "Opportunity Prioritization Engine ranks by strategic value, ROI and constitutional alignment",
      what: top?.description ?? "Review opportunity queue",
      how: "Executive approval · ECC scheduling · Roadmap integration",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "ope-rec-2",
      title: "Focus resources on top 3 ranked opportunities",
      category: "resource_allocation",
      why: "Empire shall continuously focus on highest-value opportunities · no opportunity drift",
      what: highRoi.map((o) => o.title).join(" · ") || "Top ranked opportunities",
      how: "Priority Management · ECC · Supervisor queue monitoring",
      confidencePercent: 88,
    },
    {
      id: "ope-rec-3",
      title: "Synchronize opportunities with long-term growth horizons",
      category: "growth_alignment",
      why: "E1-11 multi-year growth plan provides horizon context for opportunity timing",
      what: input.longTermGrowthPlanner
        ? `${input.longTermGrowthPlanner.growthInitiatives.length} growth initiatives · ${input.longTermGrowthPlanner.planningHorizons.length} horizons`
        : "Align with growth planner",
      how: "Long-Term Growth Planner · Executive Roadmap integration",
      confidencePercent: 82,
    },
    {
      id: "ope-rec-4",
      title: "Maintain vision alignment for all ranked opportunities",
      category: "vision_alignment",
      why: "Every opportunity must pass VIE constitutional validation before execution",
      what: `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
      how: "VIE validation · Evidence collection · Continuous ranking",
      confidencePercent: 90,
    },
  ];
}

function buildPillowEvaluations(input: {
  opportunities: RankedOpportunity[];
  recommendations: OpportunityPrioritizationRecommendation[];
  healthScore: number;
}): PillowOpportunityEvaluationMetric[] {
  const topOpp = input.opportunities[0];
  const topScore = topOpp?.priorityScore ?? 0;

  const values: Record<string, { status: string; summary: string }> = {
    new_opportunities: {
      status: input.opportunities.length >= 8 ? "strong" : "building",
      summary: `${input.opportunities.length} opportunities discovered · continuous discovery active`,
    },
    strategic_opportunities: {
      status: input.opportunities.filter((o) => o.category === "strategic").length ? "ranked" : "evaluating",
      summary: `${input.opportunities.filter((o) => o.domain.includes("strategic")).length} strategic opportunities ranked`,
    },
    business_opportunities: {
      status: "active",
      summary: `${input.opportunities.filter((o) => o.category === "business" || o.category === "growth").length} business opportunities evaluated`,
    },
    commercial_opportunities: {
      status: input.opportunities.some((o) => o.category === "commerce" || o.category === "revenue_growth")
        ? "ranked"
        : "evaluating",
      summary: `${input.opportunities.filter((o) => o.domain.includes("commerce") || o.domain.includes("revenue")).length} commercial opportunities`,
    },
    technology_opportunities: {
      status: "active",
      summary: `${input.opportunities.filter((o) => o.category === "technology" || o.category === "engineering" || o.category === "automation").length} technology opportunities`,
    },
    highest_roi: {
      status: topScore >= 80 ? "identified" : "evaluating",
      summary: `Top ROI: ${topOpp?.title ?? "evaluating"} · score ${topScore}`,
    },
    executive_recommendations: {
      status: input.recommendations.length >= 3 ? "strong" : "building",
      summary: `${input.recommendations.length} evidence-based opportunity recommendations`,
    },
  };

  return PILLOW_OPPORTUNITY_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow opportunity evaluation active",
  }));
}

export function assembleOpportunityPrioritizationEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): OpportunityPrioritizationEngine {
  const allOpportunities = buildOpportunities(input);
  const highestPriorityOpportunities = allOpportunities.slice(0, 6);
  const opportunityQueue = buildQueue(allOpportunities);
  const recommendedActions = buildRecommendations({ ...input, opportunities: allOpportunities });

  const topScore = allOpportunities[0]?.priorityScore ?? 0;
  const avgScore = allOpportunities.length
    ? Math.round(allOpportunities.reduce((s, o) => s + o.priorityScore, 0) / allOpportunities.length)
    : 0;

  const healthScore = Math.round(
    (topScore +
      avgScore +
      (input.corporateVision?.healthScore ?? 80) +
      (input.longTermGrowthPlanner?.healthScore ?? 75)) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    opportunities: allOpportunities,
    recommendations: recommendedActions,
    healthScore,
  });

  const sampleBreakdown = allOpportunities[0]?.scoreBreakdown ?? computeScoreBreakdown({});

  const pillowAdvisory = [
    `Engine health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${allOpportunities.length} opportunities ranked · continuous discovery · no opportunity drift`,
    `Top opportunity: ${allOpportunities[0]?.title ?? "evaluating"} · score ${topScore}`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing opportunity systems · one constitutional prioritization engine`,
    `Ready for E1-13 Strategic Alignment Monitor`,
  ];

  return {
    architectureVersion: "E1-12",
    computedAt: new Date().toISOString(),
    engineSummary:
      "One permanent Opportunity Prioritization Engine — continuously discovers, evaluates and ranks strategic opportunities according to business value, ROI, strategic alignment and constitutional governance",
    engineHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activeOpportunityCount: allOpportunities.length,
    topOpportunityScore: topScore,
    highestPriorityOpportunities,
    allOpportunities,
    opportunityQueue,
    opportunityPipeline: buildPipeline("executive_recommendation"),
    prioritizationModel: sampleBreakdown,
    recommendedActions,
    pillowEvaluations,
    opportunityPrinciples: [...OPPORTUNITY_PRINCIPLES],
    governedDomains: [...GOVERNED_OPPORTUNITY_DOMAINS],
    pillowAdvisory,
    integrations: {
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      strategicObjectiveEngine: input.strategicObjectives
        ? `E1-03 · ${input.strategicObjectives.objectiveHealth}`
        : "standby",
      executiveRoadmapEngine: input.executiveRoadmap
        ? `E1-04 · ${input.executiveRoadmap.roadmapHealth}`
        : "standby",
      priorityManagementEngine: input.priorityManagement
        ? `E1-05 · ${input.priorityManagement.priorityHealth}`
        : "standby",
      longTermGrowthPlanner: input.longTermGrowthPlanner
        ? `E1-11 · ${input.longTermGrowthPlanner.plannerHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring queue"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "opportunity execution"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE113: true,
  };
}

export function buildFallbackOpportunityPrioritizationEngine(): OpportunityPrioritizationEngine {
  return assembleOpportunityPrioritizationEngine({});
}
