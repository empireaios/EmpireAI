/** PILLOW-PL-001 — Preference Learning paths and constants (T4-08). */

export const PREFERENCE_LEARNING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PREFERENCE_LEARNING_SYSTEM.md";

export const PREFERENCE_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "loading",
  "learning",
  "analyzing",
  "versioning",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const PREFERENCE_STATUSES = [
  "draft",
  "learned",
  "updated",
  "deprecated",
  "conflicted",
  "validated",
  "completed",
  "failed",
] as const;

export const PREFERENCE_CATEGORIES = [
  "proposal_presentation",
  "explanation_presentation",
  "review_workflow",
  "approval_workflow",
  "comparison_preference",
  "annotation_preference",
  "conversation_preference",
  "voice_interaction_preference",
  "ux_discussion_preference",
  "collaboration_style",
  "decision_style",
  "review_sequence",
  "information_density",
  "preferred_visualization",
] as const;

export const LEARNING_SCOPES = ["minimal", "standard", "comprehensive"] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;
