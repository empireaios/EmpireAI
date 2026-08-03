/** PILLOW-EXM-001 — Execution Memory (Q0-04). */
export const EXECUTION_MEMORY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTION_MEMORY_SYSTEM.md" as const;
export const EXECUTION_MEMORY_ID = "execution-memory" as const;
export const EXM_METADATA_VERSION = "EXM-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "recording",
  "retrieving",
  "searching",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported execution memory event types (Q0-04). */
export const EXECUTION_EVENT_TYPES = [
  "mission_started",
  "mission_completed",
  "mission_failed",
  "executive_decision",
  "approval_granted",
  "approval_rejected",
  "business_created",
  "business_updated",
  "business_closed",
  "worker_escalation",
  "operational_incident",
  "lesson_learned",
] as const;

export const APPROVAL_STATUSES = [
  "not_applicable",
  "pending",
  "granted",
  "rejected",
  "recorded",
] as const;

export const EXM_CAPABILITIES = [
  "record_completed_missions",
  "record_failed_missions",
  "record_executive_decisions",
  "record_approvals",
  "record_rejected_decisions",
  "record_lessons_learned",
  "record_execution_outcomes",
  "record_operational_events",
  "historical_lookup",
  "machine_readable_retrieval",
  "search_by_mission",
  "search_by_business",
  "search_by_event_type",
  "update_history",
  "preserve_audit_trail",
  "health_monitoring",
  "recovery_management",
] as const;
