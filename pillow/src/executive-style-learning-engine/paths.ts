/** PILLOW-ESL-001 — Executive Style Learning paths and constants (T2-03). */

export const EXECUTIVE_STYLE_LEARNING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_STYLE_LEARNING_SYSTEM.md";

export const PREFERENCE_METADATA_VERSION = "1.0.0" as const;

export const LEARNING_STATUSES = [
  "idle",
  "learning",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const PREFERENCE_STATUSES = ["active", "deprecated", "conflicted"] as const;

export const PREFERENCE_CATEGORIES = [
  "layout",
  "component",
  "typography",
  "color",
  "spacing",
  "sizing",
  "navigation",
  "dashboard",
  "form",
  "table",
  "chart",
  "card",
  "modal",
  "interaction",
  "visual_density",
  "consistency",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;
