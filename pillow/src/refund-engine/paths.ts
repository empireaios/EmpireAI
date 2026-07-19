/** PILLOW-RF-001 — Refund Engine paths (R3-10). */

export const REFUND_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REFUND_ENGINE_SYSTEM.md";

export const RF_METADATA_VERSION = "RF-001-v1" as const;

export const REFUND_ENGINE_ID = "refund-engine" as const;

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

export const REFUND_STATUSES = [
  "pending",
  "validated",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export const RF_CAPABILITIES = [
  "refund_request_creation",
  "refund_eligibility_validation",
  "full_refund_processing",
  "partial_refund_processing",
  "refund_transaction_recording",
  "financial_record_updates",
  "invoice_status_updates",
  "refund_lifecycle_tracking",
  "anomaly_detection",
  "refund_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
