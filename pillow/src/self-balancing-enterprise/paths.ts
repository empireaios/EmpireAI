/** PILLOW-SBE-001 — Self-Balancing Enterprise paths (X3-19). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_SELF_BALANCING_ENTERPRISE_SYSTEM.md" as const;
export const SELF_BALANCING_ENTERPRISE_SYSTEM_PATH = SYSTEM_PATH;

export const SBE_METADATA_VERSION = "SBE-001-v1" as const;
export const SELF_BALANCING_ENTERPRISE_ID = "self-balancing-enterprise" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
  "monitoring",
  "reallocating",
  "optimizing",
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

export const BALANCE_OPERATIONS = [
  "enterprise_resource_utilization_monitoring",
  "operational_balance_monitoring",
  "financial_balance_monitoring",
  "workforce_balance_monitoring",
  "supplier_balance_monitoring",
  "infrastructure_balance_monitoring",
  "resource_imbalance_detection",
  "policy_gated_resource_reallocation",
  "enterprise_equilibrium_optimization",
] as const;

export const RESOURCE_CATEGORIES = [
  "operational",
  "financial",
  "workforce",
  "supplier",
  "infrastructure",
] as const;

export const SBE_CAPABILITIES = [
  "enterprise_resource_utilization_monitoring",
  "operational_balance_monitoring",
  "financial_balance_monitoring",
  "workforce_balance_monitoring",
  "supplier_balance_monitoring",
  "infrastructure_balance_monitoring",
  "resource_imbalance_detection",
  "policy_gated_resource_reallocation",
  "enterprise_equilibrium_optimization",
  "balancing_records",
  "balance_validation",
  "balance_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
