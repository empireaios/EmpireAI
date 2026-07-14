/** PILLOW-LUE-001 — Layout Understanding Engine paths (T1-04). */

export const LAYOUT_UNDERSTANDING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LAYOUT_UNDERSTANDING_SYSTEM.md";

export const LAYOUT_MODEL_VERSION = "1.0.0" as const;

export const LAYOUT_STATUSES = [
  "idle",
  "analyzing",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const STRUCTURAL_REGION_TYPES = [
  "header",
  "top_navigation",
  "sidebar",
  "main_content",
  "footer",
  "panel",
  "card_group",
  "form_area",
  "table_area",
  "chart_area",
  "modal",
  "dialog",
  "drawer",
  "toolbar",
  "filter_area",
  "search_area",
  "status_area",
  "empty_state",
  "loading_state",
] as const;

export const SPATIAL_RELATIONS = [
  "above",
  "below",
  "left_of",
  "right_of",
  "contains",
  "overlaps",
] as const;

export const ALIGNMENT_TYPES = ["left", "center", "right", "top", "middle", "bottom"] as const;
