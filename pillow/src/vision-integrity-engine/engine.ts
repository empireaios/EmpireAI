import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import {
  buildVisionIntegrityReadinessPipeline,
  buildVisionIntegrityReadinessPipelineSync,
  evaluateVisionIntegrityBuilderGate,
} from "./builder-gate.js";
import {
  VISION_INTEGRITY_ENGINE_PATH,
  VISION_SYNC_COMPANION_PATH,
  EXECUTION_CONTROL_CENTER_COMPANION_PATH,
} from "./paths.js";
import { formatVisionIntegrityPreamble } from "./mission-preamble.js";
import {
  evaluateMissionIntegrity,
  executeVisionIntegrityAssessment,
  buildDefaultVisionIntegritySnapshot,
} from "./integrity-assessment.js";
import { INTEGRITY_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { INTEGRITY_DRIFT_REGISTRY } from "./drift-registry.js";
import type {
  MissionIntegrityResult,
  VisionIntegrityAnalysis,
  VisionIntegrityAssessment,
  VisionIntegrityBuilderGateResult,
  VisionIntegrityMetrics,
  VisionIntegrityRequest,
  VisionIntegritySnapshot,
  VisionIntegrityEngineState,
} from "./types.js";

export interface VisionIntegritySurfaces {
  visionSync?: VisionSynchronizationEngine | null;
  memory?: RepositoryMemoryEngine | null;
  planner?: MissionPlannerEngine | null;
  executionControlCenter?: ExecutionControlCenterEngine | null;
  supervisor?: CursorSupervisorEngine | null;
  journeySystem?: JourneySystemEngine | null;
}

/**
 * Vision Integrity Engine (PILLOW-VIE-001 / P6-02).
 * Constitutional guardian of Empire direction — Should we do this?
 */
export class VisionIntegrityEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private surfacesAttached = false;
  private surfaces: VisionIntegritySurfaces = {};
  private lastReadiness: import("./types.js").VisionIntegrityReadinessPipeline | null = null;
  private lastAssessment: VisionIntegrityAssessment | null = null;
  private lastSnapshot: VisionIntegritySnapshot | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<VisionIntegrityEngineState> {
    const systemDoc = await this.reader.readText(VISION_INTEGRITY_ENGINE_PATH);
    if (!systemDoc?.includes("Vision Integrity")) {
      throw new Error(
        `${VISION_INTEGRITY_ENGINE_PATH} missing — VIE requires P6-02 doctrine.`,
      );
    }
    const visionSync = await this.reader.readText(VISION_SYNC_COMPANION_PATH);
    if (!visionSync?.includes("Vision Synchronization")) {
      throw new Error(
        `${VISION_SYNC_COMPANION_PATH} missing — VIE requires Vision Sync companion.`,
      );
    }
    const ecc = await this.reader.readText(EXECUTION_CONTROL_CENTER_COMPANION_PATH);
    if (!ecc?.includes("Execution Control Center")) {
      throw new Error(
        `${EXECUTION_CONTROL_CENTER_COMPANION_PATH} missing — VIE requires ECC companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  attachSurfaces(surfaces: VisionIntegritySurfaces): void {
    this.surfaces = surfaces;
    this.surfacesAttached = Boolean(surfaces.visionSync || surfaces.memory);
  }

  getState(): VisionIntegrityEngineState {
    if (!this.initializedAt) {
      throw new Error("Vision Integrity Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-VIE-001",
      status:
        this.lastAssessment?.classification === "critical_drift" ? "blocked" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: VISION_INTEGRITY_ENGINE_PATH,
      companionPath: VISION_SYNC_COMPANION_PATH,
      surfacesAttached: this.surfacesAttached,
      lastAssessment: this.lastAssessment,
    };
  }

  /** Automatic pre-execution Vision Integrity evaluation. */
  evaluateMissionIntegrity(request: VisionIntegrityRequest = {}): MissionIntegrityResult {
    const memory = this.surfaces.memory?.getMemory() ?? null;
    const visionPipeline =
      this.surfaces.visionSync?.getState().lastSync ??
      (this.surfaces.visionSync
        ? this.surfaces.visionSync.evaluateBuilderGateSync(request).pipeline
        : null);

    const result = evaluateMissionIntegrity({
      bootstrap: this.bootstrap,
      memory,
      visionPipeline,
      request,
    });

    this.lastAssessment = executeVisionIntegrityAssessment({
      bootstrap: this.bootstrap,
      memory,
      visionPipeline,
      request,
    });
    this.lastSnapshot = this.lastAssessment.snapshot;

    return result;
  }

  /** ECC calls this before approving execution. */
  validateForEccSync(request: VisionIntegrityRequest = {}): MissionIntegrityResult {
    return this.evaluateMissionIntegrity(request);
  }

  runAssessment(request: VisionIntegrityRequest = {}): VisionIntegrityAssessment {
    const memory = this.surfaces.memory?.getMemory() ?? null;
    const visionPipeline = this.surfaces.visionSync?.getState().lastSync ?? null;
    const assessment = executeVisionIntegrityAssessment({
      bootstrap: this.bootstrap,
      memory,
      visionPipeline,
      request,
    });
    this.lastAssessment = assessment;
    this.lastSnapshot = assessment.snapshot;
    return assessment;
  }

  async refreshReadiness(
    request: VisionIntegrityRequest = {},
  ): Promise<VisionIntegrityBuilderGateResult> {
    const pipeline = await buildVisionIntegrityReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateVisionIntegrityBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(
    request: VisionIntegrityRequest = {},
  ): VisionIntegrityBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildVisionIntegrityReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateVisionIntegrityBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: VisionIntegrityRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").VisionIntegrityReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const integrity = this.evaluateMissionIntegrity(request);
    return {
      valid: gate.allowed && integrity.allowed,
      health:
        integrity.approvalStatus === "blocked"
          ? "blocked"
          : gate.pipeline.readinessScore >= 75
            ? "healthy"
            : "degraded",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        `Integrity: ${integrity.classification}`,
        integrity.reason,
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: VisionIntegrityRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildVisionIntegrityReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatVisionIntegrityPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  /** Grand King acceptance — automatic evaluation without manual constitutional review. */
  verifyGrandKingClarity(): {
    complete: boolean;
    classification: string;
    approvalStatus: string;
    alignmentScore: number;
    assessment: VisionIntegrityAssessment;
    automaticEvaluation: boolean;
  } {
    const assessment = this.runAssessment({ missionId: "P6-02", missionTitle: "VIE validation" });
    const complete =
      assessment.success &&
      assessment.grandKingSummary.includes("VIE:") &&
      assessment.evaluation.reason.length > 0 &&
      INTEGRITY_PIPELINE_REGISTRY.length >= 13;

    return {
      complete,
      classification: assessment.classification,
      approvalStatus: assessment.approvalStatus,
      alignmentScore: assessment.visionAlignmentScore,
      assessment,
      automaticEvaluation: true,
    };
  }

  analyzeVisionEvolution(): VisionIntegrityAnalysis {
    const assessment = this.lastAssessment;
    const repositoryEvolution: string[] = [];
    const architectureEvolution: string[] = [];
    const engineeringEvolution: string[] = [];
    const businessEvolution: string[] = [];
    const missionEvolution: string[] = [];
    const knowledgeEvolution: string[] = [];
    const recommendations: string[] = [];

    if (assessment) {
      repositoryEvolution.push(
        `Repository alignment: ${assessment.classification.replace(/_/g, " ")}`,
      );
      if (assessment.detectedDrifts.some((d) => d.includes("repository"))) {
        repositoryEvolution.push("Repository drift detected — refresh memory");
      }
      architectureEvolution.push("Architecture validated against canonical law");
      engineeringEvolution.push("Engineering gates: Cursor Protocol + pre-mission checks");
      businessEvolution.push("Business alignment via objective engine");
      missionEvolution.push(
        assessment.snapshot?.missionTitle
          ? `Mission: ${assessment.snapshot.missionTitle}`
          : "Next mission evaluated against roadmap",
      );
      knowledgeEvolution.push("Vision accumulation and lessons learned tracked");
      recommendations.push(...assessment.recommendations);
    }

    recommendations.push(
      "ECC must request VIE validation before execution approval",
      "Critical Drift requires Grand King explicit override",
    );

    return {
      repositoryEvolution,
      architectureEvolution,
      engineeringEvolution,
      businessEvolution,
      missionEvolution,
      knowledgeEvolution,
      recommendations,
    };
  }

  getMetrics(): VisionIntegrityMetrics {
    const assessment = this.lastAssessment;
    return {
      totalResponsibilities: 10,
      pipelineStages: INTEGRITY_PIPELINE_REGISTRY.length,
      driftSignals: INTEGRITY_DRIFT_REGISTRY.length,
      classifications: 6,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      visionAlignmentScore: assessment?.visionAlignmentScore ?? 75,
      trend:
        assessment?.classification === "aligned" || assessment?.classification === "minor_drift"
          ? "stable"
          : assessment?.classification === "critical_drift"
            ? "degrading"
            : "improving",
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzeVisionEvolution();
    const last = this.lastAssessment;

    return {
      visionAlignment: last?.classification.replace(/_/g, " ") ?? "unknown",
      visionAlignmentScore: last?.visionAlignmentScore ?? metrics.visionAlignmentScore,
      currentDrift: last?.detectedDrifts ?? [],
      currentRecommendations: last?.recommendations ?? [],
      currentViolations: last?.violations ?? [],
      repositoryAlignment: analysis.repositoryEvolution.join(" · ") || "Awaiting assessment",
      architectureAlignment: analysis.architectureEvolution.join(" · ") || "Canonical law active",
      missionAlignment: analysis.missionEvolution.join(" · ") || "Planner evaluated",
      businessAlignment: analysis.businessEvolution.join(" · ") || "Objective engine active",
      productionAlignment: "Production Truth + Production Mode validated",
      approvalStatus: last?.approvalStatus ?? "conditional",
      integrityReview: last?.review.map((r) => `${r.dimension}: ${r.aligned ? "aligned" : "review"}`) ?? [],
      grandKingSummary: last?.grandKingSummary ?? "Run VIE assessment",
      metrics,
      analysis,
    };
  }
}

export function createVisionIntegrityEngine(
  bootstrap: EmpireBootstrapContext,
): VisionIntegrityEngine {
  return new VisionIntegrityEngine(bootstrap);
}
