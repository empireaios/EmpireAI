import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DepartmentPlanningEngine } from "../department-planning-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveCalendarEngine } from "../executive-calendar-engine/types.js";
import type { ExecutiveDependencyEngine } from "../executive-dependency-engine/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { InitiativePortfolioEngine } from "../initiative-portfolio-engine/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  SCENARIO_PIPELINE,
  SCENARIO_PRINCIPLES,
  GOVERNED_SCENARIO_DOMAINS,
  SCENARIO_TYPES,
  TRADE_OFF_DOMAINS,
  SIMULATION_OUTPUT_DOMAINS,
  PILLOW_SCENARIO_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveScenarioPlanner,
  ScenarioPipelineStep,
  ScenarioPipelinePhase,
  ExecutiveScenario,
  ScenarioOutcome,
  TradeOffMetric,
  ScenarioComparison,
  ScenarioPlannerRecommendation,
  PillowScenarioEvaluationMetric,
  GovernedScenarioDomain,
  ScenarioType,
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

function buildPipeline(activePhase: ScenarioPipelinePhase = "executive_recommendation"): ScenarioPipelineStep[] {
  const activeIdx = SCENARIO_PIPELINE.indexOf(activePhase);
  return SCENARIO_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildScenarios(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  executiveDependency?: ExecutiveDependencyEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  journey?: Record<string, unknown>;
}): ExecutiveScenario[] {
  const scenarios: ExecutiveScenario[] = [];
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];
  const blockingCount = input.executiveDependency?.blockingDependencyCount ?? 0;
  const readiness = input.executiveDependency?.executionReadiness ?? "ready";

  const catalogue: Array<{
    id: string;
    title: string;
    purpose: string;
    scenarioType: ScenarioType;
    domain: GovernedScenarioDomain;
    baseSuccess: number;
    financial: string;
    business: string;
    engineering: string;
    commercial: string;
    risks: string[];
    benefits: string[];
    deps: string[];
  }> = [
    {
      id: "esp-e1-complete",
      title: "E1 Executive Planning Complete",
      purpose: "Complete E1 programme through E1-10 before major expansion",
      scenarioType: "expected_case",
      domain: "strategic_scenarios",
      baseSuccess: 88,
      financial: "moderate investment · high strategic ROI",
      business: "high",
      engineering: "high",
      commercial: "moderate",
      risks: blockingCount > 0 ? ["Dependency resolution required"] : [],
      benefits: ["Unified executive planning", "Constitutional governance", "Executive visibility"],
      deps: ["E1-01 through E1-09 complete"],
    },
    {
      id: "esp-ms-a-best",
      title: "MS-A Best Case — USD 100k Net Profit",
      purpose: "Accelerated commerce execution achieving MS-A ahead of schedule",
      scenarioType: "best_case",
      domain: "financial_scenarios",
      baseSuccess: 72,
      financial: "USD 100k+ net profit · 18 months",
      business: "critical",
      engineering: "moderate",
      commercial: "critical",
      risks: ["Market timing", "Commercial velocity"],
      benefits: ["Primary financial milestone", "Business validation"],
      deps: ["P8 Commerce Operating Model", "Business Factory"],
    },
    {
      id: "esp-ms-a-expected",
      title: "MS-A Expected Case — Steady Commerce Growth",
      purpose: "Conservative commerce execution under constitutional governance",
      scenarioType: "expected_case",
      domain: "financial_scenarios",
      baseSuccess: 65,
      financial: "USD 100k net profit · 24–36 months",
      business: "high",
      engineering: "moderate",
      commercial: "high",
      risks: ["Commercial velocity", "Resource allocation"],
      benefits: ["Sustainable growth", "Evidence-backed execution"],
      deps: ["P8 Commerce", "Grand King Account"],
    },
    {
      id: "esp-ms-a-worst",
      title: "MS-A Worst Case — Delayed Revenue",
      purpose: "Commerce delays requiring recovery and replanning",
      scenarioType: "worst_case",
      domain: "risk_scenarios",
      baseSuccess: 35,
      financial: "Delayed revenue · extended runway required",
      business: "attention",
      engineering: "low",
      commercial: "attention",
      risks: ["Revenue delay", "Resource strain", "Market conditions"],
      benefits: ["Recovery doctrine activated", "Scenario replanning"],
      deps: ["Recovery Doctrine", "Priority Management"],
    },
    {
      id: "esp-p9-expansion",
      title: "P9 Evolution Expansion — Aggressive",
      purpose: "Accelerate repository · knowledge · architecture evolution",
      scenarioType: "aggressive",
      domain: "engineering_scenarios",
      baseSuccess: 70,
      financial: "engineering investment · long-term value",
      business: "moderate",
      engineering: "critical",
      commercial: "low",
      risks: ["Architecture drift", "Capacity constraints"],
      benefits: ["Constitutional evolution", "Production Truth preserved"],
      deps: ["P9 Continuous Evolution", "Architecture Evolution"],
    },
    {
      id: "esp-p9-conservative",
      title: "P9 Evolution — Conservative Cadence",
      purpose: "Steady evolution preserving P1–P9 foundation",
      scenarioType: "conservative",
      domain: "architecture_scenarios",
      baseSuccess: 85,
      financial: "low incremental cost",
      business: "moderate",
      engineering: "high",
      commercial: "low",
      risks: ["Evolution velocity"],
      benefits: ["Stable foundation", "Drift prevention"],
      deps: ["Repository Evolution", "VIE validation"],
    },
    {
      id: "esp-e1-10",
      title: "E1-10 Executive Scenario Planner Active",
      purpose: "Simulate futures before executive decisions",
      scenarioType: "innovation",
      domain: "strategic_scenarios",
      baseSuccess: 90,
      financial: "executive programme investment",
      business: "high",
      engineering: "high",
      commercial: "moderate",
      risks: [],
      benefits: ["Multiple futures evaluated", "Evidence-based decisions"],
      deps: ["E1-09 Executive Dependency Engine"],
    },
    {
      id: "esp-e1-11",
      title: "E1-11 Long-Term Growth Planner",
      purpose: "Extend scenario planning to long-term growth horizons",
      scenarioType: "expansion",
      domain: "growth_scenarios",
      baseSuccess: 75,
      financial: "growth investment · planned",
      business: "high",
      engineering: "moderate",
      commercial: "high",
      risks: ["Premature expansion"],
      benefits: ["Long-term strategic direction"],
      deps: ["E1-10 Executive Scenario Planner"],
    },
    {
      id: "esp-disruption",
      title: "Market Disruption Response",
      purpose: "Respond to external commercial or technology disruption",
      scenarioType: "disruption",
      domain: "risk_scenarios",
      baseSuccess: 55,
      financial: "variable · contingency required",
      business: "critical",
      engineering: "high",
      commercial: "critical",
      risks: ["External disruption", "Competitive pressure", "Timeline compression"],
      benefits: ["Adaptive strategy", "Recovery capability"],
      deps: ["Priority Management", "Scenario Planner"],
    },
    {
      id: "esp-recovery",
      title: "Constitutional Recovery Scenario",
      purpose: "Recovery doctrine under production incident or drift",
      scenarioType: "recovery",
      domain: "production_scenarios",
      baseSuccess: 80,
      financial: "incident cost · preserved foundation",
      business: "moderate",
      engineering: "critical",
      commercial: "low",
      risks: ["Production incident", "Drift detection"],
      benefits: ["Production Truth restored", "Constitutional integrity"],
      deps: ["Recovery Doctrine", "Guardian", "Production Truth"],
    },
  ];

  for (const c of catalogue) {
    const readinessPenalty = readiness === "blocked" ? 15 : readiness === "conditional" ? 8 : 0;
    const success = Math.max(20, Math.min(95, c.baseSuccess - readinessPenalty - blockingCount * 3));
    scenarios.push({
      scenarioId: c.id,
      title: c.title,
      purpose: c.purpose,
      scenarioType: c.scenarioType,
      domain: c.domain,
      assumptions: [
        `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
        `Execution readiness: ${readiness}`,
        ...objectives.slice(0, 2),
      ],
      dependencies: c.deps,
      constraints: ["Constitution First", "Evidence First", "No single-assumption planning"],
      expectedBenefits: c.benefits,
      expectedRisks: c.risks,
      businessImpact: c.business,
      financialImpact: c.financial,
      engineeringImpact: c.engineering,
      commercialImpact: c.commercial,
      confidence: Math.min(95, success - 5),
      supportingEvidence: ["E1 Scenario Planner", "Production Truth", "Dependency Engine"],
      successProbability: success,
      failureProbability: 100 - success,
      recommended: false,
    });
  }

  const sorted = [...scenarios].sort((a, b) => b.successProbability - a.successProbability);
  if (sorted[0]) sorted[0].recommended = true;
  if (sorted[1] && sorted[1].scenarioType === "conservative") sorted[1].recommended = false;

  return sorted;
}

function buildSimulationOutputs(
  recommended: ExecutiveScenario | null,
  scenarios: ExecutiveScenario[],
): ScenarioOutcome[] {
  const primary = recommended ?? scenarios[0];
  const avgSuccess = scenarios.length
    ? Math.round(scenarios.reduce((s, sc) => s + sc.successProbability, 0) / scenarios.length)
    : 0;

  const values: Record<string, { value: string; status: string }> = {
    predicted_outcomes: {
      value: primary ? `${primary.title} · ${primary.successProbability}% success` : "Simulating",
      status: "evaluated",
    },
    success_probability: {
      value: primary ? `${primary.successProbability}%` : `${avgSuccess}%`,
      status: (primary?.successProbability ?? avgSuccess) >= 75 ? "strong" : "moderate",
    },
    failure_probability: {
      value: primary ? `${primary.failureProbability}%` : `${100 - avgSuccess}%`,
      status: (primary?.failureProbability ?? 100 - avgSuccess) <= 25 ? "low" : "attention",
    },
    risk_profile: {
      value: primary?.expectedRisks.length ? `${primary.expectedRisks.length} risk factors` : "Low",
      status: (primary?.expectedRisks.length ?? 0) > 2 ? "elevated" : "managed",
    },
    resource_requirements: {
      value: "ECC · Pillow · Department capacity coordinated",
      status: "planned",
    },
    time_requirements: {
      value: primary?.financialImpact.includes("month") ? primary.financialImpact : "Programme-driven",
      status: "estimated",
    },
    financial_projection: {
      value: primary?.financialImpact ?? "Under evaluation",
      status: "projected",
    },
    operational_impact: {
      value: primary?.businessImpact ?? "moderate",
      status: "assessed",
    },
    recommended_actions: {
      value: primary ? `Proceed with ${primary.scenarioType.replace(/_/g, " ")} path` : "Evaluate alternatives",
      status: "active",
    },
    alternative_strategies: {
      value: `${scenarios.filter((s) => !s.recommended).length} alternatives simulated`,
      status: "available",
    },
  };

  return SIMULATION_OUTPUT_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "—",
    status: values[domain]?.status ?? "simulating",
  }));
}

function buildTradeOffAnalysis(recommended: ExecutiveScenario | null): TradeOffMetric[] {
  const weights: Record<string, number> = {
    cost: 8,
    time: 9,
    risk: 10,
    business_value: 10,
    revenue: 9,
    profit: 10,
    engineering_complexity: 7,
    operational_complexity: 7,
    strategic_alignment: 10,
    long_term_value: 9,
  };

  const scores: Record<string, number> = {
    cost: recommended?.scenarioType === "conservative" ? 85 : 65,
    time: recommended?.scenarioType === "aggressive" ? 55 : 75,
    risk: recommended ? 100 - recommended.failureProbability : 70,
    business_value: recommended?.businessImpact === "critical" ? 90 : 75,
    revenue: recommended?.commercialImpact === "critical" ? 88 : 70,
    profit: recommended?.domain.includes("financial") ? 85 : 65,
    engineering_complexity: recommended?.engineeringImpact === "critical" ? 60 : 80,
    operational_complexity: 75,
    strategic_alignment: recommended?.successProbability ?? 80,
    long_term_value: recommended?.scenarioType === "expansion" ? 90 : 78,
  };

  return TRADE_OFF_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    score: scores[domain] ?? 70,
    weight: weights[domain] ?? 5,
    summary: `${label(domain)} score ${scores[domain] ?? 70}/100 · weight ${weights[domain] ?? 5}`,
  }));
}

function buildScenarioComparison(scenarios: ExecutiveScenario[]): ScenarioComparison[] {
  return scenarios.slice(0, 8).map((s) => ({
    scenarioId: s.scenarioId,
    title: s.title,
    scenarioType: s.scenarioType,
    successProbability: s.successProbability,
    riskLevel: s.failureProbability >= 40 ? "elevated" : s.failureProbability >= 25 ? "moderate" : "low",
    financialImpact: s.financialImpact,
    strategicAlignment: s.successProbability >= 80 ? "aligned" : s.successProbability >= 60 ? "moderate" : "review",
  }));
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveDependency?: ExecutiveDependencyEngine | null;
  recommended: ExecutiveScenario | null;
  scenarios: ExecutiveScenario[];
}): ScenarioPlannerRecommendation[] {
  const recs: ScenarioPlannerRecommendation[] = [];

  if (input.recommended) {
    recs.push({
      id: "esp-rec-primary",
      title: `Recommended: ${input.recommended.title}`,
      category: "scenario",
      why: `${input.recommended.successProbability}% success · ${input.recommended.confidence}% confidence · constitutionally aligned`,
      what: input.recommended.title,
      how: "Grand King decision · Journey recording · ECC execution",
      confidencePercent: input.recommended.confidence,
    });
  }

  const conservative = input.scenarios.find((s) => s.scenarioType === "conservative");
  if (conservative && conservative.scenarioId !== input.recommended?.scenarioId) {
    recs.push({
      id: "esp-rec-alt",
      title: `Alternative: ${conservative.title}`,
      category: "alternative",
      why: `${conservative.successProbability}% success · lower risk profile`,
      what: conservative.title,
      how: "Compare trade-offs · dependency validation before commit",
      confidencePercent: conservative.confidence,
    });
  }

  for (const rec of input.executiveDependency?.recommendedActions.slice(0, 1) ?? []) {
    recs.push({
      id: `esp-rec-dep-${recs.length}`,
      title: rec.title,
      category: "dependency",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  if (recs.length < 2) {
    recs.push({
      id: "esp-rec-default",
      title: "Proceed to E1-11 Long-Term Growth Planner",
      category: "strategic",
      why: "Scenario planning requires long-term growth horizon extension",
      what: "Implement Long-Term Growth Planner",
      how: "Scenarios → Growth Analysis → Executive Approval",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  scenarios: ExecutiveScenario[];
  recommendations: ScenarioPlannerRecommendation[];
  healthScore: number;
}): PillowScenarioEvaluationMetric[] {
  const avgSuccess = input.scenarios.length
    ? Math.round(input.scenarios.reduce((s, sc) => s + sc.successProbability, 0) / input.scenarios.length)
    : 0;

  const values: Record<string, { status: string; summary: string }> = {
    scenario_quality: {
      status: input.scenarios.length >= 8 ? "strong" : "building",
      summary: `${input.scenarios.length} scenarios · full attributes · multiple futures`,
    },
    strategic_alternatives: {
      status: "available",
      summary: `${input.scenarios.filter((s) => !s.recommended).length} alternative strategies simulated`,
    },
    risk_exposure: {
      status: input.scenarios.some((s) => s.failureProbability >= 40) ? "evaluated" : "managed",
      summary: "Worst case · expected case · best case all evaluated",
    },
    growth_opportunities: {
      status: "evaluating",
      summary: `${input.scenarios.filter((s) => s.domain.includes("growth") || s.scenarioType === "expansion").length} growth scenarios`,
    },
    simulation_accuracy: {
      status: avgSuccess >= 70 ? "strong" : "building",
      summary: `Average success probability ${avgSuccess}% · evidence-backed`,
    },
    executive_recommendations: {
      status: "active",
      summary: `${input.recommendations.length} recommendations · Vision ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
    },
  };

  return PILLOW_SCENARIO_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "simulating",
    summary: values[domain]?.summary ?? "Pillow scenario evaluation active",
  }));
}

