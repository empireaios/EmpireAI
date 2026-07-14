/** PILLOW-CUX-001 — Executive Cockpit UX Architecture paths (P7-02). */

export const COCKPIT_UX_ARCHITECTURE_PATH = "docs/governance/EMPIREAI_COCKPIT_UX.md";

/** Constitutional executive centres — single navigation truth. */
export const COCKPIT_CENTRES = [
  "executive_home",
  "mission_centre",
  "builder",
  "supervisor",
  "pillow",
  "journey",
  "production",
  "business",
  "commerce",
  "guardian",
  "knowledge",
  "settings",
] as const;

export const COCKPIT_UX_PRINCIPLES = [
  "executive_first",
  "one_screen_awareness",
  "zero_confusion",
  "explain_before_action",
  "production_first",
  "browser_first",
  "minimal_navigation",
  "consistent_layout",
  "real_time_updates",
  "no_duplicate_information",
] as const;

/** Executive Home mandatory awareness fields. */
export const EXECUTIVE_HOME_FIELDS = [
  "empire_health",
  "current_mission",
  "current_roadmap_item",
  "overall_progress",
  "eta",
  "builder_status",
  "supervisor_status",
  "guardian_status",
  "pillow_recommendations",
  "current_business",
  "revenue",
  "production_health",
  "alerts",
  "pending_approvals",
] as const;

/** Canonical executive widgets. */
export const COCKPIT_WIDGETS = [
  "empire_health",
  "mission_progress",
  "builder",
  "supervisor",
  "journey",
  "production",
  "business_health",
  "revenue",
  "notifications",
  "recommendations",
  "current_risks",
] as const;

/** Near real-time update domains. */
export const REALTIME_DOMAINS = [
  "mission_progress",
  "execution_state",
  "production_health",
  "business_health",
  "eta",
  "recovery",
  "alerts",
  "recommendations",
] as const;

export const PILLOW_PUBLICATIONS = [
  "recommendations",
  "warnings",
  "architecture_findings",
  "engineering_findings",
  "business_findings",
  "vision_findings",
] as const;

export const SUPERVISOR_PUBLICATIONS = [
  "current_mission",
  "progress",
  "current_step",
  "eta",
  "recovery",
  "mission_health",
] as const;

export const GUARDIAN_PUBLICATIONS = [
  "runtime_health",
  "infrastructure_health",
  "performance",
  "alerts",
  "availability",
] as const;
