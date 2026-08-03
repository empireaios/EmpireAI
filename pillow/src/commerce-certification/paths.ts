/** PILLOW-CMC-001 — Commerce Certification (Q3-14). */
export const COMMERCE_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMMERCE_CERTIFICATION_SYSTEM.md" as const;
export const COMMERCE_CERTIFICATION_ID = "commerce-certification" as const;
export const CMC_METADATA_VERSION = "CMC-001-v1" as const;
export const COMMERCE_FACTORY_VERSION = "Q3-CMF-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "certifying",
  "assessing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Final certification levels (Q3-14).
 * Architecture allows additional levels via configuration without redesign.
 */
export const CERTIFICATION_LEVELS = [
  "certified",
  "certified_with_warnings",
  "provisionally_certified",
  "failed_certification",
] as const;

/**
 * Mandatory Commerce Factory components (Q3-01 … Q3-13).
 */
export const COMMERCE_FACTORY_COMPONENTS = [
  {
    id: "commerce-factory-core",
    label: "Commerce Factory Core",
    missionId: "Q3-01",
  },
  {
    id: "product-discovery-worker",
    label: "Product Discovery Worker",
    missionId: "Q3-02",
  },
  {
    id: "product-evaluation-worker",
    label: "Product Evaluation Worker",
    missionId: "Q3-03",
  },
  {
    id: "supplier-discovery-worker",
    label: "Supplier Discovery Worker",
    missionId: "Q3-04",
  },
  {
    id: "supplier-evaluation-worker",
    label: "Supplier Evaluation Worker",
    missionId: "Q3-05",
  },
  {
    id: "supplier-negotiation-worker",
    label: "Supplier Negotiation Worker",
    missionId: "Q3-06",
  },
  {
    id: "product-image-worker",
    label: "Product Image Worker",
    missionId: "Q3-07",
  },
  {
    id: "product-listing-worker",
    label: "Product Listing Worker",
    missionId: "Q3-08",
  },
  {
    id: "pricing-worker",
    label: "Pricing Worker",
    missionId: "Q3-09",
  },
  {
    id: "inventory-worker",
    label: "Inventory Worker",
    missionId: "Q3-10",
  },
  {
    id: "order-worker",
    label: "Order Worker",
    missionId: "Q3-11",
  },
  {
    id: "refund-dispute-worker",
    label: "Refund & Dispute Worker",
    missionId: "Q3-12",
  },
  {
    id: "commerce-analytics-worker",
    label: "Commerce Analytics Worker",
    missionId: "Q3-13",
  },
] as const;

/**
 * Final acceptance integration domains (Q3-14).
 */
export const INTEGRATION_DOMAINS = [
  "discovery_to_evaluation",
  "evaluation_to_supplier_discovery",
  "supplier_discovery_to_evaluation",
  "supplier_evaluation_to_negotiation",
  "product_to_images",
  "images_to_listings",
  "listings_to_pricing",
  "pricing_to_inventory",
  "inventory_to_orders",
  "orders_to_refunds",
  "refunds_to_analytics",
  "cross_worker_integration",
  "executive_reporting",
  "traceability_chain",
  "pillow_governance",
  "commerce_operational_readiness",
] as const;

/**
 * Mandatory Commerce Factory governance / operational validations (Q3-14).
 */
export const COMMERCE_GOVERNANCE_RULES = [
  "products_can_be_discovered",
  "products_can_be_evaluated",
  "suppliers_can_be_discovered",
  "suppliers_can_be_evaluated",
  "supplier_negotiations_can_be_prepared",
  "product_images_can_be_prepared",
  "product_listings_can_be_generated",
  "pricing_can_be_calculated",
  "inventory_can_be_monitored",
  "orders_can_be_managed",
  "refunds_and_disputes_can_be_managed",
  "commerce_analytics_can_be_generated",
  "complete_commerce_workflow_traceable",
  "entire_commerce_factory_governed_by_pillow",
] as const;

export const COMPONENT_PROBE_RESULTS = ["pass", "warning", "fail"] as const;

export const CMC_CAPABILITIES = [
  "verify_commerce_factory_core",
  "verify_product_discovery_worker",
  "verify_product_evaluation_worker",
  "verify_supplier_discovery_worker",
  "verify_supplier_evaluation_worker",
  "verify_supplier_negotiation_worker",
  "verify_product_image_worker",
  "verify_product_listing_worker",
  "verify_pricing_worker",
  "verify_inventory_worker",
  "verify_order_worker",
  "verify_refund_dispute_worker",
  "verify_commerce_analytics_worker",
  "verify_cross_worker_integration",
  "verify_pillow_governance",
  "verify_commerce_operational_readiness",
  "produce_unified_commerce_certification_report",
  "assess_commerce_workflow_completeness",
  "determine_q3_production_readiness",
  "confirm_readiness_for_q4",
  "extensible_certification_levels",
  "extensible_integration_domains",
  "preserve_auditability",
  "preserve_traceability",
  "commerce_certification_validation",
  "health_monitoring",
  "recovery_management",
] as const;
