/** PILLOW-PPE-001 — Performance Preservation Engine paths (X3-12). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_PERFORMANCE_PRESERVATION_ENGINE_SYSTEM.md" as const;
export const PERFORMANCE_PRESERVATION_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const PPE_METADATA_VERSION = "PPE-001-v1" as const;
export const PERFORMANCE_PRESERVATION_ENGINE_ID = "performance-preservation-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
  "detecting",
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

export const PRESERVATION_OPERATIONS = [
  "service_quality",
  "customer_experience",
  "operational_performance",
  "response_time",
  "fulfilment_quality",
  "reliability",
  "performance_degradation",
  "quality_regression",
] as const;

export const PPE_CAPABILITIES = [
  "service_quality_monitoring",
  "customer_experience_monitoring",
  "operational_performance_monitoring",
  "response_time_monitoring",
  "fulfilment_quality_monitoring",
  "reliability_monitoring",
  "performance_degradation_detection",
  "quality_regression_detection",
  "preservation_recommendations",
  "preservation_records",
  "preservation_validation",
  "preservation_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
