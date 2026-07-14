/** T5-04 — Productivity Intelligence paths and constants. */

export const PRODUCTIVITY_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRODUCTIVITY_INTELLIGENCE_SYSTEM.md";

export const PRODUCTIVITY_METADATA_VERSION = "PIE-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "learning",
  "detecting_patterns",
  "analyzing_trends",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const PRODUCTIVITY_STATUSES = [
  "learned",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const PRODUCTIVITY_CATEGORIES = [
  "workflow_pattern",
  "navigation_pattern",
  "screen_transition_pattern",
  "task_repetition",
  "workflow_bottleneck",
  "user_interruption",
  "time_utilization",
  "productivity_trend",
  "context_switching",
  "task_completion_flow",
  "workspace_usage",
  "operational_efficiency",
] as const;
