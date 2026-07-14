import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import { evaluateBuilderSyncGate } from "./builder-gate.js";
import { executeVisionSyncPipeline, executeVisionSyncPipelineSync } from "./pipeline.js";
import { VISION_SYNC_SYSTEM_PATH } from "./paths.js";
import type {
  BuilderSyncGateResult,
  SupervisorSyncValidation,
  VisionSyncPipelineResult,
  VisionSyncRequest,
  VisionSynchronizationState,
} from "./types.js";

/**
 * Vision Synchronization Engine (PILLOW-VS-001 / P4-02).
 * Pillow permanently owns constitutional alignment before every engineering mission.
 */
export class VisionSynchronizationEngine {
  private initializedAt: string | null = null;
  private lastSync: VisionSyncPipelineResult | null = null;
  private totalSyncs = 0;
  private reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private memory: RepositoryMemoryEngine,
    private planner: MissionPlannerEngine,
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<VisionSynchronizationState> {
    const text = await this.reader.readText(VISION_SYNC_SYSTEM_PATH);
    if (!text?.includes("Vision Synchronization")) {
      throw new Error(
        `${VISION_SYNC_SYSTEM_PATH} missing — Vision Synchronization Engine requires P4-02 system doc.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): VisionSynchronizationState {
    if (!this.initializedAt) {
      throw new Error(
        "Vision Synchronization Engine not initialized. Call initialize() first.",
      );
    }
    const status =
      this.lastSync === null
        ? "ready"
        : this.lastSync.success
          ? "ready"
          : "degraded";
    return {
      engineVersion: "PILLOW-VS-001",
      status,
      initializedAt: this.initializedAt,
      lastSync: this.lastSync,
      totalSyncs: this.totalSyncs,
      doctrinePath: VISION_SYNC_SYSTEM_PATH,
    };
  }

  /** Execute full constitutional synchronization pipeline. */
  async synchronize(request: VisionSyncRequest = {}): Promise<VisionSyncPipelineResult> {
    const result = await executeVisionSyncPipeline({
      bootstrap: this.bootstrap,
      memory: this.memory,
      planner: this.planner,
      reader: this.reader,
      request,
    });
    this.lastSync = result;
    this.totalSyncs += 1;
    return result;
  }

  /** Builder gate — refuse implementation when synchronization fails (sync). */
  evaluateBuilderGateSync(
    request: VisionSyncRequest = {},
  ): BuilderSyncGateResult {
    const pipeline = executeVisionSyncPipelineSync({
      bootstrap: this.bootstrap,
      memory: this.memory,
      planner: this.planner,
      request,
    });
    this.lastSync = pipeline;
    this.totalSyncs += 1;
    return evaluateBuilderSyncGate(pipeline, request);
  }

  /** Builder gate — refuse implementation when synchronization fails. */
  async evaluateBuilderGate(
    request: VisionSyncRequest = {},
  ): Promise<BuilderSyncGateResult> {
    const pipeline = await this.synchronize(request);
    return evaluateBuilderSyncGate(pipeline, request);
  }

  /** Supervisor validation — continuous synchronization health check (sync). */
  validateForSupervisorSync(
    request: VisionSyncRequest = {},
  ): SupervisorSyncValidation {
    const pipeline =
      this.lastSync ??
      executeVisionSyncPipelineSync({
        bootstrap: this.bootstrap,
        memory: this.memory,
        planner: this.planner,
        request,
      });
    return this.buildSupervisorValidation(pipeline);
  }

  /** Supervisor validation — continuous synchronization health check. */
  async validateForSupervisor(
    request: VisionSyncRequest = {},
  ): Promise<SupervisorSyncValidation> {
    const pipeline = this.lastSync ?? (await this.synchronize(request));
    return this.buildSupervisorValidation(pipeline);
  }

  private buildSupervisorValidation(
    pipeline: VisionSyncPipelineResult,
  ): SupervisorSyncValidation {
    const completeSteps = pipeline.steps.filter((s) => s.status === "complete").length;
    const completionPercent = Math.round((completeSteps / pipeline.steps.length) * 100);

    const alignmentNotes: string[] = [
      `Constitutional: ${pipeline.constitutionalState}`,
      `Architecture: ${pipeline.architectureState}`,
      `Repository: ${pipeline.repositoryState}`,
      `Production: ${pipeline.productionAlignment}`,
    ];

    if (pipeline.driftFindings.length > 0) {
      alignmentNotes.push(
        `Drift (${pipeline.driftFindings.length}): ${pipeline.driftFindings
          .slice(0, 3)
          .map((d) => d.signal)
          .join("; ")}`,
      );
    }

    const blocked =
      pipeline.steps.some((s) => s.status === "failed") ||
      pipeline.driftFindings.some((d) => d.severity === "critical" || d.severity === "high");

    return {
      valid: pipeline.success && !blocked,
      health: blocked ? "blocked" : pipeline.success ? "healthy" : "degraded",
      completionPercent,
      alignmentNotes,
      pipeline,
    };
  }

  getLastSync(): VisionSyncPipelineResult | null {
    return this.lastSync;
  }
}

export function createVisionSynchronizationEngine(
  bootstrap: EmpireBootstrapContext,
  memory: RepositoryMemoryEngine,
  planner: MissionPlannerEngine,
): VisionSynchronizationEngine {
  return new VisionSynchronizationEngine(bootstrap, memory, planner);
}
