import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRuntimeReadinessPipeline,
  buildRuntimeReadinessPipelineSync,
  evaluateBrainRuntimeBuilderGate,
} from "./builder-gate.js";
import {
  BRAIN_ARCHITECTURE_COMPANION_PATH,
  BRAIN_RUNTIME_AUDIT_PATH,
  BRAIN_RUNTIME_SYSTEM_PATH,
} from "./paths.js";
import { formatBrainRuntimePreamble } from "./mission-preamble.js";
import {
  buildDefaultRuntimeSnapshot,
  executeRuntimeAssessment,
} from "./runtime-assessment.js";
import type {
  BrainRuntimeAnalysis,
  BrainRuntimeBuilderGateResult,
  BrainRuntimeMetrics,
  BrainRuntimeRequest,
  BrainRuntimeSnapshot,
  BrainRuntimeState,
  RuntimeAssessmentResult,
} from "./types.js";

/**
 * Brain Runtime Engine (PILLOW-BR-001 / P5-01).
 * Permanent runtime stability architecture — Brain remains responsive under continuous operation.
 */
export class BrainRuntimeEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").RuntimeReadinessPipeline | null = null;
  private lastAssessment: RuntimeAssessmentResult | null = null;
  private lastSnapshot: BrainRuntimeSnapshot | null = null;
  private history: RuntimeAssessmentResult[] = [];

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BrainRuntimeState> {
    const systemDoc = await this.reader.readText(BRAIN_RUNTIME_SYSTEM_PATH);
    if (!systemDoc?.includes("Brain Runtime")) {
      throw new Error(
        `${BRAIN_RUNTIME_SYSTEM_PATH} missing — Brain Runtime Engine requires P5-01 system doc.`,
      );
    }
    const companion = await this.reader.readText(BRAIN_ARCHITECTURE_COMPANION_PATH);
    if (!companion?.includes("Brain")) {
      throw new Error(
        `${BRAIN_ARCHITECTURE_COMPANION_PATH} missing — Brain Runtime requires architecture companion.`,
      );
    }
    const audit = await this.reader.readText(BRAIN_RUNTIME_AUDIT_PATH);
    if (!audit?.includes("Brain")) {
      throw new Error(
        `${BRAIN_RUNTIME_AUDIT_PATH} missing — Brain Runtime requires audit companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): BrainRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Brain Runtime Engine not initialized. Call initialize() first.");
    }
    const status =
      this.lastAssessment?.overallStatus === "blocked"
        ? "blocked"
        : this.lastAssessment?.overallStatus === "degraded"
          ? "degraded"
          : "ready";
    return {
      engineVersion: "PILLOW-BR-001",
      status,
      initializedAt: this.initializedAt,
      doctrinePath: BRAIN_RUNTIME_SYSTEM_PATH,
      companionPath: BRAIN_ARCHITECTURE_COMPANION_PATH,
      lastAssessment: this.lastAssessment,
    };
  }

  /** Ingest live snapshot from backend bridge. */
  ingestRuntimeSnapshot(snapshot: BrainRuntimeSnapshot): RuntimeAssessmentResult {
    this.lastSnapshot = snapshot;
    const result = executeRuntimeAssessment({ snapshot });
    this.lastAssessment = result;
    this.history.push(result);
    return result;
  }

  async refreshReadiness(request: BrainRuntimeRequest = {}): Promise<BrainRuntimeBuilderGateResult> {
    const pipeline = await buildRuntimeReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateBrainRuntimeBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: BrainRuntimeRequest = {}): BrainRuntimeBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildRuntimeReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateBrainRuntimeBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: BrainRuntimeRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").RuntimeReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const blocked = this.lastAssessment?.overallStatus === "blocked";
    return {
      valid: gate.allowed && !blocked,
      health: blocked ? "blocked" : gate.pipeline.readinessScore >= 75 ? "healthy" : "degraded",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        this.lastAssessment?.summary ?? "Run runtime assessment",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: BrainRuntimeRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildRuntimeReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatBrainRuntimePreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  runAssessment(snapshot?: BrainRuntimeSnapshot | null): RuntimeAssessmentResult {
    const snap = snapshot ?? this.lastSnapshot ?? buildDefaultRuntimeSnapshot();
    return this.ingestRuntimeSnapshot(snap);
  }

  /** Grand King acceptance — verify Brain/Pillow/Login/Executive Home responsive. */
  verifyResponsiveness(snapshot?: BrainRuntimeSnapshot): {
    brainResponsive: boolean;
    pillowResponsive: boolean;
    loginResponsive: boolean;
    executiveHomeResponsive: boolean;
    noDegradation: boolean;
    assessment: RuntimeAssessmentResult;
  } {
    const snap = snapshot ?? buildDefaultRuntimeSnapshot();
    const assessment = this.runAssessment(snap);
    return {
      brainResponsive: snap.brainResponsive && assessment.responsive,
      pillowResponsive: snap.pillowResponsive,
      loginResponsive: snap.loginResponsive,
      executiveHomeResponsive: snap.executiveHomeResponsive,
      noDegradation: assessment.overallStatus !== "blocked",
      assessment,
    };
  }

  analyzeRuntimeStability(): BrainRuntimeAnalysis {
    const last = this.lastAssessment;
    const recommendations: string[] = [
      "Monitor event loop lag via /health/live",
      "Run worker.ts process when queue jobs required",
      "Use cooperativeYield during heavy aggregation",
    ];

    if (last?.activeBottlenecks.length) {
      recommendations.push(
        `Mitigate: ${last.activeBottlenecks.map((b) => b.id).join(", ")}`,
      );
    }

    return {
      stabilityTrend:
        this.history.filter((h) => h.success).length >= this.history.length - 1
          ? ["Stable across recent assessments"]
          : ["Degradation detected in recent history"],
      performanceTrends: last
        ? [`Event loop lag: ${last.snapshot?.eventLoopLagMs ?? 0}ms`]
        : [],
      runtimeDrift: last?.activeBottlenecks.map((b) => `${b.id}: ${b.description}`) ?? [],
      architectureDrift: [],
      productionDrift: last?.snapshot?.redisMode === "degraded" ? ["Redis degraded mode active"] : [],
      recommendations,
    };
  }

  getMetrics(): BrainRuntimeMetrics {
    const snap = this.lastSnapshot ?? buildDefaultRuntimeSnapshot();
    const last = this.lastAssessment;
    const memRatio = snap.heapTotalMb > 0 ? snap.heapUsedMb / snap.heapTotalMb : 0;

    return {
      eventLoopLagMs: snap.eventLoopLagMs,
      memoryPressure: memRatio,
      queueDepth: snap.queueDepth,
      activeBottleneckCount: last?.activeBottlenecks.length ?? 0,
      responsivenessScore: last?.responsive ? 1 : 0.5,
      trend:
        snap.eventLoopLagMs > 200
          ? "degrading"
          : this.history.filter((h) => h.success).length > 0
            ? "stable"
            : "improving",
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzeRuntimeStability();
    const last = this.lastAssessment;
    const snap = last?.snapshot ?? this.lastSnapshot;

    return {
      runtimeHealth: last?.overallStatus ?? "unknown",
      cpu: "N/A (process-level)",
      memory: snap ? `${snap.heapUsedMb}/${snap.heapTotalMb} MB heap · ${snap.rssMb} MB RSS` : "Unknown",
      eventLoopLagMs: metrics.eventLoopLagMs,
      queues: snap ? `Depth ${snap.queueDepth} · Redis ${snap.redisMode}` : "Unknown",
      workers: snap?.workersActive ? "Active" : "API-only",
      database: snap?.sqliteHealthy ? "SQLite healthy" : "Degraded",
      api: snap?.apiHealthy ? "Responsive" : "Degraded",
      overallRuntimeStatus: last?.summary ?? "Awaiting assessment",
      bottlenecks: last?.activeBottlenecks.map((b) => `${b.id}: ${b.description}`) ?? [],
      responsive: last?.responsive ?? true,
      metrics,
      analysis,
    };
  }
}

export function createBrainRuntimeEngine(
  bootstrap: EmpireBootstrapContext,
): BrainRuntimeEngine {
  return new BrainRuntimeEngine(bootstrap);
}
