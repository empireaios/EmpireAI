import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { InitiativePortfolioEngine } from "../initiative-portfolio-engine/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  DEPARTMENT_HIERARCHY,
  DEPARTMENT_LIFECYCLE,
  PLANNING_PRINCIPLES,
  GOVERNED_DEPARTMENTS,
  CROSS_DEPARTMENT_DOMAINS,
  PILLOW_DEPARTMENT_EVALUATIONS,
  DEPARTMENT_PLANNING_DOMAINS,
} from "./paths.js";
import type {
  DepartmentPlanningEngine,
  DepartmentHierarchyStep,
  DepartmentLifecycleStep,
  DepartmentLifecyclePhase,
  ExecutiveDepartment,
  CrossDepartmentMetric,
  DepartmentPlanningMetric,
  DepartmentRecommendation,
  PillowDepartmentEvaluationMetric,
  GovernedDepartment,
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
  initiativePortfolio?: InitiativePortfolioEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  journey?: Record<string, unknown>;
}): DepartmentHierarchyStep[] {
  const summaries: Record<string, string> = {
    vision: input.corporateVision?.visionWhy?.slice(0, 120) ?? "EMPIREAI_VISION.md",
    strategic_objectives:
      input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 2).join(" · ") ??
      "E1-03 objectives",
    executive_portfolio:
      input.initiativePortfolio?.activeInitiatives.map((i) => i.title).slice(0, 2).join(" · ") ??
      "E1-06 portfolio",
    departments: `${GOVERNED_DEPARTMENTS.length} governed departments · E1-07`,
    department_initiatives: "Initiatives assigned per department · no silos",
    projects: String(input.journey?.currentMission ?? "Active mission"),
    missions: String(input.journey?.currentJourney ?? "Constitutional execution"),
    execution: "ECC · Supervisor · Production Truth",
  };

  return DEPARTMENT_HIERARCHY.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? "Department hierarchy active",
  }));
}

