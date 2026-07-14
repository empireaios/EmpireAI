/** PILLOW-CC-001 — Continuous Collaboration paths and constants (T4-09). */

export const CONTINUOUS_COLLABORATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CONTINUOUS_COLLABORATION_SYSTEM.md";

export const COLLABORATION_METADATA_VERSION = "1.0.0" as const;

export const ENGINE_STATUSES = [
  "idle",
  "loading",
  "synchronizing",
  "tracking",
  "applying_preferences",
  "validating",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const SESSION_STATUSES = [
  "active",
  "restored",
  "paused",
  "completed",
  "interrupted",
  "failed",
] as const;

export const DISCUSSION_STATUSES = ["active", "resolved", "deferred", "blocked"] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial", "blocked"] as const;
