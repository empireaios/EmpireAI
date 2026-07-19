/** PILLOW-SCE-001 — SMS Communication Engine paths (R4-05). */

export const SMS_COMMUNICATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SMS_COMMUNICATION_ENGINE_SYSTEM.md";

export const SCE_METADATA_VERSION = "SCE-001-v1" as const;

export const SMS_COMMUNICATION_ENGINE_ID = "sms-communication-engine" as const;

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

export const SMS_CATEGORIES = ["transactional", "notification", "verification"] as const;

export const DELIVERY_STATUSES = [
  "queued",
  "sending",
  "delivered",
  "failed",
  "bounced",
  "confirmed",
] as const;

export const SCE_CAPABILITIES = [
  "transactional_sms",
  "notification_sms",
  "verification_sms",
  "template_management",
  "queue_management",
  "delivery_tracking",
  "delivery_confirmation",
  "sms_retry",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
