/** Canonical Performance Governance (P5-06). */
export const PERFORMANCE_GOVERNANCE_PATH =
  "docs/governance/EMPIREAI_PERFORMANCE_GOVERNANCE.md";

/** Scaling Architecture companion (P5-05). */
export const SCALING_ARCHITECTURE_COMPANION_PATH =
  "docs/governance/EMPIREAI_SCALING_ARCHITECTURE.md";

/** Guardian Monitoring companion (P5-04). */
export const GUARDIAN_MONITORING_COMPANION_PATH =
  "docs/governance/EMPIREAI_GUARDIAN_MONITORING_SYSTEM.md";

/** Brain Runtime companion (P5-01). */
export const BRAIN_RUNTIME_COMPANION_PATH =
  "docs/governance/EMPIREAI_BRAIN_RUNTIME_SYSTEM.md";

/** Performance principles (P5-06). */
export const PERFORMANCE_PRINCIPLES = [
  "Performance shall be measurable",
  "Performance shall be explainable",
  "Performance shall never sacrifice correctness",
  "Performance shall never violate constitutional governance",
  "Performance improvements shall remain traceable",
  "Performance regressions shall never remain invisible",
  "Performance exists for Grand King experience — not optimization for its own sake",
  "Performance governance preserves constitutional integrity",
] as const;

/** Governed performance domains (P5-06). */
export const PERFORMANCE_DOMAINS = [
  "brain_runtime",
  "pillow",
  "builder",
  "supervisor",
  "guardian",
  "cockpit",
  "journey",
  "authentication",
  "sessions",
  "database",
  "redis",
  "queues",
  "workers",
  "storage",
  "network",
  "api",
  "business_engines",
  "commerce",
  "production_infrastructure",
  "ai_providers",
] as const;

/** Continuously measured metrics (P5-06). */
export const PERFORMANCE_METRICS = [
  "api_response_time",
  "page_load_time",
  "interactive_response_time",
  "authentication_time",
  "session_recovery_time",
  "queue_latency",
  "worker_execution_time",
  "mission_duration",
  "mission_throughput",
  "database_query_time",
  "redis_latency",
  "memory_usage",
  "cpu_usage",
  "network_latency",
  "ai_provider_latency",
  "production_availability",
] as const;

/** Regression severity classifications (P5-06). */
export const REGRESSION_SEVERITIES = ["low", "medium", "high", "critical"] as const;

/** Phase P5 mission IDs for completion review. */
export const PHASE_P5_MISSIONS = [
  "P5-01",
  "P5-02",
  "P5-03",
  "P5-04",
  "P5-05",
  "P5-06",
] as const;
