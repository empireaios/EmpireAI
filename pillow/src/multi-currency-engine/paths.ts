/** PILLOW-MC-001 — Multi-Currency Engine paths (R3-12). */

export const MULTI_CURRENCY_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MULTI_CURRENCY_ENGINE_SYSTEM.md";

export const MC_METADATA_VERSION = "MC-001-v1" as const;

export const MULTI_CURRENCY_ENGINE_ID = "multi-currency-engine" as const;

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

export const CONVERSION_STATUSES = [
  "pending",
  "completed",
  "failed",
  "reversed",
] as const;

export const MC_CAPABILITIES = [
  "supported_currency_management",
  "transaction_currency_recording",
  "currency_conversion",
  "exchange_rate_management",
  "historical_rate_tracking",
  "gain_loss_calculation",
  "reporting_currency_support",
  "anomaly_detection",
  "currency_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const SUPPORTED_CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
] as const;
