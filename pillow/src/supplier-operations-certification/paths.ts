/** PILLOW-SOC-001 — Supplier Operations Certification paths (R2-20). */

export const SUPPLIER_OPERATIONS_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_OPERATIONS_CERTIFICATION_SYSTEM.md";

export const SOC_METADATA_VERSION = "SOC-001-v1" as const;

export const CERTIFICATION_SCHEMA_VERSION = "SOC-SCHEMA-001-v1" as const;

export const CERTIFIED_PHASE = "Supplier & Fulfilment" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "certifying",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const CERTIFICATION_STATUSES = ["certified", "partial", "failed", "pending"] as const;

export const CERTIFIED_MISSIONS = [
  { id: "R2-01", label: "Supplier Framework" },
  { id: "R2-02", label: "CJdropshipping Integration" },
  { id: "R2-03", label: "AliExpress Integration" },
  { id: "R2-04", label: "1688 Integration" },
  { id: "R2-05", label: "Supplier Product Sync" },
  { id: "R2-06", label: "Supplier Inventory Sync" },
  { id: "R2-07", label: "Supplier Pricing Engine" },
  { id: "R2-08", label: "Supplier Ranking Engine" },
  { id: "R2-09", label: "Procurement Engine" },
  { id: "R2-10", label: "Fulfilment Orchestrator" },
  { id: "R2-11", label: "Shipping Carrier Integration" },
  { id: "R2-12", label: "Shipment Tracking Engine" },
  { id: "R2-13", label: "Return Management" },
  { id: "R2-14", label: "Warehouse Intelligence" },
  { id: "R2-15", label: "Multi-Warehouse Support" },
  { id: "R2-16", label: "Supplier Risk Monitor" },
  { id: "R2-17", label: "Logistics Optimization" },
  { id: "R2-18", label: "Fulfilment SLA Monitor" },
  { id: "R2-19", label: "Procurement Intelligence" },
] as const;
