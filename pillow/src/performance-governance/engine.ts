import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPerformanceGovernanceReadinessPipeline,
  buildPerformanceGovernanceReadinessPipelineSync,
  evaluatePerformanceGovernanceBuilderGate,
} from "./builder-gate.js";
import {
  PERFORMANCE_GOVERNANCE_PATH,
  SCALING_ARCHITECTURE_COMPANION_PATH,
  GUARDIAN_MONITORING_COMPANION_PATH,
} from "./paths.js";
import { formatPerformanceGovernancePreamble } from "./mission-preamble.js";
import {
  buildDefaultPerformanceSnapshot,
  executePerformanceGovernanceAssessment,
  classifyRegressionSeverity,
} from "./performance-assessment.js";
import { PERFORMANCE_BASELINE_REGISTRY } from "./baseline-registry.js";
import { PERFORMANCE_METRIC_REGISTRY } from "./metric-registry.js";
import { PERFORMANCE_BOTTLENECK_REGISTRY } from "./bottleneck-registry.js";
import { PERFORMANCE_REGRESSION_REGISTRY } from "./regression-registry.js";
import { isPhaseP5Complete, PHASE_P5_REVIEW_REGISTRY } from "./phase-p5-review.js";
import type {
  PerformanceGovernanceAnalysis,
  PerformanceGovernanceAssessment,
  PerformanceGovernanceBuilderGateResult,
  PerformanceGovernanceMetrics,
  PerformanceGovernanceRequest,
  PerformanceGovernanceSnapshot,
  PerformanceGovernanceState,
} from "./types.js";

/**
 * Performance Governance Engine (PILLOW-PG-001 / P5-06).
 * Permanent framework for measurable, explainable, traceable performance.
 */
