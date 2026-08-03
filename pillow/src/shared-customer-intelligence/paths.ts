/** PILLOW-SCI-001 — Shared Customer Intelligence paths (X2-12). */

export const SHARED_CUSTOMER_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SHARED_CUSTOMER_INTELLIGENCE_SYSTEM.md";

export const SCI_METADATA_VERSION = "SCI-001-v1" as const;

export const SHARED_CUSTOMER_INTELLIGENCE_ID = "shared-customer-intelligence" as const;

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

export const SCI_CAPABILITIES = [
  "customer_knowledge_consolidation",
  "cross_company_customer_relationship_identification",
  "customer_preference_identification",
  "customer_behaviour_pattern_identification",
  "customer_lifetime_value_identification",
  "cross_selling_opportunity_detection",
  "customer_risk_detection",
  "customer_intelligence_recommendations",
  "customer_intelligence_validation",
  "customer_intelligence_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const RISK_LEVELS = ["low", "medium", "high"] as const;
