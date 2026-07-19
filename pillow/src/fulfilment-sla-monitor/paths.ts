/** PILLOW-FSM-001 — Fulfilment SLA Monitor paths (R2-18). */

export const FULFILMENT_SLA_MONITOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FULFILMENT_SLA_MONITOR_SYSTEM.md";

export const FSM_METADATA_VERSION = "FSM-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = ["cj-dropshipping", "aliexpress", "1688"] as const;

export const SUPPORTED_CARRIER_IDENTIFIERS = ["usps", "ups", "fedex", "dhl"] as const;

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

export const COMPLIANCE_STATUSES = ["compliant", "at_risk", "breached", "pending"] as const;

export const SLA_ALERT_TYPES = [
  "fulfilment_breach",
  "shipment_breach",
  "supplier_non_compliance",
  "carrier_non_compliance",
  "sla_risk",
] as const;
