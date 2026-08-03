/** PILLOW-DDW-001 — Digital Delivery Worker (Q5-10). */
export const DIGITAL_DELIVERY_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DIGITAL_DELIVERY_WORKER_SYSTEM.md" as const;
export const DIGITAL_DELIVERY_WORKER_ID = "digital-delivery-worker" as const;
export const DDW_METADATA_VERSION = "DDW-001-v1" as const;
export const DIGITAL_DELIVERY_WORKER_REPORT_VERSION = "DDW-RPT-v1" as const;

export const DIGITAL_DELIVERY_WORKER_IDENTITY = {
  workerId: "wkr-digital-delivery-01",
  workerName: "Digital Delivery Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-digital-delivery",
  reportingLine: ["wkr-digital-delivery-01", "pillow"] as string[],
  skillProfile: [
    "skill-validated-checkout-intake",
    "skill-fulfilment-eligibility-verification",
    "skill-digital-asset-delivery",
    "skill-product-access-granting",
    "skill-secure-download-link-generation",
    "skill-delivery-status-tracking",
    "skill-delivery-retry-workflow",
    "skill-fulfilment-failure-detection",
    "skill-customer-delivery-confirmation",
    "skill-structural-digital-delivery-reporting",
  ],
  approvedTools: ["delivery_ledger", "delivery_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "verifying_eligibility",
  "delivering_assets",
  "granting_access",
  "generating_download_links",
  "tracking_status",
  "handling_retries",
  "detecting_failures",
  "confirming_delivery",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported delivery feature / product-type signals (extensible). */
export const DELIVERY_TYPES = [
  "secure_file_download",
  "account_access",
  "bundle_delivery",
  "multiple_asset_delivery",
  "download_link_generation",
  "delivery_confirmation",
  "retry_workflow",
  "fulfilment_audit_trail",
  "unknown",
] as const;

/** Preferred delivery methods. */
export const DELIVERY_METHODS = [
  "secure_file_download",
  "account_access",
  "bundle_delivery",
  "multiple_asset_delivery",
  "unknown",
] as const;

export const DELIVERY_STATUSES = [
  "pending",
  "eligible",
  "delivering",
  "access_granted",
  "links_generated",
  "delivered",
  "confirmed",
  "retrying",
  "failed",
  "blocked",
] as const;

export const RETRY_STATUSES = [
  "not_required",
  "scheduled",
  "in_progress",
  "exhausted",
  "succeeded",
] as const;

export const RESEARCH_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "digital_products_factory_core",
  "checkout_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const DDW_CAPABILITIES = [
  "receive_validated_checkout_completion",
  "verify_fulfilment_eligibility",
  "deliver_purchased_digital_assets",
  "grant_product_access",
  "generate_secure_download_links",
  "track_delivery_status",
  "handle_delivery_retries",
  "detect_fulfilment_failures",
  "produce_customer_delivery_confirmations",
  "produce_machine_readable_digital_delivery_reports",
  "deliver_only_verified_purchases",
  "protect_customer_access",
  "preserve_complete_fulfilment_traceability",
  "validate_successful_delivery",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_bypass_pillow_governance",
  "never_expose_unauthorized_access",
  "never_process_payments",
  "never_create_products",
  "never_publish_storefronts",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_checkout_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "digital_delivery_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
