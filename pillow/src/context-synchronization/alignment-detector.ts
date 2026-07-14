import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { VisionSyncPipelineResult } from "../vision-synchronization/types.js";
import type {
  ContextAlignmentFinding,
  ContextAlignmentSeverity,
  ContextStepResult,
} from "./types.js";

const RANK: Record<ContextAlignmentSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function highestAlignmentSeverity(
  findings: ContextAlignmentFinding[],
): ContextAlignmentSeverity | null {
  if (findings.length === 0) return null;
  return findings.reduce<ContextAlignmentSeverity>(
    (max, f) => (RANK[f.severity] > RANK[max] ? f.severity : max),
    "low",
  );
}

export function detectContextAlignment(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryState;
  visionPipeline: VisionSyncPipelineResult;
  contextSteps: ContextStepResult[];
}): ContextAlignmentFinding[] {
  const findings: ContextAlignmentFinding[] = [...mapVisionDrift(input.visionPipeline)];

  for (const step of input.contextSteps.filter((s) => s.status === "failed")) {
    findings.push({
      domain: stepToDomain(step.step),
      severity: severityForFailedStep(step.step),
      signal: `${step.label} context load failed`,
      recommendation: `Restore: ${step.artifactPaths.join(", ")}`,
    });
  }

  for (const step of input.contextSteps.filter((s) => s.status === "degraded")) {
    findings.push({
      domain: stepToDomain(step.step),
      severity: "medium",
      signal: `${step.label} partially loaded`,
      recommendation: `Review ${step.artifactPaths.join(", ")}`,
    });
  }

  const journey = input.contextSteps.find((s) => s.step === "journey");
  if (journey?.status === "failed") {
    findings.push({
      domain: "mission",
      severity: "high",
      signal: "Journey context unavailable — mission alignment unknown",
      recommendation: "Synchronize JOURNEY.md before structural engineering",
    });
  }

  if (!input.bootstrap.journeyPosition && !input.bootstrap.currentMission) {
    findings.push({
      domain: "roadmap",
      severity: "medium",
      signal: "No current mission or journey position in bootstrap",
      recommendation: "Confirm roadmap slot with Grand King",
    });
  }

  return findings;
}

function mapVisionDrift(
  pipeline: VisionSyncPipelineResult,
): ContextAlignmentFinding[] {
  return pipeline.driftFindings.map((d) => ({
    domain:
      d.domain === "vision" || d.domain === "soul"
        ? "context"
        : d.domain === "constitution"
          ? "context"
          : d.domain,
    severity: d.severity,
    signal: d.signal,
    recommendation: d.recommendation,
  }));
}

function stepToDomain(step: ContextStepResult["step"]): ContextAlignmentFinding["domain"] {
  switch (step) {
    case "canonical_architecture":
      return "architecture";
    case "repository_structure":
    case "canonical_documentation":
      return "repository";
    case "production_truth":
    case "current_production_state":
      return "production";
    case "journey":
    case "mission_history":
    case "current_mission_context":
      return "mission";
    case "roadmap":
    case "current_roadmap_item":
      return "roadmap";
    default:
      return "context";
  }
}

function severityForFailedStep(step: ContextStepResult["step"]): ContextAlignmentSeverity {
  switch (step) {
    case "journey":
    case "canonical_architecture":
    case "repository_structure":
      return "high";
    case "hierarchy":
    case "canonical_documentation":
      return "medium";
    default:
      return "medium";
  }
}
