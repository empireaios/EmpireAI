/** PILLOW-MCT-001 — Marketplace Certification paths (R1-15). */

export const MARKETPLACE_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETPLACE_CERTIFICATION_SYSTEM.md";

export const MCT_METADATA_VERSION = "MCT-001-v1" as const;

export const CERTIFICATION_SCHEMA_VERSION = "MCT-SCHEMA-001-v1" as const;

export const CERTIFIED_PHASE = "Marketplace Integration" as const;

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
  { id: "R1-01", label: "Marketplace Connector Framework" },
  { id: "R1-02", label: "Amazon Integration Foundation" },
  { id: "R1-03", label: "Amazon Product Intelligence" },
  { id: "R1-04", label: "Amazon Order Management" },
  { id: "R1-05", label: "Amazon Inventory Sync" },
  { id: "R1-06", label: "Walmart Marketplace Integration" },
  { id: "R1-07", label: "Etsy Marketplace Integration" },
  { id: "R1-08", label: "eBay Marketplace Integration" },
  { id: "R1-09", label: "TikTok Shop Integration" },
  { id: "R1-10", label: "Shopify Store Integration" },
  { id: "R1-11", label: "WooCommerce Integration" },
  { id: "R1-12", label: "Marketplace Product Normalization" },
  { id: "R1-13", label: "Marketplace Order Normalization" },
  { id: "R1-14", label: "Marketplace Health Monitor" },
] as const;
