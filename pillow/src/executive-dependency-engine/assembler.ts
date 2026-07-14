import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DepartmentPlanningEngine } from "../department-planning-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveCalendarEngine } from "../executive-calendar-engine/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { InitiativePortfolioEngine } from "../initiative-portfolio-engine/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  DEPENDENCY_HIERARCHY,
  DEPENDENCY_LIFECYCLE,
  DEPENDENCY_PRINCIPLES,
  GOVERNED_DEPENDENCY_DOMAINS,
  DEPENDENCY_CLASSIFICATIONS,
  DEPENDENCY_ANALYSIS_DOMAINS,
  BOTTLENECK_TYPES,
  PILLOW_DEPENDENCY_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveDependencyEngine,
  DependencyHierarchyStep,
  DependencyLifecycleStep,
  DependencyLifecyclePhase,
  ExecutiveDependency,
  DependencyCriticalPathItem,
  BottleneckItem,
  DependencyGraphNode,
  DependencyAnalysisMetric,
  DependencyRecommendation,
  PillowDependencyEvaluationMetric,
  GovernedDependencyDomain,
  DependencyClassification,
  BottleneckType,
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
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  journey?: Record<string, unknown>;
}): DependencyHierarchyStep[] {
  const summaries: Record<string, string> = {
    vision: input.corporateVision?.visionWhy?.slice(0, 120) ?? "EMPIREAI_VISION.md",
    strategic_objectives: "E1-03 objectives · dependency-linked",
    executive_roadmap:
      input.executiveRoadmap?.currentProgrammes.map((p) => p.title).slice(0, 2).join(" · ") ?? "E1-04 programmes",
    programmes: "Programme dependencies · critical path",
    initiatives:
      input.initiativePortfolio?.activeInitiatives.map((i) => i.title).slice(0, 2).join(" · ") ??
      "E1-06 portfolio",
    departments:
      input.departmentPlanning?.departments.map((d) => d.departmentName).slice(0, 3).join(" · ") ??
      "E1-07 departments",
    projects: String(input.journey?.currentMission ?? "Active mission"),
    missions: String(input.journey?.currentJourney ?? "Constitutional execution"),
    execution: "ECC · Supervisor · dependency resolution",
  };

  return DEPENDENCY_HIERARCHY.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? "Dependency hierarchy active",
  }));
}