export class PerformanceGovernanceEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").PerformanceGovernanceReadinessPipeline | null = null;
  private lastAssessment: PerformanceGovernanceAssessment | null = null;
  private lastSnapshot: PerformanceGovernanceSnapshot | null = null;
  private snapshotHistory: PerformanceGovernanceSnapshot[] = [];

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PerformanceGovernanceState> {
    const systemDoc = await this.reader.readText(PERFORMANCE_GOVERNANCE_PATH);
    if (!systemDoc?.includes("Performance Governance")) {
      throw new Error(
        `${PERFORMANCE_GOVERNANCE_PATH} missing — Performance Governance Engine requires P5-06 doctrine.`,
      );
    }
    const scaling = await this.reader.readText(SCALING_ARCHITECTURE_COMPANION_PATH);
    if (!scaling?.includes("Scaling Architecture")) {
      throw new Error(
        `${SCALING_ARCHITECTURE_COMPANION_PATH} missing — Performance requires Scaling Architecture companion.`,
      );
    }
    const guardian = await this.reader.readText(GUARDIAN_MONITORING_COMPANION_PATH);
    if (!guardian?.includes("Guardian Monitoring")) {
      throw new Error(
        `${GUARDIAN_MONITORING_COMPANION_PATH} missing — Performance requires Guardian Monitoring companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): PerformanceGovernanceState {
    if (!this.initializedAt) {
      throw new Error("Performance Governance Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-PG-001",
      status: this.lastAssessment?.performanceGrade === "critical" ? "degraded" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: PERFORMANCE_GOVERNANCE_PATH,
      companionPath: SCALING_ARCHITECTURE_COMPANION_PATH,
      lastAssessment: this.lastAssessment,
    };
  }

  ingestPerformanceSnapshot(snapshot: PerformanceGovernanceSnapshot): PerformanceGovernanceAssessment {
    this.lastSnapshot = snapshot;
    this.snapshotHistory.push(snapshot);
    if (this.snapshotHistory.length > 20) {
      this.snapshotHistory = this.snapshotHistory.slice(-20);
    }
    const result = executePerformanceGovernanceAssessment({ snapshot });
    this.lastAssessment = result;
    return result;
  }

  async refreshReadiness(
    request: PerformanceGovernanceRequest = {},
  ): Promise<PerformanceGovernanceBuilderGateResult> {
    const pipeline = await buildPerformanceGovernanceReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluatePerformanceGovernanceBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(
    request: PerformanceGovernanceRequest = {},
  ): PerformanceGovernanceBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildPerformanceGovernanceReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluatePerformanceGovernanceBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: PerformanceGovernanceRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").PerformanceGovernanceReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health: gate.pipeline.readinessScore >= 75 ? "healthy" : gate.allowed ? "degraded" : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        this.lastAssessment?.grandKingSummary ?? "Run performance governance assessment",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: PerformanceGovernanceRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildPerformanceGovernanceReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatPerformanceGovernancePreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  runAssessment(snapshot?: PerformanceGovernanceSnapshot | null): PerformanceGovernanceAssessment {
    const snap = snapshot ?? this.lastSnapshot ?? buildDefaultPerformanceSnapshot();
    return this.ingestPerformanceSnapshot(snap);
  }

  /** Grand King acceptance — current/historical performance without log analysis. */
  verifyGrandKingClarity(): {
    complete: boolean;
    overallScore: number;
    grade: string;
    activeRegressions: number;
    bottleneckCount: number;
    phaseP5Complete: boolean;
    assessment: PerformanceGovernanceAssessment;
    historicalSnapshots: number;
  } {
    const assessment = this.runAssessment();
    const activeRegressions = assessment.snapshot
      ? classifyRegressionSeverity(
          assessment.regressions.filter((r) =>
            assessment.snapshot!.eventLoopLagMs >= 500
              ? r.signal === "api_degradation"
              : false,
          ).length +
            (assessment.snapshot.queueDepth > 10 ? 1 : 0) +
            (assessment.snapshot.heapUsedMb > 512 ? 1 : 0),
        )
      : "low";

    const complete =
      assessment.success &&
      assessment.baselines.length >= 10 &&
      assessment.grandKingSummary.includes("Performance:") &&
      isPhaseP5Complete();

    return {
      complete,
      overallScore: assessment.overallPerformanceScore,
      grade: assessment.performanceGrade,
      activeRegressions: typeof activeRegressions === "string" ? 0 : activeRegressions,
      bottleneckCount: assessment.bottlenecks.length,
      phaseP5Complete: isPhaseP5Complete(),
      assessment,
      historicalSnapshots: this.snapshotHistory.length,
    };
  }

  analyzePerformanceTrends(): PerformanceGovernanceAnalysis {
    const snap = this.lastSnapshot;
    const assessment = this.lastAssessment;
    const performanceTrends: string[] = [];
    const performanceRegressions: string[] = [];
    const performanceOpportunities: string[] = [];
    const architectureBottlenecks: string[] = [];
    const engineeringBottlenecks: string[] = [];
    const businessBottlenecks: string[] = [];
    const recommendations: string[] = [];

    if (assessment) {
      performanceTrends.push(
        `Grade ${assessment.performanceGrade} · score ${assessment.overallPerformanceScore}/100`,
      );
      if (this.snapshotHistory.length >= 2) {
        const prev = this.snapshotHistory[this.snapshotHistory.length - 2]!;
        const delta = assessment.overallPerformanceScore - prev.overallPerformanceScore;
        performanceTrends.push(`Score delta: ${delta >= 0 ? "+" : ""}${delta} vs prior snapshot`);
      }
    }

    if (snap) {
      if (snap.eventLoopLagMs >= 200) {
        performanceRegressions.push(`Event loop lag ${snap.eventLoopLagMs}ms`);
      }
      if (snap.queueDepth > 5) {
        performanceRegressions.push(`Queue backlog depth ${snap.queueDepth}`);
      }
      if (snap.heapUsedMb > 384) {
        performanceRegressions.push(`Heap usage elevated: ${snap.heapUsedMb}MB`);
      }
    }

    for (const b of PERFORMANCE_BOTTLENECK_REGISTRY) {
      if (b.severity === "critical" || b.severity === "high") {
        engineeringBottlenecks.push(`${b.id}: ${b.description}`);
      }
    }

    architectureBottlenecks.push("SQLite single-writer · sequential Pillow boot · 200+ tool registration");
    businessBottlenecks.push("LLM latency dominates Pillow response · mission generation chain");

    performanceOpportunities.push(
      "Lazy Pillow boot in production",
      "Async SQLite load with cooperativeYield",
      "Redis mandatory for queue performance",
    );

    recommendations.push(
      "Monitor event loop lag via Guardian · threshold 200ms acceptable / 500ms critical",
      "Complete Stage 2 production hardening before performance scaling",
      "Track mission duration in Supervisor heartbeat reports",
    );

    return {
      performanceTrends,
      performanceRegressions,
      performanceOpportunities,
      architectureBottlenecks,
      engineeringBottlenecks,
      businessBottlenecks,
      recommendations,
    };
  }

  getMetrics(): PerformanceGovernanceMetrics {
    const assessment = this.lastAssessment;
    const critical = PERFORMANCE_BOTTLENECK_REGISTRY.filter((b) => b.severity === "critical").length;

    let trend: "improving" | "stable" | "degrading" = "stable";
    if (this.snapshotHistory.length >= 2) {
      const latest = this.snapshotHistory[this.snapshotHistory.length - 1]!;
      const prev = this.snapshotHistory[this.snapshotHistory.length - 2]!;
      if (latest.overallPerformanceScore > prev.overallPerformanceScore + 5) trend = "improving";
      if (latest.overallPerformanceScore < prev.overallPerformanceScore - 5) trend = "degrading";
    }

    return {
      totalDomains: PERFORMANCE_BASELINE_REGISTRY.length,
      totalMetrics: PERFORMANCE_METRIC_REGISTRY.length,
      baselineCount: PERFORMANCE_BASELINE_REGISTRY.length,
      bottleneckCount: PERFORMANCE_BOTTLENECK_REGISTRY.length,
      criticalBottlenecks: critical,
      regressionCount: PERFORMANCE_REGRESSION_REGISTRY.length,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      overallPerformanceScore: assessment?.overallPerformanceScore ?? 70,
      trend,
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzePerformanceTrends();
    const last = this.lastAssessment;
    const snap = last?.snapshot;

    return {
      overallPerformanceScore: last?.overallPerformanceScore ?? metrics.overallPerformanceScore,
      performanceGrade: last?.performanceGrade ?? "acceptable",
      runtimePerformance: snap
        ? `Event loop ${snap.eventLoopLagMs}ms · Heap ${snap.heapUsedMb}MB · CPU ${snap.cpuUsagePercent}%`
        : "Awaiting snapshot",
      browserPerformance: "Browser Truth probe · Executive Home LCP target < 2.5s",
      missionPerformance: snap
        ? `Mission duration ${snap.missionDurationMs}ms · throughput tracked`
        : "Awaiting snapshot",
      apiPerformance: snap
        ? `API ${snap.apiResponseTimeMs}ms · availability ${snap.productionAvailabilityPercent}%`
        : "Awaiting snapshot",
      databasePerformance: snap
        ? `Query time ${snap.databaseQueryTimeMs}ms · SQLite single-writer`
        : "Awaiting snapshot",
      queuePerformance: snap
        ? `Depth ${snap.queueDepth} · latency ${snap.queueLatencyMs}ms · Redis ${snap.redisLatencyMs}ms`
        : "Awaiting snapshot",
      workerPerformance: snap
        ? `Execution ${snap.workerExecutionTimeMs}ms · ${snap.workerExecutionTimeMs > 0 ? "active" : "inactive in API prod"}`
        : "Awaiting snapshot",
      performanceTrends: analysis.performanceTrends,
      currentBottlenecks: PERFORMANCE_BOTTLENECK_REGISTRY.filter(
        (b) => b.severity === "critical" || b.severity === "high",
      ).map((b) => `${b.id}: ${b.description}`),
      recommendations: analysis.recommendations,
      grandKingSummary: last?.grandKingSummary ?? "Run performance governance assessment",
      phaseP5Review: PHASE_P5_REVIEW_REGISTRY,
      metrics,
      analysis,
    };
  }
}

export function createPerformanceGovernanceEngine(
  bootstrap: EmpireBootstrapContext,
): PerformanceGovernanceEngine {
  return new PerformanceGovernanceEngine(bootstrap);
}
