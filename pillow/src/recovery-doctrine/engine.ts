import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import type { RecoveryRecord } from "../recovery/types.js";
import {
  buildRecoveryReadinessPipeline,
  evaluateRecoveryBuilderGate,
} from "./builder-gate.js";
import { executeRecoveryPipeline } from "./pipeline.js";
import {
  CURSOR_RECOVERY_COMPANION_PATH,
  RECOVERY_DOCTRINE_SYSTEM_PATH,
  RECOVERY_LIMITS,
} from "./paths.js";
import { formatRecoveryPreamble } from "./mission-preamble.js";
import type {
  RecoveryBuilderGateResult,
  RecoveryDoctrineRequest,
  RecoveryDoctrineState,
  RecoveryEffectivenessReview,
  RecoveryMetrics,
  RecoveryMissionFailureRequest,
  RecoveryPipelineResult,
} from "./types.js";

/**
 * Recovery Doctrine Engine (PILLOW-RD-001 / P4-05).
 * Permanent constitutional recovery capability for Builder, Supervisor, and Pillow.
 */
export class RecoveryDoctrineEngine {
  private initializedAt: string | null = null;
  private totalPipelineRuns = 0;
  private totalRecoveriesAttempted = 0;
  private totalRecoveriesSucceeded = 0;
  private lastPipeline: RecoveryPipelineResult | null = null;
  private history: RecoveryPipelineResult[] = [];
  private reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private recoveryManager: RecoveryManagerEngine,
    private planner: MissionPlannerEngine,
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RecoveryDoctrineState> {
    const systemDoc = await this.reader.readText(RECOVERY_DOCTRINE_SYSTEM_PATH);
    if (!systemDoc?.includes("Recovery Doctrine")) {
      throw new Error(
        `${RECOVERY_DOCTRINE_SYSTEM_PATH} missing — Recovery Doctrine Engine requires P4-05 system doc.`,
      );
    }
    const companion = await this.reader.readText(CURSOR_RECOVERY_COMPANION_PATH);
    if (!companion?.includes("Recovery Mode")) {
      throw new Error(
        `${CURSOR_RECOVERY_COMPANION_PATH} missing — Recovery Doctrine requires companion execution doctrine.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): RecoveryDoctrineState {
    if (!this.initializedAt) {
      throw new Error("Recovery Doctrine Engine not initialized. Call initialize() first.");
    }
    const status =
      this.lastPipeline?.escalated && !this.lastPipeline.recovered
        ? "degraded"
        : "ready";
    return {
      engineVersion: "PILLOW-RD-001",
      status,
      initializedAt: this.initializedAt,
      doctrinePath: RECOVERY_DOCTRINE_SYSTEM_PATH,
      companionPath: CURSOR_RECOVERY_COMPANION_PATH,
      totalPipelineRuns: this.totalPipelineRuns,
      totalRecoveriesAttempted: this.totalRecoveriesAttempted,
      totalRecoveriesSucceeded: this.totalRecoveriesSucceeded,
      lastPipeline: this.lastPipeline,
    };
  }

  evaluateBuilderGateSync(request: RecoveryDoctrineRequest = {}): RecoveryBuilderGateResult {
    const pipeline = buildRecoveryReadinessPipeline({
      bootstrap: this.bootstrap,
      recoveryManager: this.recoveryManager,
      request,
    });
    return evaluateRecoveryBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: RecoveryDoctrineRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").RecoveryReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health: gate.pipeline.readinessScore >= 75 ? "healthy" : gate.allowed ? "degraded" : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        `Limits: max ${RECOVERY_LIMITS.maxRetryAttempts} retries · confidence ≥ ${RECOVERY_LIMITS.recoveryConfidenceThreshold}`,
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: RecoveryDoctrineRequest = {}): string {
    const gate = this.evaluateBuilderGateSync(request);
    return formatRecoveryPreamble({
      readiness: gate.pipeline,
      lastPipeline: this.lastPipeline,
    });
  }

  /** Full P4-05 pipeline — detect → classify → recover → report. */
  async handleMissionFailure(
    request: RecoveryMissionFailureRequest,
  ): Promise<RecoveryPipelineResult> {
    this.totalPipelineRuns += 1;
    this.totalRecoveriesAttempted += 1;

    const result = await executeRecoveryPipeline({
      bootstrap: this.bootstrap,
      recoveryManager: this.recoveryManager,
      request,
    });

    if (result.recovered) this.totalRecoveriesSucceeded += 1;
    this.lastPipeline = result;
    this.history.push(result);
    return result;
  }

  recordRecoveryOutcome(record: RecoveryRecord): void {
    if (
      record.outcome === "recovered_successfully" ||
      record.outcome === "recovered_with_warnings" ||
      record.outcome === "mission_already_complete"
    ) {
      this.totalRecoveriesSucceeded += 1;
    }
  }

  getMetrics(): RecoveryMetrics {
    const records = this.recoveryManager.getHistory();
    const succeeded = records.filter(
      (r) =>
        r.outcome === "recovered_successfully" ||
        r.outcome === "recovered_with_warnings" ||
        r.outcome === "mission_already_complete",
    ).length;
    const total = Math.max(records.length, this.totalRecoveriesAttempted);
    const durations = records.map((r) => r.durationMs);
    const avg =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    const repeated = records.filter((r) => r.outcome === "recovery_failed").length;

    return {
      successRate: total > 0 ? succeeded / total : 1,
      averageDurationMs: Math.round(avg),
      repeatedFailures: repeated,
      missionRecoveries: records.length,
      builderRecoveries: this.totalRecoveriesSucceeded,
      productionRecoveries: this.history.filter((h) => h.classification === "production").length,
      trend:
        repeated > 2 ? "degrading" : succeeded > repeated ? "improving" : "stable",
    };
  }

  reviewEffectiveness(): RecoveryEffectivenessReview {
    const metrics = this.getMetrics();
    const recurring = this.history
      .filter((h) => !h.recovered)
      .map((h) => `${h.classification}: ${h.rootCause}`)
      .slice(0, 5);

    return {
      effectivenessScore: Math.round(metrics.successRate * 100),
      recurringFailures: recurring,
      architecturalWeaknesses: this.history
        .filter((h) => h.classification === "architecture")
        .map((h) => h.rootCause),
      engineeringWeaknesses: this.history
        .filter((h) => h.classification === "engineering")
        .map((h) => h.rootCause),
      recommendations: [
        metrics.successRate < 0.7
          ? "Increase recovery confidence validation before autonomous execution"
          : "Recovery effectiveness within policy",
        recurring.length > 0 ? "Investigate recurring failure patterns" : "No recurring patterns",
      ],
      constitutionalImplications: [
        "Recovery aligns with Cursor Protocol pre-mission checks",
        "Irreversible actions require Grand King per escalation policy",
      ],
    };
  }

  getCockpitSnapshot() {
    const state = this.getState();
    const metrics = this.getMetrics();
    const review = this.reviewEffectiveness();
    const last = this.lastPipeline;

    return {
      recoveryStatus: state.status,
      recoveryState: last?.recovered ? "recovered" : last ? "incident" : "ready",
      recoveryProgress: last
        ? `${last.steps.filter((s) => s.status === "completed").length}/${last.steps.length} steps`
        : "Idle",
      recoveryAttempts: state.totalRecoveriesAttempted,
      recoveryConfidence: last ? last.recoveryConfidence : 1,
      rootCause: last?.rootCause ?? "None",
      currentRisks: last?.report.remainingRisks ?? [],
      escalationLevel: last?.escalationLevel ?? "supervisor",
      recommendedAction:
        last?.report.summary ?? "Autonomous recovery authorized when safe",
      metrics,
      effectivenessScore: review.effectivenessScore,
    };
  }
}

export function createRecoveryDoctrineEngine(
  bootstrap: EmpireBootstrapContext,
  recoveryManager: RecoveryManagerEngine,
  planner: MissionPlannerEngine,
): RecoveryDoctrineEngine {
  return new RecoveryDoctrineEngine(bootstrap, recoveryManager, planner);
}
