/** PILLOW-PG-001 — Preview Generator paths and constants (T3-05). */

export const PREVIEW_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PREVIEW_GENERATOR_SYSTEM.md";

export const PREVIEW_METADATA_VERSION = "1.0.0" as const;

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
  "built",
  "validated",
  "blocked",
  "failed",
  "cleaned",
] as const;

export const ENVIRONMENT_STATUSES = [
  "pending",
  "ready",
  "active",
  "expired",
  "cleaned",
  "failed",
] as const;

export const PREVIEW_SCOPES = [
  "page",
  "screen",
  "view",
  "component",
  "component_variant",
  "layout",
  "dashboard",
  "form",
  "table",
  "card",
  "navigation_area",
  "modal",
  "drawer",
  "theme",
  "loading_state",
  "empty_state",
  "error_state",
  "responsive_breakpoint",
] as const;
