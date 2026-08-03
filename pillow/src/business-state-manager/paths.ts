/** PILLOW-BSM-001 — Business State Manager (Q0-03). */
export const BUSINESS_STATE_MANAGER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_STATE_MANAGER_SYSTEM.md" as const;
export const BUSINESS_STATE_MANAGER_ID = "business-state-manager" as const;
export const BSM_METADATA_VERSION = "BSM-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "updating",
  "querying",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Business lifecycle states maintained by Q0-03. */
export const BUSINESS_LIFECYCLE_STATES = [
  "planned",
  "building",
  "testing",
  "waiting_approval",
  "operating",
  "paused",
  "recovering",
  "archived",
] as const;

/** Business health statuses. */
export const BUSINESS_HEALTH_STATUSES = ["healthy", "warning", "critical"] as const;

export const BUSINESS_PHASES = [
  "intake",
  "construction",
  "validation",
  "approval_gate",
  "production",
  "maintenance",
  "recovery",
  "closure",
] as const;

export const BSM_CAPABILITIES = [
  "maintain_live_business_registry",
  "track_business_lifecycle",
  "maintain_business_health",
  "track_business_metadata",
  "track_operational_progress",
  "track_dependencies",
  "produce_machine_readable_business_state",
  "update_business_state",
  "query_business_state",
  "validate_business_state_consistency",
  "preserve_auditability",
  "preserve_traceability",
  "health_monitoring",
  "recovery_management",
] as const;
