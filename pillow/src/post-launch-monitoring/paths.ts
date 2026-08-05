/** PILLOW-PLMRT-001 — Post-Launch Monitoring (Q11-11). */
export const POST_LAUNCH_MONITORING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_POST_LAUNCH_MONITORING_SYSTEM.md" as const;
export const POST_LAUNCH_MONITORING_ID = "post-launch-monitoring" as const;
export const PLMRT_METADATA_VERSION = "PLMRT-001-v1" as const;
export const POST_LAUNCH_MONITORING_REPORT_VERSION = "PLMRT-RPT-v1" as const;
export const PLMRT_MISSION_ID = "Q11-11" as const;
export const POST_LAUNCH_MONITORING_RUNTIME_VERSION = "Q11-PLMRT-v1" as const;

export const POST_LAUNCH_MONITORING_IDENTITY = {
  workerId: "wkr-post-launch-monitoring-01",
  workerName: "Post-Launch Monitoring",
  workerType: "monitor",
  department: "post_launch_monitoring",
  factory: "post-launch-monitoring",
  role: "role-monitor-post-launch-monitoring",
  reportingLine: ["wkr-post-launch-monitoring-01", "pillow"] as string[],
  skillProfile: [
    "skill-worker-health-monitoring",
    "skill-factory-health-monitoring",
    "skill-workflow-structural-monitoring",
    "skill-runtime-service-monitoring",
    "skill-api-integration-monitoring",
    "skill-incident-detection",
    "skill-abnormal-worker-behaviour-detection",
    "skill-production-alert-generation",
    "skill-production-health-summary",
    "skill-post-launch-monitoring-reporting",
  ],
  approvedTools: ["monitoring_runtime_evidence", "structured_reporting"],
  authorityLevel: "evidence_only_monitoring",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "detecting_incidents",
  "generating_alerts",
  "reporting",
  "validating",
  "blocked",
  "standby",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;

export const PRODUCTION_STATUSES = ["active", "blocked", "standby", "degraded", "unknown"] as const;
export const ALERT_STATUSES = ["none", "warning", "critical", "unknown"] as const;
export const BUSINESS_IMPACT_LEVELS = ["none", "low", "moderate", "high", "critical", "unknown"] as const;

export const COMPONENT_TYPES = [
  "worker",
  "factory",
  "workflow",
  "runtime_service",
  "api",
  "queue",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "grand_king_acceptance_gate",
  "shared_runtime_core",
  "pillow_orchestration_runtime",
  "monitoring_runtime",
  "recovery_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
  "worker_registry",
  "api_runtime",
  "queue_runtime",
] as const;

export const PLMRT_CAPABILITIES = [
  "verify_grand_king_acceptance_granted",
  "monitor_workers",
  "monitor_factories",
  "monitor_workflows",
  "monitor_runtime_services",
  "monitor_api_integrations",
  "detect_incidents",
  "detect_abnormal_worker_behaviour",
  "generate_alerts",
  "produce_production_health_summary",
  "produce_post_launch_monitoring_report",
  "consume_q1111_consumable_contract",
  "expose_q1112_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_monitoring_history",
  "never_fabricate_production_evidence",
  "never_suppress_critical_incidents",
  "never_hide_failures",
  "never_auto_modify_production",
  "never_override_grand_king",
  "never_override_pillow",
  "never_implement_q1112_or_later",
  "deterministic_monitoring_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "eleventh_q11_gate",
] as const;
