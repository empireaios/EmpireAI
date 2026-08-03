/** PILLOW-GSP-001 — Global Scaling Planner paths (X3-14). */



export const SYSTEM_PATH =

  "docs/governance/EMPIREAI_GLOBAL_SCALING_PLANNER_SYSTEM.md" as const;

export const GLOBAL_SCALING_PLANNER_SYSTEM_PATH = SYSTEM_PATH;



export const GSP_METADATA_VERSION = "GSP-001-v1" as const;

export const GLOBAL_SCALING_PLANNER_ID = "global-scaling-planner" as const;



export const ENGINE_STATUSES = [

  "idle",

  "connecting",

  "active",

  "evaluating",

  "identifying",

  "ranking",

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



export const SCALING_OPERATIONS = [

  "international_expansion_readiness",

  "target_region_identification",

  "target_country_identification",

  "regional_demand_evaluation",

  "regional_operational_readiness",

  "supplier_readiness_by_region",

  "financial_readiness_for_expansion",

  "opportunity_ranking",

] as const;



export const EXPANSION_PRIORITIES = ["low", "medium", "high", "critical"] as const;



export const GSP_CAPABILITIES = [

  "international_expansion_readiness",

  "target_region_identification",

  "target_country_identification",

  "regional_demand_evaluation",

  "regional_operational_readiness",

  "supplier_readiness_by_region",

  "financial_readiness_for_expansion",

  "opportunity_ranking",

  "global_expansion_recommendations",

  "global_scaling_records",

  "global_scaling_validation",

  "global_scaling_metadata_generation",

  "health_monitoring",

  "recovery",

] as const;



export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;


