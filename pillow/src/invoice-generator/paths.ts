/** PILLOW-IG-001 — Invoice Generator paths (R3-09). */

export const INVOICE_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_INVOICE_GENERATOR_SYSTEM.md";

export const IG_METADATA_VERSION = "IG-001-v1" as const;

export const INVOICE_GENERATOR_ID = "invoice-generator" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "generating",
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

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "sent",
  "paid",
  "cancelled",
  "failed",
] as const;

export const IG_CAPABILITIES = [
  "customer_invoice_creation",
  "supplier_invoice_creation",
  "invoice_number_generation",
  "invoice_line_item_generation",
  "invoice_total_calculation",
  "tax_calculation",
  "invoice_lifecycle_management",
  "invoice_status_tracking",
  "inconsistency_detection",
  "invoice_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
