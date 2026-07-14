import type { PerformanceBottleneckRecord } from "./types.js";

/** Known performance bottlenecks across EmpireAI (P5-06). */
export const PERFORMANCE_BOTTLENECK_REGISTRY: PerformanceBottleneckRecord[] = [
  { id: "PG-BN-001", domain: "brain_runtime", severity: "high", description: "200+ tool registration at Brain boot", source: "BR-BN-003" },
  { id: "PG-BN-002", domain: "database", severity: "high", description: "Sync fs.readFileSync on SQLite cold load", source: "BR-BN-001" },
  { id: "PG-BN-003", domain: "queues", severity: "critical", description: "DegradedTaskQueue when Redis unavailable", source: "BR-BN-004" },
  { id: "PG-BN-004", domain: "pillow", severity: "high", description: "Sequential startPillow() ~25 init steps", source: "BR-BN-006" },
  { id: "PG-BN-005", domain: "api", severity: "medium", description: "Full orchestrator path blocks on LLM + tools", source: "BR-BN-007" },
  { id: "PG-BN-006", domain: "pillow", severity: "medium", description: "routePrompt blocks on full command pipeline + LLM", source: "BR-BN-008" },
  { id: "PG-BN-007", domain: "workers", severity: "high", description: "Workers disabled at production API boot", source: "BR-BN-005" },
  { id: "PG-BN-008", domain: "database", severity: "high", description: "SQLite single-writer limits concurrent queries", source: "SCL-BN-001" },
  { id: "PG-BN-009", domain: "sessions", severity: "medium", description: "Ephemeral Pillow chat sessions without durable restore", source: "SCL-BN-002" },
  { id: "PG-BN-010", domain: "ai_providers", severity: "medium", description: "LLM latency dominates Pillow response time", source: "Runtime observation" },
];
