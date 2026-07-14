import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DepartmentPlanningEngine } from "../department-planning-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveCalendarEngine } from "../executive-calendar-engine/types.js";
import type { ExecutiveDependencyEngine } from "../executive-dependency-engine/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { ExecutiveScenarioPlanner } from "../executive-scenario-planner/types.js";
import type { InitiativePortfolioEngine } from "../initiative-portfolio-engine/types.js";
import type { LongTermGrowthPlanner } from "../long-term-growth-planner/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicAlignmentMonitor } from "../strategic-alignment-monitor/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  REAL_TIME_UPDATE_TRIGGERS,
  PILLOW_DASHBOARD_PUBLICATIONS,
  ECC_DASHBOARD_PUBLICATIONS,
  SUPERVISOR_DASHBOARD_PUBLICATIONS,
} from "./paths.js";
import type {
  ExecutivePlanningDashboard,
  ExecutiveSummary,
  PlanningWidget,
  ExecutiveNavigationLink,
  DashboardPublication,
  ConsolidatedRecommendation,
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

function buildWidgets(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  executiveCalendar?: ExecutiveCalendarEngine | null;
  executiveDependency?: ExecutiveDependencyEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  strategicAlignment?: StrategicAlignmentMonitor | null;
}): PlanningWidget[] {
  const widgets: PlanningWidget[] = [
    {
      widgetId: "vision",
      title: "Corporate Vision",
      engineId: "E1-02",
      health: input.corporateVision?.visionHealth ?? "building",
      healthScore: input.corporateVision?.healthScore ?? 80,
      summary: input.corporateVision?.visionSummary ?? "Constitutional vision · perpetual Empire evolution",
      keyMetric: "Vision Alignment",
      keyValue: String(input.corporateVision?.visionAlignment ?? "aligned"),
      href: "/cockpit/founder/corporate-vision",
      status: "active",
    },
    {
      widgetId: "objectives",
      title: "Strategic Objectives",
      engineId: "E1-03",
      health: input.strategicObjectives?.objectiveHealth ?? "building",
      healthScore: input.strategicObjectives?.healthScore ?? 80,
      summary: input.strategicObjectives?.objectiveSummary ?? "Measurable strategic objectives",
      keyMetric: "Active Objectives",
      keyValue: String(input.strategicObjectives?.currentStrategicObjectives.length ?? 3),
      href: "/cockpit/founder/strategic-objectives",
      status: "active",
    },
    {
      widgetId: "roadmap",
      title: "Executive Roadmap",
      engineId: "E1-04",
      health: input.executiveRoadmap?.roadmapHealth ?? "building",
      healthScore: input.executiveRoadmap?.healthScore ?? 78,
      summary: input.executiveRoadmap?.roadmapSummary ?? "E1 programme sequencing",
      keyMetric: "Programmes",
      keyValue: String(input.executiveRoadmap?.activeProgrammeCount ?? 1),
      href: "/cockpit/founder/executive-roadmap",
      status: "active",
    },
    {
      widgetId: "priority_queue",
      title: "Priority Queue",
      engineId: "E1-05",
      health: input.priorityManagement?.priorityHealth ?? "building",
      healthScore: input.priorityManagement?.healthScore ?? 80,
      summary: input.priorityManagement?.prioritySummary ?? "WHAT FIRST · priority scoring",
      keyMetric: "Top Priority Score",
      keyValue: String(input.priorityManagement?.topPriorityScore ?? 85),
      href: "/cockpit/founder/priority-management",
      status: "active",
    },
    {
      widgetId: "initiative_portfolio",
      title: "Initiative Portfolio",
      engineId: "E1-06",
      health: input.initiativePortfolio?.portfolioHealth ?? "building",
      healthScore: input.initiativePortfolio?.healthScore ?? 75,
      summary: input.initiativePortfolio?.portfolioSummary ?? "HOW collectively · portfolio coverage",
      keyMetric: "Active Initiatives",
      keyValue: String(input.initiativePortfolio?.activeInitiativeCount ?? 3),
      href: "/cockpit/founder/initiative-portfolio",
      status: "active",
    },
    {
      widgetId: "department_planning",
      title: "Department Planning",
      engineId: "E1-07",
      health: input.departmentPlanning?.planningHealth ?? "building",
      healthScore: input.departmentPlanning?.healthScore ?? 78,
      summary: input.departmentPlanning?.planningSummary ?? "Department alignment · capacity",
      keyMetric: "Departments",
      keyValue: String(input.departmentPlanning?.activeDepartmentCount ?? 4),
      href: "/cockpit/founder/department-planning",
      status: "active",
    },
    {
      widgetId: "calendar",
      title: "Executive Calendar",
      engineId: "E1-08",
      health: input.executiveCalendar?.calendarHealth ?? "building",
      healthScore: input.executiveCalendar?.healthScore ?? 82,
      summary: input.executiveCalendar?.calendarSummary ?? "WHEN · cadence · milestones",
      keyMetric: "Upcoming Events",
      keyValue: String(input.executiveCalendar?.upcomingEventCount ?? 5),
      href: "/cockpit/founder/executive-calendar",
      status: "active",
    },
    {
      widgetId: "dependencies",
      title: "Critical Dependencies",
      engineId: "E1-09",
      health: input.executiveDependency?.dependencyHealth ?? "building",
      healthScore: input.executiveDependency?.healthScore ?? 80,
      summary: input.executiveDependency?.dependencySummary ?? "WHAT depends on WHAT",
      keyMetric: "Blocking",
      keyValue: String(input.executiveDependency?.blockingDependencyCount ?? 0),
      href: "/cockpit/founder/executive-dependencies",
      status: "active",
    },
    {
      widgetId: "scenario_planner",
      title: "Scenario Analysis",
      engineId: "E1-10",
      health: input.executiveScenarioPlanner?.plannerHealth ?? "building",
      healthScore: input.executiveScenarioPlanner?.healthScore ?? 78,
      summary: input.executiveScenarioPlanner?.plannerSummary?.slice(0, 100) ?? "Multiple futures simulated",
      keyMetric: "Scenarios",
      keyValue: String(input.executiveScenarioPlanner?.availableScenarioCount ?? 8),
      href: "/cockpit/founder/executive-scenarios",
      status: "active",
    },
    {
      widgetId: "growth_planner",
      title: "Long-Term Growth",
      engineId: "E1-11",
      health: input.longTermGrowthPlanner?.plannerHealth ?? "building",
      healthScore: input.longTermGrowthPlanner?.healthScore ?? 78,
      summary: input.longTermGrowthPlanner?.growthCapacity ?? "Multi-year growth planning",
      keyMetric: "Horizons",
      keyValue: String(input.longTermGrowthPlanner?.planningHorizons.length ?? 6),
      href: "/cockpit/founder/long-term-growth",
      status: "active",
    },
    {
      widgetId: "opportunities",
      title: "Strategic Opportunities",
      engineId: "E1-12",
      health: input.opportunityPrioritization?.engineHealth ?? "building",
      healthScore: input.opportunityPrioritization?.healthScore ?? 80,
      summary: input.opportunityPrioritization?.engineSummary?.slice(0, 100) ?? "ROI-ranked opportunities",
      keyMetric: "Top Score",
      keyValue: String(input.opportunityPrioritization?.topOpportunityScore ?? 85),
      href: "/cockpit/founder/opportunity-prioritization",
      status: "active",
    },
    {
      widgetId: "strategic_alignment",
      title: "Strategic Alignment",
      engineId: "E1-13",
      health: input.strategicAlignment?.monitorHealth ?? "building",
      healthScore: input.strategicAlignment?.healthScore ?? 82,
      summary: input.strategicAlignment?.currentDrift ?? "Continuous alignment monitoring",
      keyMetric: "Alignment Score",
      keyValue: `${input.strategicAlignment?.overallAlignmentScore ?? 80}/100`,
      href: "/cockpit/founder/strategic-alignment",
      status: "active",
    },
  ];
  return widgets;
}

