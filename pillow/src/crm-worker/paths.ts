/** PILLOW-CRMW-001 — CRM Worker (Q7-05). */
export const CRM_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CRM_WORKER_SYSTEM.md" as const;
export const CRM_WORKER_ID = "crm-worker" as const;
export const CRMW_METADATA_VERSION = "CRMW-001-v1" as const;
export const CRM_REPORT_VERSION = "CRMW-RPT-v1" as const;

export const CRM_WORKER_IDENTITY = {
  workerId: "wkr-crm-01",
  workerName: "CRM Worker",
  workerType: "operations",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-ops-crm",
  reportingLine: ["wkr-crm-01", "pillow"] as string[],
  skillProfile: [
    "skill-customer-profiles",
    "skill-lead-capture",
    "skill-contact-history",
    "skill-follow-up-scheduling",
    "skill-booking-history-link",
    "skill-lifecycle-tracking",
    "skill-crm-reporting",
  ],
  approvedTools: ["crm_ledger", "customer_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "creating_profile",
  "capturing_lead",
  "recording_contact",
  "linking_booking",
  "scheduling_follow_up",
  "updating_lifecycle",
  "analytics",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Lead statuses (extensible via config). */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
  "nurture",
  "unknown",
] as const;

/** Customer lifecycle stages (extensible via config). */
export const LIFECYCLE_STAGES = [
  "lead",
  "prospect",
  "active_customer",
  "repeat_customer",
  "inactive",
  "churned",
  "unknown",
] as const;

/** Customer statuses (extensible via config). */
export const CUSTOMER_STATUSES = [
  "active",
  "inactive",
  "blocked",
  "archived",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "local_market_research_worker",
  "service_offer_worker",
  "booking_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const CRMW_CAPABILITIES = [
  "create_customer_profile",
  "update_customer_profile",
  "capture_lead",
  "update_lead_status",
  "record_contact",
  "record_interaction",
  "link_booking_history",
  "schedule_follow_up",
  "complete_follow_up",
  "track_opportunity",
  "update_lifecycle_stage",
  "generate_crm_analytics",
  "produce_crm_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_customer_history",
  "preserve_complete_traceability",
  "preserve_crm_audit_history",
  "never_execute_marketing_campaigns",
  "never_deliver_customer_jobs",
  "never_replace_booking_functionality",
  "never_fabricate_customer_interactions",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q706_or_later",
  "never_expose_credentials",
  "never_expose_prohibited_personal_data",
  "integrate_local_business_factory_core",
  "integrate_local_market_research_worker",
  "integrate_service_offer_worker",
  "integrate_booking_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "crm_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q706_consumable_contract",
] as const;
