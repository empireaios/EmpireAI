/** PILLOW-MEMRT-001 — Memory Runtime (Q10-05). */
export const MEMORY_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MEMORY_RUNTIME_SYSTEM.md" as const;
export const MEMORY_RUNTIME_ID = "memory-runtime" as const;
export const MEMRT_METADATA_VERSION = "MEMRT-001-v1" as const;
export const MEMRT_REPORT_VERSION = "MEMRT-RPT-v1" as const;
export const MEMRT_RUNTIME_VERSION = "Q10-MEMRT-v1" as const;
export const MEMRT_MISSION_ID = "Q10-05" as const;

export const MEMORY_RUNTIME_IDENTITY = {
  workerId: "wkr-memory-runtime-01",
  workerName: "Memory Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-memory",
  role: "role-coordinator-memory-runtime",
  reportingLine: ["wkr-memory-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-operational-memory",
    "skill-decision-history",
    "skill-memory-versioning",
    "skill-context-retrieval",
    "skill-memory-lineage",
    "skill-memory-reporting",
    "skill-memory-traceability",
    "skill-governance-classification",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "queue_runtime",
    "worker_registry",
    "executive_reporting_runtime",
    "audit_runtime",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const MEMORY_TYPES = [
  "operational",
  "decision_history",
  "mission_history",
  "worker_execution_history",
  "runtime_context",
  "previous_result",
  "reusable_knowledge",
  "custom_extension",
] as const;

export const GOVERNANCE_CLASSES = [
  "public_runtime",
  "internal",
  "restricted",
  "grand_king_only",
] as const;

export const RETENTION_STATUSES = [
  "active",
  "archived",
  "superseded",
  "pending_review",
  "restricted_hold",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "storing",
  "retrieving",
  "indexing",
  "reporting",
  "failed",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "unavailable"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const INTEGRATION_TARGETS = [
  "shared_runtime_core",
  "pillow_orchestration_runtime",
  "mission_runtime",
  "queue_runtime",
  "worker_registry",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
  "recovery",
] as const;

export const MEMRT_CAPABILITIES = [
  "store_operational_memory",
  "retrieve_operational_memory",
  "store_decision_history",
  "retrieve_decision_history",
  "retrieve_previous_results",
  "provide_runtime_context",
  "version_memory_entries",
  "track_memory_lineage",
  "index_context_keys",
  "query_memory_deterministic",
  "collect_metrics",
  "produce_memory_runtime_reports",
  "preserve_complete_traceability",
  "preserve_historical_memory",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_worker_registry",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "q1006_consumable_contract",
  "health_monitoring",
] as const;
