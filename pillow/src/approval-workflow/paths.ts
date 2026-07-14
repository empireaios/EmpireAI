/** PILLOW-AW-001 — Approval Workflow paths and constants (T4-07). */

export const APPROVAL_WORKFLOW_SYSTEM_PATH =
  "docs/governance/EMPIREAI_APPROVAL_WORKFLOW_SYSTEM.md";

export const APPROVAL_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "loading",
  "presenting",
  "deciding",
  "gatekeeping",
  "dispatching",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const APPROVAL_STATUSES = [
  "pending",
  "presented",
  "approved",
  "rejected",
  "deferred",
  "changes_requested",
  "cancelled",
  "reopened",
  "blocked",
  "dispatched",
  "completed",
  "failed",
] as const;

export const APPROVAL_DECISIONS = [
  "approve",
  "reject",
  "defer",
  "request_changes",
  "cancel",
  "reopen",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;
