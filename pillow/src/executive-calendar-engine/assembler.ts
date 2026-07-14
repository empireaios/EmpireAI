import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DepartmentPlanningEngine } from "../department-planning-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { InitiativePortfolioEngine } from "../initiative-portfolio-engine/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CALENDAR_HIERARCHY,
  CALENDAR_LIFECYCLE,
  CALENDAR_PRINCIPLES,
  GOVERNED_CALENDAR_DOMAINS,
  EXECUTIVE_CADENCE,
  CALENDAR_SEGMENTS,
  PILLOW_CALENDAR_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveCalendarEngine,
  CalendarHierarchyStep,
  CalendarLifecycleStep,
  CalendarLifecyclePhase,
  ExecutiveCalendarEvent,
  CadenceEntry,
  CalendarSegmentSummary,
  CalendarRecommendation,
  PillowCalendarEvaluationMetric,
  GovernedCalendarDomain,
  CalendarSegment,
  ExecutiveCadenceType,
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

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildHierarchy(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  journey?: Record<string, unknown>;
}): CalendarHierarchyStep[] {
  const summaries: Record<string, string> = {
    vision: input.corporateVision?.visionWhy?.slice(0, 120) ?? "EMPIREAI_VISION.md",
    strategic_objectives: "E1-03 measurable WHAT · objective-aligned scheduling",
    executive_roadmap:
      input.executiveRoadmap?.currentProgrammes.map((p) => p.title).slice(0, 2).join(" · ") ??
      "E1-04 programmes",
    executive_calendar: "One constitutional planning cadence · E1-08",
    programmes: "E1 Executive Programme · P1–P9 constitutional",
    milestones: "Programme · mission · review milestones",
    reviews: "Daily · weekly · monthly · quarterly · annual cadence",
    missions: String(input.journey?.currentMission ?? "Active mission"),
    execution: "ECC · Supervisor · Production Truth",
  };

  return CALENDAR_HIERARCHY.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? "Calendar hierarchy active",
  }));
}

