import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  ROADMAP_HIERARCHY,
  ROADMAP_LIFECYCLE,
  ROADMAP_PRINCIPLES,
  GOVERNED_ROADMAP_DOMAINS,
  ROADMAP_SEGMENTS,
  DEPENDENCY_DOMAINS,
  PILLOW_ROADMAP_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveRoadmapEngine,
  RoadmapHierarchyStep,
  RoadmapLifecycleStep,
  RoadmapLifecyclePhase,
  ExecutiveProgramme,
  RoadmapMilestone,
  RoadmapDependency,
  CriticalPathItem,
  RoadmapSegmentSummary,
  RoadmapRecommendation,
  PillowRoadmapEvaluationMetric,
  RoadmapSegment,
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
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
}): RoadmapHierarchyStep[] {
  const summaries: Record<string, string> = {
    vision: input.corporateVision?.visionWhy?.slice(0, 120) ?? "EMPIREAI_VISION.md · P1-01",
    strategic_objectives:
      input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3).join(" · ") ??
      "E1-03 measurable WHAT",
    executive_programmes: "E1 Executive Planning · P1–P9 Constitutional Programmes",
    programme_phases:
      input.executiveArchitecture?.planningPipeline
        ?.filter((p) => p.status === "active")
        .map((p) => p.label)
        .join(" · ") ?? "Active programme phases",
    initiatives:
      input.executiveArchitecture?.currentInitiatives.map((i) => i.title).join(" · ") ??
      "Executive initiatives sequenced",
    projects: String(input.journey?.currentMission ?? "Active mission"),
    missions: String(input.journey?.currentJourney ?? "Constitutional execution"),
    execution: "ECC · Supervisor · Production Truth",
  };

  return ROADMAP_HIERARCHY.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? "Roadmap hierarchy active",
  }));
}

