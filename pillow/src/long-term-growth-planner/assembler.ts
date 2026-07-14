import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { ExecutiveScenarioPlanner } from "../executive-scenario-planner/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  GROWTH_HIERARCHY,
  GROWTH_PLANNING_PIPELINE,
  PLANNING_HORIZONS,
  GROWTH_PRINCIPLES,
  GOVERNED_GROWTH_DOMAINS,
  GROWTH_ANALYSIS_DOMAINS,
  PILLOW_GROWTH_EVALUATIONS,
} from "./paths.js";
import type {
  LongTermGrowthPlanner,
  GrowthHierarchyStep,
  GrowthPipelineStep,
  GrowthPlanningPhase,
  PlanningHorizonView,
  GrowthInitiative,
  GrowthAnalysisMetric,
  GrowthRiskItem,
  GrowthOpportunityItem,
  InvestmentPipelineItem,
  ExpansionTimelineItem,
  GrowthPlannerRecommendation,
  PillowGrowthEvaluationMetric,
  GovernedGrowthDomain,
  PlanningHorizon,
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

function buildHierarchy(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
}): GrowthHierarchyStep[] {
  const summaries: Record<string, string> = {
    vision: input.corporateVision?.visionSummary ?? "Constitutional vision · perpetual Empire evolution",
    strategic_objectives: `${input.strategicObjectives?.currentStrategicObjectives.length ?? 3} measurable objectives active`,
    executive_roadmap: input.executiveRoadmap?.roadmapSummary ?? "E1 Executive Planning programme active",
    growth_strategy: "Multi-year sustainable growth under constitutional governance",
    growth_programmes: "E1 completion · P8 commerce · P9 evolution · MS-A milestone",
    growth_initiatives: "Capability expansion · market expansion · technology evolution",
    execution: "Builder · Supervisor · ECC · Journey coordinated execution",
    empire_expansion: "Long-term enterprise scale · global market readiness",
  };
  return GROWTH_HIERARCHY.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? label(layer),
  }));
}

function buildPipeline(activePhase: GrowthPlanningPhase = "roadmap_planning"): GrowthPipelineStep[] {
  const activeIdx = GROWTH_PLANNING_PIPELINE.indexOf(activePhase);
  return GROWTH_PLANNING_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildPlanningHorizons(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
}): PlanningHorizonView[] {
  const visionSync = String(input.corporateVision?.visionAlignment ?? "aligned");
  const scenarioCount = input.executiveScenarioPlanner?.availableScenarioCount ?? 0;
  const horizons: Array<{ horizon: PlanningHorizon; timeframe: string; summary: string; status: string }> = [
    {
      horizon: "current_quarter",
      timeframe: "Q current",
      summary: "E1-11 Long-Term Growth Planner · E1 programme completion",
      status: "active",
    },
    {
      horizon: "current_year",
      timeframe: "2026",
      summary: "Complete E1 Executive Planning · MS-A commerce foundation · P9 evolution",
      status: "active",
    },
    {
      horizon: "three_year_outlook",
      timeframe: "2026–2029",
      summary: "USD 100k net profit · multi-business portfolio · constitutional automation",
      status: "planned",
    },
    {
      horizon: "five_year_outlook",
      timeframe: "2026–2031",
      summary: "Enterprise scale · market expansion · AI-native operations",
      status: "planned",
    },
    {
      horizon: "ten_year_vision",
      timeframe: "2026–2036",
      summary: "Self-evolving Empire · global commerce · perpetual constitutional growth",
      status: "vision",
    },
    {
      horizon: "future_horizons",
      timeframe: "Beyond 2036",
      summary: `${scenarioCount} scenarios simulated · continuous horizon extension`,
      status: "exploratory",
    },
  ];
  return horizons.map((h) => ({
    ...h,
    label: label(h.horizon),
    visionSync,
  }));
}

