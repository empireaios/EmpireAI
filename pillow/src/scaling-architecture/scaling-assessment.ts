import { CURRENT_ARCHITECTURE_REGISTRY } from "./current-architecture-registry.js";
import {
  SCALING_STAGE_REGISTRY,
  getRecommendedNextStage,
} from "./scaling-stage-registry.js";
import {
  DATABASE_EVOLUTION_REGISTRY,
  RUNTIME_EVOLUTION_REGISTRY,
  SCALING_BOTTLENECK_REGISTRY,
} from "./evolution-registry.js";
import type {
  ScalingArchitectureAssessment,
  ScalingArchitectureSnapshot,
  ScalingStage,
} from "./types.js";

function inferCurrentStage(snapshot: ScalingArchitectureSnapshot): ScalingStage {
  if (snapshot.singleInstance && snapshot.sqliteOnly) {
    if (!snapshot.redisConnected || !snapshot.workersActive) {
      return "stage_1_single_instance";
    }
    return "stage_2_production_hardening";
  }
  return "stage_1_single_instance";
}

function assessScalingReadiness(
  stage: ScalingStage,
  snapshot: ScalingArchitectureSnapshot,
): ScalingArchitectureAssessment["scalingReadiness"] {
  if (stage === "stage_1_single_instance") {
    if (snapshot.scalingReadinessScore >= 70) return "ready";
    return "limited";
  }
  if (!snapshot.redisConnected) return "not_ready";
  if (snapshot.eventLoopLagMs >= 500) return "not_ready";
  return "limited";
}

function buildGrandKingSummary(input: {
  stage: ScalingStage;
  nextStage: ScalingStage;
  readiness: string;
  bottlenecks: number;
}): string {
  const stageName = SCALING_STAGE_REGISTRY.find((s) => s.id === input.stage)?.name ?? input.stage;
  const nextName = SCALING_STAGE_REGISTRY.find((s) => s.id === input.nextStage)?.name ?? input.nextStage;
  return [
    `Current: ${stageName}`,
    `Next: ${nextName}`,
    `Readiness: ${input.readiness}`,
    `Bottlenecks: ${input.bottlenecks}`,
    `Topology: Vercel + Railway + Upstash · SQLite single-instance`,
  ].join(" · ");
}

/** Execute Scaling Architecture assessment (P5-05). */
export function executeScalingArchitectureAssessment(input: {
  snapshot?: ScalingArchitectureSnapshot | null;
}): ScalingArchitectureAssessment {
  const snapshot = input.snapshot ?? buildDefaultScalingSnapshot();
  const currentStage = snapshot.currentStage ?? inferCurrentStage(snapshot);
  const recommendedNextStage = getRecommendedNextStage(currentStage);
  const scalingReadiness = assessScalingReadiness(currentStage, snapshot);

  const activeBottlenecks = SCALING_BOTTLENECK_REGISTRY.filter(
    (b) => b.resolutionStage === recommendedNextStage || b.resolutionStage === currentStage,
  );

  const grandKingSummary = buildGrandKingSummary({
    stage: currentStage,
    nextStage: recommendedNextStage,
    readiness: scalingReadiness,
    bottlenecks: activeBottlenecks.length,
  });

  return {
    pipelineVersion: "P5-05",
    assessedAt: new Date().toISOString(),
    currentStage,
    recommendedNextStage,
    scalingReadiness,
    currentArchitecture: CURRENT_ARCHITECTURE_REGISTRY,
    scalingStages: SCALING_STAGE_REGISTRY,
    databaseEvolution: DATABASE_EVOLUTION_REGISTRY,
    runtimeEvolution: RUNTIME_EVOLUTION_REGISTRY,
    bottlenecks: SCALING_BOTTLENECK_REGISTRY,
    snapshot,
    success:
      CURRENT_ARCHITECTURE_REGISTRY.length >= 10 &&
      SCALING_STAGE_REGISTRY.length >= 5 &&
      DATABASE_EVOLUTION_REGISTRY.length >= 5,
    summary: `Scaling Architecture — ${currentStage.replace(/_/g, " ")} · readiness ${scalingReadiness} · ${activeBottlenecks.length} active bottlenecks · next ${recommendedNextStage.replace(/_/g, " ")}`,
    grandKingSummary,
  };
}

export function buildDefaultScalingSnapshot(): ScalingArchitectureSnapshot {
  const mem = process.memoryUsage();
  const env = process.env;
  const redisConnected = Boolean(env.REDIS_URL);

  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    currentStage: "stage_1_single_instance",
    redisConnected,
    workersActive: env.NODE_ENV !== "production",
    sqliteOnly: true,
    singleInstance: true,
    eventLoopLagMs: 0,
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    queueDepth: 0,
    pillowHostSessions: 0,
    scalingReadinessScore: redisConnected ? 75 : 60,
  };
}