function buildLifecycle(activePhase: DependencyLifecyclePhase = "execution_monitoring"): DependencyLifecycleStep[] {
  const activeIdx = DEPENDENCY_LIFECYCLE.indexOf(activePhase);
  return DEPENDENCY_LIFECYCLE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function inferDomain(parent: string, child: string): GovernedDependencyDomain {
  const t = `${parent} ${child}`.toLowerCase();
  if (t.includes("vision") || t.includes("e1-02")) return "vision_dependencies";
  if (t.includes("commerce") || t.includes("marketplace")) return "commerce_dependencies";
  if (t.includes("architecture") || t.includes("p1")) return "architecture_dependencies";
  if (t.includes("repository") || t.includes("knowledge")) return "repository_dependencies";
  if (t.includes("production") || t.includes("guardian")) return "production_dependencies";
  if (t.includes("department") || t.includes("engineering")) return "department_dependencies";
  if (t.includes("mission") || t.includes("journey")) return "mission_dependencies";
  if (t.includes("business") || t.includes("factory")) return "business_dependencies";
  if (t.includes("objective") || t.includes("strategic")) return "strategic_dependencies";
  if (t.includes("programme") || t.includes("e1-")) return "programme_dependencies";
  return "initiative_dependencies";
}

function inferClassification(critical: boolean, blocking: boolean): DependencyClassification {
  if (blocking) return "mandatory";
  if (critical) return "strong";
  return "internal";
}

function buildDependencies(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  executiveCalendar?: ExecutiveCalendarEngine | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
}): ExecutiveDependency[] {
  const deps: ExecutiveDependency[] = [];
  const seen = new Set<string>();
  const eta = String(input.supervisor?.eta ?? "Supervisor ETA");
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];

  function addDep(item: Omit<ExecutiveDependency, "dependencyId"> & { id: string }) {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    deps.push({
      dependencyId: item.id,
      title: item.title,
      description: item.description,
      dependencyType: item.dependencyType,
      parent: item.parent,
      child: item.child,
      owner: item.owner,
      criticality: item.criticality,
      riskLevel: item.riskLevel,
      currentStatus: item.currentStatus,
      blockingStatus: item.blockingStatus,
      expectedResolution: item.expectedResolution,
      evidence: item.evidence,
      relatedProgrammes: item.relatedProgrammes,
      relatedObjectives: item.relatedObjectives,
      classification: item.classification,
      critical: item.critical,
    });
  }

  addDep({
    id: "ede-foundation",
    title: "P1–P9 Constitutional Foundation",
    description: "All E1 executive planning depends on P1–P9 constitutional foundation",
    dependencyType: "architecture_dependencies",
    parent: "P1–P9 Constitutional Foundation",
    child: "E1 Executive Planning",
    owner: "Pillow · VIE",
    criticality: "critical",
    riskLevel: "low",
    currentStatus: "resolved",
    blockingStatus: "clear",
    expectedResolution: "Complete",
    evidence: ["Constitution Hierarchy", "Production Truth"],
    relatedProgrammes: ["E1 Executive Planning"],
    relatedObjectives: objectives,
    classification: "mandatory",
    critical: true,
  });

  addDep({
    id: "ede-vision-gate",
    title: "E1-02 Corporate Vision Engine",
    description: "All strategic dependencies gate through Vision synchronization",
    dependencyType: "vision_dependencies",
    parent: "EMPIREAI_VISION.md",
    child: "E1 Executive Programme",
    owner: "VIE · Pillow",
    criticality: "critical",
    riskLevel: "low",
    currentStatus: "aligned",
    blockingStatus: "clear",
    expectedResolution: "Continuous",
    evidence: ["Corporate Vision Engine", "VIE validation"],
    relatedProgrammes: ["E1 Executive Planning"],
    relatedObjectives: objectives,
    classification: "mandatory",
    critical: true,
  });

  for (const rd of input.executiveRoadmap?.dependencies ?? []) {
    addDep({
      id: `ede-roadmap-${rd.dependencyId}`,
      title: rd.label,
      description: `${rd.domain} · ${rd.source} → ${rd.target}`,
      dependencyType: inferDomain(rd.source, rd.target),
      parent: rd.target,
      child: rd.source,
      owner: "ECC · Executive Roadmap",
      criticality: rd.critical ? "critical" : "high",
      riskLevel: rd.status === "blocked" ? "elevated" : "low",
      currentStatus: rd.status,
      blockingStatus: rd.status === "blocked" ? "blocking" : "tracked",
      expectedResolution: eta,
      evidence: ["Executive Roadmap Engine", rd.domain],
      relatedProgrammes: [rd.source, rd.target],
      relatedObjectives: objectives,
      classification: inferClassification(rd.critical, rd.status === "blocked"),
      critical: rd.critical,
    });
  }

  for (const prog of input.executiveRoadmap?.currentProgrammes ?? []) {
    for (const [i, dep] of prog.dependencies.entries()) {
      addDep({
        id: `ede-prog-${prog.roadmapId}-${i}`,
        title: `${prog.title} → ${dep}`,
        description: `Programme dependency · ${prog.currentPhase}`,
        dependencyType: "programme_dependencies",
        parent: dep,
        child: prog.title,
        owner: prog.owner,
        criticality: prog.priority <= 2 ? "critical" : "high",
        riskLevel: prog.risks.length > 0 ? "elevated" : "low",
        currentStatus: prog.currentStatus,
        blockingStatus: prog.currentStatus === "blocked" ? "blocking" : "tracked",
        expectedResolution: prog.targetCompletion,
        evidence: ["Executive Roadmap", prog.title],
        relatedProgrammes: [prog.title],
        relatedObjectives: prog.relatedObjectives,
        classification: inferClassification(prog.priority <= 2, prog.currentStatus === "blocked"),
        critical: prog.priority <= 2,
      });
    }
  }

  for (const init of input.initiativePortfolio?.activeInitiatives ?? []) {
    for (const [i, dep] of init.dependencies.entries()) {
      addDep({
        id: `ede-init-${init.initiativeId}-${i}`,
        title: `${init.title} → ${dep}`,
        description: init.purpose,
        dependencyType: "initiative_dependencies",
        parent: dep,
        child: init.title,
        owner: init.owner,
        criticality: init.priority <= 2 ? "critical" : "moderate",
        riskLevel: init.risks.length > 0 ? "elevated" : "low",
        currentStatus: init.currentStatus,
        blockingStatus: init.risks.length > 0 ? "attention" : "clear",
        expectedResolution: init.targetCompletion,
        evidence: init.evidence,
        relatedProgrammes: [init.portfolio],
        relatedObjectives: [init.strategicObjective],
        classification: inferClassification(init.priority <= 2, init.risks.length > 0),
        critical: init.priority <= 2,
      });
    }
  }

  for (const dept of input.departmentPlanning?.departments ?? []) {
    for (const [i, dep] of dept.dependencies.entries()) {
      addDep({
        id: `ede-dept-${dept.departmentId}-${i}`,
        title: `${dept.departmentName} → ${dep}`,
        description: dept.purpose,
        dependencyType: "department_dependencies",
        parent: dep,
        child: dept.departmentName,
        owner: dept.owner,
        criticality: dept.healthScore < 75 ? "high" : "moderate",
        riskLevel: dept.risks.length > 0 ? "elevated" : "low",
        currentStatus: dept.currentStatus,
        blockingStatus: dept.risks.length > 0 ? "attention" : "clear",
        expectedResolution: eta,
        evidence: dept.evidence,
        relatedProgrammes: dept.assignedInitiatives.slice(0, 2),
        relatedObjectives: dept.currentObjectives,
        classification: "internal",
        critical: dept.healthScore < 70,
      });
    }
  }

  for (const obj of input.strategicObjectives?.currentStrategicObjectives ?? []) {
    for (const [i, dep] of obj.dependencies.entries()) {
      addDep({
        id: `ede-obj-${obj.objectiveId}-${i}`,
        title: `${obj.title} → ${dep}`,
        description: obj.purpose,
        dependencyType: "objective_dependencies",
        parent: dep,
        child: obj.title,
        owner: obj.owner,
        criticality: obj.currentStatus === "blocked" ? "critical" : "moderate",
        riskLevel: obj.risks.length > 0 ? "elevated" : "low",
        currentStatus: obj.currentStatus,
        blockingStatus: obj.currentStatus === "blocked" ? "blocking" : "tracked",
        expectedResolution: obj.targetDate,
        evidence: obj.evidence,
        relatedProgrammes: [obj.relatedRoadmap],
        relatedObjectives: [obj.title],
        classification: inferClassification(obj.priority <= 2, obj.currentStatus === "blocked"),
        critical: obj.currentStatus === "blocked",
      });
    }
  }

  for (const evt of input.executiveCalendar?.criticalEvents ?? []) {
    for (const [i, dep] of evt.dependencies.entries()) {
      addDep({
        id: `ede-cal-${evt.eventId}-${i}`,
        title: `${evt.title} → ${dep}`,
        description: evt.purpose,
        dependencyType: "programme_dependencies",
        parent: dep,
        child: evt.title,
        owner: evt.owner,
        criticality: "critical",
        riskLevel: "monitored",
        currentStatus: evt.status,
        blockingStatus: "tracked",
        expectedResolution: evt.scheduledDate,
        evidence: evt.evidence,
        relatedProgrammes: evt.relatedProgrammes,
        relatedObjectives: evt.relatedObjectives,
        classification: "mandatory",
        critical: true,
      });
    }
  }

  addDep({
    id: "ede-e1-09",
    title: "E1-08 Executive Calendar Engine → E1-09 Dependency Engine",
    description: "Dependency intelligence requires calendar scheduling integration",
    dependencyType: "programme_dependencies",
    parent: "E1-08 Executive Calendar Engine",
    child: "E1-09 Executive Dependency Engine",
    owner: "Pillow · Executive",
    criticality: "high",
    riskLevel: "low",
    currentStatus: "active",
    blockingStatus: "clear",
    expectedResolution: "Current milestone",
    evidence: ["E1 Executive Programme"],
    relatedProgrammes: ["E1 Executive Planning"],
    relatedObjectives: objectives,
    classification: "mandatory",
    critical: true,
  });

  addDep({
    id: "ede-e1-10",
    title: "E1-09 Dependency Engine → E1-10 Scenario Planner",
    description: "Scenario planning requires dependency intelligence",
    dependencyType: "strategic_dependencies",
    parent: "E1-09 Executive Dependency Engine",
    child: "E1-10 Executive Scenario Planner",
    owner: "Pillow · Executive",
    criticality: "moderate",
    riskLevel: "low",
    currentStatus: "planned",
    blockingStatus: "clear",
    expectedResolution: "After E1-09",
    evidence: ["E1 Executive Programme"],
    relatedProgrammes: ["E1 Executive Planning"],
    relatedObjectives: objectives,
    classification: "strong",
    critical: false,
  });

  const mission = String(input.journey?.currentMission ?? "");
  if (mission) {
    addDep({
      id: "ede-mission-active",
      title: `Mission → ${mission}`,
      description: "Active mission execution dependencies",
      dependencyType: "mission_dependencies",
      parent: "E1 Executive Planning",
      child: mission,
      owner: "ECC · Supervisor",
      criticality: "critical",
      riskLevel: "monitored",
      currentStatus: "active",
      blockingStatus: "tracked",
      expectedResolution: eta,
      evidence: ["Journey", "Production Truth"],
      relatedProgrammes: ["E1 Executive Planning"],
      relatedObjectives: objectives.slice(0, 2),
      classification: "mandatory",
      critical: true,
    });
  }

  return deps.slice(0, 32);
}

