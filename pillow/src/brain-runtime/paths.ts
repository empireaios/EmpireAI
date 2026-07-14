/** Canonical Brain Runtime System document (P5-01). */
export const BRAIN_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BRAIN_RUNTIME_SYSTEM.md";

/** Brain architecture companion (P3-01 executor). */
export const BRAIN_ARCHITECTURE_COMPANION_PATH =
  "docs/architecture/EMPIREAI_BRAIN_ARCHITECTURE.md";

/** Runtime audit evidence companion. */
export const BRAIN_RUNTIME_AUDIT_PATH =
  "docs/audits/full-empireai-audit/08_BRAIN_AND_RUNTIME_AUDIT.md";

/** Runtime domains governed by P5-01. */
export const RUNTIME_GOVERNANCE_DOMAINS = [
  "process_lifecycle",
  "memory",
  "workers",
  "queues",
  "event_loop",
  "redis",
  "database",
  "api",
  "authentication",
  "sessions",
  "runtime_health",
  "resource_usage",
  "background_tasks",
] as const;

/** Constitutional runtime principles (P5-01). */
export const RUNTIME_PRINCIPLES = [
  "no_synchronous_blocking",
  "no_event_loop_starvation",
  "no_hidden_bottlenecks",
  "no_silent_degradation",
  "graceful_degradation",
  "independent_subsystem_execution",
  "background_processing_where_appropriate",
] as const;

/** Event-loop lag thresholds (ms). */
export const EVENT_LOOP_THRESHOLDS = {
  healthy: 50,
  degraded: 200,
  blocked: 500,
} as const;

/** Memory pressure thresholds (heap used ratio). */
export const MEMORY_THRESHOLDS = {
  healthy: 0.75,
  degraded: 0.85,
  critical: 0.95,
} as const;
