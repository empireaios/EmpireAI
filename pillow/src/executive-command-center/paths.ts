/** PILLOW-PECC-001 — Pillow Executive Command Center (Q0-18). */
export const EXECUTIVE_COMMAND_CENTER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_COMMAND_CENTER_SYSTEM.md" as const;
export const EXECUTIVE_COMMAND_CENTER_ID = "executive-command-center" as const;
export const PECC_METADATA_VERSION = "PECC-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "routing",
  "querying",
  "aggregating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const COMMAND_STATUSES = [
  "received",
  "routed",
  "completed",
  "rejected",
  "failed",
] as const;

/**
 * Default executive command types (Q0-18).
 * Architecture allows additional types via configuration without redesign.
 */
export const EXECUTIVE_COMMAND_TYPES = [
  "executive_query",
  "executive_planning",
  "executive_monitoring",
  "executive_reporting",
  "executive_routing",
  "executive_inspection",
  "executive_review",
  "executive_approval",
  "executive_recovery",
  "executive_coordination",
] as const;

/**
 * Default routed services — unified command layer targets.
 * Architecture allows additional services via configuration without redesign.
 */
export const ROUTED_SERVICES = [
  "workers",
  "tools",
  "missions",
  "business_state",
  "approvals",
  "execution_memory",
  "decision_memory",
  "executive_reports",
] as const;

export const PECC_CAPABILITIES = [
  "receive_executive_commands",
  "unified_access_workers",
  "unified_access_tools",
  "unified_access_missions",
  "unified_access_business_state",
  "unified_access_approvals",
  "unified_access_execution_memory",
  "unified_access_decision_memory",
  "unified_access_executive_reports",
  "route_executive_requests",
  "aggregate_executive_information",
  "produce_executive_command_records",
  "machine_readable_command_output",
  "extensible_command_types",
  "extensible_routed_services",
  "preserve_auditability",
  "preserve_traceability",
  "executive_command_center_validation",
  "health_monitoring",
  "recovery_management",
] as const;
