/** PILLOW-BEW-001 — Backend Worker (Q6-05). */
export const BACKEND_WORKER_SYSTEM_PATH = "docs/governance/EMPIREAI_BACKEND_WORKER_SYSTEM.md" as const;
export const BACKEND_WORKER_ID = "backend-worker" as const;
export const BEW_METADATA_VERSION = "BEW-001-v1" as const;
export const BACKEND_WORKER_REPORT_VERSION = "BEW-RPT-v1" as const;
export const BACKEND_WORKER_IDENTITY = {
  workerId: "wkr-backend-01", workerName: "Backend Worker", workerType: "backend_engineer",
  department: "enterprise_platforms", factory: "enterprise-platform-factory", role: "role-backend-builder",
  reportingLine: ["wkr-backend-01", "pillow"] as string[],
} as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "receiving_requirements", "receiving_architecture", "building", "reporting", "validating", "failed"] as const;
export const BACKEND_COMPONENTS = ["rest_apis", "graphql_apis", "authentication", "authorization", "business_logic", "background_workers", "webhooks", "api_clients", "middleware", "validation", "logging", "configuration_management", "unknown"] as const;
export const INTEGRATION_TARGETS = ["worker_registry", "worker_lifecycle", "worker_assignment_engine", "enterprise_platform_factory_core", "requirements_worker", "architecture_worker", "frontend_worker", "executive_reporting_runtime", "worker_performance_review", "worker_recovery_system"] as const;
export const BEW_CAPABILITIES = ["receive_approved_requirements_reports", "receive_approved_architecture_reports", "build_rest_and_graphql_apis", "implement_business_logic", "implement_authentication_and_authorization", "implement_external_api_integrations", "implement_background_workers_and_scheduled_jobs", "implement_validation_and_error_handling", "produce_secure_maintainable_backend_modules", "produce_backend_build_report", "preserve_complete_traceability", "validate_inputs_and_handle_failures_safely"] as const;
export const BEW_INTEGRATION_TARGETS = INTEGRATION_TARGETS;
