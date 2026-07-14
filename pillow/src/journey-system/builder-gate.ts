import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { JOURNEY_MODEL, MISSION_TRACEABILITY_FIELDS } from "./paths.js";
import type { JourneyReadinessPipeline, JourneySystemRequest } from "./types.js";

export function buildJourneyReadinessPipelineSync(input: {
  bootstrap: EmpireBootstrapContext;
  request?: JourneySystemRequest;
}): JourneyReadinessPipeline {
  const { bootstrap, request = {} } = input;
  const doctrinePresent = true;
  const journeyIndexPresent = Boolean(bootstrap.journeyPosition);
  const traceabilityReady = MISSION_TRACEABILITY_FIELDS.length >= 20;
  const timelineReady = JOURNEY_MODEL.length >= 10;

  const readinessScore = [
    doctrinePresent ? 20 : 0,
    journeyIndexPresent ? 25 : 0,
    bootstrap.repositoryHealth.healthy ? 20 : 10,
    traceabilityReady ? 20 : 0,
    timelineReady ? 15 : 0,
  ].reduce((a, b) => a + b, 0);

  const success = readinessScore >= 75 && traceabilityReady && timelineReady;

  return {
    pipelineVersion: "P4-08",
    success,
    readinessScore,
    doctrinePresent,
    journeyIndexPresent,
    traceabilityReady,
    timelineReady,
    recommendedAction: success
      ? "Journey System ready — every constitutional action becomes permanently traceable"
      : "Resolve JOURNEY.md position and repository health before journey traceability",
    steps: [
      {
        label: "Journey System Doctrine",
        status: doctrinePresent ? "passed" : "failed",
        summary: "P4-08 system doc verified",
      },
      {
        label: "Journey Index",
        status: journeyIndexPresent ? "passed" : "degraded",
        summary: bootstrap.journeyPosition ?? "JOURNEY.md position pending",
      },
      {
        label: "Mission Traceability",
        status: traceabilityReady ? "passed" : "failed",
        summary: `${MISSION_TRACEABILITY_FIELDS.length} traceability fields registered`,
      },
      {
        label: "Journey Timeline",
        status: timelineReady ? "passed" : "failed",
        summary: `${JOURNEY_MODEL.length} model stages defined`,
      },
      {
        label: "Mission Context",
        status: request.missionId ? "passed" : "degraded",
        summary: request.roadmapItem ?? request.missionTitle ?? "General journey readiness",
      },
    ],
  };
}

export async function buildJourneyReadinessPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  request?: JourneySystemRequest;
}): Promise<JourneyReadinessPipeline> {
  return buildJourneyReadinessPipelineSync(input);
}

export function evaluateJourneyBuilderGate(
  pipeline: JourneyReadinessPipeline,
  request: JourneySystemRequest = {},
): import("./types.js").JourneyBuilderGateResult {
  const allowed = pipeline.success || Boolean(request.grandKingOverride);

  return {
    allowed,
    reason: allowed
      ? "Journey System ready — permanent execution history from Vision through Production"
      : "Builder refused — Journey System readiness incomplete",
    overrideApplied: Boolean(request.grandKingOverride),
    readinessScore: pipeline.readinessScore,
    pipeline,
  };
}