function buildGrowthInitiatives(input: {
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
}): GrowthInitiative[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];
  const priorities = input.priorityManagement?.currentPriorities.slice(0, 2).map((p) => p.title) ?? [];
  const recommendedScenario = input.executiveScenarioPlanner?.recommendedScenario?.title ?? "E1 completion path";

  const catalogue: Array<Omit<GrowthInitiative, "growthId"> & { id: string }> = [
    {
      id: "ltgp-e1-complete",
      title: "E1 Executive Planning Completion",
      purpose: "Establish permanent executive planning infrastructure through E1-12",
      strategicObjective: objectives[0] ?? "E1 Executive Planning",
      domain: "growth_objectives",
      expectedValue: "high strategic ROI · constitutional governance",
      businessImpact: "critical",
      financialImpact: "foundation for revenue growth",
      engineeringImpact: "high",
      commercialImpact: "moderate",
      dependencies: ["E1-01 through E1-10 complete"],
      resources: ["Builder", "Pillow", "Executive Cockpit"],
      targetTimeline: "current_year",
      successCriteria: ["E1-12 complete", "All E1 engines operational"],
      confidence: 90,
      evidence: ["E1 programme progress", "Executive architecture validated"],
      horizon: "current_year",
      priority: "critical",
    },
    {
      id: "ltgp-ms-a",
      title: "MS-A USD 100k Net Profit",
      purpose: "Achieve primary financial milestone through constitutional commerce",
      strategicObjective: "MS-A Financial Milestone",
      domain: "growth_investments",
      expectedValue: "USD 100k+ net profit",
      businessImpact: "critical",
      financialImpact: "critical",
      engineeringImpact: "moderate",
      commercialImpact: "critical",
      dependencies: ["P8 Commerce Operating Model", "Business Factory", "Grand King Account"],
      resources: ["Commerce team", "Automation", "Marketplace integration"],
      targetTimeline: "three_year_outlook",
      successCriteria: ["USD 100k net profit achieved", "Sustainable revenue model"],
      confidence: 65,
      evidence: [recommendedScenario, "Commerce intelligence", "Scenario simulations"],
      horizon: "three_year_outlook",
      priority: "high",
    },
    {
      id: "ltgp-p9-evolution",
      title: "P9 Continuous Evolution Programme",
      purpose: "Perpetual repository, knowledge, architecture and AI improvement",
      strategicObjective: objectives[1] ?? "P9 Empire Evolution",
      domain: "technology_evolution",
      expectedValue: "compounding capability · reduced technical debt",
      businessImpact: "high",
      financialImpact: "moderate",
      engineeringImpact: "critical",
      commercialImpact: "moderate",
      dependencies: ["P9-01 Repository", "P9-03 Architecture", "P9-04 AI Evolution"],
      resources: ["Builder", "Technical Chief", "Guardian"],
      targetTimeline: "five_year_outlook",
      successCriteria: ["Zero knowledge loss", "Architecture drift managed"],
      confidence: 82,
      evidence: ["P9 programme active", "Evolution engines operational"],
      horizon: "five_year_outlook",
      priority: "high",
    },
    {
      id: "ltgp-market-expansion",
      title: "Global Market Expansion",
      purpose: "Expand commerce operations to additional markets and channels",
      strategicObjective: "Market Expansion",
      domain: "market_expansion",
      expectedValue: "revenue diversification · market share",
      businessImpact: "high",
      financialImpact: "high",
      engineeringImpact: "moderate",
      commercialImpact: "critical",
      dependencies: ["MS-A foundation", "Marketplace integration", "Commerce automation"],
      resources: ["Commerce intelligence", "Business Factory", "Marketing automation"],
      targetTimeline: "five_year_outlook",
      successCriteria: ["Multi-market presence", "Channel diversification"],
      confidence: 55,
      evidence: ["Market analysis", "Commerce readiness"],
      horizon: "five_year_outlook",
      priority: "medium",
    },
    {
      id: "ltgp-enterprise-scale",
      title: "Enterprise Scale Infrastructure",
      purpose: "Scale infrastructure, capacity and executive systems for enterprise growth",
      strategicObjective: "Enterprise Scale",
      domain: "enterprise_scale",
      expectedValue: "operational capacity · reduced friction",
      businessImpact: "high",
      financialImpact: "moderate",
      engineeringImpact: "critical",
      commercialImpact: "moderate",
      dependencies: ["Infrastructure Commander", "Scaling Architecture", "Guardian"],
      resources: ["Infrastructure", "ECC", "Supervisor"],
      targetTimeline: "three_year_outlook",
      successCriteria: ["Auto-scaling operational", "Zero-downtime deployments"],
      confidence: 78,
      evidence: ["Infrastructure health", "Production truth validated"],
      horizon: "three_year_outlook",
      priority: "high",
    },
    {
      id: "ltgp-innovation",
      title: "Innovation Planning Programme",
      purpose: "Continuous innovation pipeline aligned with vision and constitution",
      strategicObjective: objectives[2] ?? "Innovation",
      domain: "innovation_planning",
      expectedValue: "competitive advantage · new capabilities",
      businessImpact: "moderate",
      financialImpact: "moderate",
      engineeringImpact: "high",
      commercialImpact: "high",
      dependencies: ["AI Evolution", "Knowledge Evolution", "Scenario Planner"],
      resources: ["Pillow", "Builder", "Executive Council"],
      targetTimeline: "ten_year_vision",
      successCriteria: ["Innovation pipeline active", "Evidence-backed experiments"],
      confidence: 70,
      evidence: ["Scenario simulations", "Growth opportunity analysis"],
      horizon: "ten_year_vision",
      priority: "medium",
    },
    {
      id: "ltgp-capability",
      title: "Capability Expansion",
      purpose: "Expand departmental and executive capabilities for sustainable growth",
      strategicObjective: "Capability Expansion",
      domain: "capability_expansion",
      expectedValue: "organizational capacity · execution velocity",
      businessImpact: "high",
      financialImpact: "moderate",
      engineeringImpact: "high",
      commercialImpact: "moderate",
      dependencies: priorities.length ? priorities : ["Department Planning", "Initiative Portfolio"],
      resources: ["Department Planning Engine", "Executive Calendar"],
      targetTimeline: "current_year",
      successCriteria: ["Department alignment", "Capacity visibility"],
      confidence: 85,
      evidence: ["Department planning active", "Portfolio coverage"],
      horizon: "current_year",
      priority: "high",
    },
    {
      id: "ltgp-empire-expansion",
      title: "Empire Expansion — Ten-Year Vision",
      purpose: "Long-term Empire evolution toward self-sustaining global enterprise",
      strategicObjective: "Empire Expansion",
      domain: "growth_vision",
      expectedValue: "generational enterprise value",
      businessImpact: "critical",
      financialImpact: "critical",
      engineeringImpact: "critical",
      commercialImpact: "critical",
      dependencies: ["All E1 engines", "P8 Commerce", "P9 Evolution", "MS-A"],
      resources: ["Full Empire stack", "Grand King governance"],
      targetTimeline: "ten_year_vision",
      successCriteria: ["Self-evolving Empire", "Constitutional perpetual growth"],
      confidence: 60,
      evidence: ["Vision alignment", "Multi-horizon planning", "Scenario analysis"],
      horizon: "ten_year_vision",
      priority: "strategic",
    },
  ];

  return catalogue.map((c) => ({
    growthId: c.id,
    title: c.title,
    purpose: c.purpose,
    strategicObjective: c.strategicObjective,
    domain: c.domain,
    expectedValue: c.expectedValue,
    businessImpact: c.businessImpact,
    financialImpact: c.financialImpact,
    engineeringImpact: c.engineeringImpact,
    commercialImpact: c.commercialImpact,
    dependencies: c.dependencies,
    resources: c.resources,
    targetTimeline: c.targetTimeline,
    successCriteria: c.successCriteria,
    confidence: c.confidence,
    evidence: c.evidence,
    horizon: c.horizon,
    priority: c.priority,
  }));
}

