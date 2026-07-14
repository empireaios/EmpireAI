/** PILLOW-ED-001 — Explain Decisions paths and constants (T4-06). */

export const EXPLAIN_DECISIONS_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXPLAIN_DECISIONS_SYSTEM.md";

export const EXPLANATION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "loading",
  "explaining",
  "linking",
  "analyzing",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const EXPLANATION_STATUSES = [
  "received",
  "loaded",
  "linked",
  "generated",
  "validated",
  "completed",
  "failed",
] as const;

export const EXPLANATION_TYPES = [
  "proposal_rationale",
  "comparison_rationale",
  "layout_rationale",
  "component_rationale",
  "navigation_rationale",
  "workflow_rationale",
  "theme_rationale",
  "accessibility_rationale",
  "visual_consistency_rationale",
  "executive_preference_rationale",
  "ux_score_rationale",
  "tradeoff_explanation",
] as const;

export const EXPLANATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;

export const EXPLANATION_DETAIL_LEVELS = ["summary", "standard", "detailed"] as const;
