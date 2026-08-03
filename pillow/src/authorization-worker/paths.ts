/** PILLOW-AZW-001 — Authorization Worker (Q6-08). */
export const AUTHORIZATION_WORKER_SYSTEM_PATH = "docs/governance/EMPIREAI_AUTHORIZATION_WORKER_SYSTEM.md" as const;
export const AUTHORIZATION_WORKER_ID = "authorization-worker" as const;
export const AZW_METADATA_VERSION = "AZW-001-v1" as const;
export const AUTHORIZATION_WORKER_REPORT_VERSION = "AZW-RPT-v1" as const;
export const AUTHORIZATION_WORKER_IDENTITY = { workerId: "wkr-authorization-01", workerName: "Authorization Worker", workerType: "authorization_engineer", factory: "enterprise-platform-factory", department: "enterprise_platforms", role: "role-authorization-builder" } as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "building", "reporting", "validating", "failed"] as const;
export const AZW_CAPABILITIES = ["role_management", "permission_management", "policy_based_authorization", "resource_level_authorization", "action_level_authorization", "role_inheritance", "authorization_evaluation", "authorization_audit"] as const;
export const AUTHORIZATION_COMPONENTS = ["roles", "permissions", "policies", "assignments", "evaluator", "audit"] as const;
export const INTEGRATION_TARGETS = ["worker_registry", "worker_lifecycle", "worker_assignment_engine", "enterprise_platform_factory_core", "requirements_worker", "architecture_worker", "backend_worker", "database_worker", "authentication_worker", "executive_reporting_runtime", "audit_runtime", "worker_recovery_system", "worker_performance_review"] as const;
export const AZW_INTEGRATION_TARGETS = INTEGRATION_TARGETS;
