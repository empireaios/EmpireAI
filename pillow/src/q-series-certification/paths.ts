/** PILLOW-QSCRT-001 — Q Series Certification (Q11-12). */
export const Q_SERIES_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_Q_SERIES_CERTIFICATION_SYSTEM.md" as const;
export const Q_SERIES_CERTIFICATION_ID = "q-series-certification" as const;
export const QSCRT_METADATA_VERSION = "QSCRT-001-v1" as const;
export const Q_SERIES_CERTIFICATION_REPORT_VERSION = "QSCRT-RPT-v1" as const;
export const QSCRT_MISSION_ID = "Q11-12" as const;
export const Q_SERIES_CERTIFICATION_RUNTIME_VERSION = "Q11-QSCRT-v1" as const;

export const Q_SERIES_CERTIFICATION_IDENTITY = {
  workerId: "wkr-q-series-certification-01",
  workerName: "Q Series Certification",
  workerType: "certify",
  department: "q_series_certification",
  factory: "q-series-certification",
  role: "role-certify-q-series",
  reportingLine: ["wkr-q-series-certification-01", "pillow"] as string[],
  skillProfile: [
    "skill-factory-discovery",
    "skill-worker-verification",
    "skill-runtime-verification",
    "skill-cross-factory-orchestration-verification",
    "skill-governance-compliance-verification",
    "skill-production-readiness-verification",
    "skill-certification-evidence-aggregation",
    "skill-q-series-readiness-classification",
    "skill-q-series-certification-reporting",
  ],
  approvedTools: ["injected_evidence_only", "structured_reporting"],
  authorityLevel: "evidence_only_certification",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering",
  "verifying",
  "aggregating",
  "classifying",
  "reporting",
  "validating",
  "blocked",
  "standby",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;

export const CERTIFICATION_CLASSIFICATIONS = [
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
] as const;

export const CERTIFICATION_DECISIONS = ["certify", "withhold", "escalate", "defer"] as const;

export const INTEGRATION_TARGETS = [
  "post_launch_monitoring",
  "production_certification_core",
  "shared_runtime_certification",
  "worker_readiness_audit",
  "pillow_command_audit",
  "business_factory_audit",
  "security_audit",
  "performance_audit",
  "recovery_audit",
  "executive_acceptance_pack",
  "grand_king_acceptance_gate",
  "shared_runtime_core",
  "worker_registry",
  "pillow_orchestration_runtime",
  "executive_reporting_runtime",
  "audit_runtime",
  "monitoring_runtime",
  "recovery_runtime",
  "api_runtime",
  "queue_runtime",
  "scheduling_runtime",
] as const;

export const Q11_AUDIT_SOURCES = [
  "worker-readiness-audit",
  "pillow-command-audit",
  "business-factory-audit",
  "security-audit",
  "performance-audit",
  "recovery-audit",
  "financial-readiness-audit",
] as const;

export const Q11_CERTIFICATION_SOURCES = [
  "production-certification-core",
  "shared-runtime-certification",
] as const;

export const QSCRT_CAPABILITIES = [
  "discover_factories",
  "verify_workers",
  "verify_runtimes",
  "verify_cross_factory_orchestration",
  "verify_governance_compliance",
  "verify_production_readiness",
  "aggregate_certification_evidence",
  "classify_q_series_readiness",
  "produce_q_series_certification_report",
  "certify_q_series",
  "consume_q1112_consumable_contract",
  "expose_q1113_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_certification_history",
  "never_fabricate_certification_evidence",
  "never_certify_missing_functionality",
  "never_bypass_governance",
  "never_override_grand_king",
  "never_override_pillow",
  "never_implement_q1113_or_later",
  "deterministic_certification_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "twelfth_q11_gate",
] as const;
