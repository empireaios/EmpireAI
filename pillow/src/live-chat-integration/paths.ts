/** PILLOW-LCI-001 — Live Chat Integration paths (R4-07). */

export const LIVE_CHAT_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LIVE_CHAT_INTEGRATION_SYSTEM.md";

export const LCI_METADATA_VERSION = "LCI-001-v1" as const;

export const LIVE_CHAT_INTEGRATION_ID = "live-chat-integration" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const ENGINE_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const CHAT_STATUSES = [
  "waiting",
  "active",
  "assigned",
  "resolved",
  "closed",
  "failed",
] as const;

export const MESSAGE_SENDERS = ["customer", "agent", "system"] as const;

export const LCI_CAPABILITIES = [
  "session_creation",
  "customer_messages",
  "support_responses",
  "conversation_management",
  "queue_management",
  "session_assignment",
  "status_tracking",
  "response_time_tracking",
  "timeline_linking",
  "profile_linking",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
