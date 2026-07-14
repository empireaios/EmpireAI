/** PILLOW-RM-001 — Rollback Manager paths and constants (T3-08). */

export const ROLLBACK_MANAGER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ROLLBACK_MANAGER_SYSTEM.md";

export const ROLLBACK_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "rolling_back",
  "creating_restore_point",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const ROLLBACK_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;

export const ROLLBACK_STATUSES = [
  "pending",
  "completed",
  "verified",
  "failed",
  "blocked",
] as const;

export const RESTORE_POINT_STATUSES = [
  "active",
  "archived",
  "expired",
  "invalid",
] as const;

export const ROLLBACK_TRIGGERS = [
  "validation_failure",
  "regression_failure",
  "unsafe_ui_defect",
  "rejected_preview",
  "failed_deployment",
  "broken_component",
  "broken_layout",
  "broken_theme",
  "broken_responsive_state",
  "manual_rollback_request",
  "recovery_policy_trigger",
] as const;

export const ROLLBACK_SCOPES = [
  "frontend",
  "component",
  "layout",
  "theme",
  "preview",
  "full",
] as const;
