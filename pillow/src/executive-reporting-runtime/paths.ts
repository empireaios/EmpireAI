/** PILLOW-ERT-001 — Executive Reporting Runtime (Q0-26). */
export const EXECUTIVE_REPORTING_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_REPORTING_RUNTIME_SYSTEM.md" as const;
export const EXECUTIVE_REPORTING_RUNTIME_ID = "executive-reporting-runtime" as const;
export const ERT_METADATA_VERSION = "ERT-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "aggregating",
  "summarizing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default report types (Q0-26).
 * Architecture allows additional types via configuration without redesign.
 */
export const REPORT_TYPES = [
  "progress_report",
  "status_report",
  "completion_report",
  "blocker_report",
  "risk_report",
  "exception_report",
  "executive_summary",
  "department_summary",
  "factory_summary",
] as const;

export const ENTITY_TYPES = [
  "worker",
  "department",
  "factory",
  "executive_component",
] as const;

export const REPORTING_FREQUENCIES = [
  "real_time",
  "event_driven",
  "scheduled",
  "on_demand",
] as const;

export const COMPLETION_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "completed",
  "failed",
] as const;

export const ERT_CAPABILITIES = [
  "receive_reports_from_workers",
  "receive_reports_from_departments",
  "receive_reports_from_factories",
  "receive_reports_from_executive_components",
  "track_progress",
  "track_blockers",
  "track_risks",
  "track_evidence",
  "track_completion_status",
  "produce_executive_summaries",
  "produce_reporting_records",
  "machine_readable_reporting_output",
  "aggregate_progress",
  "extensible_report_types",
  "support_reporting_frequencies",
  "preserve_auditability",
  "preserve_traceability",
  "executive_reporting_runtime_validation",
  "health_monitoring",
  "recovery_management",
] as const;
