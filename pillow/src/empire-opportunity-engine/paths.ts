/** PILLOW-EOP-001 — Empire Opportunity Engine (X5-06). */
export const EMPIRE_OPPORTUNITY_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_OPPORTUNITY_ENGINE_SYSTEM.md" as const;
export const EMPIRE_OPPORTUNITY_ENGINE_ID = "empire-opportunity-engine" as const;
export const EOP_METADATA_VERSION = "EOP-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "monitoring", "evaluating", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const EOP_CAPABILITIES = [
  "business_opportunity_discovery", "emerging_industry_monitoring", "market_shift_monitoring",
  "customer_demand_monitoring", "technological_development_monitoring", "competitive_landscape_monitoring",
  "profitable_opportunity_detection", "opportunity_potential_ranking", "strategic_opportunity_recommendations",
  "opportunity_outcome_tracking", "opportunity_metadata_generation", "opportunity_validation", "health_monitoring", "recovery",
] as const;
