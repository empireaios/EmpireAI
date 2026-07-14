import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildScalingArchitectureReadinessPipeline,
  buildScalingArchitectureReadinessPipelineSync,
  evaluateScalingArchitectureBuilderGate,
} from "./builder-gate.js";
import {
  SCALING_ARCHITECTURE_PATH,
  GUARDIAN_MONITORING_COMPANION_PATH,
  PRODUCTION_MODE_COMPANION_PATH,
} from "./paths.js";
import { formatScalingArchitecturePreamble } from "./mission-preamble.js";
import {
  buildDefaultScalingSnapshot,
  executeScalingArchitectureAssessment,
} from "./scaling-assessment.js";
import { CURRENT_ARCHITECTURE_REGISTRY } from "./current-architecture-registry.js";
import { SCALING_STAGE_REGISTRY, getStage } from "./scaling-stage-registry.js";
import {
  SCALING_BOTTLENECK_REGISTRY,
  getBottlenecksForStage,
} from "./evolution-registry.js";
import type {
  ScalingArchitectureAnalysis,
  ScalingArchitectureAssessment,
  ScalingArchitectureBuilderGateResult,
  ScalingArchitectureMetrics,
  ScalingArchitectureRequest,
  ScalingArchitectureSnapshot,
  ScalingArchitectureState,
} from "./types.js";

/**
 * Scaling Architecture Engine (PILLOW-SCL-001 / P5-05).
 * Permanent doctrine for deliberate production-first evolution to HA.
 */
