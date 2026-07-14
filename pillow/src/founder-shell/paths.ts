/** Canonical Founder Shell Architecture (P7-01). */
export const FOUNDER_SHELL_PATH = "docs/governance/EMPIREAI_FOUNDER_SHELL.md";

/** Zero-Human Automation companion (P6-07). */
export const AUTOMATION_COMPANION_PATH =
  "docs/governance/EMPIREAI_ZERO_HUMAN_AUTOMATION_ARCHITECTURE.md";

/** Founder Shell principles (P7-01). */
export const FOUNDER_SHELL_PRINCIPLES = [
  "One Login — single authenticated entry for every Founder",
  "One Workspace — unified executive environment, no duplicate dashboards",
  "One Navigation — consistent founder navigation throughout the application",
  "One Executive Experience — Cockpit remains the operating interface inside the shell",
  "No Duplicate Dashboards — no competing founder experiences",
  "No Hidden Navigation — all workspaces visible in founder navigation",
  "Context Preserved — business, mission, journey, session preserved across navigation",
  "Responsive — founder shell works across desktop and mobile",
  "Production First — production truth governs executive summaries",
] as const;

/** Workspaces the Founder Shell shall provide (P7-01 · P7-02). */
export const FOUNDER_WORKSPACES = [
  "executive_home",
  "mission_centre",
  "business_workspace",
  "pillow_workspace",
  "builder_workspace",
  "supervisor_workspace",
  "journey_workspace",
  "production_workspace",
  "guardian_workspace",
  "commerce_workspace",
  "settings",
  "notifications",
  "knowledge",
] as const;

/** Canonical founder navigation order (P7-01 · P7-02). */
export const FOUNDER_NAVIGATION_ORDER = [
  "executive_home",
  "mission_centre",
  "pillow",
  "builder",
  "supervisor",
  "journey",
  "production",
  "guardian",
  "businesses",
  "commerce",
  "knowledge",
  "settings",
] as const;

/** Context fields preserved by the Founder Shell (P7-01). */
export const FOUNDER_CONTEXT_FIELDS = [
  "current_business",
  "current_mission",
  "current_journey",
  "current_context",
  "current_notifications",
  "current_recommendations",
  "current_session",
  "current_workspace",
] as const;
