import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ActiveObjective } from "../objective/types.js";
import {
  OBJECTIVE_HIERARCHY,
  OBJECTIVE_LIFECYCLE,
  OBJECTIVE_PRINCIPLES,
  GOVERNED_OBJECTIVE_DOMAINS,
  OBJECTIVE_CLASSIFICATIONS,
  MEASUREMENT_DOMAINS,
  PILLOW_OBJECTIVE_EVALUATIONS,
} from "./paths.js";
import type {
  StrategicObjectiveEngine,
  ObjectiveHierarchyStep,
  ObjectiveLifecycleStep,
  ObjectiveLifecyclePhase,
  StrategicObjective,
  ObjectiveMeasurement,
  StrategicRecommendation,
  PillowObjectiveEvaluationMetric,
  ObjectiveClassification,
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
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
}): ObjectiveHierarchyStep[] {
  const summaries: Record<string, string> = {
    vision: input.corporateVision?.visionWhy?.slice(0, 120) ?? "EMPIREAI_VISION.md · P1-01",
    strategic_themes: "E1 Executive Programme · Commerce Operating Intelligence",
    strategic_objectives:
      input.executiveArchitecture?.currentObjectives.map((o) => o.title).join(" · ") ??
      "Measurable objectives derived from Vision",
    executive_initiatives:
      input.executiveArchitecture?.currentInitiatives.map((i) => i.title).join(" · ") ??
      "Executive initiatives active",
    programmes: "P1–P9 Constitutional · E1 Executive Planning",
    projects: String(input.journey?.currentMission ?? "Active mission"),
    missions: String(input.journey?.currentJourney ?? "Constitutional execution"),
    execution: "ECC · Builder · Supervisor · Production Truth",
  };

  return OBJECTIVE_HIERARCHY.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? "Objective hierarchy active",
  }));
}

function buildLifecycle(activePhase: ObjectiveLifecyclePhase = "monitoring"): ObjectiveLifecycleStep[] {
  const activeIdx = OBJECTIVE_LIFECYCLE.indexOf(activePhase);
  return OBJECTIVE_LIFECYCLE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildStrategicObjectives(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  activeObjective?: ActiveObjective | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
}): StrategicObjective[] {
  const objectives: StrategicObjective[] = [];

  if (input.activeObjective) {
    const obj = input.activeObjective;
    objectives.push({
      objectiveId: obj.objectiveId,
      title: obj.title,
      description: obj.currentTask ?? obj.title,
      purpose: "Derived from Vision · PILLOW-019 active objective",
      expectedOutcome: obj.successCriteria.filter((c) => c.complete).length
        ? `${obj.successCriteria.filter((c) => c.complete).length}/${obj.successCriteria.length} criteria met`
        : "Success criteria in progress",
      owner: "Grand King · Pillow",
      priority: 1,
      dependencies: obj.blockers,
      targetDate: "Mission-driven",
      currentStatus: obj.complete ? "complete" : obj.blockers.length ? "blocked" : "in_progress",
      successCriteria: obj.successCriteria.map((c) => c.label),
      evidence: ["Repository · Production Truth · Journey"],
      relatedVision: input.corporateVision?.visionWhy?.slice(0, 80) ?? "EMPIREAI_VISION.md",
      relatedRoadmap: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      relatedInitiatives: input.executiveArchitecture?.currentInitiatives.map((i) => i.title) ?? [],
      classification: "executive",
      completionPercent: obj.progressPercent,
      progressTrend: obj.progressPercent >= 75 ? "accelerating" : obj.progressPercent >= 40 ? "steady" : "building",
      expectedCompletion: String(input.supervisor?.eta ?? "Supervisor ETA"),
      confidencePercent: Math.min(95, 60 + obj.progressPercent / 3),
      risks: obj.blockers,
      businessImpact: "Commercial probability · MS-A net profit",
      executiveImpact: "Executive programme execution",
      architectureImpact: "Constitutional architecture preserved",
    });
  }

  const defaults: Array<{
    id: string;
    title: string;
    classification: ObjectiveClassification;
    status: string;
    percent: number;
  }> = [
    {
      id: "soe-obj-e1-03",
      title: "E1-03 Strategic Objective Engine",
      classification: "executive",
      status: "active",
      percent: 85,
    },
    {
      id: "soe-obj-ms-a",
      title: "USD 100,000 cumulative net profit (MS-A)",
      classification: "financial",
      status: "in_progress",
      percent: 15,
    },
    {
      id: "soe-obj-commerce",
      title: "Commerce Operating Intelligence — manufacture companies",
      classification: "business",
      status: "in_progress",
      percent: 40,
    },
    {
      id: "soe-obj-e1-04",
      title: "E1-04 Executive Roadmap Engine",
      classification: "governance",
      status: "active",
      percent: 85,
    },
    {
      id: "soe-obj-e1-05",
      title: "E1-05 Priority Management Engine",
      classification: "governance",
      status: "planned",
      percent: 0,
    },
  ];

  for (const d of defaults) {
    if (objectives.some((o) => o.objectiveId === d.id)) continue;
    objectives.push({
      objectiveId: d.id,
      title: d.title,
      description: d.title,
      purpose: "Derived from Corporate Vision · measurable executive WHAT",
      expectedOutcome: "Vision-aligned measurable outcome",
      owner: d.classification === "financial" ? "Grand King" : "Pillow · Executive",
      priority: objectives.length + 1,
      dependencies: [],
      targetDate: "E1 Executive Programme",
      currentStatus: d.status,
      successCriteria: ["Vision validated", "Evidence-backed", "Executive approval"],
      evidence: ["EMPIREAI_VISION.md", "Journey · Production Truth"],
      relatedVision: input.corporateVision?.currentVision?.slice(0, 80) ?? "Vision aligned",
      relatedRoadmap: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      relatedInitiatives: input.executiveArchitecture?.currentInitiatives.map((i) => i.title) ?? [],
      classification: d.classification,
      completionPercent: d.percent,
      progressTrend: d.percent >= 50 ? "steady" : "building",
      expectedCompletion: "Continuous monitoring",
      confidencePercent: d.percent > 0 ? 80 : 70,
      risks: d.status === "blocked" ? ["Dependency blocked"] : [],
      businessImpact: d.classification === "financial" ? "high" : "medium",
      executiveImpact: "high",
      architectureImpact: d.classification === "engineering" ? "high" : "monitored",
    });
  }

  return objectives.slice(0, 8);
}

