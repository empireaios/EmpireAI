/** T5-06 — Adaptive Interface paths and constants. */

export const ADAPTIVE_INTERFACE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ADAPTIVE_INTERFACE_SYSTEM.md";

export const ADAPTIVE_METADATA_VERSION = "AIE-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "adapting",
  "detecting_context",
  "analyzing_workflow",
  "generating_adaptations",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const ADAPTATION_STATUSES = [
  "recommended",
  "prioritized",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const ADAPTATION_CATEGORIES = [
  "adaptive_layout",
  "adaptive_navigation",
  "adaptive_workspace",
  "adaptive_dashboard",
  "adaptive_shortcut_placement",
  "adaptive_workflow_presentation",
  "adaptive_information_hierarchy",
  "adaptive_task_prioritization",
  "adaptive_visual_emphasis",
  "adaptive_panel_organization",
  "adaptive_operational_context",
  "adaptive_productivity_optimization",
] as const;

export const ADAPTATION_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "deferred",
] as const;
