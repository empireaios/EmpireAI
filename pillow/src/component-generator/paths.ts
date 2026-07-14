/** PILLOW-CG-001 — Component Generator paths and constants (T3-02). */

export const COMPONENT_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMPONENT_GENERATOR_SYSTEM.md";

export const GENERATION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "generating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const GENERATION_STATUSES = [
  "planned",
  "generated",
  "validated",
  "blocked",
  "duplicate_skipped",
  "failed",
] as const;

export const COMPONENT_CATEGORIES = [
  "button",
  "input",
  "form",
  "card",
  "table",
  "list",
  "navigation_item",
  "tab",
  "modal",
  "drawer",
  "alert",
  "toast",
  "badge",
  "panel",
  "dashboard_widget",
  "loading_state",
  "empty_state",
  "error_state",
  "toolbar",
  "filter",
  "search_control",
] as const;