function buildExecutiveSummary(input: {
  widgets: PlanningWidget[];
  corporateVision?: CorporateVisionEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveDependency?: ExecutiveDependencyEngine | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  strategicAlignment?: StrategicAlignmentMonitor | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
}): ExecutiveSummary {
  const avgScore = Math.round(
    input.widgets.reduce((s, w) => s + w.healthScore, 0) / Math.max(input.widgets.length, 1),
  );
  const topRec =
    input.opportunityPrioritization?.recommendedActions[0]?.title ??
    input.strategicAlignment?.recommendedActions[0]?.title ??
    "Complete E1 programme · maintain constitutional alignment";

  return {
    overallPlanningHealth: `${avgScore}/100 · ${healthLabel(avgScore)}`,
    overallPlanningScore: avgScore,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? "aligned"),
    programmeProgress: input.executiveRoadmap?.roadmapHealth ?? "E1 programme active",
    priorityStatus: input.priorityManagement?.priorityHealth ?? "priorities ranked",
    growthReadiness: input.longTermGrowthPlanner?.growthReadiness ?? "building",
    executionReadiness: input.executiveDependency?.executionReadiness ?? "ready",
    strategicRisks: input.strategicAlignment?.currentDrift ?? "monitored",
    strategicOpportunities: `${input.opportunityPrioritization?.activeOpportunityCount ?? 8} opportunities ranked`,
    currentRecommendation: topRec,
  };
}

