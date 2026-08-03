/** PILLOW-PRR-001 — Peer Review Runtime (Q0-21). */
export const PEER_REVIEW_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PEER_REVIEW_RUNTIME_SYSTEM.md" as const;
export const PEER_REVIEW_RUNTIME_ID = "peer-review-runtime" as const;
export const PRR_METADATA_VERSION = "PRR-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "selecting",
  "reviewing",
  "comparing",
  "escalating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default review outcomes (Q0-21).
 * Architecture allows additional outcomes via configuration without redesign.
 */
export const REVIEW_OUTCOMES = [
  "approved",
  "approved_with_notes",
  "revision_required",
  "rejected",
  "escalated",
] as const;

export const ESCALATION_STATUSES = [
  "not_required",
  "pending",
  "escalated_to_pillow",
  "resolved_by_pillow",
] as const;

export const IMPACT_LEVELS = ["low", "medium", "high", "critical"] as const;

/**
 * Default review criteria (Q0-21).
 * Architecture allows additional criteria via configuration without redesign.
 */
export const REVIEW_CRITERIA = [
  "correctness",
  "completeness",
  "evidence",
  "logical_consistency",
  "compliance",
  "quality",
  "risk",
  "executive_readiness",
] as const;

export const PRR_CAPABILITIES = [
  "receive_completed_work",
  "determine_peer_review_required",
  "select_appropriate_reviewers",
  "deliver_work_to_reviewers",
  "collect_independent_reviews",
  "compare_review_results",
  "detect_disagreements",
  "request_revision",
  "escalate_unresolved_to_pillow",
  "produce_peer_review_records",
  "machine_readable_review_output",
  "extensible_review_outcomes",
  "extensible_review_criteria",
  "preserve_auditability",
  "preserve_traceability",
  "peer_review_runtime_validation",
  "health_monitoring",
  "recovery_management",
] as const;
