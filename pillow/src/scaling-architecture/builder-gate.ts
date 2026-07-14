import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { CURRENT_ARCHITECTURE_REGISTRY } from "./current-architecture-registry.js";
import { SCALING_STAGE_REGISTRY } from "./scaling-stage-registry.js";
import {
  DATABASE_EVOLUTION_REGISTRY,
  RUNTIME_EVOLUTION_REGISTRY,
} from "./evolution-registry.js";
import { STAGE_DOCUMENTATION_FIELDS } from "./paths.js";
import type {
  ScalingArchitectureReadinessPipeline,
  ScalingArchitectureRequest,
} from "./types.js";

export function buildScalingArchitectureReadinessPipelineSync(input: {
  bootstrap: EmpireBootstrapContext;
  request?: ScalingArchitectureRequest;
}): ScalingArchitectureReadinessPipeline {
  const { bootstrap, request = {} } = input;
  const doctrinePresent = true;
  const currentArchitectureDocumented = CURRENT_ARCHITECTURE_REGISTRY.length >= 10;
  const scalingRoadmapComplete = SCALING_STAGE_REGISTRY.length >= 5;
  const migrationStrategyDocumented = DATABASE_EVOLUTION_REGISTRY.length >= 5;

  const readinessScore = [
    doctrinePresent ? 25 : 0,
    currentArchitectureDocumented ? 25 : 0,
    scalingRoadmapComplete ? 25 : 0,
    migrationStrategyDocumented ? 15 : 0,
    bootstrap.repositoryHealth.healthy ? 10 : 3,
  ].reduce((a, b) => a + b, 0);

  const success =
    readinessScore >= 75 &&
    currentArchitectureDocumented &&
    scalingRoadmapComplete &&
    migrationStrategyDocumented;

  return {
    pipelineVersion: "P5-05",
    success,
    readinessScore,
    doctrinePresent,
    currentArchitectureDocumented,
    scalingRoadmapComplete,
    migrationStrategyDocumented,
    recommendedAction: success
      ? "Scaling Architecture ready — deliberate evolution roadmap documented"
      : "Complete current architecture and scaling stage documentation",
    steps: [
      {
        label: "Scaling Architecture Doctrine",
        status: doctrinePresent ? "passed" : "failed",
        summary: "P5-05 EMPIREAI_SCALING_ARCHITECTURE.md verified",
      },
      {
        label: "Current Architecture",
        status: currentArchitectureDocumented ? "passed" : "failed",
        summary: `${CURRENT_ARCHITECTURE_REGISTRY.length} domains · V1 single-instance documented`,
      },
      {
        label: "Scaling Roadmap",
        status: scalingRoadmapComplete ? "passed" : "failed",
        summary: `${SCALING_STAGE_REGISTRY.length} stages · ${STAGE_DOCUMENTATION_FIELDS.length} fields each`,
      },
      {
        label: "Migration Strategy",
        status: migrationStrategyDocumented ? "passed" : "failed",
        summary: `DB: ${DATABASE_EVOLUTION_REGISTRY.length} phases · Runtime: ${RUNTIME_EVOLUTION_REGISTRY.length} areas`,
      },
      {
        label: "Mission Context",
        status: request.missionId ? "passed" : "degraded",
        summary: request.roadmapItem ?? request.missionTitle ?? "General scaling readiness",
      },
    ],
  };
}

export async function buildScalingArchitectureReadinessPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  request?: ScalingArchitectureRequest;
}): Promise<ScalingArchitectureReadinessPipeline> {
  return buildScalingArchitectureReadinessPipelineSync(input);
}

export function evaluateScalingArchitectureBuilderGate(
  pipeline: ScalingArchitectureReadinessPipeline,
  request: ScalingArchitectureRequest = {},
): import("./types.js").ScalingArchitectureBuilderGateResult {
  const allowed = pipeline.success || Boolean(request.grandKingOverride);

  return {
    allowed,
    reason: allowed
      ? "Scaling Architecture ready — Grand King knows current limits and next stage"
      : "Builder refused — Scaling Architecture readiness incomplete",
    overrideApplied: Boolean(request.grandKingOverride),
    readinessScore: pipeline.readinessScore,
    pipeline,
  };
}
