/** PILLOW-RWOC-001 — Real World Operations Certification paths (R5-20). */

export const REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM.md";

export const RWOC_METADATA_VERSION = "RWOC-001-v1" as const;

export const CERTIFICATION_SCHEMA_VERSION = "RWOC-SCHEMA-001-v1" as const;

export const REAL_WORLD_OPERATIONS_CERTIFIED_ID = "real-world-operations-certified" as const;

export const CERTIFIED_PHASE = "Real World Operations" as const;

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

export const CERTIFIED_PROGRAMMES = [
  { id: "R1", label: "Marketplace Integration", missionRange: "R1-01 through R1-15" },
  { id: "R2", label: "Supplier & Fulfilment", missionRange: "R2-01 through R2-20" },
  { id: "R3", label: "Financial Infrastructure", missionRange: "R3-01 through R3-18" },
  { id: "R4", label: "Customer Operations", missionRange: "R4-01 through R4-19" },
  { id: "R5", label: "Marketing Operations", missionRange: "R5-01 through R5-19" },
] as const;

export const RWOC_CAPABILITIES = [
  "marketplace_validation",
  "supplier_validation",
  "fulfilment_validation",
  "financial_validation",
  "customer_validation",
  "marketing_validation",
  "cross_programme_validation",
  "end_to_end_operational_validation",
  "autonomous_operational_readiness_validation",
  "certification_reporting",
  "health_monitoring",
  "recovery",
] as const;
