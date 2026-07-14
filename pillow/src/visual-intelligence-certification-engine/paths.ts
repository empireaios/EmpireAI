/** PILLOW-VIC-001 — Visual Intelligence Certification paths (T5-10). */

export const VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM.md";

export const CERTIFICATION_REPORT_VERSION = "VIC-001-v1" as const;

export const CERTIFICATION_STATUSES = [
  "idle",
  "running",
  "certified",
  "degraded",
  "failed",
  "stopped",
] as const;

export const CERTIFICATION_DECISIONS = ["pass", "fail", "conditional"] as const;

export const CERTIFIED_PROGRAMMES = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
] as const;

export const T5_MISSION_IDS = [
  "T5-01",
  "T5-02",
  "T5-03",
  "T5-04",
  "T5-05",
  "T5-06",
  "T5-07",
  "T5-08",
  "T5-09",
] as const;

export const CERTIFICATION_CATEGORIES = [
  "visual_foundation_certification",
  "ux_intelligence_certification",
  "autonomous_builder_certification",
  "executive_collaboration_certification",
  "autonomous_evolution_certification",
  "governance_certification",
  "validation_certification",
  "recovery_certification",
  "deployment_certification",
  "continuous_learning_certification",
  "accessibility_certification",
  "design_system_certification",
  "executive_preference_certification",
  "end_to_end_visual_intelligence_certification",
] as const;
