/** PILLOW-IWM-001 — Inter-Worker Messaging (Q0-24). */
export const INTER_WORKER_MESSAGING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_INTER_WORKER_MESSAGING_SYSTEM.md" as const;
export const INTER_WORKER_MESSAGING_ID = "inter-worker-messaging" as const;
export const IWM_METADATA_VERSION = "IWM-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "sending",
  "receiving",
  "routing",
  "tracking",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default message types (Q0-24).
 * Architecture allows additional types via configuration without redesign.
 */
export const MESSAGE_TYPES = [
  "task_request",
  "task_response",
  "information",
  "review_request",
  "review_response",
  "approval_request",
  "approval_response",
  "escalation",
  "broadcast",
  "system_notification",
] as const;

export const MESSAGE_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export const DELIVERY_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "read",
  "acknowledged",
  "failed",
  "expired",
] as const;

export const IWM_CAPABILITIES = [
  "send_messages_between_workers",
  "receive_messages",
  "route_messages",
  "attach_mission_context",
  "attach_business_context",
  "support_request_response_messaging",
  "support_broadcast_messaging",
  "support_priority_messaging",
  "track_message_delivery",
  "preserve_communication_history",
  "produce_message_records",
  "machine_readable_message_output",
  "extensible_message_types",
  "searchable_communication_history",
  "preserve_auditability",
  "preserve_traceability",
  "inter_worker_messaging_validation",
  "health_monitoring",
  "recovery_management",
] as const;
