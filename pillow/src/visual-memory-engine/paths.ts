/** PILLOW-VME-001 — Visual Memory Engine paths (T1-08). */

export const VISUAL_MEMORY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VISUAL_MEMORY_SYSTEM.md";

export const MEMORY_RECORD_VERSION = "1.0.0" as const;

export const MEMORY_STATUSES = [
  "idle",
  "recording",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const RETENTION_CATEGORIES = [
  "standard",
  "snapshot",
  "extended",
  "ephemeral",
] as const;

export const STORAGE_BACKENDS = ["file", "memory"] as const;
