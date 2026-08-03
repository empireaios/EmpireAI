/** PILLOW-GTI-001 — Global Tax Intelligence paths (X4-07). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_GLOBAL_TAX_INTELLIGENCE_SYSTEM.md" as const;
export const GLOBAL_TAX_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const GTI_METADATA_VERSION = "GTI-001-v1" as const;
export const GLOBAL_TAX_INTELLIGENCE_ID = "global-tax-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "calculating",
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

export const TAX_CATEGORIES = [
  "country_specific",
  "regulatory_update",
  "indirect",
  "direct",
  "cross_border",
  "obligation_estimate",
  "compliance_risk",
  "optimization",
] as const;

export const COMPLIANCE_STATUSES = [
  "under_review",
  "partial",
  "gap",
  "aligned",
  "unknown",
] as const;

export const RISK_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const GTI_CAPABILITIES = [
  "country_specific_tax_rules",
  "tax_regulation_update_monitoring",
  "indirect_tax_management",
  "direct_tax_management",
  "cross_border_tax_requirements",
  "tax_obligation_estimation",
  "tax_compliance_risk_detection",
  "tax_optimization_opportunity_detection",
  "tax_recommendations",
  "tax_intelligence_records",
  "tax_validation",
  "tax_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
