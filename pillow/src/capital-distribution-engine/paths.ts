/** PILLOW-CDE-001 — Capital Distribution Engine paths (X2-05). */

export const CAPITAL_DISTRIBUTION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CAPITAL_DISTRIBUTION_ENGINE_SYSTEM.md";

export const CDE_METADATA_VERSION = "CDE-001-v1" as const;

export const CAPITAL_DISTRIBUTION_ENGINE_ID = "capital-distribution-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "evaluating",
  "allocating",
  "analyzing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const ALLOCATION_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export const CDE_CAPABILITIES = [
  "enterprise_capital_pool_management",
  "funding_requirement_evaluation",
  "investment_opportunity_evaluation",
  "capital_allocation_priority_ranking",
  "expected_roi_calculation",
  "capital_efficiency_calculation",
  "capital_shortage_detection",
  "capital_concentration_risk_detection",
  "capital_allocation_recommendations",
  "capital_validation",
  "capital_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
