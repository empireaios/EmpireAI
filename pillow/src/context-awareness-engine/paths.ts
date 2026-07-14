/** PILLOW-CAE-001 — Context Awareness Engine paths (T1-07). */

export const CONTEXT_AWARENESS_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CONTEXT_AWARENESS_SYSTEM.md";

export const WORKFLOW_CONTEXT_VERSION = "1.0.0" as const;

export const AWARENESS_STATUSES = [
  "idle",
  "aware",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const CONTEXT_STATES = [
  "browsing",
  "searching",
  "filtering",
  "reviewing",
  "editing",
  "creating",
  "configuring",
  "selecting",
  "comparing",
  "submitting",
  "approving",
  "rejecting",
  "waiting",
  "loading",
  "error_handling",
  "navigation",
  "form_completion",
  "modal_decision",
  "dashboard_monitoring",
] as const;

export const INTERACTION_MODES = [
  "browse",
  "edit",
  "review",
  "configure",
  "submit",
  "approve",
  "wait",
  "navigate",
] as const;
