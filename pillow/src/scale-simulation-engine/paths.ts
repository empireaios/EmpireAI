/** PILLOW-SSI-001 — Scale Simulation Engine paths (X3-18). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_SCALE_SIMULATION_ENGINE_SYSTEM.md" as const;
export const SCALE_SIMULATION_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const SSI_METADATA_VERSION = "SSI-001-v1" as const;
export const SCALE_SIMULATION_ENGINE_ID = "scale-simulation-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
  "simulating",
  "comparing",
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

export const SIMULATION_OPERATIONS = [
  "scaling_scenario_simulation",
  "revenue_outcome_simulation",
  "profit_outcome_simulation",
  "operational_capacity_simulation",
  "supplier_capacity_simulation",
  "workforce_utilization_simulation",
  "financial_impact_simulation",
  "scaling_risk_simulation",
  "multi_scenario_comparison",
  "simulation_outcome_ranking",
] as const;

export const SIMULATION_SCENARIOS = [
  "baseline_scale",
  "aggressive_scale",
  "conservative_scale",
  "revenue_focus",
  "profit_focus",
  "capacity_constrained",
  "supplier_constrained",
  "workforce_constrained",
  "risk_averse",
  "balanced",
] as const;

export const SSI_CAPABILITIES = [
  "scaling_scenario_simulation",
  "revenue_outcome_simulation",
  "profit_outcome_simulation",
  "operational_capacity_simulation",
  "supplier_capacity_simulation",
  "workforce_utilization_simulation",
  "financial_impact_simulation",
  "scaling_risk_simulation",
  "multi_scenario_comparison",
  "simulation_outcome_ranking",
  "simulation_recommendations",
  "simulation_records",
  "simulation_validation",
  "simulation_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
