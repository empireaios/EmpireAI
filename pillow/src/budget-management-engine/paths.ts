/** PILLOW-BMG-001 — Budget Management Engine paths (R3-14). */

export const BUDGET_MANAGEMENT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUDGET_MANAGEMENT_ENGINE_SYSTEM.md";

export const BMG_METADATA_VERSION = "BMG-001-v1" as const;

export const BUDGET_MANAGEMENT_ENGINE_ID = "budget-management-engine" as const;

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

export const BUDGET_PERIODS = ["monthly", "quarterly", "annual"] as const;

export const BUDGET_CATEGORIES = [
  "operations",
  "marketing",
  "payroll",
  "supplies",
  "overhead",
  "other",
] as const;

export const BUDGET_STATUSES = ["draft", "active", "exceeded", "closed"] as const;

export const BMG_CAPABILITIES = [
  "budget_creation",
  "budget_category_management",
  "budget_period_management",
  "budget_allocation",
  "budget_utilization_tracking",
  "actual_vs_budget_comparison",
  "overrun_detection",
  "variance_detection",
  "budget_recommendations",
  "budget_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
