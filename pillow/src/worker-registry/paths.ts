/** PILLOW-WRG-001 — Worker Registry (Q1-07). */
export const WORKER_REGISTRY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_REGISTRY_SYSTEM.md" as const;
export const WORKER_REGISTRY_ID = "worker-registry" as const;
export const WRG_METADATA_VERSION = "WRG-001-v1" as const;
export const REGISTRY_VERSION = "WRG-REG-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "registering",
  "querying",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum worker operational states (Q1-07).
 * Architecture allows additional states via configuration without redesign.
 */
export const WORKER_STATES = [
  "registered",
  "active",
  "busy",
  "idle",
  "suspended",
  "retired",
  "disabled",
  "offline",
] as const;

export const CERTIFICATION_STATUSES = [
  "uncertified",
  "pending",
  "certified",
  "expired",
  "revoked",
] as const;

export const REGISTRY_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const REGISTRY_RULES = [
  "unique_worker_id",
  "one_primary_role",
  "one_department",
  "one_factory",
  "pillow_governing_authority",
  "reporting_relationship_defined",
  "skill_profile_defined",
  "approved_tools_defined",
  "authority_level_defined",
  "certification_status_defined",
  "no_unregistered_execution",
] as const;

export const WRG_CAPABILITIES = [
  "register_new_workers",
  "assign_globally_unique_worker_id",
  "record_worker_identity",
  "record_worker_role",
  "record_department",
  "record_factory",
  "record_reporting_line",
  "record_owner_pillow",
  "record_skills",
  "record_approved_tools",
  "record_authority_level",
  "record_certification_status",
  "record_operational_status",
  "record_version_history",
  "produce_machine_readable_worker_records",
  "retrieve_worker_by_id",
  "query_workers_by_department",
  "query_workers_by_role",
  "query_workers_by_factory",
  "validate_reporting_line",
  "extensible_worker_states",
  "preserve_auditability",
  "preserve_traceability",
  "worker_registry_validation",
  "health_monitoring",
  "recovery_management",
] as const;
