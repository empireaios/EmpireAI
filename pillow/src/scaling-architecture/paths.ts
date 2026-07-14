/** Canonical Scaling Architecture (P5-05). */
export const SCALING_ARCHITECTURE_PATH =
  "docs/governance/EMPIREAI_SCALING_ARCHITECTURE.md";

/** Guardian Monitoring companion (P5-04). */
export const GUARDIAN_MONITORING_COMPANION_PATH =
  "docs/governance/EMPIREAI_GUARDIAN_MONITORING_SYSTEM.md";

/** Production Mode companion (P5-02). */
export const PRODUCTION_MODE_COMPANION_PATH =
  "docs/governance/EMPIREAI_PRODUCTION_MODE.md";

/** Brain Runtime companion (P5-01). */
export const BRAIN_RUNTIME_COMPANION_PATH =
  "docs/governance/EMPIREAI_BRAIN_RUNTIME_SYSTEM.md";

/** Infrastructure architecture reference. */
export const INFRASTRUCTURE_ARCHITECTURE_PATH =
  "docs/architecture/EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md";

/** Scaling principles (P5-05). */
export const SCALING_PRINCIPLES = [
  "Production-first deliberate scaling",
  "Never scale prematurely",
  "Never scale reactively without doctrine",
  "Stage-gated evolution",
  "Preserve architectural integrity",
  "Document exit criteria before advancing",
  "Horizontal scaling only when Stage 3+ ready",
  "Database migration before multi-instance",
] as const;

/** Scaling stages (P5-05). */
export const SCALING_STAGES = [
  "stage_1_single_instance",
  "stage_2_production_hardening",
  "stage_3_multi_instance",
  "stage_4_high_availability",
  "stage_5_enterprise_scale",
] as const;

/** Governed scaling domains (P5-05). */
export const SCALING_DOMAINS = [
  "brain",
  "pillow",
  "cockpit",
  "builder",
  "supervisor",
  "guardian",
  "runtime",
  "queues",
  "workers",
  "sessions",
  "database",
  "redis",
  "storage",
  "ai_providers",
  "business_engines",
  "commerce",
  "production_infrastructure",
] as const;

/** Stage documentation fields. */
export const STAGE_DOCUMENTATION_FIELDS = [
  "objectives",
  "dependencies",
  "exitCriteria",
  "currentLimitations",
  "targetCapabilities",
  "migrationNotes",
] as const;
