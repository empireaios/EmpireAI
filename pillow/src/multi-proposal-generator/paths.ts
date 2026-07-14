/** PILLOW-MPG-001 — Multi-Proposal Generator paths and constants (T4-04). */

export const MULTI_PROPOSAL_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MULTI_PROPOSAL_GENERATOR_SYSTEM.md";

export const PROPOSAL_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "interpreting",
  "strategizing",
  "generating",
  "linking",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const GENERATION_STATUSES = [
  "received",
  "interpreted",
  "strategized",
  "generated",
  "linked",
  "validated",
  "completed",
  "failed",
] as const;

export const PROPOSAL_CATEGORIES = [
  "layout_redesign",
  "component_redesign",
  "navigation_redesign",
  "workflow_redesign",
  "theme_redesign",
  "accessibility_improvement",
  "visual_consistency_improvement",
  "dashboard_improvement",
  "form_improvement",
  "table_improvement",
  "card_improvement",
  "modal_improvement",
  "drawer_improvement",
  "loading_state_improvement",
  "empty_state_improvement",
  "error_state_improvement",
] as const;

export const PROPOSAL_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;

export const IMPLEMENTATION_SCOPES = ["small", "medium", "large"] as const;
