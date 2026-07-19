/** PILLOW-WAI-001 — WhatsApp Integration paths (R4-06). */

export const WHATSAPP_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WHATSAPP_INTEGRATION_SYSTEM.md";

export const WAI_METADATA_VERSION = "WAI-001-v1" as const;

export const WHATSAPP_INTEGRATION_ID = "whatsapp-integration" as const;

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

export const MESSAGE_CATEGORIES = ["transactional", "notification", "template", "inbound"] as const;

export const DELIVERY_STATUSES = [
  "queued",
  "sending",
  "delivered",
  "failed",
  "bounced",
] as const;

export const READ_STATUSES = ["unread", "delivered", "read"] as const;

export const CONVERSATION_STATUSES = ["active", "closed"] as const;

export const WAI_CAPABILITIES = [
  "transactional_whatsapp",
  "notification_whatsapp",
  "template_whatsapp",
  "inbound_messages",
  "conversation_management",
  "template_management",
  "delivery_tracking",
  "read_receipt_tracking",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