function buildNavigationLinks(): ExecutiveNavigationLink[] {
  return [
    { target: "vision", label: "Vision", href: "/cockpit/founder/corporate-vision", description: "E1-02 Corporate Vision Engine" },
    { target: "objectives", label: "Objectives", href: "/cockpit/founder/strategic-objectives", description: "E1-03 Strategic Objectives" },
    { target: "roadmap", label: "Roadmap", href: "/cockpit/founder/executive-roadmap", description: "E1-04 Executive Roadmap" },
    { target: "portfolio", label: "Portfolio", href: "/cockpit/founder/initiative-portfolio", description: "E1-06 Initiative Portfolio" },
    { target: "departments", label: "Departments", href: "/cockpit/founder/department-planning", description: "E1-07 Department Planning" },
    { target: "calendar", label: "Calendar", href: "/cockpit/founder/executive-calendar", description: "E1-08 Executive Calendar" },
    { target: "dependencies", label: "Dependencies", href: "/cockpit/founder/executive-dependencies", description: "E1-09 Dependencies" },
    { target: "scenario_planner", label: "Scenarios", href: "/cockpit/founder/executive-scenarios", description: "E1-10 Scenario Planner" },
    { target: "growth_planner", label: "Growth", href: "/cockpit/founder/long-term-growth", description: "E1-11 Growth Planner" },
    { target: "opportunities", label: "Opportunities", href: "/cockpit/founder/opportunity-prioritization", description: "E1-12 Opportunities" },
    { target: "alignment_monitor", label: "Alignment", href: "/cockpit/founder/strategic-alignment", description: "E1-13 Alignment Monitor" },
    { target: "executive_cockpit", label: "Executive Cockpit", href: "/cockpit/founder", description: "Executive Home" },
  ];
}

function buildConsolidatedRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  strategicAlignment?: StrategicAlignmentMonitor | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
}): ConsolidatedRecommendation[] {
  const recs: ConsolidatedRecommendation[] = [];

  const sources: Array<{ source: string; items: Array<{ id: string; title: string; category: string; why: string; confidencePercent: number }> }> = [
    {
      source: "E1-02 Vision",
      items: (input.corporateVision?.visionRecommendations ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        why: r.why,
        confidencePercent: r.confidencePercent,
      })),
    },
    { source: "E1-03 Objectives", items: input.strategicObjectives?.recommendedActions ?? [] },
    { source: "E1-05 Priorities", items: input.priorityManagement?.recommendedActions ?? [] },
    { source: "E1-10 Scenarios", items: input.executiveScenarioPlanner?.recommendedActions ?? [] },
    { source: "E1-11 Growth", items: input.longTermGrowthPlanner?.recommendedActions ?? [] },
    { source: "E1-12 Opportunities", items: input.opportunityPrioritization?.recommendedActions ?? [] },
    { source: "E1-13 Alignment", items: input.strategicAlignment?.recommendedActions ?? [] },
  ];

  for (const { source, items } of sources) {
    for (const item of items.slice(0, 1)) {
      recs.push({
        id: `${source}-${item.id}`,
        title: item.title,
        source,
        category: item.category,
        why: item.why,
        confidencePercent: item.confidencePercent,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      id: "epd-rec-default",
      title: "Maintain unified executive planning command center",
      source: "E1-14 Dashboard",
      category: "planning",
      why: "One dashboard · no competing systems · constitutional governance",
      confidencePercent: 95,
    });
  }

  return recs.slice(0, 8);
}

