/** PILLOW-TB-001 — Theme Builder paths and constants (T3-04). */

export const THEME_BUILDER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_THEME_BUILDER_SYSTEM.md";

export const THEME_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "generating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const THEME_STATUSES = [
  "planned",
  "generated",
  "validated",
  "blocked",
  "failed",
] as const;

export const THEME_SCOPES = [
  "global",
  "page",
  "dashboard",
  "component",
  "button",
  "form",
  "table",
  "card",
  "navigation",
  "modal",
  "drawer",
  "alert",
  "loading_state",
  "empty_state",
  "error_state",
  "interaction_states",
  "responsive_visual_states",
] as const;
