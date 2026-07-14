/** PILLOW-AII-001 — Accessibility Intelligence paths and constants (T2-06). */

export const ACCESSIBILITY_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ACCESSIBILITY_INTELLIGENCE_SYSTEM.md";

export const ACCESSIBILITY_METADATA_VERSION = "1.0.0" as const;

export const REVIEW_STATUSES = [
  "idle",
  "reviewing",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const FINDING_SEVERITIES = ["info", "warning", "error"] as const;

export const ACCESSIBILITY_CATEGORIES = [
  "labels",
  "focus_order",
  "keyboard_navigation",
  "form_accessibility",
  "error_messages",
  "feedback_states",
  "loading_states",
  "empty_states",
  "modals_and_dialogs",
  "tables",
  "dashboards",
  "navigation_clarity",
  "touch_target_size",
  "readability",
  "semantic_structure",
  "status_communication",
] as const;
