/** PILLOW-CJI-001 — Customer Journey Intelligence paths (R4-17). */

export const CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM.md";

export const CJI_METADATA_VERSION = "CJI-001-v1" as const;

export const CUSTOMER_JOURNEY_INTELLIGENCE_ID = "customer-journey-intelligence" as const;

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

export const JOURNEY_STAGES = [
  "awareness",
  "consideration",
  "purchase",
  "retention",
  "advocacy",
  "at_risk",
  "churned",
] as const;

export const CONVERSION_STATUSES = [
  "not_started",
  "in_progress",
  "converted",
  "dropped_off",
  "stalled",
] as const;

export const RECOMMENDED_JOURNEY_ACTIONS = [
  "no_action",
  "nurture",
  "engage",
  "offer_incentive",
  "resolve_friction",
  "escalate_support",
  "re_engage",
] as const;

export const CJI_CAPABILITIES = [
  "journey_mapping",
  "touchpoint_tracking",
  "stage_identification",
  "dropoff_detection",
  "friction_detection",
  "performance_measurement",
  "conversion_measurement",
  "optimization_recommendation",
  "progression_prediction",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
