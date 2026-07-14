/** PILLOW-URE-001 — UX Rule Engine paths and constants (T2-01). */

export const UX_RULE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_UX_RULE_ENGINE_SYSTEM.md";

export const RULE_METADATA_VERSION = "1.0.0" as const;

export const RULE_ENGINE_STATUSES = [
  "idle",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const RULE_SEVERITIES = ["info", "warning", "error", "critical"] as const;

export const RULE_STATUSES = ["enabled", "disabled"] as const;

export const RULE_TARGET_TYPES = [
  "ui_state",
  "component",
  "layout",
  "navigation",
] as const;

export const RULE_CATEGORIES = [
  "clarity",
  "hierarchy",
  "spacing",
  "alignment",
  "readability",
  "navigation",
  "forms",
  "feedback",
  "error_handling",
  "loading_states",
  "empty_states",
  "responsiveness",
  "consistency",
  "safety",
  "governance",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;