function buildLifecycle(activePhase: RoadmapLifecyclePhase = "progress_monitoring"): RoadmapLifecycleStep[] {
  const activeIdx = ROADMAP_LIFECYCLE.indexOf(activePhase);
  return ROADMAP_LIFECYCLE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildProgrammes(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
}): ExecutiveProgramme[] {
  const visionRef = input.corporateVision?.currentVision?.slice(0, 80) ?? "EMPIREAI_VISION.md";
  const objectiveRefs =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 4) ?? [
      "E1-03 Strategic Objectives",
    ];
  const eta = String(input.supervisor?.eta ?? input.supervisor?.estimatedCompletion ?? "Supervisor ETA");
  const currentJourney = String(input.journey?.currentJourney ?? "E1 Executive Planning");
  const currentMission = String(input.journey?.currentMission ?? "E1-04 Executive Roadmap Engine");

  const catalogue: Array<Omit<ExecutiveProgramme, "milestones"> & { milestoneTitles: string[] }> = [
    {
      roadmapId: "ere-prog-e1",
      title: "E1 Executive Planning",
      description: "Unified executive planning programme — Vision · Objectives · Roadmap · Priorities",
      purpose: "Establish permanent executive planning constitutional framework",
      owner: "Grand King · Pillow",
      priority: 1,
      currentStatus: "active",
      dependencies: ["P1–P9 Constitutional Foundation"],
      estimatedDuration: "Continuous",
      targetCompletion: "Living programme",
      successCriteria: ["One executive truth", "Vision-aligned sequencing", "No duplicate roadmaps"],
      relatedVision: visionRef,
      relatedObjectives: objectiveRefs,
      relatedProgrammes: ["P9 Evolution", "P8 Commerce"],
      currentPhase: "E1-04 Executive Roadmap Engine",
      overallProgress: 75,
      segment: "current",
      risks: [],
      eta,
      strategicAlignment: "aligned",
      milestoneTitles: ["E1-01 Executive Architecture", "E1-02 Corporate Vision", "E1-03 Objectives", "E1-04 Roadmap"],
    },
    {
      roadmapId: "ere-prog-p9",
      title: "P9 Continuous Evolution",
      description: "Repository · Knowledge · Architecture · AI · Empire evolution programmes",
      purpose: "Perpetual constitutional evolution under Vision",
      owner: "Pillow · Empire Evolution",
      priority: 2,
      currentStatus: "in_progress",
      dependencies: ["P8 Commerce complete"],
      estimatedDuration: "Continuous",
      targetCompletion: "Living evolution",
      successCriteria: ["Repository health", "Knowledge integration", "Architecture integrity"],
      relatedVision: visionRef,
      relatedObjectives: ["Constitutional evolution", "Production Truth"],
      relatedProgrammes: ["E1 Executive Planning"],
      currentPhase: "P9-01 Repository Evolution",
      overallProgress: 60,
      segment: "current",
      risks: ["Drift detection"],
      eta,
      strategicAlignment: "aligned",
      milestoneTitles: ["P9-01 Repository", "P9-02 Knowledge", "P9-03 Architecture", "P9-05 Empire"],
    },
    {
      roadmapId: "ere-prog-p8",
      title: "P8 Business Operating Model",
      description: "Factory · Commerce · Marketplace · Automation · Intelligence · Grand King",
      purpose: "Manufacture and operate businesses under constitutional governance",
      owner: "Business Factory · Commerce",
      priority: 3,
      currentStatus: "in_progress",
      dependencies: ["P7 Cockpit complete"],
      estimatedDuration: "Multi-phase",
      targetCompletion: "MS-A milestones",
      successCriteria: ["USD 100k net profit", "Commerce Operating Intelligence"],
      relatedVision: visionRef,
      relatedObjectives: ["MS-A net profit", "Commerce Operating Intelligence"],
      relatedProgrammes: ["E1 Executive Planning"],
      currentPhase: "P8 Commerce · P8 Grand King",
      overallProgress: 55,
      segment: "current",
      risks: ["Commercial velocity"],
      eta,
      strategicAlignment: "aligned",
      milestoneTitles: ["P8-01 Factory", "P8-02 Commerce", "P8-06 Grand King"],
    },
    {
      roadmapId: "ere-prog-p7",
      title: "P7 Founder Cockpit",
      description: "Founder Shell · Cockpit UX · Pillow UX · Live ETA · Explainability",
      purpose: "Executive visibility and operational cockpit",
      owner: "Cockpit · Pillow UX",
      priority: 4,
      currentStatus: "complete",
      dependencies: ["P6 Execution Control"],
      estimatedDuration: "Complete",
      targetCompletion: "Achieved",
      successCriteria: ["Executive Home", "Live telemetry", "Explainability"],
      relatedVision: visionRef,
      relatedObjectives: ["Executive visibility"],
      relatedProgrammes: ["E1 Executive Planning"],
      currentPhase: "Complete",
      overallProgress: 100,
      segment: "completed",
      risks: [],
      eta: "Complete",
      strategicAlignment: "aligned",
      milestoneTitles: ["P7-01 Founder Shell", "P7-02 Cockpit UX", "P7-06 Live ETA"],
    },
    {
      roadmapId: "ere-prog-e1-05",
      title: "E1-05 Priority Management Engine",
      description: "Executive priority sequencing across programmes and missions",
      purpose: "Define WHAT comes first under the living roadmap",
      owner: "Pillow · Executive",
      priority: 5,
      currentStatus: "active",
      dependencies: ["E1-04 Executive Roadmap Engine"],
      estimatedDuration: "1 programme phase",
      targetCompletion: "Current E1 milestone",
      successCriteria: ["Priority framework", "ECC integration", "Executive visibility"],
      relatedVision: visionRef,
      relatedObjectives: ["Executive prioritization"],
      relatedProgrammes: ["E1 Executive Planning"],
      currentPhase: "E1-05 Priority Management",
      overallProgress: 85,
      segment: "current",
      risks: [],
      eta: "After E1-04",
      strategicAlignment: "aligned",
      milestoneTitles: ["Priority framework", "ECC scheduling"],
    },
    {
      roadmapId: "ere-prog-e1-06",
      title: "E1-06 Initiative Portfolio Engine",
      description: "Portfolio governance for executive initiatives",
      purpose: "Govern initiative portfolio under priorities",
      owner: "Pillow · Executive",
      priority: 6,
      currentStatus: "planned",
      dependencies: ["E1-05 Priority Management Engine"],
      estimatedDuration: "1 programme phase",
      targetCompletion: "Next E1 milestone",
      successCriteria: ["Portfolio framework", "Initiative tracking"],
      relatedVision: visionRef,
      relatedObjectives: ["Initiative governance"],
      relatedProgrammes: ["E1 Executive Planning"],
      currentPhase: "Queued",
      overallProgress: 0,
      segment: "future",
      risks: [],
      eta: "After E1-05",
      strategicAlignment: "planned",
      milestoneTitles: ["Portfolio analysis", "Executive approval"],
    },
    {
      roadmapId: "ere-prog-deferred",
      title: "P10 Expansion Programme",
      description: "Deferred expansion initiatives pending E1 completion",
      purpose: "Future empire expansion under validated roadmap",
      owner: "Grand King",
      priority: 10,
      currentStatus: "deferred",
      dependencies: ["E1 Executive Planning complete"],
      estimatedDuration: "TBD",
      targetCompletion: "Deferred",
      successCriteria: ["E1 foundation complete"],
      relatedVision: visionRef,
      relatedObjectives: ["Long-term growth"],
      relatedProgrammes: [],
      currentPhase: "Deferred",
      overallProgress: 0,
      segment: "deferred",
      risks: ["Premature expansion"],
      eta: "Deferred",
      strategicAlignment: "deferred",
      milestoneTitles: ["Executive approval required"],
    },
  ];

  if (currentMission && !catalogue.some((p) => p.title.includes(currentMission.slice(0, 20)))) {
    catalogue.unshift({
      roadmapId: "ere-prog-active-mission",
      title: currentMission,
      description: `Active mission under ${currentJourney}`,
      purpose: "Current constitutional execution mission",
      owner: "ECC · Builder",
      priority: 1,
      currentStatus: "active",
      dependencies: objectiveRefs.slice(0, 2),
      estimatedDuration: "Mission-driven",
      targetCompletion: eta,
      successCriteria: ["Mission complete", "Production Truth verified"],
      relatedVision: visionRef,
      relatedObjectives: objectiveRefs.slice(0, 2),
      relatedProgrammes: ["E1 Executive Planning"],
      currentPhase: String(input.journey?.currentPhase ?? "execution"),
      overallProgress: Number(input.journey?.progressPercent ?? 40),
      segment: "current",
      risks: [],
      eta,
      strategicAlignment: "aligned",
      milestoneTitles: ["Mission start", "Execution", "Acceptance"],
    });
  }

  return catalogue.map((p) => {
    const milestones: RoadmapMilestone[] = p.milestoneTitles.map((title, i) => ({
      milestoneId: `${p.roadmapId}-ms-${i}`,
      title,
      targetDate: p.segment === "completed" ? "Achieved" : p.segment === "future" ? "Planned" : "In programme",
      status:
        p.segment === "completed"
          ? "complete"
          : i === 0 && p.overallProgress > 0
            ? "in_progress"
            : p.overallProgress >= (i + 1) * 25
              ? "complete"
              : "pending",
      completionPercent:
        p.segment === "completed"
          ? 100
          : Math.min(100, Math.max(0, p.overallProgress - i * 25)),
    }));

    const { milestoneTitles: _, ...programme } = p;
    return { ...programme, milestones };
  });
}

