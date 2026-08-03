/** PILLOW-ATW-001 — Authentication Worker (Q6-07). */
export const AUTHENTICATION_WORKER_SYSTEM_PATH = "docs/governance/EMPIREAI_AUTHENTICATION_WORKER_SYSTEM.md" as const;
export const AUTHENTICATION_WORKER_ID = "authentication-worker" as const;
export const ATW_METADATA_VERSION = "ATW-001-v1" as const;
export const AUTHENTICATION_WORKER_REPORT_VERSION = "ATW-RPT-v1" as const;
export const AUTHENTICATION_WORKER_IDENTITY = {
  workerId: "wkr-authentication-01", workerName: "Authentication Worker", workerType: "authentication_engineer",
  factory: "enterprise-platform-factory", department: "enterprise_platforms", role: "role-authentication-builder",
} as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "building", "reporting", "validating", "failed"] as const;
export const AUTHENTICATION_METHODS = ["password_scrypt", "opaque_session", "password_recovery", "account_verification"] as const;
export const INTEGRATION_TARGETS = ["worker_registry", "worker_lifecycle", "worker_assignment_engine", "enterprise_platform_factory_core", "requirements_worker", "architecture_worker", "backend_worker", "database_worker", "executive_reporting_runtime", "worker_performance_review", "worker_recovery_system", "audit_runtime", "approved_notification_capability"] as const;
export const ATW_INTEGRATION_TARGETS = INTEGRATION_TARGETS;
export const ATW_CAPABILITIES = ["account_registration", "secure_login_logout", "opaque_session_lifecycle", "scrypt_password_storage", "password_recovery", "account_verification", "authentication_protection", "authentication_audit"] as const;
