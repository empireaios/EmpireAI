/** Canonical Zero-Human Automation Architecture (P6-07). */
export const ZERO_HUMAN_AUTOMATION_PATH =
  "docs/governance/EMPIREAI_ZERO_HUMAN_AUTOMATION_ARCHITECTURE.md";

/** Autonomous Recovery companion (P6-06). */
export const AUTONOMOUS_RECOVERY_COMPANION_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_RECOVERY_ENGINE.md";

/** ECC companion (P6-01). */
export const ECC_COMPANION_PATH = "docs/governance/EMPIREAI_EXECUTION_CONTROL_CENTER.md";

/** VIE companion (P6-02). */
export const VIE_COMPANION_PATH = "docs/governance/EMPIREAI_VISION_INTEGRITY_ENGINE.md";

/** Automation principles (P6-07). */
export const AUTOMATION_PRINCIPLES = [
  "Vision First — automation serves Vision, never overrides it",
  "Constitution First — no action without constitutional alignment",
  "Human Override Always Available — Grand King retains ultimate authority",
  "Evidence Before Action — observable evidence required before automation",
  "Observable Automation — every automated action visible in Cockpit",
  "Recoverable Automation — failures recover via Autonomous Recovery Engine",
  "Continuous Learning — automation improves from execution evidence",
  "Continuous Improvement — Pillow recommends automation upgrades",
  "No Hidden Decisions — all automation decisions logged and explainable",
] as const;

/** Domains automation governs (P6-07). */
export const AUTOMATION_DOMAINS = [
  "mission_generation",
  "mission_scheduling",
  "mission_prioritisation",
  "mission_execution",
  "builder",
  "supervisor",
  "guardian",
  "recovery",
  "journey",
  "repository",
  "production",
  "business_engines",
  "commerce",
  "knowledge",
  "continuous_improvement",
] as const;

/** Automation pipeline stages (P6-07). */
export const AUTOMATION_PIPELINE_STAGES = [
  "vision_synchronization",
  "context_synchronization",
  "mission_generation",
  "mission_prioritisation",
  "ecc_coordination",
  "builder_execution",
  "supervisor_observation",
  "guardian_monitoring",
  "recovery",
  "browser_truth",
  "grand_king_approval",
  "journey_recording",
  "vision_accumulation",
  "continuous_improvement",
] as const;

/** Automation levels (P6-07). */
export const AUTOMATION_LEVELS = [
  "level_0_manual",
  "level_1_assisted",
  "level_2_semi_autonomous",
  "level_3_supervised_autonomous",
  "level_4_constitutional_autonomous",
] as const;

/** Safety stop triggers (P6-07). */
export const AUTOMATION_SAFETY_STOPS = [
  "vision_conflict",
  "constitution_conflict",
  "critical_production_risk",
  "repository_integrity_threatened",
  "security_policy_violated",
  "grand_king_approval_required",
] as const;
