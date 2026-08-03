/** PILLOW-WMO-001 — Worker Monitoring (Q1-10). */
export const WORKER_MONITORING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_MONITORING_SYSTEM.md" as const;
export const WORKER_MONITORING_ID = "worker-monitoring" as const;
export const WMO_METADATA_VERSION = "WMO-001-v1" as const;
export const MONITORING_VERSION = "WMO-MON-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "observing",
  "alerting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum worker health states (Q1-10).
 * Architecture allows additional health states via configuration without redesign.
 */
export const WORKER_HEALTH_STATES = [
  "healthy",
  "warning",
  "critical",
  "recovering",
  "offline",
  "unknown",
] as const;

/**
 * Minimum monitoring events (Q1-10).
 * Architecture allows additional events via configuration without redesign.
 */
export const MONITORING_EVENTS = [
  "worker_started",
  "worker_completed",
  "worker_failed",
  "worker_stalled",
  "worker_overloaded",
  "worker_recovered",
  "worker_suspended",
  "worker_offline",
  "performance_degraded",
] as const;

export const MONITORING_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const MONITORING_RULES = [
  "continuously_monitor_active_workers",
  "detect_abnormal_behaviour",
  "detect_execution_drift",
  "detect_performance_degradation",
  "report_critical_events_to_pillow",
  "preserve_monitoring_history",
  "support_executive_reporting_runtime_integration",
] as const;

export const DRIFT_STATUSES = ["none", "minor", "major", "severe"] as const;

export const WMO_CAPABILITIES = [
  "monitor_worker_health",
  "monitor_worker_availability",
  "monitor_current_workload",
  "monitor_mission_progress",
  "monitor_execution_time",
  "monitor_failures",
  "monitor_repeated_errors",
  "monitor_execution_drift",
  "monitor_resource_usage",
  "monitor_quality_indicators",
  "detect_stalled_workers",
  "detect_unhealthy_workers",
  "detect_offline_workers",
  "produce_machine_readable_monitoring_records",
  "extensible_health_states",
  "extensible_monitoring_events",
  "alert_generation",
  "worker_monitoring_validation",
  "health_monitoring",
  "recovery_management",
] as const;
