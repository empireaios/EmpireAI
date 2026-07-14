import type { ExecutionResourceRecord } from "./types.js";

/** ECC resource coordination registry (P6-01). */
export const EXECUTION_RESOURCE_REGISTRY: ExecutionResourceRecord[] = [
  { id: "ECC-RS-001", category: "builder_capacity", name: "Builder", currentCapacity: "Single Builder dispatch · artifact or SDK", coordinationRule: "ECC queues missions · Builder executes one at a time" },
  { id: "ECC-RS-002", category: "runtime_capacity", name: "Brain Runtime", currentCapacity: "Single Railway instance · event-loop cooperative", coordinationRule: "ECC defers execution when event loop lag > 500ms" },
  { id: "ECC-RS-003", category: "worker_capacity", name: "Workers", currentCapacity: "Separate worker.ts · off in API prod", coordinationRule: "ECC routes background tasks to worker process" },
  { id: "ECC-RS-004", category: "queue_capacity", name: "Task Queue", currentCapacity: "Redis Upstash · DegradedTaskQueue fallback", coordinationRule: "ECC blocks queue-heavy missions when Redis degraded" },
  { id: "ECC-RS-005", category: "ai_provider_capacity", name: "AI Providers", currentCapacity: "LLM router · 45s timeout", coordinationRule: "ECC serializes LLM-heavy missions to prevent saturation" },
  { id: "ECC-RS-006", category: "repository_capacity", name: "Repository", currentCapacity: "Memory refresh · intelligence scan", coordinationRule: "ECC refreshes memory before mission generation" },
  { id: "ECC-RS-007", category: "infrastructure_capacity", name: "Infrastructure", currentCapacity: "Vercel + Railway + Upstash", coordinationRule: "ECC incorporates Guardian health into planning" },
];
