/** PILLOW-BII-001 — Business Idea Interpreter (Q2-02). */
export const BUSINESS_IDEA_INTERPRETER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_IDEA_INTERPRETER_SYSTEM.md" as const;
export const BUSINESS_IDEA_INTERPRETER_ID = "business-idea-interpreter" as const;
export const BII_METADATA_VERSION = "BII-001-v1" as const;
export const BUSINESS_INTENT_VERSION = "BII-INT-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "accepting",
  "interpreting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum business types (Q2-02).
 * Architecture allows additional types via configuration without redesign.
 */
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

export const MISSING_INFORMATION_FIELDS = [
  "target_customer",
  "product_service_category",
  "channel_platform",
  "constraints",
  "success_objective",
  "business_type",
] as const;

export const BII_CAPABILITIES = [
  "accept_plain_language_business_command",
  "identify_intended_business_type",
  "extract_core_business_idea",
  "extract_target_customer_if_stated",
  "extract_product_service_category_if_stated",
  "extract_channel_platform_if_stated",
  "extract_constraints_if_stated",
  "extract_success_objective_if_stated",
  "produce_structured_business_intent",
  "identify_missing_information",
  "include_confidence_score",
  "preserve_original_command_for_traceability",
  "prepare_output_for_later_q2_missions",
  "extensible_business_types",
  "business_idea_interpreter_validation",
  "health_monitoring",
  "recovery_management",
] as const;