export class ScalingArchitectureEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").ScalingArchitectureReadinessPipeline | null = null;
  private lastAssessment: ScalingArchitectureAssessment | null = null;
  private lastSnapshot: ScalingArchitectureSnapshot | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ScalingArchitectureState> {
    const systemDoc = await this.reader.readText(SCALING_ARCHITECTURE_PATH);
    if (!systemDoc?.includes("Scaling Architecture")) {
      throw new Error(
        `${SCALING_ARCHITECTURE_PATH} missing — Scaling Architecture Engine requires P5-05 doctrine.`,
      );
    }
    const monitoring = await this.reader.readText(GUARDIAN_MONITORING_COMPANION_PATH);
    if (!monitoring?.includes("Guardian Monitoring")) {
      throw new Error(
        `${GUARDIAN_MONITORING_COMPANION_PATH} missing — Scaling requires Guardian Monitoring companion.`,
      );
    }
    const productionMode = await this.reader.readText(PRODUCTION_MODE_COMPANION_PATH);
    if (!productionMode?.includes("Production Mode")) {
      throw new Error(
        `${PRODUCTION_MODE_COMPANION_PATH} missing — Scaling requires Production Mode companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ScalingArchitectureState {
    if (!this.initializedAt) {
      throw new Error("Scaling Architecture Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-SCL-001",
      status: this.lastAssessment?.scalingReadiness === "not_ready" ? "degraded" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: SCALING_ARCHITECTURE_PATH,
      companionPath: GUARDIAN_MONITORING_COMPANION_PATH,
      lastAssessment: this.lastAssessment,
    };
  }

  ingestScalingSnapshot(snapshot: ScalingArchitectureSnapshot): ScalingArchitectureAssessment {
    this.lastSnapshot = snapshot;
    const result = executeScalingArchitectureAssessment({ snapshot });
    this.lastAssessment = result;
    return result;
  }

  async refreshReadiness(
    request: ScalingArchitectureRequest = {},
  ): Promise<ScalingArchitectureBuilderGateResult> {
    const pipeline = await buildScalingArchitectureReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateScalingArchitectureBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(
    request: ScalingArchitectureRequest = {},
  ): ScalingArchitectureBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildScalingArchitectureReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateScalingArchitectureBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: ScalingArchitectureRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").ScalingArchitectureReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health: gate.pipeline.readinessScore >= 75 ? "healthy" : gate.allowed ? "degraded" : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        this.lastAssessment?.grandKingSummary ?? "Run scaling architecture assessment",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: ScalingArchitectureRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildScalingArchitectureReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatScalingArchitecturePreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  runAssessment(snapshot?: ScalingArchitectureSnapshot | null): ScalingArchitectureAssessment {
    const snap = snapshot ?? this.lastSnapshot ?? buildDefaultScalingSnapshot();
    return this.ingestScalingSnapshot(snap);
  }

  /** Grand King acceptance — current architecture, limits, next stage, migration without reconstruction. */
  verifyGrandKingClarity(): {
    complete: boolean;
    currentStage: string;
    nextStage: string;
    bottleneckCount: number;
    assessment: ScalingArchitectureAssessment;
    migrationPhases: number;
  } {
    const assessment = this.runAssessment();
    const current = getStage(assessment.currentStage);
    const next = getStage(assessment.recommendedNextStage);

    const complete =
      assessment.success &&
      Boolean(current) &&
      Boolean(next) &&
      assessment.databaseEvolution.length >= 5 &&
      assessment.grandKingSummary.includes("Current:");

    return {
      complete,
      currentStage: current?.name ?? assessment.currentStage,
      nextStage: next?.name ?? assessment.recommendedNextStage,
      bottleneckCount: assessment.bottlenecks.length,
      assessment,
      migrationPhases: assessment.databaseEvolution.length,
    };
  }

  analyzeScalingReadiness(): ScalingArchitectureAnalysis {
    const snap = this.lastSnapshot;
    const assessment = this.lastAssessment;
    const scalingReadiness: string[] = [];
    const infrastructureBottlenecks: string[] = [];
    const runtimeBottlenecks: string[] = [];
    const growthTrends: string[] = [];
    const architectureReadiness: string[] = [];
    const recommendations: string[] = [];

    if (assessment) {
      scalingReadiness.push(
        `Stage ${assessment.currentStage.replace(/_/g, " ")} · ${assessment.scalingReadiness}`,
      );
      architectureReadiness.push(
        `Next: ${assessment.recommendedNextStage.replace(/_/g, " ")}`,
      );
      for (const b of getBottlenecksForStage(assessment.recommendedNextStage)) {
        if (b.severity === "critical" || b.severity === "high") {
          infrastructureBottlenecks.push(`${b.id}: ${b.description}`);
        }
      }
    }

    if (snap) {
      if (!snap.redisConnected) {
        runtimeBottlenecks.push("Redis disconnected — Stage 2 blocker");
        recommendations.push("Enable Redis before Stage 2 production hardening");
      }
      if (snap.sqliteOnly) {
        infrastructureBottlenecks.push("SQLite single-writer — Stage 3 blocker for multi-instance");
        recommendations.push("Plan PostgreSQL migration before horizontal Brain scaling");
      }
      if (snap.eventLoopLagMs >= 200) {
        runtimeBottlenecks.push(`Event loop lag ${snap.eventLoopLagMs}ms`);
      }
      growthTrends.push(`Heap ${snap.heapUsedMb}MB · Queue depth ${snap.queueDepth}`);
    }

    recommendations.push(
      "Complete Stage 1 validation before advancing to Stage 2",
      "Do not scale horizontally until PostgreSQL migration complete",
      "Mandatory Redis policy is Stage 2 exit criterion",
    );

    return {
      scalingReadiness,
      infrastructureBottlenecks,
      runtimeBottlenecks,
      growthTrends,
      architectureReadiness,
      recommendations,
    };
  }

  getMetrics(): ScalingArchitectureMetrics {
    const assessment = this.lastAssessment;
    const stage = assessment?.currentStage ?? "stage_1_single_instance";
    const stageRecord = getStage(stage);
    const critical = SCALING_BOTTLENECK_REGISTRY.filter((b) => b.severity === "critical").length;

    return {
      totalDomains: CURRENT_ARCHITECTURE_REGISTRY.length,
      currentStageNumber: stageRecord?.stageNumber ?? 1,
      bottleneckCount: SCALING_BOTTLENECK_REGISTRY.length,
      criticalBottlenecks: critical,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      exitCriteriaMet: 0,
      exitCriteriaTotal: stageRecord?.exitCriteria.length ?? 0,
      trend: "stable",
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzeScalingReadiness();
    const last = this.lastAssessment;
    const current = last ? getStage(last.currentStage) : null;
    const next = last ? getStage(last.recommendedNextStage) : null;

    return {
      currentCapacity: last?.snapshot
        ? `Single instance · Heap ${last.snapshot.heapUsedMb}MB · Queue ${last.snapshot.queueDepth}`
        : "Awaiting snapshot",
      currentStage: current?.name ?? "Single Instance Production",
      scalingReadiness: last?.scalingReadiness ?? "unknown",
      infrastructureHealth: last?.snapshot?.redisConnected ? "Redis connected" : "Redis degraded/disconnected",
      databaseStatus: last?.snapshot?.sqliteOnly ? "SQLite (single-writer)" : "Unknown",
      queueStatus: last?.snapshot
        ? `Depth ${last.snapshot.queueDepth} · Redis ${last.snapshot.redisConnected ? "OK" : "degraded"}`
        : "Awaiting snapshot",
      workerStatus: last?.snapshot?.workersActive ? "Active" : "Inactive (API-only prod pattern)",
      recommendedNextStage: next?.name ?? "Production Hardening",
      knownBottlenecks: SCALING_BOTTLENECK_REGISTRY.filter(
        (b) => b.severity === "critical" || b.severity === "high",
      ).map((b) => `${b.id}: ${b.description}`),
      grandKingSummary: last?.grandKingSummary ?? "Run scaling architecture assessment",
      migrationStrategy: last?.databaseEvolution.map((d) => `${d.phase} (${d.status})`) ?? [],
      metrics,
      analysis,
    };
  }
}

export function createScalingArchitectureEngine(
  bootstrap: EmpireBootstrapContext,
): ScalingArchitectureEngine {
  return new ScalingArchitectureEngine(bootstrap);
}
