/** PILLOW-LGW-001 — Lead Generation Worker (Q7-08). */
export const LEAD_GENERATION_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LEAD_GENERATION_WORKER_SYSTEM.md" as const;
export const LEAD_GENERATION_WORKER_ID = "lead-generation-worker" as const;
export const LGW_METADATA_VERSION = "LGW-001-v1" as const;
export const LEAD_GENERATION_REPORT_VERSION = "LGW-RPT-v1" as const;

export const LEAD_GENERATION_WORKER_IDENTITY = {
  workerId: "wkr-lead-generation-01",
  workerName: "Lead Generation Worker",
  workerType: "analyst",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-analyst-lead-generation",
  reportingLine: ["wkr-lead-generation-01", "pillow"] as string[],
  skillProfile: [
    "skill-lead-funnel-construction",
    "skill-enquiry-form-generation",
    "skill-lead-capture",
    "skill-lead-qualification",
    "skill-lead-scoring",
    "skill-crm-routing",
    "skill-booking-routing",
    "skill-funnel-performance-measurement",
    "skill-lead-generation-reporting",
  ],
  approvedTools: ["lead_funnel_ledger", "enquiry_form_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "building_funnel",
  "generating_form",
  "capturing_lead",
  "qualifying",
  "scoring",
  "routing_crm",
  "routing_booking",
  "tracking_conversion",
  "measuring",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const LEAD_SOURCES = [
  "website_form",
  "landing_page",
  "call_request",
  "quote_request",
  "whatsapp",
  "contact_form",
  "multi_step",
  "unknown",
] as const;

export const QUALIFICATION_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "disqualified",
  "routed_to_crm",
  "routed_to_booking",
  "unknown",
] as const;

export const CONVERSION_STAGES = [
  "visitor",
  "enquiry",
  "qualified_lead",
  "crm_captured",
  "booking_requested",
  "converted",
  "abandoned",
  "unknown",
] as const;

export const AUDIT_STATUSES = [
  "draft",
  "funnel_ready",
  "leads_captured",
  "ready_for_q709",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "crm_worker",
  "whatsapp_worker",
  "local_seo_worker",
  "booking_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const LGW_CAPABILITIES = [
  "create_lead_funnel",
  "generate_enquiry_form",
  "capture_lead",
  "qualify_lead",
  "score_lead",
  "route_lead_to_crm",
  "route_lead_to_booking",
  "track_conversion_stage",
  "measure_funnel_performance",
  "produce_lead_generation_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_lead_traceability",
  "preserve_funnel_audit_history",
  "never_execute_advertising_campaigns",
  "never_replace_crm",
  "never_replace_booking_worker",
  "never_deliver_customer_jobs",
  "never_fabricate_lead_or_conversion_results",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q709_or_later",
  "never_expose_credentials",
  "never_expose_prohibited_personal_data",
  "integrate_local_business_factory_core",
  "integrate_crm_worker",
  "integrate_whatsapp_worker",
  "integrate_local_seo_worker",
  "integrate_booking_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "lead_generation_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q709_consumable_contract",
] as const;
