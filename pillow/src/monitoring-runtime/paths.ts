/** PILLOW-MONRT-001 — Monitoring Runtime (Q10-10). */
export const MONITORING_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MONITORING_RUNTIME_SYSTEM.md" as const;
export const MONITORING_RUNTIME_ID = "monitoring-runtime" as const;
export const MONRT_METADATA_VERSION = "MONRT-001-v1" as const;
export const MONRT_REPORT_VERSION = "MONRT-RPT-v1" as const;
export const MONRT_RUNTIME_VERSION = "Q10-MONRT-v1" as const;
export const MONRT_MISSION_ID = "Q10-10" as const;

export const MONITORING_RUNTIME_IDENTITY = {
  workerId: "wkr-monitoring-runtime-01",
  workerName: "Monitoring Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-monitoring",
  role: "role-coordinator-monitoring-runtime",
  reportingLine: ["wkr-monitoring-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-component-monitoring",
    "skill-heartbeat-collection",
    "skill-anomaly-detection",
    "skill-alert-generation",
    "skill-health-calculation",
    "skill-enterprise-health-aggregation",
    "skill-monitoring-reporting",
    "skill-monitoring-traceability",
    "skill-governance-enforcement",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "queue_runtime",
    "memory_runtime",
    "api_runtime",
    "tool_runtime",
    "communication_runtime",
    "approval_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
    "worker_registry",
    "factory_registry",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const COMPONENT_TYPES = [
  "worker",
  "factory",
  "runtime_service",
  "api",
  "queue",
  "mission",
  "tool",
  "enterprise_service",
  "custom_extension",
] as const;

export const HEALTH_STATUSES = [
  "healthy",
  "degraded",
  "warning",
  "critical",
  "unavailable",
  "standby",
  "unknown",
] as const;

export const ALERT_SEVERITIES = ["info", "warning", "critical"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "detecting",
  "alerting",
  "reporting",
  "failed",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "unavailable"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const INTEGRATION_TARGETS = [
  "shared_runtime_core",
  "pillow_orchestration_runtime",
  "mission_runtime",
  "queue_runtime",
  "memory_runtime",
  "api_runtime",
  "tool_runtime",
  "communication_runtime",
  "approval_runtime",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_registry",
  "factory_registry",
  "worker_recovery_system",
  "recovery",
] as const;

export const MONRT_CAPABILITIES = [
  "register_monitored_components",
  "collect_heartbeats",
  "monitor_workers",
  "monitor_factories",
  "monitor_runtimes",
  "monitor_apis",
  "monitor_queues",
  "monitor_missions",
  "monitor_tools",
  "detect_anomalies",
  "generate_alerts",
  "calculate_health_deterministically",
  "aggregate_enterprise_health",
  "produce_monitoring_runtime_reports",
  "preserve_complete_traceability",
  "preserve_monitoring_history",
  "preserve_audit_history",
  "never_fabricate_health_information",
  "never_suppress_critical_alerts",
  "never_automatically_repair_failures",
  "never_replace_recovery_systems",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "integrate_api_runtime",
  "integrate_tool_runtime",
  "integrate_communication_runtime",
  "integrate_approval_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_registry",
  "integrate_factory_registry",
  "integrate_worker_recovery_system",
  "q1011_consumable_contract",
] as const;
