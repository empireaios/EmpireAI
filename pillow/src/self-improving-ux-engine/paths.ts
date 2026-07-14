/** T5-09 — Self-Improving UX Engine paths and constants. */

export const SELF_IMPROVING_UX_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SELF_IMPROVING_UX_SYSTEM.md";

export const UX_LEARNING_METADATA_VERSION = "SIUX-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "learning",
  "analyzing_outcomes",
  "improving_recommendations",
  "updating_knowledge",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const LEARNING_STATUSES = [
  "learned",
  "prioritized",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const LEARNING_CATEGORIES = [
  "redesign_learning",
  "approval_learning",
  "deployment_learning",
  "productivity_learning",
  "workflow_learning",
  "accessibility_learning",
  "navigation_learning",
  "layout_learning",
  "component_learning",
  "workspace_learning",
  "executive_preference_learning",
  "continuous_ux_intelligence_learning",
] as const;
