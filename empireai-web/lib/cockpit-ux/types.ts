/** P7-02 — Permanent Executive Cockpit User Experience. */
export const COCKPIT_UX_MISSION = "P7-02" as const;

export type CockpitUxPrinciple =
  | "executive_first"
  | "one_screen_awareness"
  | "zero_confusion"
  | "explain_before_action"
  | "production_first"
  | "browser_first"
  | "minimal_navigation"
  | "consistent_layout"
  | "real_time_updates"
  | "no_duplicate_information";

export const COCKPIT_UX_PRINCIPLES: readonly CockpitUxPrinciple[] = [
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

export type CockpitCentreId =
  | "executive_home"
  | "mission_centre"
  | "builder"
  | "supervisor"
  | "pillow"
  | "journey"
  | "production"
  | "business"
  | "commerce"
  | "guardian"
  | "knowledge"
  | "explainability"
  | "live_eta"
  | "settings";

/** Mission 007 — honest destination truth for Grand King nav. */
export type CockpitNavAvailability = "live" | "partial" | "unavailable";

export type CockpitCentreNavItem = {
  id: CockpitCentreId;
  label: string;
  href: string;
  icon: string;
  description: string;
  group: "primary" | "operations" | "system";
  /** Default live when omitted. */
  availability?: CockpitNavAvailability;
  unavailableReason?: string;
};

export type CockpitWidget =
  | "empire_health"
  | "mission_progress"
  | "builder"
  | "supervisor"
  | "journey"
  | "production"
  | "business_health"
  | "revenue"
  | "notifications"
  | "recommendations"
  | "current_risks";

export type ExecutiveHomeField =
  | "empire_health"
  | "current_mission"
  | "current_roadmap_item"
  | "overall_progress"
  | "eta"
  | "builder_status"
  | "supervisor_status"
  | "guardian_status"
  | "pillow_recommendations"
  | "current_business"
  | "revenue"
  | "production_health"
  | "alerts"
  | "pending_approvals";