function buildGrowthRoadmap(initiatives: GrowthInitiative[]): ExpansionTimelineItem[] {
  const byHorizon: Record<string, GrowthInitiative[]> = {};
  for (const init of initiatives) {
    const bucket = byHorizon[init.horizon] ?? [];
    bucket.push(init);
    byHorizon[init.horizon] = bucket;
  }
  const order: PlanningHorizon[] = [
    "current_quarter",
    "current_year",
    "three_year_outlook",
    "five_year_outlook",
    "ten_year_vision",
    "future_horizons",
  ];
  return order
    .filter((h) => byHorizon[h]?.length)
    .map((h) => {
      const items = byHorizon[h]!;
      return {
        period: label(h),
        horizon: h,
        milestone: items[0]?.title ?? label(h),
        programmes: items.map((i) => i.title),
        status: h === "current_quarter" || h === "current_year" ? "active" : "planned",
      };
    });
}

function buildInvestmentPipeline(initiatives: GrowthInitiative[]): InvestmentPipelineItem[] {
  return initiatives
    .filter((i) => i.domain === "growth_investments" || i.financialImpact === "critical" || i.financialImpact === "high")
    .slice(0, 6)
    .map((i) => ({
      investmentId: i.growthId,
      title: i.title,
      category: label(i.domain),
      amount: i.expectedValue.includes("USD") ? i.expectedValue : "TBD · evidence-backed",
      timeline: label(i.horizon),
      expectedRoi: i.confidence >= 80 ? "high" : i.confidence >= 60 ? "moderate" : "evaluating",
      status: i.priority === "critical" ? "approved" : "planned",
    }));
}

