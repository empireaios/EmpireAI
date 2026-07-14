import { detectDrift } from "../vision-synchronization/drift-detector.js";
import type { VisionSyncPipelineResult } from "../vision-synchronization/types.js";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import { INTEGRITY_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { INTEGRITY_DRIFT_REGISTRY } from "./drift-registry.js";
import {
  approvalStatusFromClassification,
  buildIntegrityEvaluation,
  buildIntegrityReview,
  classifyFromDriftFindings,
} from "./integrity-evaluator.js";
import type {
  MissionIntegrityResult,
  VisionIntegrityAssessment,
  VisionIntegrityRequest,
  VisionIntegritySnapshot,
} from "./types.js";

function alignmentScoreFromClassification(
  classification: VisionIntegrityAssessment["classification"],
): number {
  switch (classification) {
    case "aligned":
      return 100;
    case "minor_drift":
      return 85;
    case "moderate_drift":
      return 65;
    case "major_drift":
      return 40;
    case "critical_drift":
      return 10;
    default:
      return 50;
  }
}

function buildGrandKingSummary(input: {
  classification: string;
  approval: string;
  score: number;
  driftCount: number;
}): string {
  return [
    `VIE: ${input.classification.replace(/_/g, " ")}`,
    `Approval: ${input.approval}`,
    `Alignment: ${input.score}/100`,
    `Drift: ${input.driftCount}`,
    `Should we do this? — evaluated automatically`,
  ].join(" · ");
}

/** Execute Vision Integrity assessment (P6-02). */
export function executeVisionIntegrityAssessment(input: {
  bootstrap: EmpireBootstrapContext;
  memory?: RepositoryMemoryState | null;
  visionPipeline?: VisionSyncPipelineResult | null;
  request?: VisionIntegrityRequest;
}): VisionIntegrityAssessment {
  const { bootstrap, request = {} } = input;
  const memory = input.memory ?? null;
  const steps = input.visionPipeline?.steps ?? [];
  const findings =
    memory && steps.length
      ? detectDrift({ bootstrap, memory, steps })
      : [];

  const classification = steps.length ? classifyFromDriftFindings(findings) : "unknown";
  const approvalStatus = approvalStatusFromClassification(
    classification,
    request.grandKingOverride,
  );
  const visionAlignmentScore = alignmentScoreFromClassification(classification);
  const evaluation = buildIntegrityEvaluation({
    classification,
    findings,
    missionTitle: request.missionTitle,
  });
  const review = buildIntegrityReview({
    classification,
    coherent: bootstrap.executiveSelfAssessment.coherent,
    missionTitle: request.missionTitle,
  });

  const detectedDrifts = findings.map((f) => `${f.domain}: ${f.signal}`);
  const violations = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .map((f) => f.signal);
  const recommendations = [
    evaluation.recommendation,
    ...findings.slice(0, 3).map((f) => f.recommendation),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const snapshot: VisionIntegritySnapshot = {
    capturedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    classification,
    approvalStatus,
    visionAlignmentScore,
    driftCount: findings.length,
    violationCount: violations.length,
    missionId: request.missionId ?? null,
    missionTitle: request.missionTitle ?? null,
  };

  const grandKingSummary = buildGrandKingSummary({
    classification,
    approval: approvalStatus,
    score: visionAlignmentScore,
    driftCount: findings.length,
  });

  return {
    pipelineVersion: "P6-02",
    assessedAt: new Date().toISOString(),
    classification,
    approvalStatus,
    visionAlignmentScore,
    pipeline: INTEGRITY_PIPELINE_REGISTRY,
    driftSignals: INTEGRITY_DRIFT_REGISTRY,
    evaluation,
    review,
    detectedDrifts,
    violations,
    recommendations,
    snapshot,
    success:
      INTEGRITY_PIPELINE_REGISTRY.length >= 13 &&
      INTEGRITY_DRIFT_REGISTRY.length >= 9,
    summary: `VIE — ${classification.replace(/_/g, " ")} · ${approvalStatus} · score ${visionAlignmentScore}/100 · ${findings.length} drift signals`,
    grandKingSummary,
  };
}

/** Evaluate mission integrity for automatic pre-execution check. */
export function evaluateMissionIntegrity(input: {
  bootstrap: EmpireBootstrapContext;
  memory?: RepositoryMemoryState | null;
  visionPipeline?: VisionSyncPipelineResult | null;
  request?: VisionIntegrityRequest;
}): MissionIntegrityResult {
  const assessment = executeVisionIntegrityAssessment(input);
  const allowed =
    assessment.approvalStatus !== "blocked" || Boolean(input.request?.grandKingOverride);

  return {
    allowed,
    classification: assessment.classification,
    approvalStatus: assessment.approvalStatus,
    alignment: assessment.classification.replace(/_/g, " "),
    detectedDrift: assessment.detectedDrifts,
    evidence: assessment.evaluation.evidence,
    recommendation: assessment.evaluation.recommendation,
    reason: allowed
      ? `VIE ${assessment.approvalStatus} — ${assessment.evaluation.reason}`
      : `VIE blocked — Critical Drift detected. Grand King explicit approval required.`,
  };
}

export function buildDefaultVisionIntegritySnapshot(): VisionIntegritySnapshot {
  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    classification: "unknown",
    approvalStatus: "conditional",
    visionAlignmentScore: 50,
    driftCount: 0,
    violationCount: 0,
    missionId: null,
    missionTitle: null,
  };
}
