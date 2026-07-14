import type { E2eTestingRequest, JourneyResult, TestEvidenceRecord } from "./types.js";

export function buildTestEvidence(input: {
  journey: JourneyResult;
  request: E2eTestingRequest;
  environment: string;
  repositoryVersion: string;
}): TestEvidenceRecord {
  const { journey, request, environment, repositoryVersion } = input;
  return {
    testId: `E2E-${journey.id}`,
    executionTime: new Date().toISOString(),
    environment,
    repositoryVersion,
    commit: process.env.GIT_COMMIT ?? "local",
    roadmapItem: request.roadmapItem ?? request.missionId ?? "P4-07",
    verdict: journey.verdict,
    evidence: journey.evidence,
    screenshots: [],
    logs: [journey.detail],
    knownIssues: journey.verdict === "PENDING" ? ["Awaiting live execution or Browser Truth sign-off"] : [],
  };
}
