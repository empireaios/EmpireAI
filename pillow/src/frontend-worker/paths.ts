/** PILLOW-FEW-001 — Frontend Worker (Q6-04). */
export const FRONTEND_WORKER_SYSTEM_PATH = "docs/governance/EMPIREAI_FRONTEND_WORKER_SYSTEM.md" as const;
export const FRONTEND_WORKER_ID = "frontend-worker" as const;
export const FEW_METADATA_VERSION = "FEW-001-v1" as const;
export const FRONTEND_WORKER_REPORT_VERSION = "FEW-RPT-v1" as const;
export const FRONTEND_WORKER_IDENTITY = {
  workerId: "wkr-frontend-01", workerName: "Frontend Worker", workerType: "frontend_engineer",
  department: "enterprise_platforms", factory: "enterprise-platform-factory", role: "role-frontend-builder",
  reportingLine: ["wkr-frontend-01", "pillow"] as string[],
} as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "receiving_requirements", "receiving_architecture", "building", "reporting", "validating", "failed"] as const;
export const UI_COMPONENTS = ["dashboards", "forms", "tables", "lists", "detail_pages", "navigation", "authentication_screens", "settings_pages", "responsive_layouts", "reusable_components", "unknown"] as const;
export const INTEGRATION_TARGETS = ["worker_registry", "worker_lifecycle", "worker_assignment_engine", "enterprise_platform_factory_core", "requirements_worker", "architecture_worker", "executive_reporting_runtime", "worker_performance_review", "worker_recovery_system"] as const;
export const FEW_CAPABILITIES = ["receive_approved_requirements_reports", "receive_approved_architecture_reports", "build_application_layouts", "build_dashboards", "build_pages", "build_forms_and_input_validation", "build_user_workflows", "integrate_approved_apis", "support_responsive_and_accessible_ui", "produce_frontend_build_report", "preserve_complete_traceability", "validate_accessibility_and_responsiveness"] as const;
export const FEW_INTEGRATION_TARGETS = INTEGRATION_TARGETS;
