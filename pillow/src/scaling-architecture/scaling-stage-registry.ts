import type { ScalingStageRecord } from "./types.js";

/** Constitutional scaling roadmap — 5 stages (P5-05). */
export const SCALING_STAGE_REGISTRY: ScalingStageRecord[] = [
  {
    id: "stage_1_single_instance",
    stageNumber: 1,
    name: "Single Instance Production",
    objectives: [
      "Validate V1 split stack in production",
      "Establish Production Mode doctrine",
      "Prove Grand King operational path",
    ],
    dependencies: ["ADR-CON-005", "P5-02 Production Mode", "Managed deployment"],
    exitCriteria: [
      "Production deploy validated",
      "Health endpoints green",
      "EMPIRE_V1_OPERATIONAL_READY path documented",
    ],
    currentLimitations: ["Single Brain instance", "SQLite single-writer", "No HA"],
    targetCapabilities: ["Stable single-instance production", "Guardian monitoring"],
    migrationNotes: "CURRENT STAGE — V1 production-first baseline",
  },
  {
    id: "stage_2_production_hardening",
    stageNumber: 2,
    name: "Production Hardening",
    objectives: [
      "Mandatory Redis in production",
      "Durable auth sessions",
      "Worker process always running",
      "Pillow chat persistence",
    ],
    dependencies: ["Stage 1 complete", "P5-03 Sessions", "P5-04 Monitoring"],
    exitCriteria: [
      "Redis required policy enforced",
      "No in-memory auth fallback in production",
      "worker.ts deployed on Railway",
      "Extension route policy documented",
    ],
    currentLimitations: ["Still single instance", "SQLite remains primary DB"],
    targetCapabilities: ["Production-hardened single instance", "Full queue processing"],
    migrationNotes: "NEXT RECOMMENDED STAGE after Stage 1 validation",
  },
  {
    id: "stage_3_multi_instance",
    stageNumber: 3,
    name: "Multi-instance Runtime",
    objectives: [
      "Horizontal Brain API scaling",
      "Shared Redis sessions and queues",
      "Sticky sessions or stateless API design",
      "PostgreSQL migration initiated",
    ],
    dependencies: ["Stage 2 complete", "PostgreSQL migration plan", "Session durability"],
    exitCriteria: [
      "PostgreSQL primary database live",
      "Multi-instance Brain deploy tested",
      "Shared session store verified",
      "Load balancer configured",
    ],
    currentLimitations: ["No HA failover", "Single Redis instance"],
    targetCapabilities: ["2+ Brain instances", "PostgreSQL primary", "Load balanced API"],
    migrationNotes: "Requires SQLite → PostgreSQL migration before multi-instance",
  },
  {
    id: "stage_4_high_availability",
    stageNumber: 4,
    name: "High Availability",
    objectives: [
      "Redis cluster or managed HA Redis",
      "PostgreSQL replication",
      "Multi-region failover",
      "Distributed workers",
      "Central logging and monitoring",
    ],
    dependencies: ["Stage 3 complete", "PostgreSQL replication", "Redis HA"],
    exitCriteria: [
      "Database replication active",
      "Redis HA verified",
      "Disaster recovery tested",
      "Central logging operational",
    ],
    currentLimitations: ["Enterprise features partial"],
    targetCapabilities: ["HA Brain cluster", "Replicated PostgreSQL", "DR runbook validated"],
    migrationNotes: "Target HA architecture per Brain Architecture §9.4",
  },
  {
    id: "stage_5_enterprise_scale",
    stageNumber: 5,
    name: "Enterprise Scale",
    objectives: [
      "Horizontal scaling across all subsystems",
      "Object storage for artifacts",
      "Business engine graduated production enablement",
      "Multi-marketplace commerce at scale",
    ],
    dependencies: ["Stage 4 complete", "Business engine graduation policy"],
    exitCriteria: [
      "Auto-scaling policies defined",
      "Object storage migrated",
      "Commerce multi-region",
      "Enterprise SLA met",
    ],
    currentLimitations: [],
    targetCapabilities: ["Full enterprise scale", "Graduated REAL module production"],
    migrationNotes: "Constitutional target — deliberate evolution only",
  },
];

export function getStage(id: import("./types.js").ScalingStage): ScalingStageRecord | undefined {
  return SCALING_STAGE_REGISTRY.find((s) => s.id === id);
}

export function getRecommendedNextStage(current: import("./types.js").ScalingStage): import("./types.js").ScalingStage {
  const idx = SCALING_STAGE_REGISTRY.findIndex((s) => s.id === current);
  if (idx < 0 || idx >= SCALING_STAGE_REGISTRY.length - 1) {
    return current;
  }
  return SCALING_STAGE_REGISTRY[idx + 1]!.id;
}
