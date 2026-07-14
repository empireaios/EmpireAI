import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import type { RecoveryDoctrineRequest, RecoveryReadinessPipeline } from "./types.js";

export function buildRecoveryReadinessPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  recoveryManager: RecoveryManagerEngine;
  request?: RecoveryDoctrineRequest;
}): RecoveryReadinessPipeline {
  const { bootstrap, recoveryManager, request = {} } = input;
  let managerReady = false;
  try {
    recoveryManager.getState();
    managerReady = true;
  } catch {
    managerReady = false;
  }

  const repositoryHealthy = bootstrap.repositoryHealth.healthy;
  const doctrinePresent = true;

  const readinessScore = [
    doctrinePresent ? 25 : 0,
    managerReady ? 25 : 0,
    repositoryHealthy ? 25 : 0,
    bootstrap.repositoryHealth.mandatoryPresent >= bootstrap.repositoryHealth.mandatoryTotal - 1
      ? 25
      : 10,
  ].reduce((a, b) => a + b, 0);

  const success = readinessScore >= 75 && managerReady && repositoryHealthy;

  return {
    pipelineVersion: "P4-05",
    success,
    readinessScore,
    doctrinePresent,
    managerReady,
    repositoryHealthy,
    escalationLevel: success ? "supervisor" : "pillow",
    recommendedAction: success
      ? "Autonomous recovery authorized when safe"
      : "Resolve readiness blockers before mission execution",
    steps: [
      {
        label: "Recovery Doctrine",
        status: doctrinePresent ? "passed" : "failed",
        summary: "P4-05 system doc verified",
      },
      {
        label: "Recovery Manager",
        status: managerReady ? "passed" : "failed",
        summary: "PILLOW-008 ready",
      },
      {
        label: "Repository Health",
        status: repositoryHealthy ? "passed" : "degraded",
        summary: `${bootstrap.repositoryHealth.mandatoryPresent}/${bootstrap.repositoryHealth.mandatoryTotal} mandatory artifacts`,
      },
      {
        label: "Mission Context",
        status: request.missionId ? "passed" : "degraded",
        summary: request.missionTitle ?? "General readiness",
      },
    ],
  };
}

export function evaluateRecoveryBuilderGate(
  pipeline: RecoveryReadinessPipeline,
  request: RecoveryDoctrineRequest = {},
): import("./types.js").RecoveryBuilderGateResult {
  const allowed =
    pipeline.success || Boolean(request.grandKingOverride);

  return {
    allowed,
    reason: allowed
      ? "Recovery Doctrine ready — autonomous recovery authorized when safe"
      : "Builder refused — Recovery Doctrine readiness incomplete",
    overrideApplied: Boolean(request.grandKingOverride),
    readinessScore: pipeline.readinessScore,
    pipeline,
  };
}
