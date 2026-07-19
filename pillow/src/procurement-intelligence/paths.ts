/** PILLOW-PI-001 — Procurement Intelligence paths (R2-19). */

export const PROCUREMENT_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PROCUREMENT_INTELLIGENCE_SYSTEM.md";

export const PI_METADATA_VERSION = "PI-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = ["cj-dropshipping", "aliexpress", "1688"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "analyzing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const PURCHASE_TIMING_RECOMMENDATIONS = [
  "immediate",
  "standard",
  "delayed",
  "opportunistic",
] as const;

export const ANOMALY_TYPES = [
  "price_spike",
  "quantity_surge",
  "supplier_switch",
  "risk_elevation",
  "logistics_cost_increase",
] as const;