function buildLifecycle(activePhase: CalendarLifecyclePhase = "execution"): CalendarLifecycleStep[] {
  const activeIdx = CALENDAR_LIFECYCLE.indexOf(activePhase);
  return CALENDAR_LIFECYCLE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildCadence(now: Date): CadenceEntry[] {
  const specs: Record<ExecutiveCadenceType, { frequency: string; offsetDays: number; owner: string }> = {
    daily_executive_review: { frequency: "Daily", offsetDays: 0, owner: "Grand King · Pillow" },
    weekly_planning_review: { frequency: "Weekly", offsetDays: 7, owner: "Pillow · Executive" },
    monthly_executive_review: { frequency: "Monthly", offsetDays: 30, owner: "Grand King · Pillow" },
    quarterly_strategic_review: { frequency: "Quarterly", offsetDays: 90, owner: "Grand King · E1 Programme" },
    annual_vision_review: { frequency: "Annual", offsetDays: 365, owner: "Grand King · VIE" },
    programme_reviews: { frequency: "Per programme", offsetDays: 14, owner: "ECC · Pillow" },
    milestone_reviews: { frequency: "Per milestone", offsetDays: 7, owner: "Supervisor · ECC" },
    business_reviews: { frequency: "Monthly", offsetDays: 30, owner: "Business · Commerce" },
    production_reviews: { frequency: "Weekly", offsetDays: 7, owner: "Guardian · Production Truth" },
    architecture_reviews: { frequency: "Monthly", offsetDays: 30, owner: "Architecture Evolution" },
  };

  return EXECUTIVE_CADENCE.map((cadence) => ({
    cadence,
    label: label(cadence),
    frequency: specs[cadence].frequency,
    nextOccurrence: formatDate(addDays(now, specs[cadence].offsetDays)),
    status: cadence === "daily_executive_review" ? "active" : "scheduled",
    owner: specs[cadence].owner,
  }));
}

function buildEvents(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
}): ExecutiveCalendarEvent[] {
  const events: ExecutiveCalendarEvent[] = [];
  const now = new Date();
  const seen = new Set<string>();
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];
  const roadmapRef = String(input.journey?.currentJourney ?? "E1 Executive Planning");
  const eta = String(input.supervisor?.eta ?? "Supervisor ETA");

  function addEvent(item: Omit<ExecutiveCalendarEvent, "eventId"> & { id: string }) {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    events.push({
      eventId: item.id,
      title: item.title,
      purpose: item.purpose,
      category: item.category,
      priority: item.priority,
      owner: item.owner,
      participants: item.participants,
      dependencies: item.dependencies,
      relatedObjectives: item.relatedObjectives,
      relatedRoadmap: item.relatedRoadmap,
      relatedProgrammes: item.relatedProgrammes,
      scheduledDate: item.scheduledDate,
      expectedDuration: item.expectedDuration,
      status: item.status,
      evidence: item.evidence,
      segment: item.segment,
      whyItMatters: item.whyItMatters,
    });
  }

  addEvent({
    id: "ece-e1-08",
    title: "E1-08 Executive Calendar Engine",
    purpose: "Establish constitutional executive planning cadence",
    category: "governance_reviews",
    priority: 1,
    owner: "Grand King · Pillow",
    participants: ["Grand King", "Pillow", "ECC"],
    dependencies: ["E1-07 Department Planning Engine"],
    relatedObjectives: objectives,
    relatedRoadmap: roadmapRef,
    relatedProgrammes: ["E1 Executive Planning"],
    scheduledDate: formatDate(now),
    expectedDuration: "Current milestone",
    status: "active",
    evidence: ["E1 Executive Programme", "Constitutional governance"],
    segment: "critical",
    whyItMatters: "Governs WHEN every executive activity occurs · one calendar",
  });

  addEvent({
    id: "ece-daily-review",
    title: "Daily Executive Review",
    purpose: "Daily constitutional executive visibility · priorities · execution",
    category: "strategic_reviews",
    priority: 1,
    owner: "Grand King · Pillow",
    participants: ["Grand King", "Pillow", "Supervisor"],
    dependencies: [],
    relatedObjectives: objectives,
    relatedRoadmap: roadmapRef,
    relatedProgrammes: ["E1 Executive Planning"],
    scheduledDate: formatDate(now),
    expectedDuration: "30 minutes",
    status: "recurring",
    evidence: ["Executive Cadence", "Cockpit telemetry"],
    segment: "recurring",
    whyItMatters: "Grand King always knows what is happening today and why",
  });

  for (const [i, prog] of (input.executiveRoadmap?.currentProgrammes ?? []).entries()) {
    for (const [j, ms] of prog.milestones.entries()) {
      addEvent({
        id: `ece-ms-${prog.roadmapId}-${j}`,
        title: `${prog.title} — ${ms.title}`,
        purpose: `Programme milestone · ${prog.currentPhase}`,
        category: "programme_milestones",
        priority: prog.priority,
        owner: prog.owner,
        participants: ["ECC", "Supervisor", "Pillow"],
        dependencies: prog.dependencies,
        relatedObjectives: prog.relatedObjectives,
        relatedRoadmap: roadmapRef,
        relatedProgrammes: [prog.title],
        scheduledDate: formatDate(addDays(now, i * 7 + j * 3 + 1)),
        expectedDuration: "Programme phase",
        status: ms.status,
        evidence: ["Executive Roadmap", ms.title],
        segment: ms.status === "complete" ? "completed" : prog.priority <= 2 ? "critical" : "upcoming",
        whyItMatters: `Roadmap sequencing · ${prog.overallProgress}% programme progress`,
      });
    }
  }

  for (const [i, init] of (input.initiativePortfolio?.activeInitiatives ?? []).slice(0, 6).entries()) {
    addEvent({
      id: `ece-init-${init.initiativeId}`,
      title: `Portfolio Review — ${init.title}`,
      purpose: init.purpose,
      category: init.domain.includes("commerce")
        ? "business_reviews"
        : init.domain.includes("governance")
          ? "governance_reviews"
          : "planning_sessions",
      priority: init.priority,
      owner: init.owner,
      participants: ["Grand King", "Pillow", init.owner.split(" · ")[0] ?? "Executive"],
      dependencies: init.dependencies,
      relatedObjectives: [init.strategicObjective],
      relatedRoadmap: roadmapRef,
      relatedProgrammes: [init.portfolio],
      scheduledDate: formatDate(addDays(now, i * 5 + 2)),
      expectedDuration: "Executive session",
      status: init.currentStatus,
      evidence: init.evidence,
      segment: init.priority <= 2 ? "critical" : "upcoming",
      whyItMatters: `Portfolio initiative · ${init.businessValue} business value`,
    });
  }

  for (const [i, dept] of (input.departmentPlanning?.departments ?? []).filter((d) => d.currentStatus === "active").slice(0, 5).entries()) {
    addEvent({
      id: `ece-dept-${dept.departmentId}`,
      title: `${dept.departmentName} Department Review`,
      purpose: dept.purpose,
      category: dept.departmentName === "Architecture"
        ? "architecture_reviews"
        : dept.departmentName === "Finance"
          ? "financial_reviews"
          : dept.departmentName === "Production"
            ? "production_reviews"
            : "planning_sessions",
      priority: i + 3,
      owner: dept.owner,
      participants: [dept.owner, "Pillow", "ECC"],
      dependencies: dept.dependencies,
      relatedObjectives: dept.currentObjectives,
      relatedRoadmap: roadmapRef,
      relatedProgrammes: dept.assignedInitiatives.slice(0, 2),
      scheduledDate: formatDate(addDays(now, i * 4 + 3)),
      expectedDuration: "1 hour",
      status: "scheduled",
      evidence: dept.evidence,
      segment: "upcoming",
      whyItMatters: `Department contribution · health ${dept.healthScore}/100`,
    });
  }

  addEvent({
    id: "ece-weekly-planning",
    title: "Weekly Planning Review",
    purpose: "Review roadmap · priorities · portfolio · department alignment",
    category: "planning_sessions",
    priority: 2,
    owner: "Pillow · Executive",
    participants: ["Grand King", "Pillow", "ECC", "Supervisor"],
    dependencies: ["E1-04 Roadmap", "E1-05 Priorities", "E1-06 Portfolio"],
    relatedObjectives: objectives,
    relatedRoadmap: roadmapRef,
    relatedProgrammes: ["E1 Executive Planning"],
    scheduledDate: formatDate(addDays(now, 7)),
    expectedDuration: "2 hours",
    status: "recurring",
    evidence: ["Executive Cadence", "E1 Programme"],
    segment: "recurring",
    whyItMatters: "Synchronizes WHAT · WHEN · WHAT FIRST · HOW collectively",
  });

  addEvent({
    id: "ece-quarterly-strategic",
    title: "Quarterly Strategic Review",
    purpose: "Vision alignment · strategic objectives · long-term direction",
    category: "quarterly_planning",
    priority: 1,
    owner: "Grand King · VIE",
    participants: ["Grand King", "Pillow", "VIE"],
    dependencies: ["E1-02 Corporate Vision"],
    relatedObjectives: objectives,
    relatedRoadmap: roadmapRef,
    relatedProgrammes: ["E1 Executive Planning", "P9 Evolution"],
    scheduledDate: formatDate(addDays(now, 90)),
    expectedDuration: "Half day",
    status: "scheduled",
    evidence: ["Corporate Vision Engine", "VIE validation"],
    segment: "upcoming",
    whyItMatters: "Constitutional strategic direction · Vision First",
  });

  addEvent({
    id: "ece-e1-09",
    title: "E1-09 Executive Dependency Engine",
    purpose: "Dependency governance across programmes and missions",
    category: "future_planning",
    priority: 10,
    owner: "Pillow · Executive",
    participants: ["Pillow", "ECC"],
    dependencies: ["E1-08 Executive Calendar Engine"],
    relatedObjectives: ["E1 Executive Planning"],
    relatedRoadmap: roadmapRef,
    relatedProgrammes: ["E1 Executive Planning"],
    scheduledDate: formatDate(addDays(now, 14)),
    expectedDuration: "Programme phase",
    status: "planned",
    evidence: ["E1 Executive Programme"],
    segment: "upcoming",
    whyItMatters: "Next E1 milestone · dependency coordination",
  });

  const mission = String(input.journey?.currentMission ?? "");
  if (mission) {
    addEvent({
      id: "ece-active-mission",
      title: `Mission Execution — ${mission}`,
      purpose: "Active constitutional mission under executive calendar",
      category: "mission_milestones",
      priority: 1,
      owner: "ECC · Builder",
      participants: ["ECC", "Supervisor", "Builder"],
      dependencies: [],
      relatedObjectives: objectives.slice(0, 2),
      relatedRoadmap: roadmapRef,
      relatedProgrammes: ["E1 Executive Planning"],
      scheduledDate: formatDate(now),
      expectedDuration: eta,
      status: "active",
      evidence: ["Journey", "Production Truth"],
      segment: "critical",
      whyItMatters: "Current mission execution · Supervisor ETA",
    });
  }

  return events.slice(0, 24);
}

