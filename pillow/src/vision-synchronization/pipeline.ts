import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import fs from "node:fs";
import path from "node:path";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import { detectDrift, highestDriftSeverity } from "./drift-detector.js";
import {
  buildMissionContextPackage,
  extractVisionVersionFromArtifacts,
  summarizeArchitectureState,
  summarizeConstitutionalState,
  summarizeProductionAlignment,
  summarizeRepositoryState,
} from "./mission-context.js";
import { PIPELINE_STEP_ORDER, VISION_SYNC_SYSTEM_PATH } from "./paths.js";
import type {
  SyncStepResult,
  SyncStepStatus,
  VisionSyncPipelineResult,
  VisionSyncRequest,
} from "./types.js";

async function loadArtifacts(
  reader: RepositoryReader,
  paths: string[],
): Promise<{ texts: Record<string, string | null>; missing: string[] }> {
  const texts: Record<string, string | null> = {};
  const missing: string[] = [];
  for (const p of paths) {
    const text = await reader.readText(p);
    texts[p] = text;
    if (!text?.trim()) missing.push(p);
  }
  return { texts, missing };
}

function stepStatus(missing: string[], requiredCount: number): SyncStepStatus {
  if (missing.length === 0) return "complete";
  if (missing.length < requiredCount) return "degraded";
  return "failed";
}

function summarizeStep(
  step: (typeof PIPELINE_STEP_ORDER)[number],
  texts: Record<string, string | null>,
  missing: string[],
  bootstrap: EmpireBootstrapContext,
): string {
  if (step.step === "vision") {
    const excerpt = texts[step.paths[0]!]?.split("\n").slice(0, 8).join(" ") ?? "";
    return excerpt.slice(0, 200) || "Vision file missing";
  }
  if (step.step === "soul") {
    return texts[step.paths[0]!]?.includes("Pillow")
      ? "Soul identity loaded — Pillow role confirmed"
      : "Soul loaded";
  }
  if (step.step === "current_roadmap_item") {
    return (
      bootstrap.executiveBriefing.direction.currentEmpirePhase ??
      bootstrap.journeyPosition ??
      "Roadmap item derived from doctrine register"
    );
  }
  if (step.step === "repository") {
    return `${bootstrap.repositoryHealth.mandatoryPresent}/${bootstrap.repositoryHealth.mandatoryTotal} mandatory artifacts present`;
  }
  if (step.step === "current_production_state") {
    return "Production Truth baseline — live verification required per mission";
  }
  if (step.step === "mission_generation") {
    return missing.length === 0
      ? "Mission generation policy loaded — ready for WHY → WHAT → HOW → PROOF chain"
      : "Mission generation policy incomplete";
  }
  if (missing.length === 0) return `${step.label} synchronized`;
  return `${step.label} — missing: ${missing.join(", ")}`;
}

export async function executeVisionSyncPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryEngine;
  planner: MissionPlannerEngine;
  reader: RepositoryReader;
  request?: VisionSyncRequest;
}): Promise<VisionSyncPipelineResult> {
  const started = performance.now();
  const { bootstrap, memory, planner, reader, request = {} } = input;
  memory.ensureFresh();
  const memState = memory.getMemory();

  const allPaths = [...new Set(PIPELINE_STEP_ORDER.flatMap((s) => s.paths))];
  const loaded = await loadArtifacts(reader, allPaths);

  const steps: SyncStepResult[] = [];

  for (const stepDef of PIPELINE_STEP_ORDER) {
    const stepStarted = performance.now();
    const missing = stepDef.paths.filter((p) => !loaded.texts[p]?.trim());
    let status = stepStatus(missing, stepDef.paths.length);

    if (stepDef.step === "mission_context" && missing.includes(VISION_SYNC_SYSTEM_PATH)) {
      status = "degraded";
    }

    if (stepDef.step === "mission_generation" && status !== "failed") {
      status = "complete";
    }

    steps.push({
      step: stepDef.step,
      label: stepDef.label,
      status,
      artifactPaths: stepDef.paths,
      summary: summarizeStep(stepDef, loaded.texts, missing, bootstrap),
      durationMs: Math.round(performance.now() - stepStarted),
    });
  }

  const driftFindings = detectDrift({
    bootstrap,
    memory: memState,
    steps,
  });

  const missionContext = buildMissionContextPackage({
    bootstrap,
    memory: memState,
    planner,
    steps,
    driftFindings,
    artifacts: loaded.texts,
    requestMissionId: request.missionId,
    requestMissionTitle: request.missionTitle,
  });

  const criticalFailures = steps.filter((s) => s.status === "failed").length;
  const highest = highestDriftSeverity(driftFindings);
  const success =
    criticalFailures === 0 &&
    (highest === null || highest === "low" || highest === "medium");

  return {
    pipelineVersion: "P4-02",
    synchronizedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    success,
    steps,
    driftFindings,
    highestDriftSeverity: highest,
    missionContext,
    visionVersion: extractVisionVersionFromArtifacts(loaded.texts),
    constitutionalState: summarizeConstitutionalState(steps),
    architectureState: summarizeArchitectureState(steps),
    repositoryState: summarizeRepositoryState(bootstrap, memState),
    productionAlignment: summarizeProductionAlignment(steps),
  };
}

