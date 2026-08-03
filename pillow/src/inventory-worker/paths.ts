/** PILLOW-INW-001 — Inventory Worker (Q3-10). */
export const INVENTORY_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_INVENTORY_WORKER_SYSTEM.md" as const;
export const INVENTORY_WORKER_ID = "inventory-worker" as const;
export const INW_METADATA_VERSION = "INW-001-v1" as const;
export const INVENTORY_REPORT_VERSION = "INW-RPT-v1" as const;

export const INVENTORY_WORKER_IDENTITY = {
  workerId: "wkr-inventory-01",
  workerName: "Inventory Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-inventory",
  reportingLine: ["wkr-inventory-01", "pillow"] as string[],
  skillProfile: [
    "skill-stock-monitoring",
    "skill-reorder-point-calculation",
    "skill-lead-time-tracking",
    "skill-supplier-availability-monitoring",
    "skill-inventory-alert-generation",
  ],
  approvedTools: ["inventory_ledger", "reorder_calculator", "stock_alert_engine"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "monitoring",
  "calculating",
  "detecting",
  "alerting",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock", "unknown"] as const;
export const SUPPLIER_AVAILABILITIES = [
  "available",
  "limited",
  "unavailable",
  "unknown",
] as const;
export const ALERT_SEVERITIES = ["info", "warning", "critical"] as const;

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

export const INW_CAPABILITIES = [
  "receive_approved_products",
  "monitor_supplier_stock_availability",
  "monitor_inventory_quantities",
  "monitor_lead_times",
  "monitor_supplier_availability",
  "calculate_reorder_points",
  "detect_low_stock_conditions",
  "detect_out_of_stock_conditions",
  "detect_abnormal_inventory_changes",
  "generate_inventory_alerts",
  "produce_machine_readable_inventory_reports",
  "preserve_inventory_traceability",
  "preserve_supplier_references",
  "preserve_inventory_history",
  "generate_alerts_for_critical_inventory_events",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_modify_supplier_inventory_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_supplier_evaluation_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "inventory_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
