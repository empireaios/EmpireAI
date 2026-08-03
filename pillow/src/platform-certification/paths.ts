export const PFC_INTEGRATION_TARGETS = [
  "worker_registry", "worker_lifecycle", "worker_assignment_engine", "worker_monitoring",
  "worker_performance_review", "worker_recovery_system", "enterprise_platform_factory_core",
  "requirements_worker", "architecture_worker", "frontend_worker", "backend_worker",
  "database_worker", "authentication_worker", "authorization_worker", "billing_worker",
  "api_integration_worker", "workflow_builder_worker", "notification_worker", "testing_worker",
  "deployment_worker", "executive_reporting_runtime", "audit_runtime", "monitoring_runtime",
  "recovery_runtime", "pillow_orchestration", "approval_governance",
] as const;
export const PFC_CAPABILITIES = ["repository_evidence", "worker_probing", "negative_safety_checks", "controlled_e2e", "evidence_based_certification"] as const;
export const ENGINE_STATUSES = ["idle", "ready", "connected", "certifying", "failed"] as const;
export const CERTIFICATION_STATUSES = ["Certified", "Conditionally_Certified", "Partially_Implemented", "Failed", "Missing"] as const;
export const CERTIFICATION_DIMENSIONS = ["implementation", "prior_certification", "runtime", "capability", "safety", "governance"] as const;
export const NEGATIVE_CHECKS = ["invalid_requirements", "unauthorized_access", "invalid_login", "fabricate_payment", "transport_failure", "workflow_failure", "notification_failure", "testing_default_fail", "deployment_failure", "grand_king_approval"] as const;
export const Q6_MISSION_CATALOG = [
  ["Q6-01", "enterprise-platform-factory-core", "pillow/src/enterprise-platform-factory-core/", "enterprisePlatformFactoryCore"],
  ["Q6-02", "requirements-worker", "pillow/src/requirements-worker/", "requirementsWorker"],
  ["Q6-03", "architecture-worker", "pillow/src/architecture-worker/", "architectureWorker"],
  ["Q6-04", "frontend-worker", "pillow/src/frontend-worker/", "frontendWorker"],
  ["Q6-05", "backend-worker", "pillow/src/backend-worker/", "backendWorker"],
  ["Q6-06", "database-worker", "pillow/src/database-worker/", "databaseWorker"],
  ["Q6-07", "authentication-worker", "pillow/src/authentication-worker/", "authenticationWorker"],
  ["Q6-08", "authorization-worker", "pillow/src/authorization-worker/", "authorizationWorker"],
  ["Q6-09", "billing-worker", "pillow/src/billing-worker/", "billingWorker"],
  ["Q6-10", "api-integration-worker", "pillow/src/api-integration-worker/", "apiIntegrationWorker"],
  ["Q6-11", "workflow-builder-worker", "pillow/src/workflow-builder-worker/", "workflowBuilderWorker"],
  ["Q6-12", "notification-worker", "pillow/src/notification-worker/", "notificationWorker"],
  ["Q6-13", "testing-worker", "pillow/src/testing-worker/", "testingWorker"],
  ["Q6-14", "deployment-worker", "pillow/src/deployment-worker/", "deploymentWorker"],
] as const;
export const PFC_METADATA_VERSION = "PFC-001-v1";
export const PFC_REPORT_VERSION = "PFC-RPT-v1";
export const PLATFORM_CERTIFICATION_SYSTEM_PATH = "docs/governance/EMPIREAI_PLATFORM_CERTIFICATION_SYSTEM.md";
