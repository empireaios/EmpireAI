/** PILLOW-RP-001 — Regression Protection paths and constants (T3-07). */

export const REGRESSION_PROTECTION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REGRESSION_PROTECTION_SYSTEM.md";

export const REGRESSION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "checking",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const PROTECTION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;

export const REGRESSION_STATUSES = [
  "pending",
  "protected",
  "regressions_found",
  "blocked",
  "failed",
] as const;

export const COMPARISON_SCOPES = [
  "ux_score",
  "layout",
  "component",
  "navigation",
  "accessibility",
  "consistency",
  "workflow",
  "responsive",
  "state",
  "full",
] as const;

export const REGRESSION_CATEGORIES = [
  "ux_score_regression",
  "layout_regression",
  "component_regression",
  "navigation_regression",
  "accessibility_regression",
  "visual_consistency_regression",
  "workflow_usability_regression",
  "responsive_layout_regression",
  "loading_state_regression",
  "empty_state_regression",
  "error_state_regression",
  "executive_preference_regression",
  "design_system_regression",
] as const;

export const REGRESSION_SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

export const BASELINE_SOURCE_RULES = [
  "last_passing_validation",
  "latest_ux_score",
  "visual_foundation",
  "stored_baseline",
] as const;
