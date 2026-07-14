/** PILLOW-LR-001 — Layout Refactoring paths and constants (T3-03). */

export const LAYOUT_REFACTORING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LAYOUT_REFACTORING_SYSTEM.md";

export const REFACTORING_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "refactoring",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const REFACTORING_STATUSES = [
  "planned",
  "refactored",
  "validated",
  "blocked",
  "skipped",
  "failed",
] as const;

export const LAYOUT_SCOPES = [
  "page",
  "screen",
  "view",
  "dashboard",
  "main_content",
  "header",
  "sidebar",
  "navigation_area",
  "form",
  "table",
  "card",
  "panel",
  "modal",
  "drawer",
  "toolbar",
  "filter_area",
  "search_area",
  "loading_state",
  "empty_state",
  "error_state",
] as const;
