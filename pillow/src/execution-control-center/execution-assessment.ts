import { EXECUTION_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { EXECUTION_DEPENDENCY_REGISTRY, getCriticalPath } from "./dependency-registry.js";
import { EXECUTION_RESOURCE_REGISTRY } from "./resource-registry.js";
import type {
  ExecutionControlAssessment,
  ExecutionControlSnapshot,
  ExecutionQueueEntry,
} from "./types.js";

function buildGrandKingSummary(input: {
  score: number;
  grade: string;
  queueDepth: number;
  activeMission: string | null;
}): string {
  return [
    `ECC: ${input.grade} (${input.score}/100)`,
    `Queue: ${input.queueDepth}`,
    input.activeMission ? `Active: ${input.activeMission}` : "Active: none",
    `Authority: coordinates · does not replace Builder/Supervisor/Pillow`,
    `Ready: P6-02 Vision Integrity Engine`,
  ].join(" · ");
}

/** Execute ECC assessment (P6-01). */
export function executeExecutionControlAssessment(input: {
  snapshot?: ExecutionControlSnapshot | null;
  queue?: ExecutionQueueEntry[];
}): ExecutionControlAssessment {
  const snapshot = input.snapshot ?? buildDefaultExecutionSnapshot();
  const queue = input.queue ?? [];
  const score = snapshot.coordinationScore;
  const grade: ExecutionControlAssessment["executionGrade"] =
    score >= 80 ? "coordinated" : score >= 50 ? "partial" : "blocked";

  const grandKingSummary = buildGrandKingSummary({
    score,
    grade,
    queueDepth: snapshot.queueDepth,
    activeMission: snapshot.activeMissionTitle,
  });

  return {
    pipelineVersion: "P6-01",
    assessedAt: new Date().toISOString(),
    coordinationScore: score,
    executionGrade: grade,
    pipeline: EXECUTION_PIPELINE_REGISTRY,
    dependencies: EXECUTION_DEPENDENCY_REGISTRY,
    resources: EXECUTION_RESOURCE_REGISTRY,
    queue,
    snapshot,
    success:
      EXECUTION_PIPELINE_REGISTRY.length >= 12 &&
      EXECUTION_DEPENDENCY_REGISTRY.length >= 8 &&
      getCriticalPath().length >= 4,
    summary: `ECC — ${grade} · score ${score}/100 · queue ${snapshot.queueDepth} · ${getCriticalPath().length} critical path dependencies`,
    grandKingSummary,
  };
}

export function buildDefaultExecutionSnapshot(): ExecutionControlSnapshot {
  const env = process.env;
  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    activeMissionId: null,
    activeMissionTitle: null,
    executionState: "ready",
    currentPipelineStage: "execution_coordination",
    queueDepth: 0,
    overallProgressPercent: 0,
    queuedMissions: 0,
    activeDependencies: getCriticalPath().length,
    criticalPathLength: getCriticalPath().length,
    builderCapacity: "available",
    runtimeCapacity: "healthy",
    openRisks: 0,
    openBottlenecks: 0,
    coordinationScore: 75,
  };
}