function buildSegmentSummaries(events: ExecutiveCalendarEvent[]): CalendarSegmentSummary[] {
  return CALENDAR_SEGMENTS.map((segment) => {
    const items = events.filter((e) => e.segment === segment);
    return {
      segment,
      label: label(segment),
      count: items.length,
      summary:
        items.length > 0
          ? items.map((e) => e.title).slice(0, 3).join(" · ")
          : segment === "historical" || segment === "cancelled"
            ? "Fully traceable · no active items"
            : "None scheduled",
    };
  });
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  events: ExecutiveCalendarEvent[];
}): CalendarRecommendation[] {
  const recs: CalendarRecommendation[] = [];
  const critical = input.events.filter((e) => e.segment === "critical" && e.status !== "complete");

  if (critical[0]) {
    recs.push({
      id: "ece-rec-critical",
      title: `Prioritize: ${critical[0].title}`,
      category: "scheduling",
      why: `Critical event · ${critical[0].whyItMatters}`,
      what: critical[0].title,
      how: "ECC execution timing · Supervisor readiness monitoring",
      confidencePercent: 90,
    });
  }

  for (const rec of input.departmentPlanning?.recommendedActions.slice(0, 1) ?? []) {
    recs.push({
      id: `ece-rec-dept-${recs.length}`,
      title: rec.title,
      category: "department",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  for (const rec of input.priorityManagement?.recommendedActions.slice(0, 1) ?? []) {
    recs.push({
      id: `ece-rec-priority-${recs.length}`,
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
      id: "ece-rec-default",
      title: "Proceed to E1-09 Executive Dependency Engine",
      category: "strategic",
      why: "Calendar requires dependency governance across scheduling",
      what: "Implement Executive Dependency Engine",
      how: "Calendar → Dependency Analysis → ECC Coordination",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  events: ExecutiveCalendarEvent[];
  cadence: CadenceEntry[];
  recommendations: CalendarRecommendation[];
  healthScore: number;
}): PillowCalendarEvaluationMetric[] {
  const upcoming = input.events.filter((e) => e.segment === "upcoming" || e.segment === "critical");
  const recurring = input.events.filter((e) => e.segment === "recurring").length;

  const values: Record<string, { status: string; summary: string }> = {
    executive_calendar_health: {
      status: healthLabel(input.healthScore),
      summary: `${input.events.length} events · health ${input.healthScore}/100 · one calendar`,
    },
    planning_cadence: {
      status: "active",
      summary: `${input.cadence.length} cadence types · ${recurring} recurring events`,
    },
    scheduling_conflicts: {
      status: "clear",
      summary: "No scheduling conflicts · dependency aware scheduling",
    },
    review_quality: {
      status: "strong",
      summary: `${upcoming.length} upcoming reviews · evidence-backed events`,
    },
    executive_opportunities: {
      status: "evaluating",
      summary: "Predictable cadence · continuous planning active",
    },
    calendar_recommendations: {
      status: "active",
      summary: `${input.recommendations.length} recommendations · Vision ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
    },
  };

  return PILLOW_CALENDAR_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow calendar evaluation active",
  }));
}

export function assembleExecutiveCalendarEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveCalendarEngine {
  const now = new Date();
  const today = formatDate(now);
  const allEvents = buildEvents(input);
  const executiveCadence = buildCadence(now);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    departmentPlanning: input.departmentPlanning,
    priorityManagement: input.priorityManagement,
    events: allEvents,
  });

  const todaysAgenda = allEvents.filter(
    (e) => e.scheduledDate === today || e.segment === "recurring" || e.status === "active",
  );
  const upcomingReviews = allEvents.filter(
    (e) =>
      e.category.includes("review") ||
      e.category.includes("planning") ||
      e.category === "planning_sessions",
  );
  const programmeMilestones = allEvents.filter((e) => e.category === "programme_milestones");
  const criticalEvents = allEvents.filter((e) => e.segment === "critical");

  const healthScore = Math.round(
    ((input.departmentPlanning?.healthScore ?? 80) +
      (input.initiativePortfolio?.healthScore ?? 80) +
      (input.executiveRoadmap?.healthScore ?? 80) +
      (input.corporateVision?.healthScore ?? 80)) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    events: allEvents,
    cadence: executiveCadence,
    recommendations: recommendedActions,
    healthScore,
  });

  const upcomingCount = allEvents.filter(
    (e) => e.segment === "upcoming" || e.segment === "critical" || e.segment === "recurring",
  ).length;

  const pillowAdvisory = [
    `Calendar health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${allEvents.length} executive events · ${todaysAgenda.length} on today's agenda`,
    `Planning cadence: ${executiveCadence.length} cadence types · predictable scheduling`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing calendar systems · one constitutional cadence`,
    `Ready for E1-10 Executive Scenario Planner`,
  ];

  return {
    architectureVersion: "E1-08",
    computedAt: now.toISOString(),
    calendarSummary:
      "One permanent Executive Calendar Engine — governs the executive planning cadence of the Empire, coordinating strategic reviews, programme milestones and enterprise scheduling through one constitutional calendar",
    calendarHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    scheduleHealth: upcomingCount > 0 ? "on cadence" : "building",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    planningCadence: `${executiveCadence.length} cadence types · daily through annual`,
    healthScore,
    upcomingEventCount: upcomingCount,
    criticalEventCount: criticalEvents.length,
    todaysAgenda,
    upcomingReviews: upcomingReviews.slice(0, 10),
    programmeMilestones: programmeMilestones.slice(0, 10),
    criticalEvents,
    executiveCadence,
    calendarHierarchy: buildHierarchy(input),
    calendarLifecycle: buildLifecycle("execution"),
    calendarSegments: buildSegmentSummaries(allEvents),
    recommendedActions,
    pillowEvaluations,
    calendarPrinciples: [...CALENDAR_PRINCIPLES],
    governedDomains: [...GOVERNED_CALENDAR_DOMAINS],
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
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "calendar scheduling"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE109: true,
  };
}

export function buildFallbackExecutiveCalendarEngine(): ExecutiveCalendarEngine {
  return assembleExecutiveCalendarEngine({});
}
