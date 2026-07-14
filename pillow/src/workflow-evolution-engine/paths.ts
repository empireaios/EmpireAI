/** T5-05 — Workflow Evolution paths and constants. */

export const WORKFLOW_EVOLUTION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFLOW_EVOLUTION_SYSTEM.md";

export const WORKFLOW_EVOLUTION_METADATA_VERSION = "WFE-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "evolving",
  "analyzing_workflows",
  "detecting_friction",
  "prioritizing",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const EVOLUTION_STATUSES = [
  "recommended",
  "prioritized",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const EVOLUTION_CATEGORIES = [
  "workflow_simplification",
  "navigation_simplification",
  "task_reduction",
  "screen_transition_reduction",
  "click_reduction",
  "context_switching_reduction",
  "workflow_acceleration",
  "productivity_improvement",
  "user_effort_reduction",
  "process_optimization",
  "operational_efficiency",
  "workflow_consistency",
] as const;

export const EVOLUTION_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "deferred",
] as const;
