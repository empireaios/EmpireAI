/** PILLOW-VFC-001 — Visual Foundation Certification paths (T1-10). */

export const VISUAL_FOUNDATION_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VISUAL_FOUNDATION_CERTIFICATION_SYSTEM.md";

export const CERTIFICATION_REPORT_VERSION = "1.0.0" as const;

export const CERTIFICATION_STATUSES = [
  "idle",
  "running",
  "certified",
  "degraded",
  "failed",
  "stopped",
] as const;

export const T1_MISSION_IDS = [
  "T1-01",
  "T1-02",
  "T1-03",
  "T1-04",
  "T1-05",
  "T1-06",
  "T1-07",
  "T1-08",
  "T1-09",
] as const;

export const CERTIFICATION_DECISIONS = ["pass", "fail", "conditional"] as const;
