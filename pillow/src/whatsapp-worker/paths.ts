/** PILLOW-WAW-001 — WhatsApp Worker (Q7-06). */
export const WHATSAPP_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WHATSAPP_WORKER_SYSTEM.md" as const;
export const WHATSAPP_WORKER_ID = "whatsapp-worker" as const;
export const WAW_METADATA_VERSION = "WAW-001-v1" as const;
export const WHATSAPP_REPORT_VERSION = "WAW-RPT-v1" as const;

export const WHATSAPP_WORKER_IDENTITY = {
  workerId: "wkr-whatsapp-01",
  workerName: "WhatsApp Worker",
  workerType: "operations",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-ops-whatsapp",
  reportingLine: ["wkr-whatsapp-01", "pillow"] as string[],
  skillProfile: [
    "skill-whatsapp-conversations",
    "skill-message-templates",
    "skill-automation-workflows",
    "skill-crm-trigger",
    "skill-booking-trigger",
    "skill-reminder-scheduling",
    "skill-human-escalation",
    "skill-whatsapp-reporting",
  ],
  approvedTools: ["whatsapp_ledger", "conversation_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving_inbound",
  "sending_outbound",
  "applying_template",
  "running_workflow",
  "triggering_crm",
  "triggering_booking",
  "scheduling_reminder",
  "escalating",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Conversation statuses (extensible via config). */
export const CONVERSATION_STATUSES = [
  "open",
  "awaiting_customer",
  "awaiting_agent",
  "automated",
  "escalated",
  "resolved",
  "closed",
  "failed",
  "unknown",
] as const;

/** Message directions (extensible via config). */
export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;

/** Automation step types (extensible via config). */
export const AUTOMATION_STEP_TYPES = [
  "enquiry_received",
  "auto_reply",
  "template_send",
  "quotation",
  "booking_trigger",
  "crm_trigger",
  "reminder",
  "follow_up",
  "status_update",
  "escalate_human",
  "unknown",
] as const;

export const EVIDENCE_MODES = ["fixture", "sandbox", "cached", "live"] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "booking_worker",
  "crm_worker",
  "notification_worker",
  "api_integration_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const WAW_CAPABILITIES = [
  "receive_inbound_enquiry",
  "send_outbound_message",
  "apply_template",
  "run_automated_workflow",
  "trigger_crm_workflow",
  "trigger_booking_workflow",
  "schedule_reminder",
  "schedule_follow_up_message",
  "escalate_to_human",
  "assign_conversation",
  "label_conversation",
  "get_conversation_history",
  "produce_whatsapp_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_conversation_history",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "never_replace_crm",
  "never_replace_booking_worker",
  "never_replace_operations_worker",
  "never_fabricate_message_delivery_results",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q707_or_later",
  "never_expose_credentials",
  "never_expose_prohibited_personal_data",
  "integrate_local_business_factory_core",
  "integrate_booking_worker",
  "integrate_crm_worker",
  "integrate_notification_worker",
  "integrate_api_integration_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "whatsapp_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q707_consumable_contract",
] as const;
