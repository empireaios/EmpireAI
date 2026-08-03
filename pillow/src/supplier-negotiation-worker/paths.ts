/** PILLOW-SNW-001 — Supplier Negotiation Worker (Q3-06). */
export const SUPPLIER_NEGOTIATION_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_NEGOTIATION_WORKER_SYSTEM.md" as const;
export const SUPPLIER_NEGOTIATION_WORKER_ID = "supplier-negotiation-worker" as const;
export const SNW_METADATA_VERSION = "SNW-001-v1" as const;
export const SUPPLIER_NEGOTIATION_REPORT_VERSION = "SNW-RPT-v1" as const;

export const SUPPLIER_NEGOTIATION_WORKER_IDENTITY = {
  workerId: "wkr-supplier-negotiation-01",
  workerName: "Supplier Negotiation Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-supplier-negotiation",
  reportingLine: ["wkr-supplier-negotiation-01", "pillow"] as string[],
  skillProfile: [
    "skill-supplier-comparison",
    "skill-moq-negotiation",
    "skill-price-negotiation",
    "skill-shipping-terms",
    "skill-professional-messaging",
  ],
  approvedTools: ["negotiation_ledger", "comparison_analysis", "message_drafting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "comparing",
  "preparing",
  "recommending",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const RECOMMENDATIONS = ["Prefer", "Review", "Defer"] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "supplier_evaluation_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const SNW_CAPABILITIES = [
  "receive_supplier_evaluation_reports",
  "compare_multiple_suppliers",
  "identify_negotiation_opportunities",
  "prepare_moq_negotiation_questions",
  "prepare_pricing_negotiation_questions",
  "prepare_shipping_term_negotiations",
  "prepare_fulfilment_capability_questions",
  "prepare_refund_and_warranty_clarification",
  "prepare_professional_negotiation_messages",
  "recommend_preferred_supplier",
  "produce_machine_readable_supplier_negotiation_reports",
  "preserve_complete_supplier_traceability",
  "base_negotiations_on_supplier_evaluation_results",
  "produce_professional_communication",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_contact_suppliers_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_supplier_evaluation_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "supplier_negotiation_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