function buildLifecycle(activePhase: DepartmentLifecyclePhase = "execution"): DepartmentLifecycleStep[] {
  const activeIdx = DEPARTMENT_LIFECYCLE.indexOf(activePhase);
  return DEPARTMENT_LIFECYCLE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function matchInitiatives(
  dept: GovernedDepartment,
  initiatives: InitiativePortfolioEngine["activeInitiatives"],
): string[] {
  const keywords: Record<GovernedDepartment, string[]> = {
    engineering: ["engineering", "repository", "evolution", "builder"],
    architecture: ["architecture", "framework", "constitutional"],
    runtime: ["runtime", "brain", "production mode", "session"],
    execution: ["execution", "ecc", "mission", "journey"],
    experience: ["cockpit", "ux", "experience", "founder", "eta"],
    business: ["business", "factory", "operating"],
    commerce: ["commerce", "marketplace", "manufacture"],
    finance: ["profit", "financial", "ms-a", "grand king"],
    governance: ["governance", "e1-", "vision", "constitution"],
    knowledge: ["knowledge", "repository evolution"],
    production: ["production", "guardian", "truth", "browser"],
    operations: ["operations", "supervisor", "automation"],
    marketing: ["marketing", "growth", "commercial"],
    future_departments: ["future", "expansion", "deferred"],
  };

  const keys = keywords[dept] ?? [];
  return initiatives
    .filter((i) => keys.some((k) => i.title.toLowerCase().includes(k)))
    .map((i) => i.title)
    .slice(0, 4);
}

function buildDepartments(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  supervisor?: Record<string, unknown>;
}): ExecutiveDepartment[] {
  const initiatives = input.initiativePortfolio?.activeInitiatives ?? [];
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];
  const eta = String(input.supervisor?.eta ?? "Supervisor ETA");

  const catalogue: Record<
    GovernedDepartment,
    {
      name: string;
      purpose: string;
      responsibilities: string[];
      owner: string;
      deps: string[];
      resources: string;
      capacity: string;
      performance: string;
      businessValue: string;
      status: string;
      health: number;
      risks: string[];
    }
  > = {
    engineering: {
      name: "Engineering",
      purpose: "Constitutional software engineering · repository · builder execution",
      responsibilities: ["Repository evolution", "Builder execution", "Code quality", "Production Truth"],
      owner: "Builder · Pillow",
      deps: ["Architecture", "Runtime"],
      resources: "Builder · ECC · Pillow",
      capacity: "active",
      performance: "P1–P9 foundation stable",
      businessValue: "high",
      status: "active",
      health: 82,
      risks: [],
    },
    architecture: {
      name: "Architecture",
      purpose: "Canonical architecture · constitutional integrity · drift prevention",
      responsibilities: ["Architecture evolution", "Constitutional alignment", "Naming standards"],
      owner: "Pillow · Architecture Evolution",
      deps: ["Governance", "Knowledge"],
      resources: "Architecture Evolution · VIE",
      capacity: "active",
      performance: "Constitutional architecture preserved",
      businessValue: "high",
      status: "active",
      health: 88,
      risks: [],
    },
    runtime: {
      name: "Runtime",
      purpose: "Brain runtime · production mode · durable sessions",
      responsibilities: ["P5 runtime foundation", "Production mode", "Session durability"],
      owner: "Brain Runtime · Pillow",
      deps: ["Engineering", "Production"],
      resources: "Pillow Session · Brain Runtime",
      capacity: "stable",
      performance: "Runtime operational",
      businessValue: "high",
      status: "active",
      health: 85,
      risks: [],
    },
    execution: {
      name: "Execution",
      purpose: "ECC coordination · mission scheduling · dependency resolution",
      responsibilities: ["Mission execution", "Programme coordination", "Priority execution"],
      owner: "ECC · Supervisor",
      deps: ["Governance", "Operations"],
      resources: "ECC · Journey · Supervisor",
      capacity: "active",
      performance: String(input.executiveRoadmap?.overallProgress ?? 60) + "% roadmap progress",
      businessValue: "critical",
      status: "active",
      health: 80,
      risks: [],
    },
    experience: {
      name: "Experience",
      purpose: "Founder Cockpit · executive visibility · Pillow UX",
      responsibilities: ["Cockpit UX", "Live ETA", "Explainability", "Executive Home"],
      owner: "Cockpit · Pillow UX",
      deps: ["Engineering", "Governance"],
      resources: "empireai-web · Cockpit UX",
      capacity: "active",
      performance: "P7 Cockpit complete",
      businessValue: "high",
      status: "active",
      health: 90,
      risks: [],
    },
    business: {
      name: "Business",
      purpose: "Business Factory · company manufacture · operating model",
      responsibilities: ["Manufacture businesses", "Launch operations", "Business automation"],
      owner: "Business Factory",
      deps: ["Commerce", "Finance"],
      resources: "P8 Factory · Automation",
      capacity: "growing",
      performance: "Factory operational",
      businessValue: "critical",
      status: "active",
      health: 75,
      risks: ["Commercial velocity"],
    },
    commerce: {
      name: "Commerce",
      purpose: "Commerce Operating Intelligence · marketplace · commercial execution",
      responsibilities: ["Commerce operations", "Marketplace integration", "Commercial intelligence"],
      owner: "Commerce Operating Model",
      deps: ["Business", "Finance"],
      resources: "P8 Commerce · Marketplace",
      capacity: "active",
      performance: "Commerce programmes in progress",
      businessValue: "critical",
      status: "active",
      health: 78,
      risks: ["Commercial velocity"],
    },
    finance: {
      name: "Finance",
      purpose: "MS-A net profit · Grand King account · financial governance",
      responsibilities: ["USD 100k net profit", "Financial tracking", "ROI measurement"],
      owner: "Grand King",
      deps: ["Commerce", "Business"],
      resources: "Grand King Operating Account",
      capacity: "monitoring",
      performance: "MS-A in progress",
      businessValue: "critical",
      status: "active",
      health: 70,
      risks: ["Revenue velocity"],
    },
    governance: {
      name: "Governance",
      purpose: "E1 Executive Planning · constitutional governance · VIE validation",
      responsibilities: ["Executive planning", "Vision integrity", "Constitutional compliance"],
      owner: "Grand King · Pillow · VIE",
      deps: ["Knowledge"],
      resources: "E1 Programme · VIE · Constitution",
      capacity: "active",
      performance: "E1-01 through E1-07 active",
      businessValue: "critical",
      status: "active",
      health: 92,
      risks: [],
    },
    knowledge: {
      name: "Knowledge",
      purpose: "Knowledge evolution · repository truth · learning integration",
      responsibilities: ["Knowledge evolution", "Repository sync", "Learning integration"],
      owner: "Knowledge Evolution · Pillow",
      deps: ["Engineering", "Architecture"],
      resources: "P9 Knowledge · Repository Evolution",
      capacity: "active",
      performance: "Knowledge programmes active",
      businessValue: "high",
      status: "active",
      health: 83,
      risks: [],
    },
    production: {
      name: "Production",
      purpose: "Production Truth · Guardian monitoring · browser verification",
      responsibilities: ["Production mode", "Guardian monitoring", "Browser truth"],
      owner: "Guardian · Production Truth",
      deps: ["Runtime", "Engineering"],
      resources: "Guardian · Browser Truth",
      capacity: "stable",
      performance: "Production Truth active",
      businessValue: "critical",
      status: "active",
      health: 86,
      risks: [],
    },
    operations: {
      name: "Operations",
      purpose: "Supervisor · ETA · recovery · zero-human automation",
      responsibilities: ["Mission supervision", "ETA monitoring", "Recovery doctrine"],
      owner: "Supervisor · Automation",
      deps: ["Execution", "Production"],
      resources: "Supervisor · ETA Engine · Recovery",
      capacity: "active",
      performance: `ETA ${eta}`,
      businessValue: "high",
      status: "active",
      health: 84,
      risks: [],
    },
    marketing: {
      name: "Marketing",
      purpose: "Commercial growth · market positioning · customer acquisition",
      responsibilities: ["Growth initiatives", "Commercial positioning", "Market intelligence"],
      owner: "Commercial Intelligence",
      deps: ["Commerce", "Business"],
      resources: "P8 Intelligence · Commerce",
      capacity: "planned",
      performance: "Growth programmes queued",
      businessValue: "medium",
      status: "planning",
      health: 65,
      risks: ["Market timing"],
    },
    future_departments: {
      name: "Future Departments",
      purpose: "Expansion departments under validated executive planning",
      responsibilities: ["Future expansion", "Department onboarding", "E1 completion gate"],
      owner: "Grand King · Pillow",
      deps: ["Governance", "E1 Executive Planning"],
      resources: "Deferred until E1 foundation complete",
      capacity: "reserved",
      performance: "Awaiting E1 completion",
      businessValue: "planned",
      status: "deferred",
      health: 60,
      risks: ["Premature expansion"],
    },
  };

  return GOVERNED_DEPARTMENTS.map((dept, i) => {
    const spec = catalogue[dept];
    const assigned = matchInitiatives(dept, initiatives);
    if (assigned.length === 0 && dept === "governance") {
      assigned.push("E1-07 Department Planning Engine");
    }
    return {
      departmentId: `dpe-${dept}`,
      departmentName: spec.name,
      purpose: spec.purpose,
      strategicResponsibilities: spec.responsibilities,
      currentObjectives: objectives.slice(0, 2),
      assignedInitiatives: assigned.length ? assigned : [`${spec.name} programme`],
      priority: i + 1,
      owner: spec.owner,
      dependencies: spec.deps,
      resources: spec.resources,
      capacity: spec.capacity,
      performance: spec.performance,
      businessValue: spec.businessValue,
      currentStatus: spec.status,
      evidence: ["E1 Department Planning", "Production Truth", "Journey"],
      healthScore: spec.health,
      risks: spec.risks,
    };
  });
}

