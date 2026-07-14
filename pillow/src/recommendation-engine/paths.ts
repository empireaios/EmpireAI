/** PILLOW-REC-001 — Recommendation Engine paths and constants (T2-09). */

export const RECOMMENDATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RECOMMENDATION_ENGINE_SYSTEM.md";

export const RECOMMENDATION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "generating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const RECOMMENDATION_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export const RECOMMENDATION_SEVERITIES = ["error", "warning", "info"] as const;

export const RECOMMENDATION_CATEGORIES = [
  "layout_improvement",
  "component_improvement",
  "navigation_improvement",
  "workflow_improvement",
  "accessibility_improvement",
  "visual_consistency_improvement",
  "design_system_alignment",
  "executive_preference_alignment",
  "form_usability_improvement",
  "dashboard_improvement",
  "table_improvement",
  "card_improvement",
  "modal_improvement",
  "drawer_improvement",
  "loading_state_improvement",
  "empty_state_improvement",
  "error_state_improvement",
] as const;
