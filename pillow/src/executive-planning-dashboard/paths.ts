/** PILLOW-EPD-001 — Executive Planning Dashboard paths (E1-14). */

export const EXECUTIVE_PLANNING_DASHBOARD_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_PLANNING_DASHBOARD.md";

export const DASHBOARD_SECTIONS = [
  "executive_summary",
  "planning_widgets",
  "executive_recommendations",
  "pillow_publications",
  "ecc_publications",
  "supervisor_publications",
  "navigation",
] as const;

export const PLANNING_WIDGET_IDS = [
  "vision",
  "objectives",
  "roadmap",
  "priority_queue",
  "initiative_portfolio",
  "department_planning",
  "calendar",
  "dependencies",
  "scenario_planner",
  "growth_planner",
  "opportunities",
  "strategic_alignment",
] as const;

export const REAL_TIME_UPDATE_TRIGGERS = [
  "vision_changes",
  "objectives_change",
  "roadmap_changes",
  "priorities_change",
  "dependencies_change",
  "calendar_changes",
  "scenario_results_change",
  "growth_plans_change",
  "strategic_alignment_changes",
] as const;

export const PILLOW_DASHBOARD_PUBLICATIONS = [
  "strategic_recommendations",
  "planning_warnings",
  "growth_opportunities",
  "priority_changes",
  "strategic_risks",
  "executive_insights",
] as const;

export const ECC_DASHBOARD_PUBLICATIONS = [
  "programme_queue",
  "execution_readiness",
  "scheduling_status",
  "dependency_resolution",
  "mission_readiness",
] as const;

export const SUPERVISOR_DASHBOARD_PUBLICATIONS = [
  "planning_health",
  "execution_progress",
  "strategic_drift",
  "current_eta",
  "milestone_status",
] as const;

export const EXECUTIVE_NAV_TARGETS = [
  "vision",
  "objectives",
  "roadmap",
  "portfolio",
  "departments",
  "calendar",
  "dependencies",
  "scenario_planner",
  "growth_planner",
  "opportunities",
  "alignment_monitor",
  "executive_cockpit",
] as const;