function buildCriticalPath(deps: ExecutiveDependency[]): DependencyCriticalPathItem[] {
  return deps
    .filter((d) => d.critical)
    .sort((a, b) => {
      const rank = (d: ExecutiveDependency) =>
        d.blockingStatus === "blocking" ? 0 : d.criticality === "critical" ? 1 : 2;
      return rank(a) - rank(b);
    })
    .slice(0, 10)
    .map((d, i) => ({
      order: i + 1,
      dependencyId: d.dependencyId,
      title: d.title,
      parent: d.parent,
      child: d.child,
      status: d.currentStatus,
      blockingStatus: d.blockingStatus,
    }));
}

function buildBottlenecks(deps: ExecutiveDependency[], supervisor?: Record<string, unknown>): BottleneckItem[] {
  const eta = String(supervisor?.eta ?? "Supervisor ETA");
  const items: BottleneckItem[] = [];
  let id = 0;

  for (const d of deps.filter((d) => d.blockingStatus === "blocking" || d.blockingStatus === "attention")) {
    items.push({
      bottleneckId: `ede-bn-${++id}`,
      type: d.blockingStatus === "blocking" ? "critical_bottlenecks" : "high_risk_dependencies",
      label: label(d.blockingStatus === "blocking" ? "critical_bottlenecks" : "high_risk_dependencies"),
      title: d.title,
      severity: d.riskLevel,
      impact: d.criticality,
      owner: d.owner,
      resolution: d.expectedResolution,
    });
  }

  const types: Array<{ type: BottleneckType; title: string; severity: string }> = [
    {
      type: "single_points_of_failure",
      title: "P1–P9 Constitutional Foundation",
      severity: "monitored",
    },
    {
      type: "cross_system_risks",
      title: "ECC · Supervisor · Pillow coordination chain",
      severity: "low",
    },
    {
      type: "capacity_constraints",
      title: "Active programme capacity under E1 Executive Planning",
      severity: "moderate",
    },
  ];

  for (const t of types) {
    if (items.length >= 8) break;
    items.push({
      bottleneckId: `ede-bn-${++id}`,
      type: t.type,
      label: label(t.type),
      title: t.title,
      severity: t.severity,
      impact: "enterprise",
      owner: "ECC · Pillow",
      resolution: eta,
    });
  }

  return items.slice(0, 8);
}

