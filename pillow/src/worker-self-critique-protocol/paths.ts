/** PILLOW-WSCP-001 — Worker Self-Critique Protocol (Q0-28). */
export const WORKER_SELF_CRITIQUE_PROTOCOL_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_SELF_CRITIQUE_PROTOCOL_SYSTEM.md" as const;
export const WORKER_SELF_CRITIQUE_PROTOCOL_ID = "worker-self-critique-protocol" as const;
export const WSCP_METADATA_VERSION = "WSCP-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "critiquing",
  "deciding",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Self-critique checklist items (Q0-28).
 * Architecture allows additional checks via configuration without redesign.
 */
export const CRITIQUE_CHECKS = [
  "completeness",
  "correctness",
  "evidence",
  "internal_consistency",
  "assumptions",
  "risks",
  "missing_information",
  "quality",
  "executive_readiness",
] as const;

export const SUBMISSION_DECISIONS = [
  "submit",
  "revise_before_submit",
  "escalate",
  "reject_output",
] as const;

export const WSCP_CAPABILITIES = [
  "review_completed_output",
  "check_completeness",
  "check_logical_consistency",
  "check_factual_consistency",
  "identify_assumptions",
  "identify_weaknesses",
  "identify_possible_improvements",
  "detect_missing_evidence",
  "recalculate_confidence_score",
  "decide_revision_required",
  "produce_self_critique_records",
  "machine_readable_self_critique_output",
  "extensible_critique_checks",
  "preserve_auditability",
  "preserve_traceability",
  "worker_self_critique_protocol_validation",
  "health_monitoring",
  "recovery_management",
] as const;
