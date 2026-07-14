/** PILLOW-SCE-001 — Session Continuity Engine paths (T1-09). */

export const SESSION_CONTINUITY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SESSION_CONTINUITY_SYSTEM.md";

export const SESSION_CONTINUITY_VERSION = "1.0.0" as const;

export const CONTINUITY_STATUSES = [
  "idle",
  "active",
  "paused",
  "interrupted",
  "recovering",
  "failed",
  "stopped",
] as const;

export const RECOVERY_STATUSES = [
  "none",
  "pending",
  "in_progress",
  "completed",
  "partial",
  "failed",
] as const;

export const SESSION_EVENTS = [
  "session_start",
  "session_resume",
  "session_pause",
  "session_interruption",
  "session_recovery",
  "browser_refresh",
  "application_restart",
  "route_continuation",
  "workflow_continuation",
  "context_rehydration",
  "stable_state_detected",
  "unstable_state_detected",
] as const;

export const STABLE_STATE_KINDS = [
  "browsing",
  "editing",
  "reviewing",
  "configuring",
  "waiting",
] as const;
