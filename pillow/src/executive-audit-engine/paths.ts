/** PILLOW-EXA-001 — Executive Audit Engine (Q0-08). */
export const EXECUTIVE_AUDIT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_AUDIT_ENGINE_SYSTEM.md" as const;
export const EXECUTIVE_AUDIT_ENGINE_ID = "executive-audit-engine" as const;
export const EXA_METADATA_VERSION = "EXA-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "inspecting",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default audit types (Q0-08).
 * Architecture allows additional types via configuration without redesign.
 */
export const AUDIT_TYPES = [
  "executive_audit",
  "workforce_audit",
  "business_audit",
  "mission_audit",
  "decision_audit",
  "memory_audit",
  "approval_audit",
  "governance_audit",
  "runtime_audit",
] as const;

export const AUDIT_TYPE_LABELS: Record<(typeof AUDIT_TYPES)[number], string> = {
  executive_audit: "Executive Audit",
  workforce_audit: "Workforce Audit",
  business_audit: "Business Audit",
  mission_audit: "Mission Audit",
  decision_audit: "Decision Audit",
  memory_audit: "Memory Audit",
  approval_audit: "Approval Audit",
  governance_audit: "Governance Audit",
  runtime_audit: "Runtime Audit",
};

export const AUDIT_STATUSES = ["passed", "failed", "warning", "inconclusive"] as const;

export const SEVERITY_LEVELS = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

export const SEVERITY_RANK: Record<(typeof SEVERITY_LEVELS)[number], number> = {
  critical: 100,
  high: 80,
  medium: 60,
  low: 40,
  informational: 20,
};

export const EXA_CAPABILITIES = [
  "audit_executive_decisions",
  "audit_mission_outputs",
  "audit_workforce_activities",
  "audit_governance_compliance",
  "audit_approval_compliance",
  "audit_business_state_consistency",
  "audit_execution_memory_integrity",
  "audit_decision_engine_recommendations",
  "audit_recommendation_quality",
  "detect_governance_violations",
  "produce_audit_reports",
  "recommend_corrective_actions",
  "machine_readable_audit_output",
  "extensible_audit_types",
  "preserve_auditability",
  "preserve_traceability",
  "audit_validation",
  "health_monitoring",
  "recovery_management",
] as const;
