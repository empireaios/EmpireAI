import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGuardianMonitoringReadinessPipeline,
  buildGuardianMonitoringReadinessPipelineSync,
  evaluateGuardianMonitoringBuilderGate,
} from "./builder-gate.js";
import {
  GUARDIAN_MONITORING_PATH,
  DURABLE_SESSIONS_COMPANION_PATH,
  PRODUCTION_MODE_COMPANION_PATH,
  BRAIN_RUNTIME_COMPANION_PATH,
} from "./paths.js";
import { formatGuardianMonitoringPreamble } from "./mission-preamble.js";
import {
  buildDefaultMonitoringSnapshot,
  executeGuardianMonitoringAssessment,
} from "./monitoring-assessment.js";
import { MONITORED_COMPONENT_REGISTRY } from "./monitored-component-registry.js";
import { HistoricalMonitoringStore } from "./historical-store.js";
import type {
  GuardianMonitoringAnalysis,
  GuardianMonitoringAssessment,
  GuardianMonitoringBuilderGateResult,
  GuardianMonitoringMetrics,
  GuardianMonitoringRequest,
  GuardianMonitoringSnapshot,
  GuardianMonitoringState,
} from "./types.js";

/**
 * Guardian Monitoring Engine (PILLOW-GM-001 / P5-04).
 * Permanent constitutional monitoring — observes, detects, evidences; never executes.
 */
