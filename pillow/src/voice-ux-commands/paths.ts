/** PILLOW-VUC-001 — Voice UX Commands paths and constants (T4-02). */

export const VOICE_UX_COMMANDS_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VOICE_UX_COMMANDS_SYSTEM.md";

export const VOICE_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "listening",
  "transcribing",
  "interpreting",
  "clarifying",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const PROCESSING_STATUSES = [
  "received",
  "transcribed",
  "interpreted",
  "awaiting_clarification",
  "linked",
  "completed",
  "failed",
] as const;

export const VOICE_COMMAND_TYPES = [
  "ux_question",
  "ux_complaint",
  "design_preference",
  "layout_change_request",
  "component_change_request",
  "navigation_concern",
  "workflow_concern",
  "accessibility_concern",
  "visual_consistency_concern",
  "theme_preference",
  "preview_request",
  "validation_request",
  "general_ux_discussion",
] as const;

export const VOICE_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;

export const SPEECH_TO_TEXT_PROVIDERS = [
  "local_adapter",
  "passthrough_text",
  "browser_speech_api",
] as const;