function buildPillowPublications(input: {
  recommendations: ConsolidatedRecommendation[];
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  strategicAlignment?: StrategicAlignmentMonitor | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
  priorityManagement?: PriorityManagementEngine | null;
}): DashboardPublication[] {
  const values: Record<string, { status: string; summary: string }> = {
    strategic_recommendations: {
      status: input.recommendations.length >= 3 ? "active" : "building",
      summary: `${input.recommendations.length} consolidated recommendations from E1 engines`,
    },
    planning_warnings: {
      status: input.strategicAlignment?.currentDrift.includes("deviation") ? "attention" : "clear",
      summary: input.strategicAlignment?.currentDrift ?? "No planning warnings",
    },
    growth_opportunities: {
      status: "active",
      summary: `${input.longTermGrowthPlanner?.strategicOpportunities.length ?? 4} growth opportunities · ${input.opportunityPrioritization?.activeOpportunityCount ?? 8} ranked opportunities`,
    },
    priority_changes: {
      status: (input.priorityManagement?.priorityChanges.length ?? 0) > 0 ? "updated" : "stable",
      summary: `${input.priorityManagement?.priorityChanges.length ?? 0} recent priority changes`,
    },
    strategic_risks: {
      status: "monitored",
      summary: `${input.strategicAlignment?.driftDetections.filter((d) => d.deviationLevel !== "none").length ?? 0} alignment deviations tracked`,
    },
    executive_insights: {
      status: "publishing",
      summary: "Pillow continuously publishes planning intelligence · 5s refresh",
    },
  };

  return PILLOW_DASHBOARD_PUBLICATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "active",
    summary: values[domain]?.summary ?? "Pillow publication active",
  }));
}

function buildEccPublications(input: {
  executiveDependency?: ExecutiveDependencyEngine | null;
  executiveCalendar?: ExecutiveCalendarEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  ecc?: Record<string, unknown>;
}): DashboardPublication[] {
  const values: Record<string, { status: string; summary: string }> = {
    programme_queue: {
      status: "active",
      summary: `${input.priorityManagement?.executionQueue.length ?? 3} items in execution queue`,
    },
    execution_readiness: {
      status: input.executiveDependency?.executionReadiness === "ready" ? "ready" : "building",
      summary: String(input.executiveDependency?.executionReadiness ?? "evaluating"),
    },
    scheduling_status: {
      status: "synchronized",
      summary: `${input.executiveCalendar?.upcomingEventCount ?? 5} calendar events scheduled`,
    },
    dependency_resolution: {
      status: (input.executiveDependency?.blockingDependencyCount ?? 0) > 0 ? "active" : "clear",
      summary: `${input.executiveDependency?.blockingDependencyCount ?? 0} blocking dependencies`,
    },
    mission_readiness: {
      status: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
      summary: "ECC coordinating programme execution · mission readiness",
    },
  };

  return ECC_DASHBOARD_PUBLICATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "active",
    summary: values[domain]?.summary ?? "ECC publication active",
  }));
}

