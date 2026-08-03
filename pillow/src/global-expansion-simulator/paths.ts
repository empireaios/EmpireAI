/** PILLOW-GES-001 — Global Expansion Simulator paths (X4-17). */
export const GLOBAL_EXPANSION_SIMULATOR_SYSTEM_PATH = "docs/governance/EMPIREAI_GLOBAL_EXPANSION_SIMULATOR_SYSTEM.md" as const;
export const GLOBAL_EXPANSION_SIMULATOR_ID = "global-expansion-simulator" as const;
export const GES_METADATA_VERSION = "GES-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "simulating", "comparing", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const GES_CAPABILITIES = [
  "country_expansion_simulation", "regional_expansion_simulation", "operational_readiness_simulation",
  "logistics_performance_simulation", "regulatory_impact_simulation", "financial_outcomes_simulation",
  "market_demand_simulation", "business_risk_simulation", "scenario_comparison", "outcome_ranking",
  "expansion_recommendations", "simulation_validation", "simulation_metadata_generation", "health_monitoring", "recovery",
] as const;
