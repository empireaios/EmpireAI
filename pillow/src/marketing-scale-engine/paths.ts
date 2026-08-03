/** PILLOW-MSE-001 — Marketing Scale Engine paths (X3-05). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETING_SCALE_ENGINE_SYSTEM.md" as const;
export const MARKETING_SCALE_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const MSE_METADATA_VERSION = "MSE-001-v1" as const;
export const MARKETING_SCALE_ENGINE_ID = "marketing-scale-engine" as const;

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

export const MSE_CAPABILITIES = [
  "marketing_performance_monitoring",
  "campaign_scalability_monitoring",
  "customer_acquisition_cost_monitoring",
  "return_on_advertising_spend_monitoring",
  "conversion_performance_monitoring",
  "channel_performance_monitoring",
  "scalable_campaign_detection",
  "marketing_bottleneck_detection",
  "marketing_scaling_recommendations",
  "marketing_scaling_records",
  "marketing_validation",
  "marketing_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const MARKETING_CHANNELS = [
  "paid_search",
  "paid_social",
  "email",
  "content",
  "affiliate",
  "organic",
] as const;
