/** PILLOW-LBLP-001 — Local Business Launch Pack (Q7-10). */
export const LOCAL_BUSINESS_LAUNCH_PACK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOCAL_BUSINESS_LAUNCH_PACK_SYSTEM.md" as const;
export const LOCAL_BUSINESS_LAUNCH_PACK_ID = "local-business-launch-pack" as const;
export const LBLP_METADATA_VERSION = "LBLP-001-v1" as const;
export const LOCAL_BUSINESS_LAUNCH_REPORT_VERSION = "LBLP-RPT-v1" as const;

export const LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY = {
  workerId: "wkr-local-business-launch-pack-01",
  workerName: "Local Business Launch Pack",
  workerType: "assembler",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-assembler-local-business-launch-pack",
  reportingLine: ["wkr-local-business-launch-pack-01", "pillow"] as string[],
  skillProfile: [
    "skill-factory-output-collection",
    "skill-deliverable-verification",
    "skill-executive-package-assembly",
    "skill-business-opportunity-summarization",
    "skill-services-and-pricing-summarization",
    "skill-booking-crm-communication-readiness-summarization",
    "skill-seo-and-lead-generation-readiness-summarization",
    "skill-operational-readiness-summarization",
    "skill-risk-and-outstanding-issue-identification",
    "skill-launch-pack-reporting",
  ],
  approvedTools: ["launch_package_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "collecting_outputs",
  "verifying_deliverables",
  "assembling_package",
  "summarizing",
  "identifying_risks",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Readiness assessment is always evidence-derived — never fabricated. */
export const READINESS_STATUSES = [
  "not_ready",
  "partial",
  "ready_for_approval",
  "blocked",
  "unknown",
] as const;

export const APPROVAL_RECOMMENDATIONS = [
  "do_not_approve",
  "approve_with_conditions",
  "recommend_approval",
  "deferred",
  "unknown",
] as const;

export const AUDIT_STATUSES = [
  "draft",
  "outputs_collected",
  "verified",
  "package_ready",
  "ready_for_q711",
  "submitted",
  "rejected",
  "unknown",
] as const;

/** Q7-01..Q7-09 deliverables the Launch Pack verifies before assembling a package. */
export const DELIVERABLE_ITEMS = [
  "business_identity",
  "market_research",
  "service_offer",
  "booking_readiness",
  "crm_readiness",
  "whatsapp_readiness",
  "local_seo",
  "lead_generation",
  "operations",
] as const;

/** Deliverables without which a launch recommendation must never be positive. */
export const CRITICAL_DELIVERABLE_ITEMS = [
  "business_identity",
  "market_research",
  "service_offer",
] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "local_market_research_worker",
  "service_offer_worker",
  "booking_worker",
  "crm_worker",
  "whatsapp_worker",
  "local_seo_worker",
  "lead_generation_worker",
  "operations_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const LBLP_CAPABILITIES = [
  "collect_factory_outputs",
  "verify_deliverables",
  "generate_executive_launch_package",
  "summarize_business_opportunity",
  "summarize_services_and_pricing",
  "summarize_booking_crm_communication_readiness",
  "summarize_seo_and_lead_generation_readiness",
  "summarize_operational_readiness",
  "identify_risks_and_outstanding_issues",
  "produce_local_business_launch_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "never_launch_business_automatically",
  "never_override_governance",
  "never_replace_certification",
  "never_claim_readiness_without_evidence",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q711_or_later",
  "integrate_local_business_factory_core",
  "integrate_local_market_research_worker",
  "integrate_service_offer_worker",
  "integrate_booking_worker",
  "integrate_crm_worker",
  "integrate_whatsapp_worker",
  "integrate_local_seo_worker",
  "integrate_lead_generation_worker",
  "integrate_operations_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "local_business_launch_pack_validation",
  "health_monitoring",
  "recovery_management",
  "q711_consumable_contract",
] as const;
