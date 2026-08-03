/** PILLOW-GBM-001 — Global Brand Management paths (X4-11). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_GLOBAL_BRAND_MANAGEMENT_SYSTEM.md" as const;
export const GLOBAL_BRAND_MANAGEMENT_SYSTEM_PATH = SYSTEM_PATH;

export const GBM_METADATA_VERSION = "GBM-001-v1" as const;
export const GLOBAL_BRAND_MANAGEMENT_ID = "global-brand-management" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
  "governing",
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

export const BRAND_CATEGORIES = [
  "worldwide_identity",
  "regional_adaptation",
  "brand_consistency",
  "brand_performance",
  "brand_reputation",
  "brand_compliance",
  "brand_inconsistency",
  "reputation_risk",
] as const;

export const COMPLIANCE_STATUSES = [
  "under_review",
  "partial",
  "gap",
  "aligned",
  "unknown",
] as const;

export const RISK_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const GBM_CAPABILITIES = [
  "worldwide_brand_identity",
  "regional_brand_adaptations",
  "brand_consistency_management",
  "brand_performance_monitoring",
  "brand_reputation_monitoring",
  "brand_compliance_monitoring",
  "brand_inconsistency_detection",
  "brand_reputation_risk_detection",
  "brand_governance_recommendations",
  "brand_governance_records",
  "brand_validation",
  "brand_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