function buildCrossDepartmentCoordination(departments: ExecutiveDepartment[]): CrossDepartmentMetric[] {
  const sharedDeps = departments.reduce((s, d) => s + d.dependencies.length, 0);
  const activeCount = departments.filter((d) => d.currentStatus === "active").length;
  const riskCount = departments.reduce((s, d) => s + d.risks.length, 0);
  const constrained = departments.filter((d) => d.capacity === "constrained" || d.capacity === "reserved").length;

  const values: Record<string, { value: string; status: string }> = {
    shared_objectives: {
      value: "E1 Executive Planning · MS-A · Constitutional execution",
      status: "aligned",
    },
    shared_dependencies: {
      value: `${sharedDeps} cross-department dependencies`,
      status: sharedDeps > 20 ? "tracked" : "healthy",
    },
    shared_resources: {
      value: "ECC · Pillow · Supervisor coordinated",
      status: "allocated",
    },
    execution_bottlenecks: {
      value: constrained > 0 ? `${constrained} capacity signals` : "None detected",
      status: constrained > 0 ? "attention" : "clear",
    },
    strategic_alignment: {
      value: `${activeCount}/${departments.length} departments active`,
      status: "aligned",
    },
    business_alignment: {
      value: "Commerce · Finance · Business synchronized",
      status: "coordinated",
    },
    capacity_conflicts: {
      value: constrained > 0 ? String(constrained) : "None",
      status: constrained > 0 ? "review" : "clear",
    },
    knowledge_sharing: {
      value: "Knowledge · Architecture · Governance linked",
      status: "active",
    },
  };

  return CROSS_DEPARTMENT_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "—",
    status: values[domain]?.status ?? "monitoring",
  }));
}

