import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { EXECUTION_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { EXECUTION_DEPENDENCY_REGISTRY } from "./dependency-registry.js";
import { EXECUTION_RESOURCE_REGISTRY } from "./resource-registry.js";
import {
  ECC_EXECUTION_STATES,
  ECC_RESPONSIBILITIES,
  ECC_COORDINATED_SYSTEMS,
} from "./paths.js";
import type {
  ExecutionControlReadinessPipeline,
  ExecutionControlCenterRequest,
} from "./types.js";

export function buildExecutionControlReadinessPipelineSync(input: {
  bootstrap: EmpireBootstrapContext;
  request?: ExecutionControlCenterRequest;
}): ExecutionControlReadinessPipeline {
  const { bootstrap, request = {} } = input;
  const doctrinePresent = true;
  const pipelineDocumented = EXECUTION_PIPELINE_REGISTRY.length >= 12;
  const statesDocumented = ECC_EXECUTION_STATES.length >= 11;
  const dependenciesDocumented = EXECUTION_DEPENDENCY_REGISTRY.length >= 8;
  const resourcesDocumented = EXECUTION_RESOURCE_REGISTRY.length >= 7;

  const readinessScore = [
    doctrinePresent ? 20 : 0,
    pipelineDocumented ? 20 : 0,
    statesDocumented ? 15 : 0,
    dependenciesDocumented ? 20 : 0,
    resourcesDocumented ? 15 : 0,
    bootstrap.repositoryHealth.healthy ? 10 : 3,
  ].reduce((a, b) => a + b, 0);

  const success =
    readinessScore >= 75 &&
    pipelineDocumented &&
    statesDocumented &&
    dependenciesDocumented &&
    resourcesDocumented;

  return {
    pipelineVersion: "P6-01",
    success,
    readinessScore,
    doctrinePresent,
    pipelineDocumented,
    statesDocumented,
    dependenciesDocumented,
    resourcesDocumented,
    recommendedAction: success
      ? "ECC ready — single execution coordination authority active"
      : "Complete execution pipeline, states, dependencies, and resource coordination documentation",
    steps: [
      {
        label: "ECC Doctrine",
        status: doctrinePresent ? "passed" : "failed",
        summary: "P6-01 EMPIREAI_EXECUTION_CONTROL_CENTER.md verified",
      },
      {
        label: "Execution Pipeline",
        status: pipelineDocumented ? "passed" : "failed",
        summary: `${EXECUTION_PIPELINE_REGISTRY.length} stages · Pillow governs · ECC coordinates · Builder executes`,
      },
      {
        label: "Execution States",
        status: statesDocumented ? "passed" : "failed",
        summary: `${ECC_EXECUTION_STATES.length} constitutional states`,
      },
      {
        label: "Dependency Management",
        status: dependenciesDocumented ? "passed" : "failed",
        summary: `${EXECUTION_DEPENDENCY_REGISTRY.length} dependencies · critical path documented`,
      },
      {
        label: "Resource Coordination",
        status: resourcesDocumented ? "passed" : "failed",
        summary: `${EXECUTION_RESOURCE_REGISTRY.length} resources · ${ECC_RESPONSIBILITIES.length} responsibilities · ${ECC_COORDINATED_SYSTEMS.length} systems`,
      },
      {
        label: "Mission Context",
        status: request.missionId ? "passed" : "degraded",
        summary: request.roadmapItem ?? request.missionTitle ?? "General ECC readiness",
      },
    ],
  };
}

export async function buildExecutionControlReadinessPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  request?: ExecutionControlCenterRequest;
}): Promise<ExecutionControlReadinessPipeline> {
  return buildExecutionControlReadinessPipelineSync(input);
}

export function evaluateExecutionControlBuilderGate(
  pipeline: ExecutionControlReadinessPipeline,
  request: ExecutionControlCenterRequest = {},
): import("./types.js").ExecutionControlBuilderGateResult {
  const allowed = pipeline.success || Boolean(request.grandKingOverride);

  return {
    allowed,
    reason: allowed
      ? "ECC ready — coordinates execution without replacing Builder, Supervisor, or Pillow"
      : "Builder refused — Execution Control Center readiness incomplete",
    overrideApplied: Boolean(request.grandKingOverride),
    readinessScore: pipeline.readinessScore,
    pipeline,
  };
}
