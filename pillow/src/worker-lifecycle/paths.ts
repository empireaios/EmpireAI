/** PILLOW-WLC-001 — Worker Lifecycle (Q1-08). */
export const WORKER_LIFECYCLE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_LIFECYCLE_SYSTEM.md" as const;
export const WORKER_LIFECYCLE_ID = "worker-lifecycle" as const;
export const WLC_METADATA_VERSION = "WLC-001-v1" as const;
export const LIFECYCLE_VERSION = "WLC-LIFE-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "transitioning",
  "auditing",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum worker lifecycle states (Q1-08).
 * Architecture allows additional states via configuration without redesign.
 */
export const LIFECYCLE_STATES = [
  "created",
  "registered",
  "onboarding",
  "configured",
  "certified",
  "active",
  "busy",
  "idle",
  "suspended",
  "recovering",
  "replaced",
  "retired",
  "archived",
] as const;

export const LIFECYCLE_EVENTS = [
  "create",
  "onboard",
  "configure",
  "certify",
  "activate",
  "suspend",
  "resume",
  "replace",
  "retire",
  "archive",
  "audit",
  "restore",
] as const;

export const LIFECYCLE_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const LIFECYCLE_RULES = [
  "registered_before_onboarding",
  "onboarded_before_activation",
  "certified_before_production_use",
  "preserve_lifecycle_history",
  "preserve_audit_records",
  "preserve_traceability",
  "pillow_authorization_for_retirement",
  "pillow_authorization_for_replacement",
  "never_permanently_deleted",
] as const;

export const WLC_CAPABILITIES = [
  "worker_creation",
  "worker_onboarding",
  "worker_configuration",
  "worker_activation",
  "worker_suspension",
  "worker_resumption",
  "worker_replacement",
  "worker_retirement",
  "worker_archival",
  "worker_auditing",
  "worker_restoration",
  "produce_machine_readable_lifecycle_records",
  "extensible_lifecycle_states",
  "preserve_auditability",
  "preserve_traceability",
  "worker_lifecycle_validation",
  "health_monitoring",
  "recovery_management",
] as const;
