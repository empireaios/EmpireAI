import type { RuntimeBottleneck } from "./types.js";

/** Canonical registry of known Brain runtime bottlenecks (P5-01). */
export const RUNTIME_BOTTLENECK_REGISTRY: RuntimeBottleneck[] = [
  {
    id: "BR-BN-001",
    category: "database",
    severity: "high",
    location: "backend/src/brain/sqlite-database.ts",
    description: "Sync fs.readFileSync on cold DB load blocks event loop",
    mitigation: "Async load + cooperativeYield at boot; debounced persist (250ms)",
    blocking: true,
  },
  {
    id: "BR-BN-002",
    category: "database",
    severity: "medium",
    location: "backend/src/brain/database.ts",
    description: "Large sync schema migration on first getDatabase()",
    mitigation: "Defer migration; yield during bootstrapFoundation",
    blocking: true,
  },
  {
    id: "BR-BN-003",
    category: "process_lifecycle",
    severity: "high",
    location: "backend/src/brain/index.ts",
    description: "200+ tool registration at createBrain() extends startup",
    mitigation: "earlyListen + deferred extension routes",
    blocking: false,
  },
  {
    id: "BR-BN-004",
    category: "queues",
    severity: "critical",
    location: "backend/src/brain/task-queue.ts",
    description: "DegradedTaskQueue no-op when Redis unavailable",
    mitigation: "Require Redis in production; run worker.ts process",
    blocking: true,
  },
  {
    id: "BR-BN-005",
    category: "workers",
    severity: "high",
    location: "backend/src/app.ts",
    description: "Workers/scheduler disabled at production API boot",
    mitigation: "Separate worker.ts process with startWorkers: true",
    blocking: false,
  },
  {
    id: "BR-BN-006",
    category: "event_loop",
    severity: "high",
    location: "pillow/src/session.ts",
    description: "Sequential startPillow() chain (~25 init steps)",
    mitigation: "yieldEventLoop between engines; lazy prod Pillow boot",
    blocking: true,
  },
  {
    id: "BR-BN-007",
    category: "api",
    severity: "medium",
    location: "POST /brain/dispatch",
    description: "Full orchestrator path can block on LLM + tools",
    mitigation: "LLM timeout 45s; cooperativeYield in executive-home",
    blocking: true,
  },
  {
    id: "BR-BN-008",
    category: "background_tasks",
    severity: "medium",
    location: "backend/src/orchestration/pillow-host/pillow-host.ts",
    description: "routePrompt blocks on full command pipeline + LLM",
    mitigation: "Async dispatch; event-loop capacity wait",
    blocking: true,
  },
];

export function getBlockingBottlenecks(): RuntimeBottleneck[] {
  return RUNTIME_BOTTLENECK_REGISTRY.filter((b) => b.blocking);
}
