/** PILLOW-CEG-001 — Cross-Empire Governance Engine (X5-11). */
export const CROSS_EMPIRE_GOVERNANCE_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_CROSS_EMPIRE_GOVERNANCE_ENGINE_SYSTEM.md" as const;
export const CROSS_EMPIRE_GOVERNANCE_ENGINE_ID = "cross-empire-governance-engine" as const;
export const CEG_METADATA_VERSION = "CEG-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "managing_policies", "managing_rules", "validating", "monitoring", "detecting", "analyzing", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const COMPLIANCE_STATUSES = ["compliant", "partial", "non_compliant", "unknown"] as const;
export const RISK_LEVELS = ["low", "moderate", "elevated", "critical"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const CEG_CAPABILITIES = [
  "enterprise_governance_policy_management",
  "constitutional_rule_management",
  "governance_compliance_validation",
  "governance_consistency_monitoring",
  "governance_violation_detection",
  "policy_conflict_detection",
  "governance_risk_evaluation",
  "governance_recommendation_generation",
  "governance_metadata_generation",
  "governance_validation",
  "health_monitoring",
  "recovery_management",
] as const;
