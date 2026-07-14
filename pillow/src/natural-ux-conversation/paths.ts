/** PILLOW-NUC-001 — Natural UX Conversation paths and constants (T4-01). */

export const NATURAL_UX_CONVERSATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_NATURAL_UX_CONVERSATION_SYSTEM.md";

export const CONVERSATION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "conversing",
  "clarifying",
  "planning",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const CONVERSATION_STATUSES = [
  "active",
  "awaiting_clarification",
  "planned",
  "completed",
  "interrupted",
  "failed",
] as const;

export const CLARIFICATION_STATUSES = [
  "not_required",
  "pending",
  "answered",
  "skipped",
] as const;

export const INTENT_CATEGORIES = [
  "layout_modification",
  "component_modification",
  "navigation_improvement",
  "workflow_improvement",
  "dashboard_improvement",
  "form_improvement",
  "table_improvement",
  "card_improvement",
  "theme_request",
  "ux_question",
  "design_question",
  "builder_request",
  "review_request",
  "analysis_request",
  "explanation_request",
  "general_ux_discussion",
] as const;

export const CONVERSATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;
