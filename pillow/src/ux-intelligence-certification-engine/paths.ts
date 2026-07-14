/** PILLOW-UIC-001 — UX Intelligence Certification paths (T2-10). */

export const UX_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_UX_INTELLIGENCE_CERTIFICATION_SYSTEM.md";

export const CERTIFICATION_REPORT_VERSION = "1.0.0" as const;

export const CERTIFICATION_STATUSES = [
  "idle",
  "running",
  "certified",
  "degraded",
  "failed",
  "stopped",
] as const;

export const T2_MISSION_IDS = [
  "T2-01",
  "T2-02",
  "T2-03",
  "T2-04",
  "T2-05",
  "T2-06",
  "T2-07",
  "T2-08",
  "T2-09",
] as const;

export const CERTIFICATION_DECISIONS = ["pass", "fail", "conditional"] as const;
