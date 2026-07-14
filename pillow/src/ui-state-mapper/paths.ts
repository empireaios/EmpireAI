/** PILLOW-USM-001 — UI State Mapper paths (T1-02). */

export const UI_STATE_MAPPER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_UI_STATE_MAPPER_SYSTEM.md";

export const UI_STATE_MODEL_VERSION = "1.0.0" as const;

export const MAPPING_STATUSES = [
  "idle",
  "mapping",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const SERIALIZATION_FORMATS = ["json", "compact-json"] as const;
