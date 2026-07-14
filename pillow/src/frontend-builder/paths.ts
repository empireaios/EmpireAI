/** PILLOW-FB-001 — Frontend Builder paths and constants (T3-01). */

export const FRONTEND_BUILDER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FRONTEND_BUILDER_SYSTEM.md";

export const BUILD_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "building",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const BUILD_STATUSES = [
  "planned",
  "generated",
  "validated",
  "blocked",
  "failed",
] as const;

export const BUILD_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export const CODE_GENERATION_SCOPES = [
  "page",
  "screen",
  "view",
  "ui_section",
  "existing_component",
  "existing_layout",
  "navigation_area",
  "form",
  "card",
  "table",
  "dashboard",
  "modal",
  "drawer",
  "loading_state",
  "empty_state",
  "error_state",
] as const;

export const CHANGE_TYPES = ["modify", "create"] as const;
