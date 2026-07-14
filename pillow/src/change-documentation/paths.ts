/** PILLOW-CD-001 — Change Documentation paths and constants (T3-09). */

export const CHANGE_DOCUMENTATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CHANGE_DOCUMENTATION_SYSTEM.md";

export const CHANGE_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "documenting",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const DOCUMENTATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;

export const CHANGE_STATUSES = [
  "pending",
  "documented",
  "partial",
  "failed",
  "rejected",
  "accepted",
] as const;

export const CHANGE_TYPES = [
  "frontend_code_generation",
  "component_generation",
  "component_variant_generation",
  "layout_refactoring",
  "theme_generation",
  "preview_build_creation",
  "validation_pass",
  "validation_failure",
  "regression_pass",
  "regression_failure",
  "rollback_execution",
  "rollback_verification",
  "rejected_change",
  "accepted_change",
  "failed_change",
] as const;

export const DOCUMENTATION_SCOPES = [
  "frontend",
  "component",
  "layout",
  "theme",
  "preview",
  "validation",
  "regression",
  "rollback",
  "full",
] as const;
