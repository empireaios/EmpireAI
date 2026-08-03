/** PILLOW-CPE-001 — Capacity Planning Engine paths (X3-04). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_CAPACITY_PLANNING_ENGINE_SYSTEM.md" as const;
export const CAPACITY_PLANNING_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const CPE_METADATA_VERSION = "CPE-001-v1" as const;
export const CAPACITY_PLANNING_ENGINE_ID = "capacity-planning-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "forecasting",
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

export const CPE_CAPABILITIES = [
  "operational_capacity_monitoring",
  "infrastructure_capacity_monitoring",
  "supplier_capacity_monitoring",
  "fulfilment_capacity_monitoring",
  "inventory_capacity_monitoring",
  "workforce_capacity_monitoring",
  "capacity_requirement_forecasting",
  "capacity_bottleneck_detection",
  "capacity_expansion_recommendations",
  "capacity_planning_records",
  "capacity_validation",
  "capacity_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const CAPACITY_DOMAINS = [
  "operational",
  "infrastructure",
  "supplier",
  "fulfilment",
  "inventory",
  "workforce",
] as const;
