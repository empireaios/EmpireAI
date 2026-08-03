/** PILLOW-WCR-001 — Workforce Capability Registry (Q0-10). */
export const WORKFORCE_CAPABILITY_REGISTRY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFORCE_CAPABILITY_REGISTRY_SYSTEM.md" as const;
export const WORKFORCE_CAPABILITY_REGISTRY_ID = "workforce-capability-registry" as const;
export const WCR_METADATA_VERSION = "WCR-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "registering",
  "querying",
  "updating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const WORKER_STATUSES = [
  "available",
  "busy",
  "waiting",
  "blocked",
  "escalated",
  "failed",
  "completed",
  "offline",
  "maintenance",
] as const;

export const WORKER_TYPES = [
  "specialist",
  "generalist",
  "coordinator",
  "reviewer",
  "analyst",
  "operator",
] as const;

export const LOOKUP_DIMENSIONS = [
  "worker",
  "capability",
  "department",
  "tool",
  "skill",
  "status",
] as const;

export const WCR_CAPABILITIES = [
  "register_workers",
  "register_departments",
  "register_capabilities",
  "register_tools",
  "register_skills",
  "register_worker_limits",
  "register_worker_dependencies",
  "track_worker_status",
  "lookup_by_worker",
  "lookup_by_capability",
  "lookup_by_department",
  "lookup_by_tool",
  "lookup_by_skill",
  "lookup_by_status",
  "update_registry_records",
  "produce_registry_records",
  "machine_readable_registry_output",
  "preserve_auditability",
  "preserve_traceability",
  "registry_validation",
  "health_monitoring",
  "recovery_management",
] as const;
