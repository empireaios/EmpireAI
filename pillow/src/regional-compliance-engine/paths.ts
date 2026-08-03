/** PILLOW-RCE-001 — Regional Compliance Engine paths (X4-06). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_REGIONAL_COMPLIANCE_ENGINE_SYSTEM.md" as const;
export const REGIONAL_COMPLIANCE_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const RCE_METADATA_VERSION = "RCE-001-v1" as const;
export const REGIONAL_COMPLIANCE_ENGINE_ID = "regional-compliance-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "assessing",
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

export const REGULATION_CATEGORIES = [
  "country_specific",
  "regulatory_change",
  "business_rules",
  "operational",
  "marketplace",
  "data_protection",
] as const;

export const COMPLIANCE_STATUSES = [
  "under_review",
  "partial",
  "gap",
  "aligned",
  "unknown",
] as const;

export const RISK_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const RCE_CAPABILITIES = [
  "country_compliance_requirements",
  "regulatory_change_monitoring",
  "regional_business_rules",
  "operational_compliance",
  "marketplace_compliance",
  "data_protection_requirements",
  "compliance_violation_detection",
  "compliance_risk_assessment",
  "compliance_recommendations",
  "compliance_records",
  "compliance_validation",
  "compliance_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
