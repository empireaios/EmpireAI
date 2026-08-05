/** PILLOW-SECART-001 — Security Audit (Q11-05). Fifth Q11 acceptance gate. */
export const SECURITY_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SECURITY_AUDIT_SYSTEM.md" as const;
export const SECURITY_AUDIT_ID = "security-audit" as const;
export const SECART_METADATA_VERSION = "SECART-001-v1" as const;
export const SECURITY_AUDIT_REPORT_VERSION = "SECART-RPT-v1" as const;
export const SECART_MISSION_ID = "Q11-05" as const;
export const SECURITY_AUDIT_RUNTIME_VERSION = "Q11-SECART-v1" as const;

export const SECURITY_AUDIT_IDENTITY = {
  workerId: "wkr-security-audit-01",
  workerName: "Security Audit",
  workerType: "auditor",
  department: "security_audit",
  factory: "security-audit",
  role: "role-auditor-security-audit",
  reportingLine: ["wkr-security-audit-01", "pillow"] as string[],
  skillProfile: [
    "skill-security-component-discovery",
    "skill-authentication-verification",
    "skill-authorization-verification",
    "skill-rbac-verification",
    "skill-secret-management-verification",
    "skill-environment-configuration-verification",
    "skill-api-security-verification",
    "skill-token-validation-verification",
    "skill-encryption-verification",
    "skill-data-protection-verification",
    "skill-runtime-security-verification",
    "skill-operational-security-verification",
    "skill-security-readiness-classification",
    "skill-security-audit-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_security_components",
  "verifying_authentication",
  "verifying_authorization",
  "verifying_role_permission_enforcement",
  "verifying_secret_management",
  "verifying_api_security",
  "verifying_data_protection",
  "verifying_runtime_security",
  "verifying_operational_security",
  "classifying_security_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-dimension structural check outcome — derived strictly from observed evidence. */
export const CHECK_STATUSES = ["Passed", "Partial", "Failed", "Missing"] as const;

/** Per-component security readiness classification. */
export const READINESS_CLASSIFICATIONS = [
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
] as const;

/** Overall audit decision. */
export const READINESS_DECISIONS = ["certify", "withhold", "escalate", "defer"] as const;

export const AUDIT_STATUSES = [
  "draft",
  "security_components_discovered",
  "evidence_collected",
  "security_readiness_assessed",
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
  "submitted",
  "rejected",
  "unknown",
] as const;

/**
 * Evidence-backed security component catalog. Discovery walks this fixed,
 * read-only key list and checks binding presence on injected dependencies
 * only — components are never invented beyond this catalog, and a
 * catalog entry is only ever reported "discovered" when its corresponding
 * dependency is actually injected.
 */
export const SECURITY_COMPONENT_KEYS = [
  "authentication-worker",
  "authorization-worker",
  "authority-matrix",
  "api-runtime",
  "audit-runtime",
  "monitoring-runtime",
  "production-certification-core",
  "executive-reporting-runtime",
  "tool-runtime",
  "secret-management",
] as const;

export const SECURITY_COMPONENT_LABELS: Record<(typeof SECURITY_COMPONENT_KEYS)[number], string> = {
  "authentication-worker": "Authentication Worker",
  "authorization-worker": "Authorization Worker",
  "authority-matrix": "Authority Matrix",
  "api-runtime": "API Runtime",
  "audit-runtime": "Audit Runtime",
  "monitoring-runtime": "Monitoring Runtime",
  "production-certification-core": "Production Certification Core",
  "executive-reporting-runtime": "Executive Reporting Runtime",
  "tool-runtime": "Tool Runtime",
  "secret-management": "Secret Management",
};

/** Coarse security category per component — used for the LOCKED `componentType` assessment field. */
export const SECURITY_COMPONENT_TYPES: Record<(typeof SECURITY_COMPONENT_KEYS)[number], string> = {
  "authentication-worker": "identity_provider",
  "authorization-worker": "access_control",
  "authority-matrix": "access_control",
  "api-runtime": "network_security",
  "audit-runtime": "audit_logging",
  "monitoring-runtime": "operational_monitoring",
  "production-certification-core": "certification_signal",
  "executive-reporting-runtime": "reporting",
  "tool-runtime": "network_security",
  "secret-management": "secret_management",
};

/** Components required for a meaningful audit — never fabricated when absent. */
export const REQUIRED_SECURITY_COMPONENT_KEYS = [
  "authentication-worker",
  "authorization-worker",
  "api-runtime",
] as const;

/** Optional cores — absence never fails the audit outright, only lowers readiness. */
export const OPTIONAL_SECURITY_COMPONENT_KEYS = [
  "authority-matrix",
  "audit-runtime",
  "monitoring-runtime",
  "production-certification-core",
  "executive-reporting-runtime",
  "tool-runtime",
  "secret-management",
] as const;

export const INTEGRATION_TARGETS = [
  "business_factory_audit",
  "production_certification_core",
  "authentication_worker",
  "authorization_worker",
  "authority_matrix",
  "api_runtime",
  "tool_runtime",
  "monitoring_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
  "shared_runtime_core",
  "worker_registry",
  "pillow_orchestration_runtime",
] as const;

export const SECART_CAPABILITIES = [
  "discover_security_components",
  "verify_authentication",
  "verify_authorization",
  "verify_role_permission_enforcement",
  "verify_secret_management",
  "verify_environment_configuration",
  "verify_api_security",
  "verify_token_validation",
  "verify_encryption_capability",
  "verify_data_protection",
  "verify_runtime_security",
  "verify_operational_security",
  "classify_security_readiness",
  "produce_security_audit_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1106_consumable_contract",
  "consume_q1105_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_audit_history",
  "preserve_audit_history",
  "never_fabricate_security_evidence",
  "never_certify_insecure_implementations",
  "never_expose_secrets_during_auditing",
  "never_assume_implementation",
  "never_modify_security_implementations",
  "never_repair_failed_security_components",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1106_or_later",
  "integrate_business_factory_audit",
  "integrate_production_certification_core",
  "integrate_authentication_worker",
  "integrate_authorization_worker",
  "integrate_authority_matrix",
  "integrate_api_runtime",
  "integrate_tool_runtime",
  "integrate_monitoring_runtime",
  "integrate_audit_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_worker_registry",
  "integrate_pillow_orchestration_runtime",
  "deterministic_audit_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "recovery_management",
  "fifth_q11_gate",
] as const;
