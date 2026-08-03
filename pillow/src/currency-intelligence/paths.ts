/** PILLOW-CUR-001 — Currency Intelligence paths (X4-05). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_CURRENCY_INTELLIGENCE_SYSTEM.md" as const;
export const CURRENCY_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const CUR_METADATA_VERSION = "CUR-001-v1" as const;
export const CURRENCY_INTELLIGENCE_ID = "currency-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "managing",
  "converting",
  "pricing",
  "analyzing",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const REGIONAL_PRICING_STATUSES = [
  "enabled",
  "disabled",
  "partial",
  "anomaly",
] as const;

export const EXCHANGE_RATE_SOURCES = [
  "structural_baseline",
  "cached_structural",
  "manual_validated",
  "unavailable",
] as const;

export const CUR_CAPABILITIES = [
  "supported_currency_management",
  "customer_currency_preference_detection",
  "price_conversion",
  "exchange_rate_management",
  "exchange_rate_fluctuation_monitoring",
  "regional_pricing_support",
  "currency_anomaly_detection",
  "currency_recommendations",
  "currency_intelligence_records",
  "currency_validation",
  "currency_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const DEFAULT_SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "SGD",
  "CHF",
  "CNY",
  "INR",
] as const;
