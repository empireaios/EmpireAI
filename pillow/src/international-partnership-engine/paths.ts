/** PILLOW-IPE-001 — International Partnership Engine paths (X4-12). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM.md" as const;
export const INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const IPE_METADATA_VERSION = "IPE-001-v1" as const;
export const INTERNATIONAL_PARTNERSHIP_ENGINE_ID = "international-partnership-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "evaluating",
  "analyzing",
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

export const PARTNERSHIP_CATEGORIES = [
  "strategic_partnership",
  "regional_partner_network",
  "prospective_partner",
  "partner_performance",
  "partner_reliability",
  "partnership_value",
  "partnership_risk",
  "partnership_opportunity",
] as const;

export const APPROVAL_STATUSES = [
  "under_review",
  "partial",
  "rejected",
  "approved_validated",
  "unknown",
] as const;

export const RISK_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const IPE_CAPABILITIES = [
  "strategic_partnership_management",
  "regional_partner_networks",
  "prospective_partner_evaluation",
  "partner_performance_monitoring",
  "partner_reliability_monitoring",
  "partnership_value_monitoring",
  "partnership_risk_detection",
  "partnership_opportunity_detection",
  "partnership_recommendations",
  "partnership_records",
  "partnership_validation",
  "partnership_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
