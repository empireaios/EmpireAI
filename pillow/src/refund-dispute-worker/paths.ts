/** PILLOW-RDW-001 — Refund & Dispute Worker (Q3-12). */
export const REFUND_DISPUTE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REFUND_DISPUTE_WORKER_SYSTEM.md" as const;
export const REFUND_DISPUTE_WORKER_ID = "refund-dispute-worker" as const;
export const RDW_METADATA_VERSION = "RDW-001-v1" as const;
export const REFUND_DISPUTE_REPORT_VERSION = "RDW-RPT-v1" as const;

export const REFUND_DISPUTE_WORKER_IDENTITY = {
  workerId: "wkr-refund-dispute-01",
  workerName: "Refund & Dispute Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-refund-dispute",
  reportingLine: ["wkr-refund-dispute-01", "pillow"] as string[],
  skillProfile: [
    "skill-refund-intake",
    "skill-return-handling",
    "skill-dispute-classification",
    "skill-policy-validation",
    "skill-customer-communications",
    "skill-escalation-routing",
  ],
  approvedTools: ["case_tracker", "policy_validator", "customer_comms"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "classifying",
  "validating",
  "tracking",
  "coordinating",
  "escalating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const CASE_TYPES = [
  "refund",
  "return",
  "exchange",
  "supplier_issue",
  "shipping_issue",
  "damaged_product",
  "missing_item",
  "customer_dispute",
  "chargeback",
  "general_support",
] as const;

export const CASE_STATUSES = [
  "received",
  "under_review",
  "policy_check",
  "awaiting_supplier",
  "awaiting_customer",
  "approved",
  "denied",
  "resolved",
  "escalated",
  "closed",
] as const;

export const POLICY_DECISIONS = ["allow", "deny", "escalate", "review"] as const;

export const EXCEPTION_SEVERITIES = ["info", "warning", "critical"] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "order_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const RDW_CAPABILITIES = [
  "receive_refund_requests",
  "receive_return_requests",
  "receive_customer_disputes",
  "classify_case_types",
  "validate_requests_against_policies",
  "track_case_status",
  "coordinate_with_suppliers_when_required",
  "generate_customer_communications",
  "escalate_exceptional_cases",
  "record_final_case_outcomes",
  "produce_machine_readable_refund_dispute_reports",
  "follow_approved_policies",
  "preserve_complete_case_traceability",
  "preserve_supplier_references",
  "preserve_customer_communication_history",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "escalate_cases_beyond_delegated_authority",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_order_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "refund_dispute_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
