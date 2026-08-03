/** PILLOW-SSI-001 — Shared Supplier Intelligence paths (X2-13). */

export const SHARED_SUPPLIER_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SHARED_SUPPLIER_INTELLIGENCE_SYSTEM.md";

export const SSI_METADATA_VERSION = "SSI-001-v1" as const;

export const SHARED_SUPPLIER_INTELLIGENCE_ID = "shared-supplier-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "synchronizing",
  "analyzing",
  "recommending",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const SSI_CAPABILITIES = [
  "supplier_knowledge_consolidation",
  "enterprise_supplier_registry_management",
  "supplier_performance_tracking",
  "supplier_reliability_tracking",
  "supplier_pricing_competitiveness_tracking",
  "supplier_risk_detection",
  "supplier_duplication_detection",
  "optimal_supplier_recommendations",
  "cross_company_supplier_intelligence_sharing",
  "supplier_intelligence_validation",
  "supplier_intelligence_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const RISK_LEVELS = ["low", "medium", "high"] as const;
