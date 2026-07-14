/** PILLOW-WFO-001 — Workflow Optimization paths and constants (T2-05). */

export const WORKFLOW_OPTIMIZATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFLOW_OPTIMIZATION_SYSTEM.md";

export const WORKFLOW_METADATA_VERSION = "1.0.0" as const;

export const OPTIMIZATION_STATUSES = [
  "idle",
  "analyzing",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const FRICTION_SEVERITIES = ["info", "warning", "error"] as const;

export const FRICTION_CATEGORIES = [
  "too_many_steps",
  "repeated_actions",
  "unclear_next_action",
  "unclear_decision_point",
  "excessive_scrolling",
  "excessive_navigation",
  "poor_form_sequence",
  "confusing_field_grouping",
  "missing_feedback",
  "waiting_loading_friction",
  "dead_end",
  "backtracking",
  "hidden_important_action",
  "weak_primary_action",
  "distracting_secondary_actions",
  "poor_confirmation_flow",
  "error_recovery_friction",
] as const;
