/** PILLOW-ESF-001 — Escalation Framework (Q0-22). */
export const ESCALATION_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ESCALATION_FRAMEWORK_SYSTEM.md" as const;
export const ESCALATION_FRAMEWORK_ID = "escalation-framework" as const;
export const ESF_METADATA_VERSION = "ESF-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "detecting",
  "routing",
  "tracking",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default escalation categories (Q0-22).
 * Architecture allows additional categories via configuration without redesign.
 */
export const ESCALATION_CATEGORIES = [
  "low_confidence",
  "missing_information",
  "conflicting_recommendations",
  "policy_violation",
  "authority_limit",
  "worker_deadlock",
  "technical_failure",
  "business_risk",
  "security_risk",
  "executive_decision_required",
] as const;

export const ESCALATION_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export const ESCALATION_STATUSES = [
  "open",
  "routed_to_pillow",
  "acknowledged",
  "resolved",
  "cancelled",
] as const;

export const ESF_CAPABILITIES = [
  "detect_unresolved_disagreements",
  "detect_insufficient_confidence",
  "detect_missing_information",
  "detect_conflicting_evidence",
  "detect_authority_violations",
  "detect_policy_violations",
  "detect_execution_deadlocks",
  "detect_repeated_failures",
  "generate_escalation_requests",
  "route_escalations_to_pillow",
  "produce_escalation_records",
  "machine_readable_escalation_output",
  "extensible_escalation_categories",
  "preserve_auditability",
  "preserve_traceability",
  "escalation_framework_validation",
  "health_monitoring",
  "recovery_management",
] as const;
