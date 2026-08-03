/** PILLOW-BKW-001 — Booking Worker (Q7-04). */
export const BOOKING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BOOKING_WORKER_SYSTEM.md" as const;
export const BOOKING_WORKER_ID = "booking-worker" as const;
export const BKW_METADATA_VERSION = "BKW-001-v1" as const;
export const BOOKING_REPORT_VERSION = "BKW-RPT-v1" as const;

export const BOOKING_WORKER_IDENTITY = {
  workerId: "wkr-booking-01",
  workerName: "Booking Worker",
  workerType: "operations",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-ops-booking",
  reportingLine: ["wkr-booking-01", "pillow"] as string[],
  skillProfile: [
    "skill-booking-creation",
    "skill-calendar-management",
    "skill-slot-allocation",
    "skill-worker-assignment",
    "skill-conflict-prevention",
    "skill-booking-confirmation",
    "skill-booking-reporting",
  ],
  approvedTools: ["booking_ledger", "calendar_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_offer",
  "creating_booking",
  "managing_calendar",
  "allocating_slots",
  "assigning_worker",
  "modifying_booking",
  "confirming",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Booking lifecycle statuses (extensible). completed_booking_record closes booking lifecycle — not service fulfilment. */
export const BOOKING_STATUSES = [
  "draft",
  "pending_confirmation",
  "confirmed",
  "modified",
  "rescheduled",
  "cancelled",
  "completed_booking_record",
  "failed",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "local_market_research_worker",
  "service_offer_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const BKW_CAPABILITIES = [
  "consume_service_offer",
  "create_booking",
  "manage_calendar",
  "set_availability",
  "allocate_time_slots",
  "assign_worker",
  "modify_booking",
  "cancel_booking",
  "reschedule_booking",
  "validate_availability",
  "prevent_conflicts",
  "generate_confirmation",
  "produce_booking_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_booking_audit_history",
  "never_perform_the_service",
  "never_process_payments",
  "never_replace_crm",
  "never_fabricate_booking_confirmations",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q705_or_later",
  "integrate_local_business_factory_core",
  "integrate_local_market_research_worker",
  "integrate_service_offer_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "booking_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q705_consumable_contract",
] as const;
