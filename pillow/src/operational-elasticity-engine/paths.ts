/** PILLOW-OEE-001 — Operational Elasticity Engine paths (X3-11). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_OPERATIONAL_ELASTICITY_ENGINE_SYSTEM.md" as const;
export const OPERATIONAL_ELASTICITY_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const OEE_METADATA_VERSION = "OEE-001-v1" as const;
export const OPERATIONAL_ELASTICITY_ENGINE_ID = "operational-elasticity-engine" as const;

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

export const ELASTICITY_OPERATIONS = [
  "demand",
  "utilization",
  "scale_up",
  "scale_down",
  "workload_balance",
  "resource_optimization",
  "overcapacity",
  "undercapacity",
] as const;

export const OEE_CAPABILITIES = [
  "operational_demand_monitoring",
  "operational_utilization_monitoring",
  "capacity_scale_up",
  "capacity_scale_down",
  "dynamic_workload_balancing",
  "resource_utilization_optimization",
  "overcapacity_detection",
  "undercapacity_detection",
  "elasticity_recommendations",
  "elasticity_records",
  "elasticity_validation",
  "elasticity_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
