/** PILLOW-UXS-001 — UX Scoring Engine paths and constants (T2-08). */

export const UX_SCORING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_UX_SCORING_SYSTEM.md";

export const SCORING_METADATA_VERSION = "1.0.0" as const;

export const SCORING_STATUSES = [
  "idle",
  "scoring",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const SCORING_CATEGORIES = [
  "clarity",
  "visual_hierarchy",
  "layout_quality",
  "component_quality",
  "navigation_quality",
  "workflow_usability",
  "accessibility_quality",
  "visual_consistency",
  "design_system_alignment",
  "executive_preference_alignment",
  "form_usability",
  "dashboard_usability",
  "error_state_quality",
  "loading_state_quality",
  "empty_state_quality",
  "responsiveness",
  "governance_compliance",
] as const;
