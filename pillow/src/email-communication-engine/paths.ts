/** PILLOW-ECE-001 — Email Communication Engine paths (R4-04). */

export const EMAIL_COMMUNICATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EMAIL_COMMUNICATION_ENGINE_SYSTEM.md";

export const ECE_METADATA_VERSION = "ECE-001-v1" as const;

export const EMAIL_COMMUNICATION_ENGINE_ID = "email-communication-engine" as const;

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

export const EMAIL_CATEGORIES = [
  "transactional",
  "marketing",
  "notification",
  "support",
] as const;

export const DELIVERY_STATUSES = [
  "queued",
  "sending",
  "delivered",
  "failed",
  "bounced",
] as const;

export const OPEN_STATUSES = ["not_opened", "opened"] as const;

export const CLICK_STATUSES = ["not_clicked", "clicked"] as const;

export const ECE_CAPABILITIES = [
  "transactional_email",
  "marketing_email",
  "notification_email",
  "support_email",
  "template_management",
  "queue_management",
  "delivery_tracking",
  "open_tracking",
  "click_tracking",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
