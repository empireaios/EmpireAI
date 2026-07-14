/** T5-03 — UX Opportunity Discovery paths and constants. */

export const UX_OPPORTUNITY_DISCOVERY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_UX_OPPORTUNITY_DISCOVERY_SYSTEM.md";

export const OPPORTUNITY_METADATA_VERSION = "UOD-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "discovering",
  "detecting_opportunities",
  "prioritizing",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const OPPORTUNITY_STATUSES = [
  "discovered",
  "prioritized",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const OPPORTUNITY_CATEGORIES = [
  "layout_improvement",
  "component_improvement",
  "navigation_improvement",
  "workflow_improvement",
  "accessibility_improvement",
  "visual_consistency_improvement",
  "responsive_improvement",
  "readability_improvement",
  "information_hierarchy_improvement",
  "interaction_improvement",
  "feedback_improvement",
  "performance_related_ux_improvement",
] as const;

export const OPPORTUNITY_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "deferred",
] as const;

export const COMPLEXITY_LEVELS = ["low", "medium", "high", "very_high"] as const;
