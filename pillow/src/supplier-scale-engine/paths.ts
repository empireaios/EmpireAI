/** PILLOW-SSE-001 — Supplier Scale Engine paths (X3-06). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_SCALE_ENGINE_SYSTEM.md" as const;
export const SUPPLIER_SCALE_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const SSE_METADATA_VERSION = "SSE-001-v1" as const;
export const SUPPLIER_SCALE_ENGINE_ID = "supplier-scale-engine" as const;

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

export const SSE_CAPABILITIES = [
  "supplier_capacity_monitoring",
  "supplier_performance_monitoring",
  "supplier_lead_time_monitoring",
  "supplier_inventory_monitoring",
  "fulfilment_performance_monitoring",
  "supplier_reliability_monitoring",
  "supplier_bottleneck_detection",
  "supplier_scaling_risk_detection",
  "supplier_expansion_recommendations",
  "supplier_scaling_records",
  "supplier_validation",
  "supplier_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
