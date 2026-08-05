/** PILLOW-COMRT-001 — Communication Runtime (Q10-08). */
export const COMMUNICATION_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMMUNICATION_RUNTIME_SYSTEM.md" as const;
export const COMMUNICATION_RUNTIME_ID = "communication-runtime" as const;
export const COMRT_METADATA_VERSION = "COMRT-001-v1" as const;
export const COMRT_REPORT_VERSION = "COMRT-RPT-v1" as const;
export const COMRT_RUNTIME_VERSION = "Q10-COMRT-v1" as const;
export const COMRT_MISSION_ID = "Q10-08" as const;

export const COMMUNICATION_RUNTIME_IDENTITY = {
  workerId: "wkr-communication-runtime-01",
  workerName: "Communication Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-communication",
  role: "role-coordinator-communication-runtime",
  reportingLine: ["wkr-communication-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-message-routing",
    "skill-channel-management",
    "skill-sync-messaging",
    "skill-async-messaging",
    "skill-acknowledgement",
    "skill-retry-delivery",
    "skill-collaboration-session",
    "skill-communication-reporting",
    "skill-communication-traceability",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "queue_runtime",
    "memory_runtime",
    "api_runtime",
    "tool_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
    "worker_registry",
    "factory_registry",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const MESSAGE_TYPES = [
  "request",
  "response",
  "event",
  "broadcast",
  "multicast",
  "point_to_point",
  "collaboration",
  "acknowledgement",
  "dead_letter",
  "custom_extension",
] as const;

export const DELIVERY_STATUSES = [
  "pending",
  "routed",
  "delivered",
  "acknowledged",
  "failed",
  "retrying",
  "dead_lettered",
] as const;

export const CHANNEL_TYPES = [
  "worker_to_worker",
  "factory_to_factory",
  "runtime_service",
  "collaboration_session",
] as const;

export const PRIORITIES = ["critical", "high", "normal", "low", "bulk"] as const;

export const PRIORITY_RANK: Record<(typeof PRIORITIES)[number], number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  bulk: 4,
};

export const CHANNEL_STATUSES = ["active", "idle", "closed", "degraded"] as const;
export const SESSION_STATUSES = ["open", "idle", "closed"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "routing",
  "delivering",
  "acknowledging",
  "retrying",
  "collaborating",
  "reporting",
  "failed",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "unavailable"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const INTEGRATION_TARGETS = [
  "shared_runtime_core",
  "pillow_orchestration_runtime",
  "mission_runtime",
  "queue_runtime",
  "memory_runtime",
  "api_runtime",
  "tool_runtime",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_registry",
  "factory_registry",
  "worker_recovery_system",
  "recovery",
] as const;

export const COMRT_CAPABILITIES = [
  "open_communication_channels",
  "route_messages_deterministically",
  "synchronous_request_response",
  "asynchronous_delivery",
  "acknowledge_messages",
  "retry_failed_deliveries",
  "dead_letter_exhausted_retries",
  "propagate_context_references",
  "open_collaboration_sessions",
  "close_collaboration_sessions",
  "collect_communication_metrics",
  "monitor_runtime_health",
  "produce_communication_runtime_reports",
  "preserve_complete_traceability",
  "preserve_communication_history",
  "preserve_acknowledged_messages",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "integrate_api_runtime",
  "integrate_tool_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_registry",
  "integrate_factory_registry",
  "integrate_worker_recovery_system",
  "q1009_consumable_contract",
] as const;
