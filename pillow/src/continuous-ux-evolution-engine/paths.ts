/** T5-07 — Continuous UX Evolution paths and constants. */

export const CONTINUOUS_UX_EVOLUTION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CONTINUOUS_UX_EVOLUTION_SYSTEM.md";

export const UX_EVOLUTION_METADATA_VERSION = "CUE-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "evolving",
  "analyzing_trends",
  "discovering_improvements",
  "generating_recommendations",
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
  "layout_evolution",
  "component_evolution",
  "navigation_evolution",
  "workflow_evolution",
  "accessibility_evolution",
  "visual_consistency_evolution",
  "dashboard_evolution",
  "workspace_evolution",
  "productivity_evolution",
  "context_aware_evolution",
  "user_experience_evolution",
  "operational_efficiency_evolution",
] as const;

export const IMPROVEMENT_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "deferred",
] as const;