function buildSegmentSummaries(programmes: ExecutiveProgramme[]): RoadmapSegmentSummary[] {
  return ROADMAP_SEGMENTS.map((segment) => {
    const items = programmes.filter((p) => p.segment === segment);
    return {
      segment,
      label: label(segment),
      count: items.length,
      summary:
        items.length > 0
          ? items.map((p) => p.title).join(" · ")
          : segment === "cancelled" || segment === "historical"
            ? "Fully traceable · no active items"
            : "None scheduled",
    };
  });
}

function buildDependencies(programmes: ExecutiveProgramme[]): RoadmapDependency[] {
  const deps: RoadmapDependency[] = [];
  let id = 0;

  for (const prog of programmes) {
    for (const dep of prog.dependencies) {
      deps.push({
        dependencyId: `ere-dep-${++id}`,
        domain: dep.includes("Architecture") || dep.includes("P1")
          ? "architecture_dependencies"
          : dep.includes("Commerce") || dep.includes("P8")
            ? "commerce_dependencies"
            : dep.includes("Knowledge")
              ? "knowledge_dependencies"
              : "programme_dependencies",
        label: `${prog.title} → ${dep}`,
        source: prog.roadmapId,
        target: dep,
        status: prog.currentStatus === "blocked" ? "blocked" : "tracked",
        critical: prog.priority <= 2,
      });
    }
  }

  for (const domain of DEPENDENCY_DOMAINS) {
    if (domain === "critical_path") continue;
    if (!deps.some((d) => d.domain === domain)) {
      deps.push({
        dependencyId: `ere-dep-${++id}`,
        domain,
        label: `${label(domain)} — monitored`,
        source: "ECC",
        target: "Supervisor",
        status: "clear",
        critical: false,
      });
    }
  }

  return deps.slice(0, 20);
}

