/** PILLOW-EMG-001 — Empire Builder Model Generator (Q2-03). */
export const EMPIRE_BUILDER_MODEL_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EMPIRE_BUILDER_MODEL_GENERATOR_SYSTEM.md" as const;
export const EMPIRE_BUILDER_MODEL_GENERATOR_ID = "empire-builder-model-generator" as const;
export const EMG_METADATA_VERSION = "EMG-001-v1" as const;
export const BUSINESS_MODEL_VERSION = "EMG-MDL-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum business model types (Q2-03).
 * Architecture allows additional types via configuration without redesign.
 */
export const BUSINESS_MODEL_TYPES = [
  "media_content",
  "commerce_retail",
  "local_service",
  "affiliate_referral",
  "digital_product",
  "saas_subscription",
  "agency_services",
  "hybrid",
  "unknown",
] as const;

export const BUSINESS_TYPES = [
  "media",
  "commerce",
  "local_cleaning",
  "affiliate",
  "digital_product",
  "local_services",
  "saas",
  "agency",
  "unknown",
] as const;

export const EMG_CAPABILITIES = [
  "receive_structured_business_intent",
  "determine_business_model_type",
  "define_value_proposition",
  "define_products_and_services",
  "define_customer_segments",
  "define_revenue_model",
  "define_cost_model",
  "define_operating_model",
  "define_required_business_capabilities",
  "define_required_external_platforms",
  "define_business_assumptions",
  "produce_machine_readable_business_model",
  "prepare_downstream_planning",
  "extensible_business_model_types",
  "empire_builder_model_generator_validation",
  "health_monitoring",
  "recovery_management",
] as const;
