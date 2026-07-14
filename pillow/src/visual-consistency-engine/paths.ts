/** PILLOW-VCE-001 — Visual Consistency Engine paths and constants (T2-07). */

export const VISUAL_CONSISTENCY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VISUAL_CONSISTENCY_SYSTEM.md";

export const CONSISTENCY_METADATA_VERSION = "1.0.0" as const;

export const REVIEW_STATUSES = [
  "idle",
  "reviewing",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const FINDING_SEVERITIES = ["info", "warning", "error"] as const;

export const CONSISTENCY_CATEGORIES = [
  "components",
  "component_variants",
  "typography",
  "colors",
  "spacing",
  "sizing",
  "icons",
  "borders",
  "corner_radius",
  "shadows",
  "layout_structure",
  "navigation",
  "forms",
  "tables",
  "cards",
  "modals",
  "drawers",
  "alerts",
  "loading_states",
  "empty_states",
  "interaction_states",
] as const;