function buildDepartmentPlanning(departments: ExecutiveDepartment[]): DepartmentPlanningMetric[] {
  const avgHealth = Math.round(departments.reduce((s, d) => s + d.healthScore, 0) / departments.length);
  const riskCount = departments.reduce((s, d) => s + d.risks.length, 0);

  const values: Record<string, { value: string; status: string }> = {
    department_objectives: {
      value: `${departments.length} departments · shared objectives`,
      status: "active",
    },
    department_capacity: {
      value: `${departments.filter((d) => d.capacity === "active" || d.capacity === "stable").length} within capacity`,
      status: "managed",
    },
    department_resources: {
      value: "ECC resource coordination active",
      status: "allocated",
    },
    department_dependencies: {
      value: `${departments.reduce((s, d) => s + d.dependencies.length, 0)} tracked`,
      status: "coordinated",
    },
    department_risks: {
      value: String(riskCount),
      status: riskCount > 3 ? "attention" : "clear",
    },
    department_roadmaps: {
      value: "Aligned to E1-04 Executive Roadmap",
      status: "synchronized",
    },
    department_performance: {
      value: `${avgHealth}/100 average health`,
      status: avgHealth >= 80 ? "strong" : "building",
    },
    department_improvements: {
      value: "Continuous improvement active",
      status: "optimizing",
    },
  };

  return DEPARTMENT_PLANNING_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "—",
    status: values[domain]?.status ?? "monitoring",
  }));
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  departments: ExecutiveDepartment[];
}): DepartmentRecommendation[] {
  const recs: DepartmentRecommendation[] = [];
  const lowest = [...input.departments].sort((a, b) => a.healthScore - b.healthScore)[0];

  if (lowest && lowest.healthScore < 75) {
    recs.push({
      id: "dpe-rec-attention",
      title: `Strengthen ${lowest.departmentName} department`,
      category: "department",
      why: `Health ${lowest.healthScore}/100 · ${lowest.risks.join(", ") || "performance attention"}`,
      what: lowest.departmentName,
      how: "Cross-department coordination · ECC resource reallocation",
      confidencePercent: 85,
    });
  }

  for (const rec of input.initiativePortfolio?.recommendedActions.slice(0, 2) ?? []) {
    recs.push({
      id: `dpe-rec-portfolio-${recs.length}`,
      title: rec.title,
      category: "portfolio",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  for (const rec of input.priorityManagement?.recommendedActions.slice(0, 1) ?? []) {
    recs.push({
      id: `dpe-rec-priority-${recs.length}`,
      title: rec.title,
      category: "priority",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  if (recs.length < 2) {
    recs.push({
      id: "dpe-rec-default",
      title: "Proceed to E1-08 Executive Calendar Engine",
      category: "strategic",
      why: "Department planning requires executive calendar coordination",
      what: "Implement Executive Calendar Engine",
      how: "Department Plans → Calendar Sync → Executive Visibility",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  departments: ExecutiveDepartment[];
  recommendations: DepartmentRecommendation[];
  healthScore: number;
}): PillowDepartmentEvaluationMetric[] {
  const riskCount = input.departments.reduce((s, d) => s + d.risks.length, 0);

  const values: Record<string, { status: string; summary: string }> = {
    department_health: {
      status: healthLabel(input.healthScore),
      summary: `${input.departments.length} departments · avg health ${input.healthScore}/100`,
    },
    department_alignment: {
      status: String(input.corporateVision?.visionAlignment ?? "aligned"),
      summary: "Every department synchronized · no silos · shared executive direction",
    },
    department_performance: {
      status: input.healthScore >= 80 ? "strong" : "building",
      summary: `${input.departments.filter((d) => d.currentStatus === "active").length} active departments`,
    },
    department_risks: {
      status: riskCount > 3 ? "attention" : "clear",
      summary: `${riskCount} department risk signals · cross-department monitored`,
    },
    department_opportunities: {
      status: "evaluating",
      summary: "Balanced investment · capacity optimization opportunities",
    },
    executive_recommendations: {
      status: "active",
      summary: `${input.recommendations.length} recommendations · continuous planning`,
    },
  };

  return PILLOW_DEPARTMENT_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow department evaluation active",
  }));
}

export function assembleDepartmentPlanningEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): DepartmentPlanningEngine {
  const departments = buildDepartments(input);
  const crossDepartmentCoordination = buildCrossDepartmentCoordination(departments);
  const departmentPlanning = buildDepartmentPlanning(departments);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    initiativePortfolio: input.initiativePortfolio,
    priorityManagement: input.priorityManagement,
    departments,
  });

  const healthScore = Math.round(
    departments.reduce((s, d) => s + d.healthScore, 0) / Math.max(1, departments.length),
  );

  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    departments,
    recommendations: recommendedActions,
    healthScore,
  });

  const activeDepartments = departments.filter((d) => d.currentStatus === "active");

  const pillowAdvisory = [
    `Planning health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${departments.length} departments · ${activeDepartments.length} active · one executive planning architecture`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No department silos · cross-department coordination active`,
    `Portfolio initiatives assigned per department · E1-06 integrated`,
    `Ready for E1-09 Executive Dependency Engine`,
  ];

  return {
    architectureVersion: "E1-07",
    computedAt: new Date().toISOString(),
    planningSummary:
      "One permanent Department Planning Engine — aligns every department under one constitutional executive planning framework ensuring coordinated execution, shared strategic direction and enterprise-wide organizational alignment",
    planningHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activeDepartmentCount: activeDepartments.length,
    departments,
    departmentHierarchy: buildHierarchy(input),
    departmentLifecycle: buildLifecycle("execution"),
    crossDepartmentCoordination,
    departmentPlanning,
    recommendedActions,
    pillowEvaluations,
    planningPrinciples: [...PLANNING_PRINCIPLES],
    governedDepartments: [...GOVERNED_DEPARTMENTS],
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
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "department coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE108: true,
  };
}

export function buildFallbackDepartmentPlanningEngine(): DepartmentPlanningEngine {
  return assembleDepartmentPlanningEngine({});
}
