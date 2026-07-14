/** PILLOW-LEV-001 — Layout Evaluation paths and constants (T2-04). */

export const LAYOUT_EVALUATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LAYOUT_EVALUATION_SYSTEM.md";

export const EVALUATION_METADATA_VERSION = "1.0.0" as const;

export const EVALUATION_STATUSES = [
  "idle",
  "evaluating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const OVERALL_EVALUATION_STATUSES = ["pass", "partial", "fail", "skipped"] as const;

export const EVALUATION_SCOPES = ["full_page", "region", "component_placement"] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const EVALUATION_CATEGORIES = [
  "layout_hierarchy",
  "visual_hierarchy",
  "component_organization",
  "alignment",
  "spacing",
  "white_space",
  "navigation_structure",
  "information_grouping",
  "section_organization",
  "form_layout",
  "dashboard_organization",
  "table_layout",
  "card_layout",
  "modal_layout",
  "drawer_layout",
  "responsive_layout",
  "visual_balance",
  "screen_clarity",
] as const;
