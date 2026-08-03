/** PILLOW-SEW-001 — Supplier Evaluation Worker (Q3-05). */
export const SUPPLIER_EVALUATION_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_EVALUATION_WORKER_SYSTEM.md" as const;
export const SUPPLIER_EVALUATION_WORKER_ID = "supplier-evaluation-worker" as const;
export const SEW_METADATA_VERSION = "SEW-001-v1" as const;
export const SUPPLIER_EVALUATION_REPORT_VERSION = "SEW-RPT-v1" as const;

export const SUPPLIER_EVALUATION_WORKER_IDENTITY = {
  workerId: "wkr-supplier-evaluation-01",
  workerName: "Supplier Evaluation Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-supplier-evaluation",
  reportingLine: ["wkr-supplier-evaluation-01", "pillow"] as string[],
  skillProfile: [
    "skill-supplier-reliability",
    "skill-price-scoring",
    "skill-shipping-evaluation",
    "skill-fulfilment-quality",
    "skill-supplier-risk",
  ],
  approvedTools: ["evaluation_ledger", "evidence_scoring", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "scoring",
  "recommending",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const RECOMMENDATIONS = ["Approve", "Review", "Reject"] as const;

export const SCORE_DIMENSIONS = [
  "reliability",
  "price",
  "shipping",
  "refund_policy",
  "fulfilment_quality",
  "communication",
  "risk",
  "overall",
] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "supplier_discovery_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const SEW_CAPABILITIES = [
  "receive_supplier_discovery_reports",
  "evaluate_supplier_reliability",
  "evaluate_product_pricing",
  "evaluate_shipping_capability",
  "evaluate_refund_and_return_policy",
  "evaluate_fulfilment_quality",
  "evaluate_communication_quality",
  "evaluate_operational_risk",
  "generate_overall_supplier_score",
  "recommend_approve_review_or_reject",
  "produce_machine_readable_supplier_evaluation_reports",
  "base_evaluations_on_evidence",
  "preserve_traceability_to_supplier_discovery",
  "preserve_audit_history",
  "distinguish_facts_from_assumptions",
  "produce_confidence_scores",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_supplier_discovery_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "supplier_evaluation_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
