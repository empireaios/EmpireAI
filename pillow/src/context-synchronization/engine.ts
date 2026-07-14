import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import { evaluateContextBuilderGate } from "./builder-gate.js";
import { executeContextSyncPipeline, executeContextSyncPipelineSync } from "./pipeline.js";
import { CONTEXT_SYNC_SYSTEM_PATH } from "./paths.js";
import type {
  ContextBuilderGateResult,
  ContextSyncPipelineResult,
  ContextSyncRequest,
  ContextSynchronizationState,
} from "./types.js";

/**
 * Context Synchronization Engine (PILLOW-CS-001 / P4-03).
 * Pillow owns complete operational context before every engineering mission.
 */
export class ContextSynchronizationEngine {
  private initializedAt: string | null = null;
  private lastSync: ContextSyncPipelineResult | null = null;
  private totalSyncs = 0;
  private reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private intelligence: RepositoryIntelligenceContext,
    private memory: RepositoryMemoryEngine,
    private planner: MissionPlannerEngine,
    private visionSync: VisionSynchronizationEngine,
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ContextSynchronizationState> {
    const text = await this.reader.readText(CONTEXT_SYNC_SYSTEM_PATH);
    if (!text?.includes("Context Synchronization")) {
      throw new Error(
        `${CONTEXT_SYNC_SYSTEM_PATH} missing — Context Synchronization Engine requires P4-03 system doc.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ContextSynchronizationState {
    if (!this.initializedAt) {
      throw new Error(
        "Context Synchronization Engine not initialized. Call initialize() first.",
      );
    }
    const status =
      this.lastSync === null
        ? "ready"
        : this.lastSync.success
          ? "ready"
          : "degraded";
    return {
      engineVersion: "PILLOW-CS-001",
      status,
      initializedAt: this.initializedAt,
      lastSync: this.lastSync,
      totalSyncs: this.totalSyncs,
      doctrinePath: CONTEXT_SYNC_SYSTEM_PATH,
    };
  }

  async synchronize(request: ContextSyncRequest = {}): Promise<ContextSyncPipelineResult> {
    const result = await executeContextSyncPipeline({
      bootstrap: this.bootstrap,
      memory: this.memory,
      intelligence: this.intelligence,
      planner: this.planner,
      visionSync: this.visionSync,
      reader: this.reader,
      request,
    });
    this.lastSync = result;
    this.totalSyncs += 1;
    return result;
  }

  evaluateBuilderGateSync(request: ContextSyncRequest = {}): ContextBuilderGateResult {
    const pipeline = executeContextSyncPipelineSync({
      bootstrap: this.bootstrap,
      memory: this.memory,
      intelligence: this.intelligence,
      planner: this.planner,
      visionSync: this.visionSync,
      request,
    });
    this.lastSync = pipeline;
    this.totalSyncs += 1;
    return evaluateContextBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: ContextSyncRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    completionPercent: number;
    notes: string[];
    pipeline: ContextSyncPipelineResult;
  } {
    const pipeline =
      this.lastSync ??
      executeContextSyncPipelineSync({
        bootstrap: this.bootstrap,
        memory: this.memory,
        intelligence: this.intelligence,
        planner: this.planner,
        visionSync: this.visionSync,
        request,
      });

    const notes = [
      `Completeness: ${pipeline.contextCompletenessPercent}%`,
      `Roadmap: ${pipeline.roadmapPosition}`,
      `Architecture: ${pipeline.architectureVersion}`,
      `Production: ${pipeline.productionAlignment}`,
    ];

    const blocked =
      pipeline.steps.some((s) => s.status === "failed") ||
      pipeline.alignmentFindings.some((f) => f.severity === "critical" || f.severity === "high") ||
      pipeline.contextCompletenessPercent < 75;

    return {
      valid: pipeline.success && !blocked,
      health: blocked ? "blocked" : pipeline.success ? "healthy" : "degraded",
      completionPercent: pipeline.contextCompletenessPercent,
      notes,
      pipeline,
    };
  }

  getLastSync(): ContextSyncPipelineResult | null {
    return this.lastSync;
  }
}

export function createContextSynchronizationEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryEngine,
  planner: MissionPlannerEngine,
  visionSync: VisionSynchronizationEngine,
): ContextSynchronizationEngine {
  return new ContextSynchronizationEngine(
    bootstrap,
    intelligence,
    memory,
    planner,
    visionSync,
  );
}
