import type { PerformanceRegressionRecord } from "./types.js";

/** Performance regression signals and classification (P5-06). */
export const PERFORMANCE_REGRESSION_REGISTRY: PerformanceRegressionRecord[] = [
  { id: "PG-RG-001", signal: "latency_increase", severity: "high", description: "API P95 latency increased > 50% from baseline", detectionMethod: "Snapshot delta vs baseline threshold" },
  { id: "PG-RG-002", signal: "memory_growth", severity: "medium", description: "Heap usage grew > 30% without traffic increase", detectionMethod: "Heap trend over 5 snapshots" },
  { id: "PG-RG-003", signal: "cpu_spike", severity: "high", description: "CPU utilisation exceeded 80% sustained", detectionMethod: "Process CPU sampling" },
  { id: "PG-RG-004", signal: "queue_backlog", severity: "critical", description: "Queue depth growing without drain", detectionMethod: "queueDepth trend + worker status" },
  { id: "PG-RG-005", signal: "database_slowdown", severity: "high", description: "Database query time exceeded critical threshold", detectionMethod: "databaseQueryTimeMs vs PG-BL-007" },
  { id: "PG-RG-006", signal: "worker_slowdown", severity: "medium", description: "Worker execution time increased > 2x", detectionMethod: "workerExecutionTimeMs delta" },
  { id: "PG-RG-007", signal: "api_degradation", severity: "critical", description: "Event loop lag > 500ms or apiHealthy false", detectionMethod: "eventLoopLagMs threshold" },
  { id: "PG-RG-008", signal: "browser_slowdown", severity: "medium", description: "Page load / interactive time exceeded acceptable threshold", detectionMethod: "Browser Truth production probe" },
  { id: "PG-RG-009", signal: "mission_slowdown", severity: "high", description: "Mission generation or duration exceeded critical threshold", detectionMethod: "missionDurationMs vs PG-BL-009" },
  { id: "PG-RG-010", signal: "ai_provider_latency", severity: "medium", description: "LLM round-trip exceeded 45s timeout window", detectionMethod: "aiProviderLatencyMs vs router timeout" },
];