function buildGrowthAnalysis(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiatives: GrowthInitiative[];
}): GrowthAnalysisMetric[] {
  const avgConfidence = input.initiatives.length
    ? Math.round(input.initiatives.reduce((s, i) => s + i.confidence, 0) / input.initiatives.length)
    : 70;
  const scenarioSuccess = input.executiveScenarioPlanner?.recommendedScenario?.successProbability ?? 70;

  const blockingCount =
    input.priorityManagement?.currentPriorities.filter(
      (p) => p.riskLevel === "high" || p.riskLevel === "critical",
    ).length ?? 0;

  const values: Record<string, { value: string; status: string }> = {
    growth_capacity: {
      value: `${avgConfidence}% average confidence · ${input.initiatives.length} initiatives`,
      status: avgConfidence >= 75 ? "strong" : "building",
    },
    growth_constraints: {
      value: blockingCount ? `${blockingCount} high-risk priorities` : "No critical blockers",
      status: blockingCount ? "attention" : "managed",
    },
    market_expansion: {
      value: "Multi-market readiness · post MS-A",
      status: "planned",
    },
    technology_readiness: {
      value: "P9 evolution active · Builder operational",
      status: "strong",
    },
    resource_availability: {
      value: "Builder · Pillow · ECC · Supervisor coordinated",
      status: "available",
    },
    capital_requirements: {
      value: "MS-A milestone · moderate investment phase",
      status: "planned",
    },
    business_readiness: {
      value: String(input.corporateVision?.visionHealth ?? "building"),
      status: "building",
    },
    strategic_alignment: {
      value: String(input.strategicObjectives?.visionAlignment ?? "aligned"),
      status: "aligned",
    },
    expected_roi: {
      value: `${scenarioSuccess}% scenario success · sustainable growth model`,
      status: scenarioSuccess >= 70 ? "positive" : "evaluating",
    },
  };

  return GROWTH_ANALYSIS_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "evaluating",
    status: values[domain]?.status ?? "building",
  }));
}

function buildOpportunities(initiatives: GrowthInitiative[]): GrowthOpportunityItem[] {
  return initiatives
    .filter((i) => i.confidence >= 60)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6)
    .map((i) => ({
      opportunityId: i.growthId,
      title: i.title,
      domain: i.domain,
      expectedValue: i.expectedValue,
      horizon: label(i.horizon),
      confidence: i.confidence,
    }));
}

