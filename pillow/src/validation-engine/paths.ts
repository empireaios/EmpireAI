/** PILLOW-VE-001 — Validation Engine paths and constants (T3-06). */

export const VALIDATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VALIDATION_ENGINE_SYSTEM.md";

export const VALIDATION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;

export const VALIDATION_STATUSES = [
  "pending",
  "validated",
  "defects_found",
  "blocked",
  "failed",
] as const;

export const VALIDATION_SCOPES = [
  "preview",
  "component",
  "layout",
  "theme",
  "responsive",
  "state",
  "full",
] as const;

export const DEFECT_CATEGORIES = [
  "broken_component",
  "missing_component",
  "misaligned_component",
  "overlapping_component",
  "broken_layout",
  "broken_responsive_layout",
  "broken_navigation_area",
  "broken_form_state",
  "broken_table_state",
  "broken_card_state",
  "broken_modal_state",
  "broken_drawer_state",
  "broken_theme_token",
  "inconsistent_styling",
  "unreadable_text",
  "broken_loading_state",
  "broken_empty_state",
  "broken_error_state",
  "preview_build_failure",
] as const;

export const DEFECT_SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
