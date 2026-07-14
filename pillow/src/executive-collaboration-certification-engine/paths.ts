/** PILLOW-EXC-001 — Executive Collaboration Certification paths (T4-10). */

export const EXECUTIVE_COLLABORATION_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_COLLABORATION_CERTIFICATION_SYSTEM.md";

export const CERTIFICATION_REPORT_VERSION = "1.0.0" as const;

export const CERTIFICATION_STATUSES = [
  "idle",
  "running",
  "certified",
  "degraded",
  "failed",
  "stopped",
] as const;

export const T4_MISSION_IDS = [
  "T4-01",
  "T4-02",
  "T4-03",
  "T4-04",
  "T4-05",
  "T4-06",
  "T4-07",
  "T4-08",
  "T4-09",
] as const;

export const CERTIFICATION_DECISIONS = ["pass", "fail", "conditional"] as const;