function buildGrowthRisks(input: {
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
  priorityManagement?: PriorityManagementEngine | null;
}): GrowthRiskItem[] {
  const risks: GrowthRiskItem[] = [];
  const worstScenario = input.executiveScenarioPlanner?.availableScenarios.find(
    (s) => s.scenarioType === "worst_case",
  );
  if (worstScenario) {
    risks.push({
      riskId: "risk-scenario-worst",
      title: worstScenario.title,
      severity: "high",
      horizon: "three_year_outlook",
      mitigation: "Scenario replanning · Recovery Doctrine · Priority Management",
    });
  }
  if (input.priorityManagement?.currentPriorities.some((p) => p.riskLevel === "high" || p.riskLevel === "critical")) {
    risks.push({
      riskId: "risk-blocking-priorities",
      title: "High-risk priorities constrain growth velocity",
      severity: "medium",
      horizon: "current_year",
      mitigation: "Priority Management Engine · Executive approval",
    });
  }
  risks.push(
    {
      riskId: "risk-uncontrolled-growth",
      title: "Uncontrolled expansion without constitutional governance",
      severity: "high",
      horizon: "five_year_outlook",
      mitigation: "No Uncontrolled Growth principle · VIE validation",
    },
    {
      riskId: "risk-capital-strain",
      title: "Capital requirements exceed runway before MS-A",
      severity: "medium",
      horizon: "three_year_outlook",
      mitigation: "Investment pipeline · Scenario planning · Conservative path",
    },
  );
  return risks;
}

function buildRecommendations(input: {
  initiatives: GrowthInitiative[];
  corporateVision?: CorporateVisionEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
}): GrowthPlannerRecommendation[] {
  const topInitiative = input.initiatives.find((i) => i.priority === "critical") ?? input.initiatives[0];
  const scenarioRec = input.executiveScenarioPlanner?.recommendedScenario?.title ?? "E1 completion path";

  return [
    {
      id: "ltgp-rec-1",
      title: "Complete E1 Executive Planning before major expansion",
      category: "growth_strategy",
      why: "Constitutional executive planning infrastructure enables sustainable multi-year growth",
      what: "Complete E1-12 Opportunity Prioritization Engine · validate all E1 engines",
      how: "Sequential E1 missions · Executive approval · Journey recording",
      confidencePercent: 92,
    },
    {
      id: "ltgp-rec-2",
      title: `Align growth path with scenario recommendation: ${scenarioRec}`,
      category: "scenario_alignment",
      why: "E1-10 simulated multiple futures · evidence-backed path selected",
      what: "Synchronize growth roadmap with recommended scenario outcomes",
      how: "Executive Scenario Planner · Long-Term Growth Planner integration",
      confidencePercent: input.executiveScenarioPlanner?.recommendedScenario?.confidence ?? 85,
    },
    {
      id: "ltgp-rec-3",
      title: topInitiative ? `Prioritize: ${topInitiative.title}` : "Prioritize E1 completion",
      category: "investment_priority",
      why: "Critical growth initiative with highest strategic value",
      what: topInitiative?.purpose ?? "Establish executive planning foundation",
      how: "Priority Management · ECC scheduling · Supervisor monitoring",
      confidencePercent: topInitiative?.confidence ?? 80,
    },
    {
      id: "ltgp-rec-4",
      title: "Maintain vision synchronization across all planning horizons",
      category: "vision_alignment",
      why: "Every horizon must remain synchronized with constitutional vision",
      what: "Review quarterly growth alignment · VIE validation",
      how: "Corporate Vision Engine · VIE · Continuous Growth Review pipeline phase",
      confidencePercent: 88,
    },
  ];
}

function buildPillowEvaluations(input: {
  initiatives: GrowthInitiative[];
  opportunities: GrowthOpportunityItem[];
  risks: GrowthRiskItem[];
  recommendations: GrowthPlannerRecommendation[];
  healthScore: number;
}): PillowGrowthEvaluationMetric[] {
  const values: Record<string, { status: string; summary: string }> = {
    growth_opportunities: {
      status: input.opportunities.length >= 4 ? "strong" : "building",
      summary: `${input.opportunities.length} strategic opportunities identified across horizons`,
    },
    growth_risks: {
      status: input.risks.some((r) => r.severity === "high") ? "evaluated" : "managed",
      summary: `${input.risks.length} growth risks tracked · mitigation active`,
    },
    growth_readiness: {
      status: input.healthScore >= 75 ? "ready" : "building",
      summary: `Growth readiness ${input.healthScore}/100 · multi-horizon planning active`,
    },
    strategic_expansion: {
      status: input.initiatives.filter((i) => i.domain === "market_expansion" || i.domain === "enterprise_scale").length
        ? "planned"
        : "evaluating",
      summary: "Market and enterprise expansion programmes mapped to horizons",
    },
    investment_priorities: {
      status: "active",
      summary: `${input.initiatives.filter((i) => i.financialImpact === "critical" || i.financialImpact === "high").length} investment priorities in pipeline`,
    },
    executive_recommendations: {
      status: input.recommendations.length >= 3 ? "strong" : "building",
      summary: `${input.recommendations.length} evidence-based growth recommendations`,
    },
  };

  return PILLOW_GROWTH_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow growth evaluation active",
  }));
}