export class GuardianMonitoringEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").GuardianMonitoringReadinessPipeline | null = null;
  private lastAssessment: GuardianMonitoringAssessment | null = null;
  private lastSnapshot: GuardianMonitoringSnapshot | null = null;
  private historicalStore = new HistoricalMonitoringStore();

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GuardianMonitoringState> {
    const systemDoc = await this.reader.readText(GUARDIAN_MONITORING_PATH);
    if (!systemDoc?.includes("Guardian Monitoring")) {
      throw new Error(
        `${GUARDIAN_MONITORING_PATH} missing — Guardian Monitoring Engine requires P5-04 doctrine.`,
      );
    }
    const sessions = await this.reader.readText(DURABLE_SESSIONS_COMPANION_PATH);
    if (!sessions?.includes("Durable Session")) {
      throw new Error(
        `${DURABLE_SESSIONS_COMPANION_PATH} missing — Guardian Monitoring requires Sessions companion.`,
      );
    }
    const productionMode = await this.reader.readText(PRODUCTION_MODE_COMPANION_PATH);
    if (!productionMode?.includes("Production Mode")) {
      throw new Error(
        `${PRODUCTION_MODE_COMPANION_PATH} missing — Guardian Monitoring requires Production Mode companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): GuardianMonitoringState {
    if (!this.initializedAt) {
      throw new Error("Guardian Monitoring Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-GM-001",
      status: this.lastAssessment?.overallHealth === "critical" ? "degraded" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: GUARDIAN_MONITORING_PATH,
      companionPath: DURABLE_SESSIONS_COMPANION_PATH,
      lastAssessment: this.lastAssessment,
    };
  }

  ingestMonitoringSnapshot(snapshot: GuardianMonitoringSnapshot): GuardianMonitoringAssessment {
    this.lastSnapshot = snapshot;
    const result = executeGuardianMonitoringAssessment({ snapshot });
    this.historicalStore.recordAssessment(result);
    result.historicalTimeline = this.historicalStore.getTimeline();
    this.lastAssessment = result;
    return result;
  }

  async refreshReadiness(
    request: GuardianMonitoringRequest = {},
  ): Promise<GuardianMonitoringBuilderGateResult> {
    const pipeline = await buildGuardianMonitoringReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateGuardianMonitoringBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(
    request: GuardianMonitoringRequest = {},
  ): GuardianMonitoringBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildGuardianMonitoringReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateGuardianMonitoringBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: GuardianMonitoringRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").GuardianMonitoringReadinessPipeline;
    alerts: GuardianMonitoringAssessment["alerts"];
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const alerts = this.lastAssessment?.alerts ?? [];
    const critical = alerts.filter(
      (a) => a.currentStatus === "open" && a.severity === "critical",
    );
    return {
      valid: gate.allowed && critical.length === 0,
      health:
        critical.length > 0
          ? "blocked"
          : gate.pipeline.readinessScore >= 75
            ? "healthy"
            : gate.allowed
              ? "degraded"
              : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        this.lastAssessment?.grandKingSummary ?? "Run Guardian monitoring assessment",
        critical.length > 0 ? `${critical.length} critical alerts require Supervisor attention` : "",
      ].filter(Boolean),
      pipeline: gate.pipeline,
      alerts,
    };
  }

  formatMissionPreamble(request: GuardianMonitoringRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildGuardianMonitoringReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatGuardianMonitoringPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  runAssessment(snapshot?: GuardianMonitoringSnapshot | null): GuardianMonitoringAssessment {
    const snap = snapshot ?? this.lastSnapshot ?? buildDefaultMonitoringSnapshot();
    return this.ingestMonitoringSnapshot(snap);
  }

  /** Grand King acceptance — Cockpit shows empire health without reading logs. */
  verifyGrandKingVisibility(): {
    complete: boolean;
    componentCount: number;
    openAlerts: number;
    assessment: GuardianMonitoringAssessment;
    cockpitFields: string[];
  } {
    const assessment = this.runAssessment();
    const openAlerts = assessment.alerts.filter(
      (a) => a.currentStatus === "open" && a.severity !== "informational",
    ).length;

    const cockpitFields = [
      "overallHealth",
      "runtimeHealth",
      "alerts",
      "degradations",
      "historicalTrends",
      "affectedComponents",
    ];

    const complete =
      assessment.success &&
      Boolean(assessment.grandKingSummary) &&
      assessment.components.length >= 18 &&
      cockpitFields.length >= 6;

    return {
      complete,
      componentCount: assessment.components.length,
      openAlerts,
      assessment,
      cockpitFields,
    };
  }

  analyzeMonitoringTrends(): GuardianMonitoringAnalysis {
    const snap = this.lastSnapshot;
    const assessment = this.lastAssessment;
    const monitoringTrends: string[] = [];
    const architectureWeaknesses: string[] = [];
    const performanceDrift: string[] = [];
    const productionDrift: string[] = [];
    const reliabilityTrends: string[] = [];
    const operationalRisks: string[] = [];
    const recommendations: string[] = [
      "Require Redis in production for auth and queue durability",
      "Run worker.ts as separate process in production",
      "Monitor event loop lag during Pillow boot chain",
    ];

    const trend = this.historicalStore.analyzeTrend();
    monitoringTrends.push(`Historical trend: ${trend}`);

    if (snap) {
      if (snap.eventLoopLagMs >= 200) {
        performanceDrift.push(`Event loop lag elevated: ${snap.eventLoopLagMs}ms`);
        architectureWeaknesses.push("BR-BN-006 sequential startPillow() chain");
      }
      if (!snap.redisConnected) {
        productionDrift.push("Redis disconnected — auth and queue degraded");
        operationalRisks.push("Sessions and jobs not durable");
      }
      if (snap.authStoreMode === "in_memory") {
        productionDrift.push("Auth in-memory fallback active");
      }
    }

    if (assessment) {
      reliabilityTrends.push(
        `Overall: ${assessment.overallHealth} · Runtime: ${assessment.runtimeHealth}`,
      );
      for (const alert of assessment.alerts) {
        if (alert.currentStatus === "open" && alert.severity !== "informational") {
          operationalRisks.push(`${alert.affectedComponent}: ${alert.observedSymptoms}`);
        }
      }
    }

    return {
      monitoringTrends,
      architectureWeaknesses,
      performanceDrift,
      productionDrift,
      reliabilityTrends,
      operationalRisks,
      recommendations,
    };
  }

  getMetrics(): GuardianMonitoringMetrics {
    const assessment = this.lastAssessment;
    const componentHealth = assessment?.componentHealth ?? {};
    const healthyCount = Object.values(componentHealth).filter((h) => h === "healthy").length;
    const degradedCount = Object.values(componentHealth).filter(
      (h) => h === "degraded" || h === "warning",
    ).length;
    const criticalCount = Object.values(componentHealth).filter((h) => h === "critical").length;
    const openAlerts =
      assessment?.alerts.filter(
        (a) => a.currentStatus === "open" && a.severity !== "informational",
      ).length ?? 0;

    return {
      totalComponents: MONITORED_COMPONENT_REGISTRY.length,
      healthyCount,
      degradedCount,
      criticalCount,
      openAlerts,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      driftSignals: this.analyzeMonitoringTrends().operationalRisks.length,
      trend: this.historicalStore.analyzeTrend(),
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzeMonitoringTrends();
    const last = this.lastAssessment;

    return {
      overallHealth: last?.overallHealth ?? "unknown",
      runtimeHealth: last?.runtimeHealth ?? "unknown",
      brain: last?.componentHealth["GM-BRAIN-RT"] ?? "unknown",
      pillow: last?.componentHealth["GM-PILLOW"] ?? "unknown",
      builder: last?.componentHealth["GM-BUILDER"] ?? "unknown",
      supervisor: last?.componentHealth["GM-SUPERVISOR"] ?? "unknown",
      sessions: last?.componentHealth["GM-SESSIONS"] ?? "unknown",
      queues: last?.componentHealth["GM-QUEUES"] ?? "unknown",
      workers: last?.componentHealth["GM-WORKERS"] ?? "unknown",
      database: last?.componentHealth["GM-DB"] ?? "unknown",
      redis: last?.componentHealth["GM-REDIS"] ?? "unknown",
      api: last?.componentHealth["GM-API"] ?? "unknown",
      alerts: last?.alerts.filter((a) => a.currentStatus === "open") ?? [],
      historicalTrends: last?.historicalTimeline.slice(-10) ?? [],
      grandKingSummary: last?.grandKingSummary ?? "Run Guardian monitoring assessment",
      metrics,
      analysis,
      affectedComponents: Object.entries(last?.componentHealth ?? {})
        .filter(([, h]) => h === "degraded" || h === "critical" || h === "warning")
        .map(([id]) => id),
    };
  }
}

export function createGuardianMonitoringEngine(
  bootstrap: EmpireBootstrapContext,
): GuardianMonitoringEngine {
  return new GuardianMonitoringEngine(bootstrap);
}
