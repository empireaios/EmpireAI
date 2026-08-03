/** PILLOW-ECA-001 — Empire Capital Allocation (X5-05). */
export const EMPIRE_CAPITAL_ALLOCATION_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_CAPITAL_ALLOCATION_SYSTEM.md" as const;
export const EMPIRE_CAPITAL_ALLOCATION_ID = "empire-capital-allocation" as const;
export const ECA_METADATA_VERSION = "ECA-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "monitoring", "evaluating", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const ECA_CAPABILITIES = [
  "enterprise_capital_monitoring", "capital_utilization_monitoring", "investment_evaluation",
  "roi_analysis", "capital_priority_ranking", "underperforming_investment_detection",
  "capital_shortage_detection", "capital_reallocation_recommendations", "allocation_outcome_tracking",
  "capital_metadata_generation", "capital_validation", "health_monitoring", "recovery",
] as const;
