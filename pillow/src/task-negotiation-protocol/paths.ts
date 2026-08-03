/** PILLOW-TNP-001 — Task Negotiation Protocol (Q0-20). */
export const TASK_NEGOTIATION_PROTOCOL_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TASK_NEGOTIATION_PROTOCOL_SYSTEM.md" as const;
export const TASK_NEGOTIATION_PROTOCOL_ID = "task-negotiation-protocol" as const;
export const TNP_METADATA_VERSION = "TNP-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "negotiating",
  "resolving",
  "escalating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default negotiation outcomes (Q0-20).
 * Architecture allows additional outcomes via configuration without redesign.
 */
export const NEGOTIATION_OUTCOMES = [
  "accepted",
  "declined",
  "shared_ownership",
  "delegated",
  "escalated",
  "waiting_dependency",
  "cancelled",
] as const;

export const ESCALATION_STATUSES = [
  "not_required",
  "pending",
  "escalated_to_pillow",
  "resolved_by_pillow",
] as const;

export const TNP_CAPABILITIES = [
  "receive_task_from_workforce_orchestrator",
  "identify_candidate_workers",
  "declare_worker_capability",
  "allow_workers_to_decline",
  "resolve_ownership",
  "identify_supporting_workers",
  "build_dependency_chains",
  "coordinate_task_handoffs",
  "detect_negotiation_conflicts",
  "escalate_unresolved_to_pillow",
  "produce_negotiation_records",
  "machine_readable_negotiation_output",
  "extensible_negotiation_outcomes",
  "preserve_auditability",
  "preserve_traceability",
  "task_negotiation_protocol_validation",
  "health_monitoring",
  "recovery_management",
] as const;
