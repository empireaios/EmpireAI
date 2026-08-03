/** PILLOW-POE-001 — Portfolio Optimization Engine paths (X2-16). */

export const PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM.md";

export const POE_METADATA_VERSION = "POE-001-v1" as const;

export const PORTFOLIO_OPTIMIZATION_ENGINE_ID = "portfolio-optimization-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "analyzing",
  "optimizing",
  "recommending",
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

export const POE_CAPABILITIES = [
  "enterprise_performance_optimization",
  "capital_allocation_optimization",
  "resource_utilization_optimization",
  "company_priority_optimization",
  "operational_efficiency_optimization",
  "portfolio_balance_optimization",
  "optimization_opportunity_detection",
  "optimization_priority_ranking",
  "optimization_recommendations",
  "optimization_validation",
  "optimization_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const OPTIMIZATION_CATEGORIES = [
  "performance",
  "capital",
  "resource",
  "priority",
  "operational_efficiency",
  "portfolio_balance",
] as const;

export const OPTIMIZATION_PRIORITIES = ["low", "medium", "high", "critical"] as const;