function buildCriticalPath(programmes: ExecutiveProgramme[], supervisor?: Record<string, unknown>): CriticalPathItem[] {
  const current = programmes
    .filter((p) => p.segment === "current")
    .sort((a, b) => a.priority - b.priority);

  const eta = String(supervisor?.eta ?? "Supervisor ETA");

  return current.slice(0, 6).map((p, i) => ({
    order: i + 1,
    roadmapId: p.roadmapId,
    title: p.title,
    status: p.currentStatus,
    eta: p.eta || eta,
  }));
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  programmes: ExecutiveProgramme[];
}): RoadmapRecommendation[] {
  const recs: RoadmapRecommendation[] = [];

  for (const rec of input.strategicObjectives?.recommendedActions.slice(0, 2) ?? []) {
    recs.push({
      id: `ere-rec-soe-${recs.length}`,
      title: rec.title,
      category: "objective",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  for (const rec of input.executiveArchitecture?.executiveRecommendations.slice(0, 2) ?? []) {
    recs.push({
      id: `ere-rec-eaf-${recs.length}`,
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
      id: "ere-rec-default",
      title: "Proceed to E1-05 Priority Management Engine",
      category: "strategic",
      why: "Roadmap sequencing requires executive priority governance",
      what: "Implement Priority Management Engine",
      how: "Roadmap → Priority Analysis → ECC Scheduling",
      confidencePercent: 90,
    });
  }

  const blocked = input.programmes.filter((p) => p.risks.length > 0);
  if (blocked.length > 0) {
    recs.push({
      id: "ere-rec-risks",
      title: `Review ${blocked.length} programme risk signals`,
      category: "risk",
      why: "Roadmap health depends on dependency resolution",
      what: "Resolve programme dependencies and risks",
      how: "ECC dependency resolution · Supervisor ETA monitoring",
      confidencePercent: 85,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  programmes: ExecutiveProgramme[];
  dependencies: RoadmapDependency[];
  recommendations: RoadmapRecommendation[];
  overallProgress: number;
}): PillowRoadmapEvaluationMetric[] {
  const riskCount = input.programmes.reduce((s, p) => s + p.risks.length, 0);
  const criticalDeps = input.dependencies.filter((d) => d.critical).length;

  const values: Record<string, { status: string; summary: string }> = {
    roadmap_health: {
      status: input.overallProgress >= 75 ? "healthy" : input.overallProgress >= 50 ? "stable" : "building",
      summary: `${input.programmes.length} programmes · ${input.overallProgress}% overall progress`,
    },
    roadmap_progress: {
      status: "tracking",
      summary: `${input.programmes.filter((p) => p.segment === "current").length} active · ${input.programmes.filter((p) => p.segment === "completed").length} complete`,
    },
    roadmap_risks: {
      status: riskCount > 0 ? "attention" : "clear",
      summary: `${riskCount} programme risk signals · continuously monitored`,
    },
    roadmap_dependencies: {
      status: criticalDeps > 0 ? "tracked" : "clear",
      summary: `${input.dependencies.length} dependencies · ${criticalDeps} on critical path`,
    },
    future_opportunities: {
      status: "evaluating",
      summary: `${input.programmes.filter((p) => p.segment === "future").length} future programmes queued`,
    },
    strategic_recommendations: {
      status: "active",
      summary: `${input.recommendations.length} recommendations · Vision alignment ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
    },
  };

  return PILLOW_ROADMAP_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow roadmap evaluation active",
  }));
}

export function assembleExecutiveRoadmapEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveRoadmapEngine {
  const programmes = buildProgrammes(input);
  const currentProgrammes = programmes.filter((p) => p.segment === "current");
  const dependencies = buildDependencies(programmes);
  const criticalPath = buildCriticalPath(programmes, input.supervisor);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    strategicObjectives: input.strategicObjectives,
    executiveArchitecture: input.executiveArchitecture,
    programmes,
  });
  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    programmes,
    dependencies,
    recommendations: recommendedActions,
    overallProgress: Math.round(
      programmes.reduce((s, p) => s + p.overallProgress, 0) / Math.max(1, programmes.length),
    ),
  });

  const overallProgress = Math.round(
    currentProgrammes.length
      ? currentProgrammes.reduce((s, p) => s + p.overallProgress, 0) / currentProgrammes.length
      : 0,
  );

  const healthScore = Math.round(
    (overallProgress +
      (input.strategicObjectives?.healthScore ?? 75) +
      (input.corporateVision?.healthScore ?? 80)) /
      3,
  );

  const activePhase: RoadmapLifecyclePhase = currentProgrammes.some((p) => p.currentStatus === "active")
    ? "progress_monitoring"
    : "execution";

  const pillowAdvisory = [
    `Roadmap health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${programmes.length} programmes · ${currentProgrammes.length} current · one living executive roadmap`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `Overall progress: ${overallProgress}% · critical path ${criticalPath.length} items`,
    `No duplicate roadmaps · EMPIREAI_ROADMAP.md companion only`,
    `Ready for E1-06 Initiative Portfolio Engine`,
  ];

  return {
    architectureVersion: "E1-04",
    computedAt: new Date().toISOString(),
    roadmapSummary:
      "One permanent Executive Roadmap Engine — coordinates WHEN and IN WHAT ORDER strategic objectives are achieved, governing every programme, initiative, mission, dependency and milestone across the Empire",
    roadmapHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    overallProgress,
    activeProgrammeCount: currentProgrammes.length,
    currentProgrammes,
    currentPhases: [...new Set(currentProgrammes.map((p) => p.currentPhase))],
    roadmapHierarchy: buildHierarchy(input),
    roadmapLifecycle: buildLifecycle(activePhase),
    roadmapSegments: buildSegmentSummaries(programmes),
    dependencies,
    criticalPath,
    recommendedActions,
    pillowEvaluations,
    roadmapPrinciples: [...ROADMAP_PRINCIPLES],
    governedDomains: [...GOVERNED_ROADMAP_DOMAINS],
    pillowAdvisory,
    integrations: {
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      strategicObjectiveEngine: input.strategicObjectives
        ? `E1-03 · ${input.strategicObjectives.objectiveHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "scheduling"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE105: true,
  };
}

export function buildFallbackExecutiveRoadmapEngine(): ExecutiveRoadmapEngine {
  return assembleExecutiveRoadmapEngine({});
}