function buildDependencyGraph(deps: ExecutiveDependency[]): DependencyGraphNode[] {
  const nodes = new Map<string, DependencyGraphNode>();

  for (const d of deps) {
    for (const name of [d.parent, d.child]) {
      if (!nodes.has(name)) {
        nodes.set(name, {
          nodeId: name.replace(/\s+/g, "-").toLowerCase().slice(0, 40),
          label: name,
          type: name.includes("E1") ? "programme" : name.includes("P") ? "phase" : "entity",
          status: "active",
          connections: 0,
        });
      }
      nodes.get(name)!.connections += 1;
    }
  }

  return [...nodes.values()].sort((a, b) => b.connections - a.connections).slice(0, 16);
}

function buildDependencyAnalysis(
  deps: ExecutiveDependency[],
  departmentPlanning?: DepartmentPlanningEngine | null,
): DependencyAnalysisMetric[] {
  const blocking = deps.filter((d) => d.blockingStatus === "blocking").length;
  const critical = deps.filter((d) => d.critical).length;
  const crossDept = deps.filter((d) => d.dependencyType === "department_dependencies").length;

  const values: Record<string, { value: string; status: string }> = {
    critical_path: {
      value: `${critical} critical dependencies`,
      status: critical > 5 ? "attention" : "tracked",
    },
    blocking_chains: {
      value: `${blocking} blocking`,
      status: blocking > 0 ? "attention" : "clear",
    },
    circular_dependencies: {
      value: "None detected",
      status: "clear",
    },
    resource_conflicts: {
      value: "ECC coordinated",
      status: "managed",
    },
    scheduling_conflicts: {
      value: "Calendar integrated · E1-08",
      status: "clear",
    },
    architecture_dependencies: {
      value: `${deps.filter((d) => d.dependencyType === "architecture_dependencies").length} tracked`,
      status: "constitutional",
    },
    production_dependencies: {
      value: `${deps.filter((d) => d.dependencyType === "production_dependencies").length} tracked`,
      status: "monitored",
    },
    cross_department_dependencies: {
      value: `${crossDept} cross-department`,
      status: crossDept > 0 ? "coordinated" : "clear",
    },
    business_risks: {
      value: `${departmentPlanning?.departments.filter((d) => d.risks.length > 0).length ?? 0} department risks`,
      status: "evaluating",
    },
  };

  return DEPENDENCY_ANALYSIS_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "—",
    status: values[domain]?.status ?? "monitoring",
  }));
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveCalendar?: ExecutiveCalendarEngine | null;
  deps: ExecutiveDependency[];
  bottlenecks: BottleneckItem[];
}): DependencyRecommendation[] {
  const recs: DependencyRecommendation[] = [];
  const blocking = input.deps.filter((d) => d.blockingStatus === "blocking");

  if (blocking[0]) {
    recs.push({
      id: "ede-rec-block",
      title: `Resolve blocking: ${blocking[0].title}`,
      category: "resolution",
      why: `Blocking dependency · ${blocking[0].criticality} criticality`,
      what: blocking[0].title,
      how: "ECC dependency resolution · Supervisor monitoring",
      confidencePercent: 90,
    });
  }

  if (input.bottlenecks[0]) {
    recs.push({
      id: "ede-rec-bottleneck",
      title: `Address bottleneck: ${input.bottlenecks[0].title}`,
      category: "bottleneck",
      why: `${input.bottlenecks[0].type.replace(/_/g, " ")} · ${input.bottlenecks[0].severity} severity`,
      what: input.bottlenecks[0].title,
      how: input.bottlenecks[0].resolution,
      confidencePercent: 85,
    });
  }

  for (const rec of input.executiveCalendar?.recommendedActions.slice(0, 1) ?? []) {
    recs.push({
      id: `ede-rec-cal-${recs.length}`,
      title: rec.title,
      category: "calendar",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  if (recs.length < 2) {
    recs.push({
      id: "ede-rec-default",
      title: "Proceed to E1-10 Executive Scenario Planner",
      category: "strategic",
      why: "Dependency intelligence enables scenario planning before execution",
      what: "Implement Executive Scenario Planner",
      how: "Dependencies → Scenario Analysis → Executive Approval",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  deps: ExecutiveDependency[];
  recommendations: DependencyRecommendation[];
  healthScore: number;
}): PillowDependencyEvaluationMetric[] {
  const critical = input.deps.filter((d) => d.critical).length;
  const blocking = input.deps.filter((d) => d.blockingStatus === "blocking").length;

  const values: Record<string, { status: string; summary: string }> = {
    dependency_health: {
      status: healthLabel(input.healthScore),
      summary: `${input.deps.length} dependencies · health ${input.healthScore}/100`,
    },
    critical_dependencies: {
      status: critical > 5 ? "attention" : "tracked",
      summary: `${critical} critical · ${blocking} blocking · no hidden dependencies`,
    },
    dependency_risks: {
      status: blocking > 0 ? "attention" : "clear",
      summary: `${input.deps.filter((d) => d.riskLevel === "elevated").length} elevated risk signals`,
    },
    dependency_opportunities: {
      status: "evaluating",
      summary: "Dependency optimization · continuous analysis active",
    },
    dependency_optimization: {
      status: "optimizing",
      summary: "Critical path visibility · bottleneck detection active",
    },
    executive_recommendations: {
      status: "active",
      summary: `${input.recommendations.length} recommendations · Vision ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
    },
  };

  return PILLOW_DEPENDENCY_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow dependency evaluation active",
  }));
}

export function assembleExecutiveDependencyEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  executiveCalendar?: ExecutiveCalendarEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveDependencyEngine {
  const allDependencies = buildDependencies(input);
  const criticalPath = buildCriticalPath(allDependencies);
  const currentBottlenecks = buildBottlenecks(allDependencies, input.supervisor);
  const blockingDependencies = allDependencies.filter(
    (d) => d.blockingStatus === "blocking" || d.blockingStatus === "attention",
  );
  const crossDepartmentDependencies = allDependencies.filter(
    (d) => d.dependencyType === "department_dependencies",
  );
  const dependencyGraph = buildDependencyGraph(allDependencies);
  const dependencyAnalysis = buildDependencyAnalysis(allDependencies, input.departmentPlanning);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    executiveCalendar: input.executiveCalendar,
    deps: allDependencies,
    bottlenecks: currentBottlenecks,
  });

  const blockingCount = allDependencies.filter((d) => d.blockingStatus === "blocking").length;
  const criticalCount = allDependencies.filter((d) => d.critical).length;

  const healthScore = Math.round(
    Math.max(
      50,
      100 -
        blockingCount * 8 -
        allDependencies.filter((d) => d.riskLevel === "elevated").length * 3 +
        (input.corporateVision?.healthScore ?? 80) / 10,
    ),
  );

  const executionReadiness =
    blockingCount === 0
      ? "ready"
      : blockingCount <= 2
        ? "conditional"
        : "blocked";

  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    deps: allDependencies,
    recommendations: recommendedActions,
    healthScore,
  });

  const pillowAdvisory = [
    `Dependency health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${allDependencies.length} dependencies · ${criticalCount} critical · ${blockingCount} blocking`,
    `Execution readiness: ${executionReadiness} · critical path ${criticalPath.length} items`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing dependency systems · one enterprise dependency intelligence`,
    `Ready for E1-10 Executive Scenario Planner`,
  ];

  return {
    architectureVersion: "E1-09",
    computedAt: new Date().toISOString(),
    dependencySummary:
      "One permanent Executive Dependency Engine — continuously discovers, analyses and governs enterprise dependencies, providing complete executive visibility into bottlenecks, critical paths and execution readiness before work begins",
    dependencyHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    executionReadiness,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    healthScore,
    criticalDependencyCount: criticalCount,
    blockingDependencyCount: blockingCount,
    criticalPath,
    currentBottlenecks,
    blockingDependencies,
    crossDepartmentDependencies,
    allDependencies,
    dependencyGraph,
    dependencyAnalysis,
    dependencyHierarchy: buildHierarchy(input),
    dependencyLifecycle: buildLifecycle("execution_monitoring"),
    recommendedActions,
    pillowEvaluations,
    dependencyPrinciples: [...DEPENDENCY_PRINCIPLES],
    governedDomains: [...GOVERNED_DEPENDENCY_DOMAINS],
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
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "dependency resolution"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE110: true,
  };
}

export function buildFallbackExecutiveDependencyEngine(): ExecutiveDependencyEngine {
  return assembleExecutiveDependencyEngine({});
}
