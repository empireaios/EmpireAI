/** PILLOW-SBC-001 — Side-by-Side Comparison paths and constants (T4-05). */

export const SIDE_BY_SIDE_COMPARISON_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SIDE_BY_SIDE_COMPARISON_SYSTEM.md";

export const COMPARISON_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "loading",
  "comparing",
  "highlighting",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const COMPARISON_STATUSES = [
  "received",
  "loaded",
  "compared",
  "highlighted",
  "validated",
  "completed",
  "failed",
] as const;

export const COMPARISON_TYPES = [
  "original_vs_proposal",
  "proposal_vs_proposal",
  "layout_comparison",
  "component_comparison",
  "navigation_comparison",
  "workflow_comparison",
  "theme_comparison",
  "accessibility_comparison",
  "visual_consistency_comparison",
  "responsive_layout_comparison",
] as const;

export const COMPARISON_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;
