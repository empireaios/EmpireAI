/** PILLOW-OPSW-001 — Operations Worker (Q7-09). */
export const OPERATIONS_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_OPERATIONS_WORKER_SYSTEM.md" as const;
export const OPERATIONS_WORKER_ID = "operations-worker" as const;
export const OPSW_METADATA_VERSION = "OPSW-001-v1" as const;
export const OPERATIONS_REPORT_VERSION = "OPSW-RPT-v1" as const;

export const OPERATIONS_WORKER_IDENTITY = {
  workerId: "wkr-operations-01",
  workerName: "Operations Worker",
  workerType: "operations",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-ops-operations",
  reportingLine: ["wkr-operations-01", "pillow"] as string[],
  skillProfile: [
    "skill-service-delivery-workflow-design",
    "skill-operational-stage-definition",
    "skill-technician-assignment-design",
    "skill-fulfilment-checklist-design",
    "skill-qa-checkpoint-design",
    "skill-escalation-workflow-design",
    "skill-completion-workflow-design",
    "skill-follow-up-workflow-design",
    "skill-operations-reporting",
  ],
  approvedTools: ["operations_workflow_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_booking",
  "designing_workflow",
  "defining_stages",
  "assigning_technician",
  "building_checklist",
  "defining_qa_checkpoints",
  "defining_escalation",
  "defining_completion",
  "defining_follow_up",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Operational stage vocabulary — extensible. Ops designs the workflow structure only;
 * it never records that a stage was actually executed against a real customer.
 */
export const OPERATIONAL_STAGES = [
  "job_preparation",
  "technician_assignment",
  "dispatch",
  "arrival",
  "service_execution",
  "quality_inspection",
  "customer_sign_off",
  "completion",
  "follow_up",
  "escalation",
  "cancellation",
  "exception",
] as const;

export const AUDIT_STATUSES = [
  "draft",
  "workflow_designed",
  "stages_defined",
  "ready_for_q710",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "booking_worker",
  "crm_worker",
  "whatsapp_worker",
  "lead_generation_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const OPSW_CAPABILITIES = [
  "consume_approved_booking",
  "generate_service_delivery_workflow",
  "define_operational_stages",
  "define_technician_assignment_workflow",
  "define_fulfilment_checklist",
  "define_qa_checkpoints",
  "define_escalation_workflow",
  "define_completion_workflow",
  "define_follow_up_workflow",
  "produce_operations_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_operational_traceability",
  "preserve_workflow_audit_history",
  "never_perform_customer_services",
  "never_replace_booking_worker",
  "never_replace_crm_worker",
  "never_replace_lead_generation_worker",
  "never_fabricate_operational_evidence",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q710_or_later",
  "integrate_local_business_factory_core",
  "integrate_booking_worker",
  "integrate_crm_worker",
  "integrate_whatsapp_worker",
  "integrate_lead_generation_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "operations_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q710_consumable_contract",
] as const;
