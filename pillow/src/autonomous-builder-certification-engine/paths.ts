/** PILLOW-ABC-001 — Autonomous Builder Certification paths (T3-10). */

export const AUTONOMOUS_BUILDER_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_BUILDER_CERTIFICATION_SYSTEM.md";

export const CERTIFICATION_REPORT_VERSION = "1.0.0" as const;

export const CERTIFICATION_STATUSES = [
  "idle",
  "running",
  "certified",
  "degraded",
  "failed",
  "stopped",
] as const;

export const T3_MISSION_IDS = [
  "T3-01",
  "T3-02",
  "T3-03",
  "T3-04",
  "T3-05",
  "T3-06",
  "T3-07",
  "T3-08",
  "T3-09",
] as const;

export const CERTIFICATION_DECISIONS = ["pass", "fail", "conditional"] as const;
