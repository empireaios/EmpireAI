import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { VisionSyncPipelineResult } from "../vision-synchronization/types.js";
import type { ContextAlignmentFinding, ContextPackage, ContextStepResult } from "./types.js";

export function buildContextPackage(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryState;
  intelligence: RepositoryIntelligenceContext;
  planner: MissionPlannerEngine;
  visionPipeline: VisionSyncPipelineResult;
  steps: ContextStepResult[];
  findings: ContextAlignmentFinding[];
  requestMissionId?: string | null;
  requestMissionTitle?: string | null;
}): ContextPackage {
  const { bootstrap, memory, planner, visionPipeline, findings } = input;
  const vctx = visionPipeline.missionContext;
  const next = planner.determineNextMission();

  const missionId = input.requestMissionId ?? vctx.missionId ?? bootstrap.currentMission;
  const currentPhase =
    bootstrap.executiveBriefing.direction.currentEmpirePhase ??
    bootstrap.journeyPosition ??
    "P4 — Engineering Foundation";

  return {
    packageVersion: "P4-03",
    currentRoadmapItem: vctx.currentRoadmapItem,
    currentPhase,
    missionPurpose:
      input.requestMissionTitle ??
      next?.objective ??
      vctx.what ??
      "Engineering mission under constitutional execution",
    relevantVision: vctx.visionSummary,
    relevantSoul: vctx.currentWhy,
    constitutionalArticles: vctx.constitutionalArticles,
    relevantArchitecture: [
      ...vctx.relevantArchitecture,
      "docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md",
    ],
    relevantRepositoryAreas: [
      ...vctx.relevantRepositoryAreas,
      "JOURNEY.md",
      "docs/governance/",
      "pillow/src/context-synchronization/",
    ],
    relevantProductionComponents: vctx.relevantProductionComponents,
    relevantLessons: vctx.previousLessons,
    knownRisks: findings.length
      ? findings.map((f) => `[${f.severity}] ${f.signal}`)
      : vctx.knownRisks,
    dependencies: vctx.knownDependencies.length
      ? vctx.knownDependencies
      : (next?.blockedBy ?? []),
    acceptanceCriteria: [
      "Context Synchronization completes before implementation",
      "Vision · Soul · Roadmap · Architecture · Repository · Production loaded",
      "Builder refuses when context incomplete (unless Grand King override)",
      ...vctx.acceptanceCriteria.slice(0, 2),
    ],
    estimatedDuration: vctx.estimatedCompletionTime,
    missionId,
  };
}

export function summarizeArchitectureVersion(steps: ContextStepResult[]): string {
  const arch = steps.find((s) => s.step === "canonical_architecture");
  return arch?.status === "complete"
    ? "Canonical Architecture · Architecture Law synchronized"
    : arch?.summary ?? "Unknown";
}
