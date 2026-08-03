/** PILLOW-ILE-001 — International Logistics Engine paths (X4-08). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_INTERNATIONAL_LOGISTICS_ENGINE_SYSTEM.md" as const;
export const INTERNATIONAL_LOGISTICS_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const ILE_METADATA_VERSION = "ILE-001-v1" as const;
export const INTERNATIONAL_LOGISTICS_ENGINE_ID = "international-logistics-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "optimizing",
  "analyzing",
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

export const LOGISTICS_CATEGORIES = [
  "shipping_network",
  "provider",
  "shipping_performance",
  "delivery_time",
  "fulfillment_capacity",
  "shipping_cost",
  "bottleneck",
  "fulfillment_risk",
  "route_optimization",
] as const;

export const FULFILLMENT_STATUSES = [
  "under_review",
  "partial",
  "constrained",
  "ready",
  "unknown",
] as const;

export const RISK_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const ILE_CAPABILITIES = [
  "global_shipping_networks",
  "logistics_provider_monitoring",
  "shipping_performance_monitoring",
  "delivery_time_monitoring",
  "fulfillment_capacity_monitoring",
  "shipping_cost_monitoring",
  "logistics_bottleneck_detection",
  "fulfillment_risk_detection",
  "shipping_route_optimization",
  "logistics_recommendations",
  "logistics_records",
  "logistics_validation",
  "logistics_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
