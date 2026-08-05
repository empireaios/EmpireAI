/** PILLOW-BFART-001 — Business Factory Audit (Q11-04). Fourth Q11 acceptance gate. */
export const BUSINESS_FACTORY_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_FACTORY_AUDIT_SYSTEM.md" as const;
export const BUSINESS_FACTORY_AUDIT_ID = "business-factory-audit" as const;
export const BFART_METADATA_VERSION = "BFART-001-v1" as const;
export const BUSINESS_FACTORY_AUDIT_REPORT_VERSION = "BFART-RPT-v1" as const;
export const BFART_MISSION_ID = "Q11-04" as const;
export const BUSINESS_FACTORY_AUDIT_RUNTIME_VERSION = "Q11-BFART-v1" as const;

export const BUSINESS_FACTORY_AUDIT_IDENTITY = {
  workerId: "wkr-business-factory-audit-01",
  workerName: "Business Factory Audit",
  workerType: "auditor",
  department: "business_factory_audit",
  factory: "business-factory-audit",
  role: "role-auditor-business-factory-audit",
  reportingLine: ["wkr-business-factory-audit-01", "pillow"] as string[],
  skillProfile: [
    "skill-factory-discovery",
    "skill-factory-registration-verification",
    "skill-factory-worker-verification",
    "skill-factory-workflow-verification",
    "skill-factory-runtime-integration-verification",
    "skill-factory-external-integration-verification",
    "skill-factory-governance-verification",
    "skill-factory-operational-readiness-verification",
    "skill-business-factory-readiness-classification",
    "skill-business-factory-audit-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_factories",
  "verifying_registration",
  "verifying_workers",
  "verifying_workflows",
  "verifying_runtime_integration",
  "verifying_external_integrations",
  "verifying_governance",
  "verifying_operational_readiness",
  "classifying_business_factory_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-dimension structural check outcome — derived strictly from observed evidence. */
export const CHECK_STATUSES = ["Passed", "Partial", "Failed", "Missing"] as const;

/** Per-factory business factory readiness classification. */
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
  "factories_discovered",
  "evidence_collected",
  "business_factory_readiness_assessed",
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

/** Shared Runtime Core FACTORY_KEYS catalog — duplicated read-only for discovery evidence. Never invented. */
export const FACTORY_KEYS = [
  "workforce-os",
  "workforce",
  "empire-builder-factory",
  "commerce-factory",
  "media-factory",
  "digital-products-factory",
  "enterprise-platform-factory",
  "local-business-factory",
  "affiliate-factory",
  "capital-factory",
] as const;

/** Worker Registry CERTIFICATION_STATUSES catalog — duplicated read-only for governance evidence. */
export const GOVERNED_CERTIFICATION_STATUS = "certified" as const;
export const PARTIAL_CERTIFICATION_STATUS = "pending" as const;

export const INTEGRATION_TARGETS = [
  "pillow_command_audit",
  "production_certification_core",
  "shared_runtime_core",
  "worker_registry",
  "empire_builder_factory_core",
  "commerce_factory_core",
  "media_factory_core",
  "digital_products_factory_core",
  "enterprise_platform_factory_core",
  "local_business_factory_core",
  "affiliate_factory_core",
  "capital_factory_core",
  "pillow_orchestration_runtime",
  "monitoring_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
] as const;

/** Factory keys that require a dedicated *FactoryCore handle for a full registration pass. */
export const DEDICATED_CORE_FACTORY_KEYS = [
  "empire-builder-factory",
  "commerce-factory",
  "media-factory",
  "digital-products-factory",
  "enterprise-platform-factory",
  "local-business-factory",
  "affiliate-factory",
  "capital-factory",
] as const;

/** Factory keys satisfied by Worker Registry + workforce presence — no dedicated *FactoryCore required. */
export const WORKFORCE_FACTORY_KEYS = ["workforce-os", "workforce"] as const;

export const BFART_CAPABILITIES = [
  "discover_business_factories",
  "verify_factory_registration",
  "verify_factory_workers",
  "verify_factory_workflows",
  "verify_factory_runtime_integration",
  "verify_factory_external_integrations",
  "verify_factory_governance",
  "verify_factory_operational_readiness",
  "classify_business_factory_readiness",
  "produce_business_factory_audit_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1105_consumable_contract",
  "consume_q1104_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_audit_history",
  "preserve_audit_history",
  "never_fabricate_audit_evidence",
  "never_certify_incomplete_workflows",
  "never_certify_missing_integrations",
  "never_assume_implementation",
  "never_modify_factory_implementations",
  "never_repair_failed_factories",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1105_or_later",
  "integrate_pillow_command_audit",
  "integrate_production_certification_core",
  "integrate_shared_runtime_core",
  "integrate_worker_registry",
  "integrate_empire_builder_factory_core",
  "integrate_commerce_factory_core",
  "integrate_media_factory_core",
  "integrate_digital_products_factory_core",
  "integrate_enterprise_platform_factory_core",
  "integrate_local_business_factory_core",
  "integrate_affiliate_factory_core",
  "integrate_capital_factory_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_monitoring_runtime",
  "integrate_audit_runtime",
  "integrate_executive_reporting_runtime",
  "deterministic_audit_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "recovery_management",
  "fourth_q11_gate",
] as const;