function buildSupervisorPublications(input: {
  strategicAlignment?: StrategicAlignmentMonitor | null;
  executiveDependency?: ExecutiveDependencyEngine | null;
  supervisor?: Record<string, unknown>;
  journey?: Record<string, unknown>;
}): DashboardPublication[] {
  const values: Record<string, { status: string; summary: string }> = {
    planning_health: {
      status: "monitoring",
      summary: `Planning health tracked across ${12} E1 widgets`,
    },
    execution_progress: {
      status: String(input.supervisor?.status ?? "supervising"),
      summary: String(input.supervisor?.missionStatus ?? "Execution progress monitored"),
    },
    strategic_drift: {
      status: input.strategicAlignment?.currentDrift.includes("none") ? "clear" : "detected",
      summary: input.strategicAlignment?.currentDrift ?? "Drift monitoring active",
    },
    current_eta: {
      status: "tracking",
      summary: String(input.supervisor?.eta ?? "ETA tracked via Supervisor"),
    },
    milestone_status: {
      status: "active",
      summary: String(input.journey?.currentMission ?? "E1 Executive Planning programme"),
    },
  };

  return SUPERVISOR_DASHBOARD_PUBLICATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Supervisor publication active",
  }));
}

export function assembleExecutivePlanningDashboard(input: {
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiativePortfolio?: InitiativePortfolioEngine | null;
  departmentPlanning?: DepartmentPlanningEngine | null;
  executiveCalendar?: ExecutiveCalendarEngine | null;
  executiveDependency?: ExecutiveDependencyEngine | null;
  executiveScenarioPlanner?: ExecutiveScenarioPlanner | null;
  longTermGrowthPlanner?: LongTermGrowthPlanner | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  strategicAlignment?: StrategicAlignmentMonitor | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutivePlanningDashboard {
  const planningWidgets = buildWidgets(input);
  const executiveSummary = buildExecutiveSummary({ ...input, widgets: planningWidgets });
  const navigationLinks = buildNavigationLinks();
  const executiveRecommendations = buildConsolidatedRecommendations(input);

  const healthScore = executiveSummary.overallPlanningScore;

  const pillowPublications = buildPillowPublications({
    recommendations: executiveRecommendations,
    opportunityPrioritization: input.opportunityPrioritization,
    strategicAlignment: input.strategicAlignment,
    longTermGrowthPlanner: input.longTermGrowthPlanner,
    priorityManagement: input.priorityManagement,
  });
  const eccPublications = buildEccPublications(input);
  const supervisorPublications = buildSupervisorPublications(input);

  const pillowAdvisory = [
    `Dashboard health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${planningWidgets.length} planning widgets · one unified command center`,
    `Vision alignment: ${executiveSummary.visionAlignment}`,
    `Current recommendation: ${executiveSummary.currentRecommendation}`,
    `Real-time updates · 5s refresh · no manual refresh required`,
    `No competing executive planning dashboards`,
    `Ready for E1-15 Executive Planning Certified`,
  ];

  return {
    architectureVersion: "E1-14",
    computedAt: new Date().toISOString(),
    dashboardSummary:
      "One permanent Executive Planning Dashboard — the single executive planning cockpit consolidating every E1 capability into one unified command center for the Grand King",
    dashboardHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    healthScore,
    executiveSummary,
    planningWidgets,
    executiveRecommendations,
    pillowPublications,
    eccPublications,
    supervisorPublications,
    navigationLinks,
    realTimeUpdateTriggers: [...REAL_TIME_UPDATE_TRIGGERS],
    pillowAdvisory,
    integrations: {
      executiveArchitectureFramework: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
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
      executiveScenarioPlanner: input.executiveScenarioPlanner
        ? `E1-10 · ${input.executiveScenarioPlanner.plannerHealth}`
        : "standby",
      longTermGrowthPlanner: input.longTermGrowthPlanner
        ? `E1-11 · ${input.longTermGrowthPlanner.plannerHealth}`
        : "standby",
      opportunityPrioritizationEngine: input.opportunityPrioritization
        ? `E1-12 · ${input.opportunityPrioritization.engineHealth}`
        : "standby",
      strategicAlignmentMonitor: input.strategicAlignment
        ? `E1-13 · ${input.strategicAlignment.monitorHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? "coordinating"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE115: true,
  };
}

export function buildFallbackExecutivePlanningDashboard(): ExecutivePlanningDashboard {
  return assembleExecutivePlanningDashboard({});
}
