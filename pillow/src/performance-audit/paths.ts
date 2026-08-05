/** PILLOW-PERFART-001 — Performance Audit (Q11-06). Sixth Q11 acceptance gate. */
export const PERFORMANCE_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PERFORMANCE_AUDIT_SYSTEM.md" as const;
export const PERFORMANCE_AUDIT_ID = "performance-audit" as const;
export const PERFART_METADATA_VERSION = "PERFART-001-v1" as const;
export const PERFORMANCE_AUDIT_REPORT_VERSION = "PERFART-RPT-v1" as const;
export const PERFART_MISSION_ID = "Q11-06" as const;
export const PERFORMANCE_AUDIT_RUNTIME_VERSION = "Q11-PERFART-v1" as const;

export const PERFORMANCE_AUDIT_IDENTITY = {
  workerId: "wkr-performance-audit-01",
  workerName: "Performance Audit",
  workerType: "auditor",
  department: "performance_audit",
  factory: "performance-audit",
  role: "role-auditor-performance-audit",
  reportingLine: ["wkr-performance-audit-01", "pillow"] as string[],
  skillProfile: [
    "skill-performance-component-discovery",
    "skill-worker-performance-testing",
    "skill-factory-performance-testing",
    "skill-runtime-performance-testing",
    "skill-api-load-testing",
    "skill-queue-throughput-testing",
    "skill-concurrent-execution-testing",
    "skill-memory-utilisation-analysis",
    "skill-cpu-utilisation-analysis",
    "skill-database-performance-verification",
    "skill-end-to-end-workflow-benchmarking",
    "skill-bottleneck-detection",
    "skill-performance-trend-history",
    "skill-performance-readiness-classification",
    "skill-performance-audit-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_performance_components",
  "executing_workload_benchmarks",
  "measuring_response_times",
  "measuring_throughput",
  "measuring_resource_utilisation",
  "measuring_scalability",
  "detecting_bottlenecks",
  "verifying_sustained_stability",
  "classifying_performance_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-benchmark structural check outcome — derived strictly from measured evidence. */
export const CHECK_STATUSES = ["Passed", "Partial", "Failed", "Missing"] as const;

/** Dedicated stability catalog — informational alias over CHECK_STATUSES semantics for benchmark stability reporting. */
export const STABILITY_STATUSES = ["stable", "degraded", "unstable", "unknown"] as const;

/** Per-component performance readiness classification. */
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
  "performance_components_discovered",
  "evidence_collected",
  "performance_readiness_assessed",
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
 * Evidence-backed performance benchmark target catalog. Discovery walks
 * this fixed, read-only key list and checks binding presence on injected
 * dependencies only — targets are never invented beyond this catalog, and
 * a catalog entry is only ever reported "discovered" when its
 * corresponding dependency is actually injected.
 */
export const PERFORMANCE_COMPONENT_KEYS = [
  "worker-registry",
  "shared-runtime-core",
  "monitoring-runtime",
  "api-runtime",
  "queue-runtime",
  "scheduling-runtime",
  "audit-runtime",
  "executive-reporting-runtime",
  "production-certification-core",
  "pillow-orchestration-runtime",
] as const;

export const PERFORMANCE_COMPONENT_LABELS: Record<(typeof PERFORMANCE_COMPONENT_KEYS)[number], string> = {
  "worker-registry": "Worker Registry",
  "shared-runtime-core": "Shared Runtime Core",
  "monitoring-runtime": "Monitoring Runtime",
  "api-runtime": "API Runtime",
  "queue-runtime": "Queue Runtime",
  "scheduling-runtime": "Scheduling Runtime",
  "audit-runtime": "Audit Runtime",
  "executive-reporting-runtime": "Executive Reporting Runtime",
  "production-certification-core": "Production Certification Core",
  "pillow-orchestration-runtime": "Pillow Orchestration Runtime",
};

/** Coarse benchmark category per component — used for the LOCKED `componentType` assessment field. */
export const PERFORMANCE_COMPONENT_TYPES: Record<(typeof PERFORMANCE_COMPONENT_KEYS)[number], string> = {
  "worker-registry": "worker_performance_benchmark",
  "shared-runtime-core": "factory_performance_benchmark",
  "monitoring-runtime": "resource_stability_benchmark",
  "api-runtime": "api_load_benchmark",
  "queue-runtime": "queue_throughput_benchmark",
  "scheduling-runtime": "schedule_execution_benchmark",
  "audit-runtime": "audit_trail_benchmark",
  "executive-reporting-runtime": "reporting_benchmark",
  "production-certification-core": "certification_signal_benchmark",
  "pillow-orchestration-runtime": "workflow_benchmark",
};

/** The safe, non-mutating structural probe method invoked for each benchmark target — never business logic. */
export const PERFORMANCE_COMPONENT_PROBES: Record<(typeof PERFORMANCE_COMPONENT_KEYS)[number], string> = {
  "worker-registry": "listWorkers",
  "shared-runtime-core": "getCatalog",
  "monitoring-runtime": "getDashboard",
  "api-runtime": "checkHealth",
  "queue-runtime": "getState",
  "scheduling-runtime": "getState",
  "audit-runtime": "query",
  "executive-reporting-runtime": "getState",
  "production-certification-core": "getCertificationResults",
  "pillow-orchestration-runtime": "getState",
};

/** Components required for a meaningful audit — never fabricated when absent. */
export const REQUIRED_PERFORMANCE_COMPONENT_KEYS = [
  "worker-registry",
  "shared-runtime-core",
  "api-runtime",
] as const;

/** Optional targets — absence never fails the audit outright, only lowers readiness. */
export const OPTIONAL_PERFORMANCE_COMPONENT_KEYS = [
  "monitoring-runtime",
  "queue-runtime",
  "scheduling-runtime",
  "audit-runtime",
  "executive-reporting-runtime",
  "production-certification-core",
  "pillow-orchestration-runtime",
] as const;

export const INTEGRATION_TARGETS = [
  "security_audit",
  "production_certification_core",
  "shared_runtime_core",
  "monitoring_runtime",
  "audit_runtime",
  "queue_runtime",
  "api_runtime",
  "worker_registry",
  "executive_reporting_runtime",
  "pillow_orchestration_runtime",
  "scheduling_runtime",
] as const;

export const PERFART_CAPABILITIES = [
  "discover_performance_components",
  "execute_workload_benchmarks",
  "measure_response_times",
  "measure_throughput",
  "measure_resource_utilisation",
  "measure_scalability",
  "detect_bottlenecks",
  "verify_sustained_stability",
  "classify_performance_readiness",
  "produce_performance_audit_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1107_consumable_contract",
  "consume_q1106_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_benchmark_history",
  "preserve_audit_history",
  "never_fabricate_performance_evidence",
  "never_certify_untested_performance",
  "never_optimize_or_modify_production_systems",
  "never_assume_implementation",
  "never_repair_failed_performance_components",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1107_or_later",
  "integrate_security_audit",
  "integrate_production_certification_core",
  "integrate_shared_runtime_core",
  "integrate_monitoring_runtime",
  "integrate_audit_runtime",
  "integrate_queue_runtime",
  "integrate_api_runtime",
  "integrate_worker_registry",
  "integrate_executive_reporting_runtime",
  "integrate_pillow_orchestration_runtime",
  "integrate_scheduling_runtime",
  "deterministic_audit_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "recovery_management",
  "sixth_q11_gate",
] as const;
