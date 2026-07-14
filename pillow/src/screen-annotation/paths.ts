/** PILLOW-SA-001 — Screen Annotation paths and constants (T4-03). */

export const SCREEN_ANNOTATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SCREEN_ANNOTATION_SYSTEM.md";

export const ANNOTATION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "capturing",
  "mapping",
  "linking",
  "generating",
  "clarifying",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const PROCESSING_STATUSES = [
  "received",
  "captured",
  "mapped",
  "linked",
  "intent_generated",
  "awaiting_clarification",
  "completed",
  "failed",
] as const;

export const ANNOTATION_TYPES = [
  "point",
  "highlight",
  "rectangle",
  "region_selection",
  "component_selection",
  "layout_region_selection",
  "navigation_area_selection",
  "text_note",
  "ux_complaint_note",
  "design_preference_note",
  "edit_instruction",
  "review_request",
  "validation_request",
  "preview_request",
] as const;

export const ANNOTATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;