export function assembleLongTermGrowthPlanner(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): LongTermGrowthPlanner {
  const growthInitiatives = buildGrowthInitiatives(input);
  const growthObjectives = growthInitiatives.filter(
    (i) => i.domain === "growth_objectives" || i.domain === "growth_vision",
  );
  const growthRoadmap = buildGrowthRoadmap(growthInitiatives);
  const investmentPipeline = buildInvestmentPipeline(growthInitiatives);
  const planningHorizons = buildPlanningHorizons(input);
  const growthAnalysis = buildGrowthAnalysis({ ...input, initiatives: growthInitiatives });
  const strategicOpportunities = buildOpportunities(growthInitiatives);
  const growthRisks = buildGrowthRisks(input);
  const recommendedActions = buildRecommendations({ ...input, initiatives: growthInitiatives });

  const healthScore = Math.round(
    (growthInitiatives.reduce((s, i) => s + i.confidence, 0) / Math.max(growthInitiatives.length, 1) +
      (input.corporateVision?.healthScore ?? 80) +
      (input.executiveScenarioPlanner?.healthScore ?? 75) +
      (input.strategicObjectives?.healthScore ?? 80)) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    initiatives: growthInitiatives,
    opportunities: strategicOpportunities,
    risks: growthRisks,
    recommendations: recommendedActions,
    healthScore,
  });

  const avgConfidence = Math.round(
    growthInitiatives.reduce((s, i) => s + i.confidence, 0) / Math.max(growthInitiatives.length, 1),
  );

  const pillowAdvisory = [
    `Planner health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${growthInitiatives.length} growth initiatives across ${planningHorizons.length} planning horizons`,
    `Growth capacity: ${avgConfidence}% average confidence · ${strategicOpportunities.length} opportunities`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing long-term planning systems · one constitutional growth framework`,
    `Ready for E1-12 Opportunity Prioritization Engine`,
  ];

  return {
    architectureVersion: "E1-11",
    computedAt: new Date().toISOString(),
    plannerSummary:
      "One permanent Long-Term Growth Planner — constitutional framework for sustainable multi-year growth, enabling the Empire to continuously plan, expand and evolve while remaining aligned with the Vision and Constitution",
    plannerHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    growthCapacity: `${avgConfidence}% · ${growthInitiatives.length} initiatives · ${planningHorizons.length} horizons`,
    growthReadiness: healthScore >= 75 ? "ready for multi-year planning" : "building growth foundation",
    growthHierarchy: buildHierarchy(input),
    growthPipeline: buildPipeline("roadmap_planning"),
    planningHorizons,
    growthRoadmap,
    growthObjectives,
    growthInitiatives,
    investmentPipeline,
    growthAnalysis,
    strategicOpportunities,
    growthRisks,
    recommendedActions,
    pillowEvaluations,
    growthPrinciples: [...GROWTH_PRINCIPLES],
    governedDomains: [...GOVERNED_GROWTH_DOMAINS],
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
      executiveScenarioPlanner: input.executiveScenarioPlanner
        ? `E1-10 · ${input.executiveScenarioPlanner.plannerHealth}`
        : "standby",
      priorityManagementEngine: input.priorityManagement
        ? `E1-05 · ${input.priorityManagement.priorityHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "growth programme coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE112: true,
  };
}

export function buildFallbackLongTermGrowthPlanner(): LongTermGrowthPlanner {
  return assembleLongTermGrowthPlanner({});
}