function buildMeasurements(objectives: StrategicObjective[]): ObjectiveMeasurement[] {
  const primary = objectives[0];
  const avgCompletion = objectives.length
    ? Math.round(objectives.reduce((s, o) => s + o.completionPercent, 0) / objectives.length)
    : 0;
  const riskCount = objectives.reduce((s, o) => s + o.risks.length, 0);

  const values: Record<string, { value: string; status: string }> = {
    completion_percentage: {
      value: `${avgCompletion}%`,
      status: avgCompletion >= 75 ? "on_track" : avgCompletion >= 40 ? "steady" : "building",
    },
    current_status: {
      value: primary?.currentStatus ?? "monitoring",
      status: primary?.currentStatus ?? "active",
    },
    progress_trend: {
      value: primary?.progressTrend ?? "steady",
      status: "tracking",
    },
    expected_completion: {
      value: primary?.expectedCompletion ?? "Supervisor ETA",
      status: "scheduled",
    },
    confidence: {
      value: `${primary?.confidencePercent ?? 75}%`,
      status: (primary?.confidencePercent ?? 75) >= 80 ? "high" : "moderate",
    },
    risks: {
      value: String(riskCount),
      status: riskCount > 0 ? "attention" : "clear",
    },
    dependencies: {
      value: String(primary?.dependencies.length ?? 0),
      status: (primary?.dependencies.length ?? 0) > 0 ? "review" : "clear",
    },
    business_impact: {
      value: primary?.businessImpact ?? "commercial",
      status: "high",
    },
    executive_impact: {
      value: primary?.executiveImpact ?? "programme",
      status: "high",
    },
    architecture_impact: {
      value: primary?.architectureImpact ?? "preserved",
      status: "constitutional",
    },
  };

  return MEASUREMENT_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "—",
    status: values[domain]?.status ?? "monitoring",
  }));
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  objectives: StrategicObjective[];
}): StrategicRecommendation[] {
  const recs: StrategicRecommendation[] = [];

  for (const rec of input.corporateVision?.visionRecommendations.slice(0, 2) ?? []) {
    recs.push({
      id: `soe-rec-vision-${recs.length}`,
      title: rec.title,
      category: "vision",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  for (const rec of input.executiveArchitecture?.executiveRecommendations.slice(0, 2) ?? []) {
    recs.push({
      id: `soe-rec-eaf-${recs.length}`,
      title: rec.title,
      category: rec.category,
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "soe-rec-default",
      title: "Proceed to E1-05 Priority Management Engine",
      category: "strategic",
      why: "Objectives require executive priority sequencing under roadmap",
      what: "Implement Priority Management Engine",
      how: "Roadmap → Priority Analysis → ECC Scheduling",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  objectives: StrategicObjective[];
  recommendations: StrategicRecommendation[];
}): PillowObjectiveEvaluationMetric[] {
  const avgCompletion = input.objectives.length
    ? Math.round(input.objectives.reduce((s, o) => s + o.completionPercent, 0) / input.objectives.length)
    : 0;

  const values: Record<string, { status: string; summary: string }> = {
    objective_quality: {
      status: "strong",
      summary: `${input.objectives.length} measurable objectives · full attributes`,
    },
    objective_alignment: {
      status: String(input.corporateVision?.visionAlignment ?? "aligned"),
      summary: "Every objective derived from Vision · VIE validated",
    },
    objective_risks: {
      status: input.objectives.some((o) => o.risks.length > 0) ? "attention" : "clear",
      summary: `${input.objectives.reduce((s, o) => s + o.risks.length, 0)} active risk signals`,
    },
    objective_dependencies: {
      status: "tracked",
      summary: "ECC coordinates dependencies · Supervisor monitors",
    },
    objective_opportunities: {
      status: "evaluating",
      summary: `${input.recommendations.length} strategic recommendations`,
    },
    strategic_recommendations: {
      status: "active",
      summary: `Average completion ${avgCompletion}% · continuously reviewed`,
    },
  };

  return PILLOW_OBJECTIVE_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow objective evaluation active",
  }));
}

export function assembleStrategicObjectiveEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  activeObjective?: ActiveObjective | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
  objectiveEngine?: Record<string, unknown>;
}): StrategicObjectiveEngine {
  const objectives = buildStrategicObjectives(input);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    executiveArchitecture: input.executiveArchitecture,
    objectives,
  });
  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    objectives,
    recommendations: recommendedActions,
  });
  const objectiveMeasurements = buildMeasurements(objectives);

  const avgCompletion = objectives.length
    ? Math.round(objectives.reduce((s, o) => s + o.completionPercent, 0) / objectives.length)
    : 72;

  const healthScore = Math.round(
    (avgCompletion + (input.corporateVision?.healthScore ?? 80)) / 2,
  );

  const activePhase: ObjectiveLifecyclePhase =
    objectives.some((o) => o.currentStatus === "in_progress") ? "monitoring" : "planning";

  const pillowAdvisory = [
    `Objective health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${objectives.length} strategic objectives · ${objectives.filter((o) => o.currentStatus === "active" || o.currentStatus === "in_progress").length} active`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.approvalStatus ?? "aligned")}`,
    `Average completion: ${avgCompletion}%`,
    `PILLOW-019 runtime objective engine companion — no competing systems`,
    `Ready for E1-05 Priority Management Engine`,
  ];

  return {
    architectureVersion: "E1-03",
    computedAt: new Date().toISOString(),
    objectiveSummary:
      "One permanent Strategic Objective Engine — transforms Vision into measurable, traceable executive objectives ensuring every programme and mission contributes directly to long-term Empire direction",
    objectiveHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicCoverage: `${objectives.length} objectives · ${GOVERNED_OBJECTIVE_DOMAINS.length} governed domains`,
    healthScore,
    activeObjectiveCount: objectives.filter(
      (o) => o.currentStatus === "active" || o.currentStatus === "in_progress",
    ).length,
    currentStrategicObjectives: objectives,
    objectiveHierarchy: buildHierarchy(input),
    objectiveLifecycle: buildLifecycle(activePhase),
    objectiveMeasurements,
    recommendedActions,
    pillowEvaluations,
    objectivePrinciples: [...OBJECTIVE_PRINCIPLES],
    governedDomains: [...GOVERNED_OBJECTIVE_DOMAINS],
    objectiveClassifications: [...OBJECTIVE_CLASSIFICATIONS],
    pillowAdvisory,
    integrations: {
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      objectiveEngine: String(input.objectiveEngine?.engineVersion ?? "PILLOW-019 · companion"),
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE104: true,
  };
}

export function buildFallbackStrategicObjectiveEngine(): StrategicObjectiveEngine {
  return assembleStrategicObjectiveEngine({});
}
