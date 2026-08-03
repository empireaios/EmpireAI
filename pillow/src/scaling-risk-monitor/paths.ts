/** PILLOW-SRM-001 — Scaling Risk Monitor paths (X3-13). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_SCALING_RISK_MONITOR_SYSTEM.md" as const;
export const SCALING_RISK_MONITOR_SYSTEM_PATH = SYSTEM_PATH;

export const SRM_METADATA_VERSION = "SRM-001-v1" as const;
export const SCALING_RISK_MONITOR_ID = "scaling-risk-monitor" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
  "detecting",
  "ranking",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const RISK_OPERATIONS = [
  "scaling_risk",
  "operational_risk",
  "financial_risk",
  "supplier_risk",
  "marketing_risk",
  "workforce_risk",
  "infrastructure_risk",
  "uncontrolled_expansion",
  "risk_ranking",
] as const;

export const RISK_CATEGORIES = [
  "operational",
  "financial",
  "supplier",
  "marketing",
  "workforce",
  "infrastructure",
  "uncontrolled_expansion",
] as const;

export const RISK_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const SRM_CAPABILITIES = [
  "scaling_risk_monitoring",
  "operational_risk_monitoring",
  "financial_risk_monitoring",
  "supplier_risk_monitoring",
  "marketing_risk_monitoring",
  "workforce_risk_monitoring",
  "infrastructure_risk_monitoring",
  "uncontrolled_expansion_detection",
  "risk_ranking",
  "risk_mitigation_recommendations",
  "scaling_risk_records",
  "scaling_risk_validation",
  "scaling_risk_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