export function assembleExecutiveScenarioPlanner(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  executiveCalendar?: ExecutiveCalendarEngine | null;
  executiveDependency?: ExecutiveDependencyEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveScenarioPlanner {
  const availableScenarios = buildScenarios(input);
  const recommendedScenario = availableScenarios.find((s) => s.recommended) ?? availableScenarios[0] ?? null;
  const scenarioComparison = buildScenarioComparison(availableScenarios);
  const simulationOutputs = buildSimulationOutputs(recommendedScenario, availableScenarios);
  const tradeOffAnalysis = buildTradeOffAnalysis(recommendedScenario);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    executiveDependency: input.executiveDependency,
    recommended: recommendedScenario,
    scenarios: availableScenarios,
  });

  const healthScore = Math.round(
    ((recommendedScenario?.successProbability ?? 70) +
      (input.corporateVision?.healthScore ?? 80) +
      (input.executiveDependency?.healthScore ?? 80) +
      (input.initiativePortfolio?.healthScore ?? 75)) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    scenarios: availableScenarios,
    recommendations: recommendedActions,
    healthScore,
  });

  const alternativeOptions = availableScenarios.filter((s) => !s.recommended).slice(0, 6);

  const pillowAdvisory = [
    `Planner health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${availableScenarios.length} scenarios simulated · never single-assumption planning`,
    `Recommended: ${recommendedScenario?.title ?? "Evaluate scenarios"} · ${recommendedScenario?.successProbability ?? 0}% success`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing scenario systems · one strategic simulation engine`,
    `Ready for E1-11 Long-Term Growth Planner`,
  ];

  return {
    architectureVersion: "E1-10",
    computedAt: new Date().toISOString(),
    plannerSummary:
      "One permanent Executive Scenario Planner — simulates multiple strategic futures, evaluates business, engineering and financial outcomes, and provides evidence-based executive recommendations before major decisions are executed",
    plannerHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    availableScenarioCount: availableScenarios.length,
    recommendedScenario,
    availableScenarios,
    scenarioComparison,
    simulationOutputs,
    tradeOffAnalysis,
    alternativeOptions,
    scenarioPipeline: buildPipeline("executive_recommendation"),
    recommendedActions,
    pillowEvaluations,
    scenarioPrinciples: [...SCENARIO_PRINCIPLES],
    governedDomains: [...GOVERNED_SCENARIO_DOMAINS],
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
      initiativePortfolioEngine: input.initiativePortfolio
        ? `E1-06 · ${input.initiativePortfolio.portfolioHealth}`
        : "standby",
      departmentPlanningEngine: input.departmentPlanning
        ? `E1-07 · ${input.departmentPlanning.planningHealth}`
        : "standby",
      executiveCalendarEngine: input.executiveCalendar
        ? `E1-08 · ${input.executiveCalendar.calendarHealth}`
        : "standby",
      executiveDependencyEngine: input.executiveDependency
        ? `E1-09 · ${input.executiveDependency.dependencyHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "scenario preparation"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE111: true,
  };
}

export function buildFallbackExecutiveScenarioPlanner(): ExecutiveScenarioPlanner {
  return assembleExecutiveScenarioPlanner({});
}
