import fs from "node:fs";
import path from "node:path";
import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import type { SyncStepId } from "../vision-synchronization/types.js";
import {
  detectContextAlignment,
  highestAlignmentSeverity,
} from "./alignment-detector.js";
import { buildContextPackage, summarizeArchitectureVersion } from "./context-package.js";
import { CONTEXT_EXTENSION_STEPS } from "./paths.js";
import type {
  ContextStepResult,
  ContextStepStatus,
  ContextSyncPipelineResult,
  ContextSyncRequest,
} from "./types.js";

const VISION_TO_CONTEXT_STEP: Record<SyncStepId, import("./types.js").ContextStepId> = {
  vision: "vision",
  vision_accumulation: "vision_accumulation",
  soul: "soul",
  ctd: "constitution",
  constitution_hierarchy: "hierarchy",
  roadmap: "roadmap",
  current_roadmap_item: "current_roadmap_item",
  architecture: "canonical_architecture",
  repository: "repository_structure",
  production_truth: "production_truth",
  current_production_state: "current_production_state",
  previous_lessons_learned: "previous_lessons_learned",
  mission_context: "current_mission_context",
  mission_generation: "current_mission_context",
};

function readTextSync(repositoryRoot: string, relativePath: string): string | null {
  try {
    const absolute = path.join(repositoryRoot, relativePath);
    if (!fs.existsSync(absolute)) return null;
    return fs.readFileSync(absolute, "utf8");
  } catch {
    return null;
  }
}

function stepStatus(missing: string[], total: number): ContextStepStatus {
  if (missing.length === 0) return "complete";
  if (missing.length < total) return "degraded";
  return "failed";
}

function mapVisionSteps(
  visionPipeline: import("../vision-synchronization/types.js").VisionSyncPipelineResult,
): ContextStepResult[] {
  return visionPipeline.steps.map((s) => ({
    step: VISION_TO_CONTEXT_STEP[s.step] ?? "current_mission_context",
    label: s.label,
    status: s.status,
    artifactPaths: s.artifactPaths,
    summary: s.summary,
    durationMs: s.durationMs,
  }));
}

function buildExtensionSteps(
  bootstrap: EmpireBootstrapContext,
  memory: RepositoryMemoryEngine,
  repositoryRoot: string,
): ContextStepResult[] {
  const mem = memory.getMemory();
  const results: ContextStepResult[] = [];

  for (const def of CONTEXT_EXTENSION_STEPS) {
    const started = performance.now();
    const missing = def.paths.filter((p) => !readTextSync(repositoryRoot, p)?.trim());
    let status = stepStatus(missing, def.paths.length);
    let summary = `${def.label} loaded`;

    if (def.step === "journey") {
      summary = bootstrap.journeyPosition
        ? `Journey position: ${bootstrap.journeyPosition}`
        : missing.length
          ? "Journey files missing"
          : "Journey loaded";
    }

    if (def.step === "mission_history") {
      const completed = mem.domains.completedMissions.value.length;
      const pending = mem.domains.pendingMissions.value.length;
      summary = `${completed} completed · ${pending} pending missions in memory`;
      status = "complete";
    }

    results.push({
      step: def.step,
      label: def.label,
      status,
      artifactPaths: def.paths,
      summary,
      durationMs: Math.round(performance.now() - started),
    });
  }

  return results;
}

function mergeSteps(visionMapped: ContextStepResult[], extension: ContextStepResult[]): ContextStepResult[] {
  const byStep = new Map<string, ContextStepResult>();
  for (const s of [...visionMapped, ...extension]) {
    const existing = byStep.get(s.step);
    if (!existing || s.status === "failed" || (existing.status !== "failed" && s.status === "degraded")) {
      byStep.set(s.step, s);
    }
  }
  const order: import("./types.js").ContextStepId[] = [
    "vision",
    "vision_accumulation",
    "soul",
    "constitution",
    "roadmap",
    "current_roadmap_item",
    "hierarchy",
    "canonical_architecture",
    "canonical_documentation",
    "repository_structure",
    "production_truth",
    "current_production_state",
    "journey",
    "previous_lessons_learned",
    "mission_history",
    "current_mission_context",
  ];
  return order.filter((id) => byStep.has(id)).map((id) => byStep.get(id)!);
}

export async function executeContextSyncPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryEngine;
  intelligence: RepositoryIntelligenceContext;
  planner: MissionPlannerEngine;
  visionSync: VisionSynchronizationEngine;
  reader: RepositoryReader;
  request?: ContextSyncRequest;
}): Promise<ContextSyncPipelineResult> {
  return executeContextSyncPipelineSync(input);
}

export function executeContextSyncPipelineSync(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryEngine;
  intelligence: RepositoryIntelligenceContext;
  planner: MissionPlannerEngine;
  visionSync: VisionSynchronizationEngine;
  request?: ContextSyncRequest;
}): ContextSyncPipelineResult {
  const started = performance.now();
  const { bootstrap, memory, intelligence, planner, visionSync, request = {} } = input;
  memory.ensureFresh();
  const memState = memory.getMemory();

  const visionGate = visionSync.evaluateBuilderGateSync({
    missionId: request.missionId,
    missionTitle: request.missionTitle,
    grandKingOverride: request.grandKingOverride,
  });
  const visionPipeline = visionGate.pipeline;

  const visionMapped = mapVisionSteps(visionPipeline);
  const extension = buildExtensionSteps(bootstrap, memory, bootstrap.repositoryRoot);
  const steps = mergeSteps(visionMapped, extension);

  const completeCount = steps.filter((s) => s.status === "complete").length;
  const contextCompletenessPercent = Math.round((completeCount / steps.length) * 100);

  const alignmentFindings = detectContextAlignment({
    bootstrap,
    memory: memState,
    visionPipeline,
    contextSteps: extension,
  });

  const highest = highestAlignmentSeverity(alignmentFindings);
  const failedSteps = steps.filter((s) => s.status === "failed").length;
  const success =
    visionGate.allowed &&
    failedSteps === 0 &&
    (highest === null || highest === "low" || highest === "medium");

  const contextPackage = buildContextPackage({
    bootstrap,
    memory: memState,
    intelligence,
    planner,
    visionPipeline,
    steps,
    findings: alignmentFindings,
    requestMissionId: request.missionId,
    requestMissionTitle: request.missionTitle,
  });

  return {
    pipelineVersion: "P4-03",
    synchronizedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    success,
    contextCompletenessPercent,
    steps,
    alignmentFindings,
    highestAlignmentSeverity: highest,
    contextPackage,
    visionPipeline,
    roadmapPosition: contextPackage.currentRoadmapItem,
    architectureVersion: summarizeArchitectureVersion(steps),
    repositoryVersion: bootstrap.repositoryVersion,
    productionAlignment: visionPipeline.productionAlignment,
  };
}
