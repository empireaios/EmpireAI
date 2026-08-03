/** PILLOW-LSEO-001 — Local SEO Worker (Q7-07). */
export const LOCAL_SEO_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOCAL_SEO_WORKER_SYSTEM.md" as const;
export const LOCAL_SEO_WORKER_ID = "local-seo-worker" as const;
export const LSEO_METADATA_VERSION = "LSEO-001-v1" as const;
export const LOCAL_SEO_REPORT_VERSION = "LSEO-RPT-v1" as const;

export const LOCAL_SEO_WORKER_IDENTITY = {
  workerId: "wkr-local-seo-01",
  workerName: "Local SEO Worker",
  workerType: "analyst",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-analyst-local-seo",
  reportingLine: ["wkr-local-seo-01", "pillow"] as string[],
  skillProfile: [
    "skill-local-seo-landing-pages",
    "skill-google-business-recommendations",
    "skill-local-keyword-research",
    "skill-seo-metadata",
    "skill-structured-data-recommendations",
    "skill-citation-recommendations",
    "skill-local-seo-reporting",
  ],
  approvedTools: ["local_seo_ledger", "landing_page_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_offer",
  "generating_gbp",
  "generating_pages",
  "generating_keywords",
  "generating_metadata",
  "generating_schema",
  "generating_citations",
  "evaluating_completeness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const PAGE_TYPES = ["landing", "service", "city", "area"] as const;

export const AUDIT_STATUSES = [
  "draft",
  "assets_prepared",
  "ready_for_q708",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "service_offer_worker",
  "crm_worker",
  "whatsapp_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const LSEO_CAPABILITIES = [
  "consume_service_offer",
  "generate_google_business_recommendations",
  "generate_landing_pages",
  "generate_service_pages",
  "generate_city_area_pages",
  "generate_seo_titles_and_meta",
  "generate_structured_data_recommendations",
  "generate_local_keywords",
  "generate_internal_linking_recommendations",
  "generate_citation_recommendations",
  "evaluate_seo_completeness",
  "produce_local_seo_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "never_publish_websites",
  "never_purchase_backlinks",
  "never_manipulate_search_rankings",
  "never_modify_live_google_business_profiles_automatically",
  "never_fabricate_seo_performance_results",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q708_or_later",
  "never_expose_credentials",
  "integrate_local_business_factory_core",
  "integrate_service_offer_worker",
  "integrate_crm_worker",
  "integrate_whatsapp_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "local_seo_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q708_consumable_contract",
] as const;
