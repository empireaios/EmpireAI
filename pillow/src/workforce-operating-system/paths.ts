/** PILLOW-WFOS-001 — Workforce Operating System (Q0-19). */
export const WORKFORCE_OPERATING_SYSTEM_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFORCE_OPERATING_SYSTEM.md" as const;
export const WORKFORCE_OPERATING_SYSTEM_ID = "workforce-operating-system" as const;
export const WFOS_METADATA_VERSION = "WFOS-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "starting",
  "active",
  "synchronizing",
  "monitoring",
  "recovering",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const ORGANIZATION_STATES = [
  "forming",
  "synchronized",
  "degraded",
  "recovering",
  "halted",
] as const;

export const WORKER_LIFECYCLE_STATES = [
  "registered",
  "active",
  "idle",
  "suspended",
  "retired",
] as const;

export const SESSION_STATES = ["open", "closed", "expired"] as const;

/**
 * Default Workforce OS services (Q0-19).
 * Architecture allows additional services via configuration without redesign.
 */
export const WORKFORCE_OS_SERVICES = [
  "worker_registration",
  "department_registration",
  "factory_registration",
  "session_management",
  "communication_runtime",
  "state_synchronization",
  "runtime_monitoring",
  "runtime_recovery",
  "organization_health_monitoring",
  "runtime_diagnostics",
] as const;

export const WFOS_CAPABILITIES = [
  "register_workforce_components",
  "maintain_live_organizational_structure",
  "coordinate_department_communication",
  "manage_workforce_sessions",
  "manage_worker_lifecycle",
  "coordinate_worker_discovery",
  "coordinate_inter_factory_communication",
  "maintain_organization_wide_state",
  "provide_standardized_runtime_services",
  "produce_workforce_os_records",
  "machine_readable_runtime_output",
  "extensible_workforce_os_services",
  "preserve_auditability",
  "preserve_traceability",
  "workforce_operating_system_validation",
  "health_monitoring",
  "recovery_management",
] as const;
