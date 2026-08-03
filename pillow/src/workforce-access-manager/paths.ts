/** PILLOW-WAM-001 — Workforce Access Manager (Q0-11). */
export const WORKFORCE_ACCESS_MANAGER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFORCE_ACCESS_MANAGER_SYSTEM.md" as const;
export const WORKFORCE_ACCESS_MANAGER_ID = "workforce-access-manager" as const;
export const WAM_METADATA_VERSION = "WAM-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "locating",
  "invoking",
  "controlling",
  "inspecting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default executive actions (Q0-11).
 * Architecture allows additional actions via configuration without redesign.
 */
export const EXECUTIVE_ACTIONS = [
  "locate",
  "invoke",
  "suspend",
  "resume",
  "pause",
  "continue",
  "reassign",
  "inspect",
  "restart",
  "stop",
] as const;

export const ACCESS_STATUSES = [
  "granted",
  "denied",
  "completed",
  "in_progress",
  "failed",
] as const;

export const WORKER_RUNTIME_STATUSES = [
  "available",
  "connected",
  "invoked",
  "busy",
  "suspended",
  "paused",
  "reassigned",
  "stopped",
  "offline",
  "unknown",
] as const;

export const WAM_CAPABILITIES = [
  "locate_workers",
  "connect_pillow_to_workers",
  "invoke_workers",
  "suspend_workers",
  "resume_workers",
  "reassign_workers",
  "terminate_worker_execution",
  "inspect_worker_status",
  "inspect_worker_capabilities",
  "produce_access_records",
  "machine_readable_access_output",
  "extensible_executive_actions",
  "preserve_auditability",
  "preserve_traceability",
  "access_validation",
  "health_monitoring",
  "recovery_management",
] as const;
