/** PILLOW-PWO-001 — Pillow Workforce Orchestrator (Q0-09). */
export const WORKFORCE_ORCHESTRATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFORCE_ORCHESTRATOR_SYSTEM.md" as const;
export const WORKFORCE_ORCHESTRATOR_ID = "workforce-orchestrator" as const;
export const PWO_METADATA_VERSION = "PWO-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering",
  "selecting",
  "coordinating",
  "monitoring",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default worker states (Q0-09).
 * Architecture allows additional states via configuration without redesign.
 */
export const WORKER_STATES = [
  "available",
  "busy",
  "waiting",
  "blocked",
  "escalated",
  "failed",
  "completed",
  "offline",
] as const;

export const COMPLETION_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "partial",
  "failed",
  "escalated",
  "timed_out",
] as const;

export const COORDINATION_MODES = [
  "single",
  "multi",
  "sequential",
  "parallel",
  "handoff",
  "dependency",
  "recovery",
  "escalation",
] as const;

export const WORKER_CATEGORIES = [
  "strategy",
  "product",
  "engineering",
  "operations",
  "finance",
  "compliance",
  "legal",
  "marketing",
  "sales",
  "customer_success",
  "data_intelligence",
  "security",
  "talent",
  "executive_governance",
] as const;

export const PWO_CAPABILITIES = [
  "receive_executive_intent",
  "discover_available_workers",
  "select_suitable_workers",
  "build_workforce_execution_groups",
  "coordinate_multi_worker_execution",
  "track_worker_status",
  "detect_worker_failures",
  "handle_worker_timeouts",
  "handle_worker_escalation",
  "return_execution_status",
  "single_worker_missions",
  "multi_worker_missions",
  "sequential_execution",
  "parallel_execution",
  "worker_handoffs",
  "worker_dependencies",
  "worker_recovery",
  "produce_orchestration_records",
  "machine_readable_orchestration_output",
  "extensible_worker_states",
  "preserve_auditability",
  "preserve_traceability",
  "orchestration_validation",
  "health_monitoring",
  "recovery_management",
] as const;
