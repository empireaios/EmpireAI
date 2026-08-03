/** PILLOW-ORW-001 — Order Worker (Q3-11). */
export const ORDER_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ORDER_WORKER_SYSTEM.md" as const;
export const ORDER_WORKER_ID = "order-worker" as const;
export const ORW_METADATA_VERSION = "ORW-001-v1" as const;
export const ORDER_REPORT_VERSION = "ORW-RPT-v1" as const;

export const ORDER_WORKER_IDENTITY = {
  workerId: "wkr-order-01",
  workerName: "Order Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-order",
  reportingLine: ["wkr-order-01", "pillow"] as string[],
  skillProfile: [
    "skill-order-routing",
    "skill-fulfilment-tracking",
    "skill-shipment-tracking",
    "skill-exception-detection",
    "skill-customer-status-updates",
  ],
  approvedTools: ["order_ledger", "fulfilment_tracker", "exception_detector"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "routing",
  "tracking",
  "detecting",
  "escalating",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const ORDER_STATUSES = [
  "received",
  "awaiting_fulfilment",
  "processing",
  "fulfilled",
  "shipped",
  "delivered",
  "delayed",
  "exception",
  "cancelled",
  "closed",
] as const;

export const FULFILMENT_STATUSES = [
  "pending",
  "awaiting_supplier",
  "in_progress",
  "fulfilled",
  "failed",
  "cancelled",
] as const;

export const SHIPPING_STATUSES = [
  "not_shipped",
  "preparing",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delayed",
  "failed",
  "returned",
] as const;

export const EXCEPTION_SEVERITIES = ["info", "warning", "critical"] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "inventory_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const ORW_CAPABILITIES = [
  "receive_confirmed_customer_orders",
  "route_orders_to_supplier",
  "track_fulfilment_status",
  "track_shipment_status",
  "detect_fulfilment_exceptions",
  "detect_delayed_orders",
  "detect_failed_fulfilment",
  "generate_customer_status_updates",
  "escalate_critical_order_issues",
  "maintain_complete_order_history",
  "produce_machine_readable_order_reports",
  "preserve_complete_order_traceability",
  "preserve_fulfilment_history",
  "preserve_supplier_references",
  "detect_operational_exceptions",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_alter_financial_records",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_inventory_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "order_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
