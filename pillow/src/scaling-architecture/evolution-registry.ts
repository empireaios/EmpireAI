import type { DatabaseEvolutionRecord, RuntimeEvolutionRecord, ScalingBottleneckRecord } from "./types.js";

/** Database evolution path (P5-05). */
export const DATABASE_EVOLUTION_REGISTRY: DatabaseEvolutionRecord[] = [
  {
    phase: "SQLite (current)",
    description: "sql.js WASM · single file · Railway /data/ volume",
    status: "current",
    dependencies: ["Railway volume", "Brain database layer"],
  },
  {
    phase: "Migration Strategy",
    description: "Schema export · dual-write period · validation · cutover",
    status: "planned",
    dependencies: ["Stage 2 exit", "Migration mission approval", "ADR for PostgreSQL"],
  },
  {
    phase: "PostgreSQL Primary",
    description: "Managed PostgreSQL · connection pooling · migration complete",
    status: "planned",
    dependencies: ["Migration Strategy", "Stage 3 entry"],
  },
  {
    phase: "Replication",
    description: "Read replicas · failover · backup automation",
    status: "future",
    dependencies: ["PostgreSQL Primary", "Stage 4 entry"],
  },
  {
    phase: "Backup & Recovery",
    description: "Point-in-time recovery · DR runbook · tested restore",
    status: "planned",
    dependencies: ["PostgreSQL Primary"],
  },
];

/** Runtime evolution path (P5-05). */
export const RUNTIME_EVOLUTION_REGISTRY: RuntimeEvolutionRecord[] = [
  {
    area: "Workers",
    currentState: "Separate worker.ts · single instance · off in API boot",
    targetState: "Managed worker fleet · auto-restart · horizontal worker scaling",
    scalingTrigger: "Queue depth sustained >100 · Stage 3+",
  },
  {
    area: "Queues",
    currentState: "Single BullMQ queue · DegradedTaskQueue fallback",
    targetState: "Redis cluster · priority queues · dead letter handling",
    scalingTrigger: "Redis HA required · Stage 4",
  },
  {
    area: "API Scaling",
    currentState: "Single Fastify instance · earlyListen",
    targetState: "Load balanced multi-instance · stateless dispatch",
    scalingTrigger: "Event loop lag sustained · Stage 3 after PostgreSQL",
  },
  {
    area: "Memory",
    currentState: "Single process heap · 200+ tool registration",
    targetState: "Memory profiling · lazy tool loading · instance right-sizing",
    scalingTrigger: "Heap >85% sustained · Stage 2 hardening",
  },
  {
    area: "Caching",
    currentState: "Redis optional · in-memory fallbacks",
    targetState: "Mandatory Redis · session cache · query cache layer",
    scalingTrigger: "Stage 2 production hardening",
  },
  {
    area: "AI Providers",
    currentState: "LLMRouter · OpenAI primary",
    targetState: "Provider abstraction · failover · rate limit distribution",
    scalingTrigger: "Provider rate limits · Stage 3+",
  },
];

/** Known scaling bottlenecks (P5-05) — integrates with BR-BN registry. */
export const SCALING_BOTTLENECK_REGISTRY: ScalingBottleneckRecord[] = [
  {
    id: "SCL-BN-001",
    domain: "database",
    severity: "critical",
    description: "SQLite single-writer blocks horizontal Brain scaling",
    scalingImpact: "Cannot run multi-instance Brain until PostgreSQL migration",
    resolutionStage: "stage_3_multi_instance",
  },
  {
    id: "SCL-BN-002",
    domain: "sessions",
    severity: "high",
    description: "In-memory Pillow chat and auth fallback",
    scalingImpact: "Session loss on restart · no sticky session sharing",
    resolutionStage: "stage_2_production_hardening",
  },
  {
    id: "SCL-BN-003",
    domain: "brain",
    severity: "high",
    description: "200+ tool registration at boot (BR-BN-003)",
    scalingImpact: "Slow cold start · memory pressure on scale-out",
    resolutionStage: "stage_2_production_hardening",
  },
  {
    id: "SCL-BN-004",
    domain: "queues",
    severity: "critical",
    description: "DegradedTaskQueue without Redis (BR-BN-004)",
    scalingImpact: "Background jobs silently dropped",
    resolutionStage: "stage_2_production_hardening",
  },
  {
    id: "SCL-BN-005",
    domain: "pillow",
    severity: "high",
    description: "Sequential startPillow() chain (BR-BN-006)",
    scalingImpact: "Boot time blocks recovery and scale events",
    resolutionStage: "stage_2_production_hardening",
  },
  {
    id: "SCL-BN-006",
    domain: "workers",
    severity: "high",
    description: "Workers off in production API process (BR-BN-005)",
    scalingImpact: "Queue processing requires separate manual worker deploy",
    resolutionStage: "stage_2_production_hardening",
  },
  {
    id: "SCL-BN-007",
    domain: "production_infrastructure",
    severity: "medium",
    description: "Single Railway service · no load balancer",
    scalingImpact: "No horizontal API scaling path",
    resolutionStage: "stage_3_multi_instance",
  },
  {
    id: "SCL-BN-008",
    domain: "redis",
    severity: "medium",
    description: "Single Redis instance · not cluster",
    scalingImpact: "Redis SPOF for auth and queues",
    resolutionStage: "stage_4_high_availability",
  },
];

export function getBottlenecksForStage(stage: import("./types.js").ScalingStage): ScalingBottleneckRecord[] {
  return SCALING_BOTTLENECK_REGISTRY.filter((b) => b.resolutionStage === stage);
}
