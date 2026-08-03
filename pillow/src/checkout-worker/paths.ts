/** PILLOW-CKW-001 — Checkout Worker (Q5-09). */
export const CHECKOUT_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CHECKOUT_WORKER_SYSTEM.md" as const;
export const CHECKOUT_WORKER_ID = "checkout-worker" as const;
export const CKW_METADATA_VERSION = "CKW-001-v1" as const;
export const CHECKOUT_WORKER_REPORT_VERSION = "CKW-RPT-v1" as const;

export const CHECKOUT_WORKER_IDENTITY = {
  workerId: "wkr-checkout-01",
  workerName: "Checkout Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-checkout",
  reportingLine: ["wkr-checkout-01", "pillow"] as string[],
  skillProfile: [
    "skill-approved-product-information-intake",
    "skill-checkout-workflow-preparation",
    "skill-payment-provider-abstraction",
    "skill-order-summary-generation",
    "skill-customer-confirmation-workflow",
    "skill-purchase-information-validation",
    "skill-post-payment-handoff-preparation",
    "skill-checkout-readiness-validation",
    "skill-structural-checkout-reporting",
  ],
  approvedTools: ["checkout_ledger", "checkout_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating_workflow",
  "configuring_payments",
  "generating_order_summary",
  "generating_confirmation",
  "validating_purchase_info",
  "preparing_handoff",
  "configuring_providers",
  "validating_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Supported checkout feature / product-type signals (extensible).
 * Used as PRODUCT_TYPES for sibling-pattern consistency.
 */
export const PRODUCT_TYPES = [
  "one_time_purchase",
  "coupon_enabled",
  "discount_enabled",
  "order_summary",
  "tax_configuration",
  "multi_currency",
  "payment_provider_abstraction",
  "confirmation_workflow",
  "unknown",
] as const;

/** Preferred checkout flow types. */
export const CHECKOUT_FLOW_TYPES = [
  "one_time_purchase",
  "subscription_ready_placeholder",
  "lead_to_checkout",
  "unknown",
] as const;

export const FEATURES = [
  "coupon_support",
  "discount_support",
  "order_summary",
  "tax_configuration_support",
  "currency_support",
  "payment_provider_abstraction",
  "confirmation_workflow",
] as const;

/** Structural payment-provider readiness signals only — never live credentials. */
export const PAYMENT_PROVIDERS = [
  "stripe_ready",
  "paypal_ready",
  "paddle_ready",
  "manual_invoice_ready",
  "unknown",
] as const;

export const DELIVERY_HANDOFF_STATUSES = [
  "not_prepared",
  "prepared",
  "ready_for_handoff",
  "blocked",
] as const;

export const RESEARCH_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "digital_products_factory_core",
  "sales_page_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const CKW_CAPABILITIES = [
  "receive_approved_digital_product_information",
  "generate_checkout_workflow",
  "prepare_payment_provider_configuration",
  "generate_order_summary",
  "generate_customer_confirmation_workflow",
  "validate_required_purchase_information",
  "prepare_post_payment_handoff",
  "configure_payment_provider_abstraction",
  "validate_checkout_readiness",
  "produce_machine_readable_checkout_reports",
  "follow_approved_product_information",
  "preserve_complete_traceability",
  "validate_checkout_integrity_before_submission",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_charge_customers",
  "never_execute_payment_transactions",
  "never_deliver_products",
  "never_publish_storefronts",
  "never_store_sensitive_payment_credentials",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_sales_page_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "checkout_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
