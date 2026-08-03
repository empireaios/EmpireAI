/** PILLOW-LME-001 — Launch Monitoring Engine paths (X1-13). */

export const LAUNCH_MONITORING_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LAUNCH_MONITORING_ENGINE_SYSTEM.md";

export const LME_METADATA_VERSION = "LME-001-v1" as const;

export const LAUNCH_MONITORING_ENGINE_ID = "launch-monitoring-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "monitoring",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const LME_CAPABILITIES = [
  "launch_business_monitoring",
  "operational_health_monitoring",
  "customer_activity_monitoring",
  "sales_performance_monitoring",
  "order_activity_monitoring",
  "system_stability_monitoring",
  "launch_anomaly_detection",
  "operational_failure_detection",
  "launch_health_recommendations",
  "launch_monitoring_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
