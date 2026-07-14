/** Canonical Supervisor System (P6-03). */
export const SUPERVISOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPERVISOR_SYSTEM.md";

/** Supervisor governance companion. */
export const SUPERVISOR_GOVERNANCE_COMPANION_PATH =
  "docs/governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md";

/** Vision Integrity Engine companion (P6-02). */
export const VISION_INTEGRITY_COMPANION_PATH =
  "docs/governance/EMPIREAI_VISION_INTEGRITY_ENGINE.md";

/** Supervisor principles (P6-03). */
export const SUPERVISOR_PRINCIPLES = [
  "Supervisor is NOT an AI",
  "Supervisor is NOT Builder",
  "Supervisor is NOT Pillow",
  "Supervisor is the constitutional execution supervisor",
  "Continuous observation — no silent execution",
  "No hidden failure — evidence-based reporting",
  "Real-time visibility for Grand King",
  "Supervisor observes — ECC coordinates",
  "Guardian provides infrastructure health — Supervisor provides execution health",
  "Single Supervisor authority — no competing systems",
] as const;

/** Supervisor responsibilities (P6-03). */
export const SUPERVISOR_RESPONSIBILITIES = [
  "mission_supervision",
  "execution_supervision",
  "builder_supervision",
  "runtime_supervision",
  "journey_supervision",
  "production_supervision",
  "recovery_supervision",
  "dependency_supervision",
  "progress_supervision",
  "health_supervision",
] as const;

/** Supervision pipeline stages (P6-03). */
export const SUPERVISION_PIPELINE = [
  "mission_created",
  "mission_accepted",
  "mission_started",
  "execution_monitoring",
  "progress_monitoring",
  "dependency_monitoring",
  "risk_monitoring",
  "recovery_monitoring",
  "validation_monitoring",
  "mission_completion",
] as const;

/** Mission health classifications (P6-03). */
export const MISSION_HEALTH_CLASSIFICATIONS = [
  "healthy",
  "attention_required",
  "delayed",
  "blocked",
  "recovering",
  "critical",
  "completed",
] as const;

/** Supervision events Supervisor records (P6-03). */
export const SUPERVISION_EVENTS = [
  "mission_started",
  "mission_paused",
  "mission_resumed",
  "mission_delayed",
  "mission_blocked",
  "recovery_started",
  "recovery_completed",
  "validation_started",
  "validation_completed",
  "mission_completed",
] as const;

/** Observations Supervisor shall track (P6-03). */
export const SUPERVISION_OBSERVATIONS = [
  "mission_state",
  "current_roadmap_item",
  "current_phase",
  "current_step",
  "current_activity",
  "mission_progress",
  "overall_progress",
  "current_dependencies",
  "current_risks",
  "current_errors",
  "current_warnings",
  "current_recovery",
  "execution_health",
] as const;
