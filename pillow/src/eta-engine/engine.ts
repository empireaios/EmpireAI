import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { BuilderMonitorEngine } from "../builder-monitor/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import {
  buildEtaReadinessPipeline,
  buildEtaReadinessPipelineSync,
  evaluateEtaBuilderGate,
} from "./builder-gate.js";
import {
  ETA_ENGINE_PATH,
  BUILDER_MONITOR_COMPANION_PATH,
  SUPERVISOR_SYSTEM_ETA_COMPANION_PATH,
} from "./paths.js";
import { formatEtaEnginePreamble } from "./mission-preamble.js";
import { calculateEtaEstimate, triggerFromBuilderEvent } from "./eta-calculator.js";
import { ETA_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { ETA_CONFIDENCE_CLASSIFICATIONS } from "./paths.js";
import type {
  EtaBuilderGateResult,
  EtaEngineAnalysis,
  EtaEngineAssessment,
  EtaEngineMetrics,
  EtaEngineRequest,
  EtaEngineState,
  EtaEstimate,
  EtaUpdateTrigger,
} from "./types.js";

export interface EtaEngineSurfaces {
  supervisor?: CursorSupervisorEngine | null;
  builderMonitor?: BuilderMonitorEngine | null;
  executionControlCenter?: ExecutionControlCenterEngine | null;
  journeySystem?: JourneySystemEngine | null;
  planner?: MissionPlannerEngine | null;
  memory?: RepositoryMemoryEngine | null;
}

/**
 * ETA Engine (PILLOW-ETA-001 / P6-05).
 * Continuously predicts remaining execution time from live operational evidence.
 */
export class EtaEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private surfacesAttached = false;
  private surfaces: EtaEngineSurfaces = {};
  private lastReadiness: import("./types.js").EtaReadinessPipeline | null = null;
  private lastAssessment: EtaEngineAssessment | null = null;
  private lastEstimate: EtaEstimate | null = null;
  private updateCount = 0;
  private previousConfidence = 0;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<EtaEngineState> {
    const systemDoc = await this.reader.readText(ETA_ENGINE_PATH);
    if (!systemDoc?.includes("ETA Engine")) {
      throw new Error(`${ETA_ENGINE_PATH} missing — ETA Engine requires P6-05 doctrine.`);
    }
    const builderMonitor = await this.reader.readText(BUILDER_MONITOR_COMPANION_PATH);
    if (!builderMonitor?.includes("Builder Monitor")) {
      throw new Error(
        `${BUILDER_MONITOR_COMPANION_PATH} missing — ETA requires Builder Monitor companion.`,
      );
    }
    const supervisor = await this.reader.readText(SUPERVISOR_SYSTEM_ETA_COMPANION_PATH);
    if (!supervisor?.includes("Supervisor System")) {
      throw new Error(
        `${SUPERVISOR_SYSTEM_ETA_COMPANION_PATH} missing — ETA requires Supervisor companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  attachSurfaces(surfaces: EtaEngineSurfaces): void {
    this.surfaces = surfaces;
    this.surfacesAttached = Boolean(surfaces.builderMonitor || surfaces.supervisor);
  }

  getState(): EtaEngineState {
    if (!this.initializedAt) {
      throw new Error("ETA Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-ETA-001",
      status:
        this.lastEstimate?.confidenceLevel === "unknown"
          ? "degraded"
          : this.lastEstimate?.currentDelayReason &&
              this.lastEstimate.confidenceLevel === "low"
            ? "degraded"
            : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: ETA_ENGINE_PATH,
      companionPath: BUILDER_MONITOR_COMPANION_PATH,
      surfacesAttached: this.surfacesAttached,
      lastEstimate: this.lastEstimate,
    };
  }

  /** Recalculate ETA from live Supervisor + Builder Monitor evidence. */
  updateEta(request: EtaEngineRequest = {}): EtaEstimate {
    const registry = this.surfaces.supervisor?.getState().registry;
    const activeMission = registry?.activeMission ?? null;

    let telemetry = null;
    if (this.surfaces.builderMonitor) {
      const sync = this.surfaces.builderMonitor.validateForEccSync(request);
      telemetry = sync.telemetry;
    }

    const historicalDurationMs = this.estimateHistoricalDuration();

    const estimate = calculateEtaEstimate({
      telemetry,
      activeMission,
      historicalDurationMs,
      request,
    });

    this.lastEstimate = estimate;
    this.updateCount += 1;
    this.previousConfidence = estimate.confidencePercent;

    this.surfaces.journeySystem?.publishEvent({
      type: "mission_started",
      label: "ETA updated",
      detail: `ETA: ~${Math.round(estimate.estimatedRemainingTimeMs / 60000)} min remaining · ${estimate.confidencePercent}% confidence`,
      stage: "builder_mission",
    });

    this.lastAssessment = this.buildAssessment(estimate);
    return estimate;
  }

  private estimateHistoricalDuration(): number | undefined {
    const completed = this.surfaces.supervisor?.getState().registry.completed ?? [];
    if (completed.length === 0) return undefined;
    const avg =
      completed.reduce((sum, m) => sum + m.durationMs, 0) / completed.length;
    return avg > 0 ? avg : undefined;
  }

  /** Called when Builder Monitor emits events — automatic ETA refresh. */
  onExecutionEvidence(input: {
    eventKind?: string;
    missionId?: string | null;
    missionTitle?: string | null;
  }): EtaEstimate {
    const trigger =
      (input.eventKind ? triggerFromBuilderEvent(input.eventKind) : null) ??
      "execution_velocity_change";
    return this.updateEta({
      missionId: input.missionId,
      missionTitle: input.missionTitle,
      trigger,
    });
  }

  getLastEstimate(): EtaEstimate | null {
    return this.lastEstimate;
  }

  async refreshReadiness(request: EtaEngineRequest = {}): Promise<EtaBuilderGateResult> {
    const pipeline = await buildEtaReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateEtaBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: EtaEngineRequest = {}): EtaBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildEtaReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return evaluateEtaBuilderGate(pipeline, request);
  }

  runAssessment(request: EtaEngineRequest = {}): EtaEngineAssessment {
    const estimate = this.lastEstimate ?? this.updateEta(request);
    return this.buildAssessment(estimate);
  }

  private buildAssessment(estimate: EtaEstimate): EtaEngineAssessment {
    const quality =
      estimate.confidencePercent >= this.previousConfidence
        ? estimate.confidencePercent >= 75
          ? "accurate"
          : "improving"
        : "degraded";

    const assessment: EtaEngineAssessment = {
      success: estimate.confidenceLevel !== "unknown",
      predictionQuality: this.updateCount > 1 ? quality : "unknown",
      lastEstimate: estimate,
      updateCount: this.updateCount,
      recommendations: [
        estimate.recommendedAction,
        "ETA auto-updates on progress · recovery · validation · dependency changes",
        "ECC uses ETA for mission scheduling and resource allocation",
      ],
      grandKingSummary: estimate.missionTitle
        ? `ETA: ${estimate.missionTitle} · ~${Math.round(estimate.estimatedRemainingTimeMs / 60000)} min remaining · ${estimate.confidencePercent}% confidence · completes ${estimate.predictedCompletionAt}`
        : "ETA: no active mission — ready for next Builder execution",
    };
    this.lastAssessment = assessment;
    return assessment;
  }

  validateForEccSync(request: EtaEngineRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    estimate: EtaEstimate;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const estimate = this.lastEstimate ?? this.updateEta(request);
    return {
      valid: gate.allowed && estimate.confidenceLevel !== "unknown",
      health:
        estimate.confidenceLevel === "unknown"
          ? "degraded"
          : estimate.currentDelayReason
            ? "degraded"
            : "healthy",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        `Confidence: ${estimate.confidencePercent}% (${estimate.confidenceLevel})`,
        estimate.reason,
      ],
      estimate,
    };
  }

  formatMissionPreamble(request: EtaEngineRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildEtaReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return formatEtaEnginePreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  verifyGrandKingClarity(): {
    complete: boolean;
    confidenceLevel: string;
    autoUpdate: boolean;
    assessment: EtaEngineAssessment;
  } {
    const estimate = this.updateEta({
      missionId: "P6-05",
      missionTitle: "ETA Engine validation",
      trigger: "progress_change",
    });
    const assessment = this.buildAssessment(estimate);
    const complete =
      Boolean(estimate.elapsedTimeMs >= 0) &&
      Boolean(estimate.estimatedRemainingTimeMs >= 0) &&
      Boolean(estimate.predictedCompletionAt) &&
      ETA_PIPELINE_REGISTRY.length >= 8 &&
      ETA_CONFIDENCE_CLASSIFICATIONS.length >= 5;

    return {
      complete,
      confidenceLevel: estimate.confidenceLevel,
      autoUpdate: true,
      assessment,
    };
  }

  analyzePredictionQuality(): EtaEngineAnalysis {
    const estimate = this.lastEstimate;
    const recommendations: string[] = [];
    const etaAccuracy: string[] = [];
    const predictionQuality: string[] = [];
    const historicalTrends: string[] = [];
    const executionEfficiency: string[] = [];
    const planningImprovements: string[] = [];

    if (estimate) {
      etaAccuracy.push(
        `Last prediction: ${estimate.confidencePercent}% confidence (${estimate.confidenceLevel})`,
      );
      predictionQuality.push(`Updates: ${this.updateCount} · velocity ${estimate.executionVelocity.toFixed(2)}%/min`);
      executionEfficiency.push(
        `${estimate.completionPercent}% complete · ${Math.round(estimate.elapsedTimeMs / 1000)}s elapsed`,
      );
      if (estimate.currentDelayReason) {
        planningImprovements.push(`Delay: ${estimate.currentDelayReason}`);
      }
      historicalTrends.push(
        this.estimateHistoricalDuration()
          ? `Historical avg: ${Math.round((this.estimateHistoricalDuration() ?? 0) / 60000)} min`
          : "Insufficient historical missions for comparison",
      );
      recommendations.push(estimate.recommendedAction);
    }

    recommendations.push("Pillow evaluates ETA accuracy and planning improvements continuously");

    return {
      etaAccuracy,
      predictionQuality,
      historicalTrends,
      executionEfficiency,
      planningImprovements,
      recommendations,
    };
  }

  getMetrics(): EtaEngineMetrics {
    return {
      totalResponsibilities: 10,
      pipelineStages: ETA_PIPELINE_REGISTRY.length,
      confidenceLevels: ETA_CONFIDENCE_CLASSIFICATIONS.length,
      updateTriggers: 9,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      updateCount: this.updateCount,
      averageConfidence: this.lastEstimate?.confidencePercent ?? 0,
      trend:
        this.lastAssessment?.predictionQuality === "accurate"
          ? "stable"
          : this.lastAssessment?.predictionQuality === "degraded"
            ? "degrading"
            : "improving",
    };
  }

  getCockpitSnapshot() {
    const estimate =
      this.lastEstimate ??
      this.updateEta({ missionId: "P6-05", roadmapItem: "P6-05", trigger: "progress_change" });
    const analysis = this.analyzePredictionQuality();

    return {
      currentMission: estimate.missionTitle ?? "No active mission",
      currentProgress: `${estimate.completionPercent}%`,
      elapsedTimeMs: estimate.elapsedTimeMs,
      estimatedRemainingTimeMs: estimate.estimatedRemainingTimeMs,
      predictedCompletionAt: estimate.predictedCompletionAt,
      confidence: `${estimate.confidencePercent}% (${estimate.confidenceLevel.replace(/_/g, " ")})`,
      confidencePercent: estimate.confidencePercent,
      executionVelocity: estimate.executionVelocity,
      criticalPath: estimate.criticalPath,
      currentDelays: estimate.currentDelayReason ?? "None",
      dependencyStatus:
        estimate.blockingDependencies.length > 0
          ? estimate.blockingDependencies.join(", ")
          : "No blocking dependencies",
      lastEtaUpdate: estimate.lastEtaUpdate,
      reason: estimate.reason,
      evidence: estimate.evidence,
      knownUncertainty: estimate.knownUncertainty,
      recommendedAction: estimate.recommendedAction,
      grandKingSummary: this.lastAssessment?.grandKingSummary ?? estimate.reason,
      metrics: this.getMetrics(),
      analysis,
    };
  }
}

export function createEtaEngine(bootstrap: EmpireBootstrapContext): EtaEngine {
  return new EtaEngine(bootstrap);
}
