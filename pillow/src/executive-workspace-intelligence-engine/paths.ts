/** T5-08 — Executive Workspace Intelligence paths and constants. */

export const EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM.md";

export const WORKSPACE_INTELLIGENCE_METADATA_VERSION = "EWI-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "optimizing",
  "analyzing_missions",
  "analyzing_context",
  "generating_recommendations",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const WORKSPACE_STATUSES = [
  "recommended",
  "prioritized",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const WORKSPACE_CATEGORIES = [
  "mission_dashboard",
  "executive_dashboard",
  "operations_dashboard",
  "workflow_dashboard",
  "analytics_dashboard",
  "productivity_dashboard",
  "executive_shortcut_organization",
  "workspace_layout_optimization",
  "context_aware_workspace",
  "priority_based_workspace",
  "role_based_workspace",
  "operational_workspace_optimization",
] as const;

export const WORKSPACE_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "deferred",
] as const;
