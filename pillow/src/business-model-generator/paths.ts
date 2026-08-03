/** PILLOW-BMG-001 — Business Model Generator paths (X1-04). */

export const BUSINESS_MODEL_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_MODEL_GENERATOR_SYSTEM.md";

export const BMG_METADATA_VERSION = "BMG-001-v1" as const;

export const BUSINESS_MODEL_GENERATOR_ID = "business-model-generator" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "generating",
  "scoring",
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

export const REVENUE_MODELS = [
  "subscription",
  "transaction_fee",
  "marketplace_commission",
  "product_sales",
  "licensing",
  "freemium",
  "hybrid_structural",
] as const;

export const BMG_CAPABILITIES = [
  "business_model_generation",
  "revenue_model_generation",
  "cost_structure_generation",
  "value_proposition_generation",
  "customer_segment_generation",
  "distribution_channel_generation",
  "partnership_strategy_generation",
  "operational_model_generation",
  "business_model_scoring",
  "business_model_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
