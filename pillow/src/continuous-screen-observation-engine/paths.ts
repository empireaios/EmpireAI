/** T5-01 — Continuous Screen Observation paths and constants. */

export const CONTINUOUS_SCREEN_OBSERVATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CONTINUOUS_SCREEN_OBSERVATION_SYSTEM.md";

export const OBSERVATION_METADATA_VERSION = "CSO-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "observing",
  "detecting_changes",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const OBSERVATION_STATUSES = [
  "recorded",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const UI_SURFACE_STATES = [
  "ready",
  "loading",
  "empty",
  "error",
  "modal_open",
  "drawer_open",
  "tab_changed",
] as const;
