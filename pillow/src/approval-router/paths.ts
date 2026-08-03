/** PILLOW-AR-001 — Approval Router (Q0-06). */
export const APPROVAL_ROUTER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_APPROVAL_ROUTER_SYSTEM.md" as const;
export const APPROVAL_ROUTER_ID = "approval-router" as const;
export const AR_METADATA_VERSION = "AR-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
  "routing",
  "tracking",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Approval levels (Q0-06). */
export const APPROVAL_LEVELS = [
  "autonomous",
  "pillow_approval",
  "grand_king_approval",
  "multi_stage_approval",
] as const;

/** Approval workflow states (Q0-06). */
export const APPROVAL_STATES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "expired",
  "escalated",
] as const;

export const AR_CAPABILITIES = [
  "receive_execution_request",
  "evaluate_approval_requirement",
  "configurable_approval_policies",
  "classify_approval_level",
  "generate_approval_request",
  "route_to_pending_queue",
  "prevent_unauthorized_execution",
  "track_approval_status",
  "preserve_approval_history",
  "preserve_auditability",
  "machine_readable_approval_records",
  "execution_gate_check",
  "health_monitoring",
  "recovery_management",
] as const;
