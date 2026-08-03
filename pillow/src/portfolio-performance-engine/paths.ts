/** PILLOW-PPE-001 — Portfolio Performance Engine paths (X2-03). */

export const PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM.md";

export const PPE_METADATA_VERSION = "PPE-001-v1" as const;

export const PORTFOLIO_PERFORMANCE_ENGINE_ID = "portfolio-performance-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "measuring",
  "comparing",
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

export const PPE_CAPABILITIES = [
  "company_performance_measurement",
  "company_performance_comparison",
  "revenue_performance_tracking",
  "profitability_tracking",
  "operational_efficiency_tracking",
  "customer_performance_tracking",
  "growth_performance_tracking",
  "portfolio_kpi_calculation",
  "performance_recommendations",
  "performance_validation",
  "performance_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
