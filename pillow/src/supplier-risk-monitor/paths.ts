/** PILLOW-SRM-001 — Supplier Risk Monitor paths (R2-16). */

export const SUPPLIER_RISK_MONITOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_RISK_MONITOR_SYSTEM.md";

export const SRM_METADATA_VERSION = "SRM-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = ["cj-dropshipping", "aliexpress", "1688"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "monitoring",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const AVAILABILITY_STATUSES = ["available", "limited", "unavailable", "disrupted"] as const;

export const STABILITY_STATUSES = ["stable", "volatile", "critical"] as const;

export const FULFILMENT_RELIABILITY_STATUSES = ["high", "moderate", "low", "failed"] as const;

export const RISK_ALERT_TYPES = [
  "disruption",
  "inventory_instability",
  "pricing_volatility",
  "fulfilment_failure",
  "communication_degraded",
  "abnormal_behaviour",
] as const;
