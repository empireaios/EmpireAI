/** T5-02 — Autonomous UX Audit paths and constants. */

export const AUTONOMOUS_UX_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_UX_AUDIT_SYSTEM.md";

export const AUDIT_METADATA_VERSION = "AUA-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "auditing",
  "detecting_issues",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const AUDIT_STATUSES = [
  "recorded",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const UX_ISSUE_CATEGORIES = [
  "layout_issue",
  "component_issue",
  "navigation_issue",
  "workflow_issue",
  "accessibility_issue",
  "visual_consistency_issue",
  "loading_state_issue",
  "empty_state_issue",
  "error_state_issue",
  "readability_issue",
  "hierarchy_issue",
  "spacing_issue",
  "alignment_issue",
  "feedback_issue",
] as const;

export const ISSUE_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;
