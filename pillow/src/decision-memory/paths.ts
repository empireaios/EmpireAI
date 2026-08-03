/** PILLOW-DMEM-001 — Decision Memory (Q0-16). */
export const DECISION_MEMORY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DECISION_MEMORY_SYSTEM.md" as const;
export const DECISION_MEMORY_ID = "decision-memory" as const;
export const DMEM_METADATA_VERSION = "DMEM-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "recording",
  "retrieving",
  "searching",
  "comparing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "not_required",
  "escalated",
] as const;

export const FINAL_OUTCOMES = [
  "pending",
  "success",
  "partial_success",
  "failure",
  "reversed",
  "superseded",
] as const;

/**
 * Default lookup dimensions (Q0-16).
 * Architecture allows additional dimensions via configuration without redesign.
 */
export const LOOKUP_DIMENSIONS = [
  "decision_id",
  "business",
  "mission",
  "worker",
  "outcome",
  "confidence",
  "date",
  "approval_status",
] as const;

export const DMEM_CAPABILITIES = [
  "record_executive_decisions",
  "record_decision_rationale",
  "record_supporting_evidence",
  "record_assumptions",
  "record_alternative_options",
  "record_confidence_scores",
  "record_approvals",
  "record_execution_outcomes",
  "link_decisions_to_businesses_missions_workers",
  "historical_decision_retrieval",
  "search_decisions",
  "compare_previous_decisions",
  "produce_decision_records",
  "machine_readable_decision_output",
  "extensible_lookup_dimensions",
  "preserve_auditability",
  "preserve_traceability",
  "decision_memory_validation",
  "health_monitoring",
  "recovery_management",
] as const;