function readTextSync(repositoryRoot: string, relativePath: string): string | null {
  try {
    const absolute = path.join(repositoryRoot, relativePath);
    if (!fs.existsSync(absolute)) return null;
    return fs.readFileSync(absolute, "utf8");
  } catch {
    return null;
  }
}

function loadArtifactsSync(
  repositoryRoot: string,
  paths: string[],
): { texts: Record<string, string | null>; missing: string[] } {
  const texts: Record<string, string | null> = {};
  const missing: string[] = [];
  for (const p of paths) {
    const text = readTextSync(repositoryRoot, p);
    texts[p] = text;
    if (!text?.trim()) missing.push(p);
  }
  return { texts, missing };
}

/** Synchronous pipeline for Builder gate (Cursor Bridge — no async break). */
export function executeVisionSyncPipelineSync(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryEngine;
  planner: MissionPlannerEngine;
  request?: VisionSyncRequest;
}): VisionSyncPipelineResult {
  const started = performance.now();
  const { bootstrap, memory, planner, request = {} } = input;
  memory.ensureFresh();
  const memState = memory.getMemory();

  const allPaths = [...new Set(PIPELINE_STEP_ORDER.flatMap((s) => s.paths))];
  const loaded = loadArtifactsSync(bootstrap.repositoryRoot, allPaths);

  const steps: SyncStepResult[] = [];

  for (const stepDef of PIPELINE_STEP_ORDER) {
    const stepStarted = performance.now();
    const missing = stepDef.paths.filter((p) => !loaded.texts[p]?.trim());
    let status = stepStatus(missing, stepDef.paths.length);

    if (stepDef.step === "mission_context" && missing.includes(VISION_SYNC_SYSTEM_PATH)) {
      status = "degraded";
    }

    if (stepDef.step === "mission_generation" && status !== "failed") {
      status = "complete";
    }

    steps.push({
      step: stepDef.step,
      label: stepDef.label,
      status,
      artifactPaths: stepDef.paths,
      summary: summarizeStep(stepDef, loaded.texts, missing, bootstrap),
      durationMs: Math.round(performance.now() - stepStarted),
    });
  }

  const driftFindings = detectDrift({
    bootstrap,
    memory: memState,
    steps,
  });

  const missionContext = buildMissionContextPackage({
    bootstrap,
    memory: memState,
    planner,
    steps,
    driftFindings,
    artifacts: loaded.texts,
    requestMissionId: request.missionId,
    requestMissionTitle: request.missionTitle,
  });

  const criticalFailures = steps.filter((s) => s.status === "failed").length;
  const highest = highestDriftSeverity(driftFindings);
  const success =
    criticalFailures === 0 &&
    (highest === null || highest === "low" || highest === "medium");

  return {
    pipelineVersion: "P4-02",
    synchronizedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    success,
    steps,
    driftFindings,
    highestDriftSeverity: highest,
    missionContext,
    visionVersion: extractVisionVersionFromArtifacts(loaded.texts),
    constitutionalState: summarizeConstitutionalState(steps),
    architectureState: summarizeArchitectureState(steps),
    repositoryState: summarizeRepositoryState(bootstrap, memState),
    productionAlignment: summarizeProductionAlignment(steps),
  };
}
