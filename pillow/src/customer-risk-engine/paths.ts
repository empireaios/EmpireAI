/** PILLOW-CRE-001 — Customer Risk Engine paths (R4-14). */

export const CUSTOMER_RISK_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CUSTOMER_RISK_ENGINE_SYSTEM.md";

export const CRE_METADATA_VERSION = "CRE-001-v1" as const;

export const CUSTOMER_RISK_ENGINE_ID = "customer-risk-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const ENGINE_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const RISK_CATEGORIES = [
  "fraud",
  "abuse",
  "returns",
  "communication",
  "purchasing",
  "composite",
] as const;

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export const RECOMMENDED_ACTIONS = [
  "monitor",
  "review",
  "verify_identity",
  "limit_transactions",
  "escalate",
  "no_action",
] as const;

export const ALERT_STATUSES = ["pending", "active", "cleared", "suppressed"] as const;

export const CRE_CAPABILITIES = [
  "risk_evaluation",
  "fraud_detection",
  "abuse_detection",
  "behaviour_analysis",
  "risk_scoring",
  "alert_generation",
  "mitigation_recommendation",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
