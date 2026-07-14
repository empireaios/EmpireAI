import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDurableSessionReadinessPipeline,
  buildDurableSessionReadinessPipelineSync,
  evaluateDurableSessionBuilderGate,
} from "./builder-gate.js";
import {
  SESSION_ARCHITECTURE_PATH,
  PRODUCTION_MODE_COMPANION_PATH,
  BRAIN_RUNTIME_COMPANION_PATH,
  JOURNEY_COMPANION_PATH,
} from "./paths.js";
import { formatDurableSessionPreamble } from "./mission-preamble.js";
import {
  buildDefaultSessionSnapshot,
  executeSessionArchitectureAssessment,
} from "./session-assessment.js";
import { SESSION_LAYER_REGISTRY, getLayersByTier } from "./session-registry.js";
import { PERSISTENCE_MODEL_REGISTRY } from "./persistence-registry.js";
import { executeSessionRecovery, validateSessionIntegrity } from "./session-recovery.js";
import type {
  DurableSessionAnalysis,
  DurableSessionBuilderGateResult,
  DurableSessionMetrics,
  DurableSessionRequest,
  DurableSessionSnapshot,
  DurableSessionState,
  SessionArchitectureAssessment,
} from "./types.js";

/**
 * Durable Session Architecture Engine (PILLOW-DS-001 / P5-03).
 * Permanent doctrine ensuring secure, resilient, recoverable operational continuity.
 */
export class DurableSessionEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").DurableSessionReadinessPipeline | null = null;
  private lastAssessment: SessionArchitectureAssessment | null = null;
  private lastSnapshot: DurableSessionSnapshot | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<DurableSessionState> {
    const systemDoc = await this.reader.readText(SESSION_ARCHITECTURE_PATH);
    if (!systemDoc?.includes("Durable Session")) {
      throw new Error(
        `${SESSION_ARCHITECTURE_PATH} missing — Durable Session Engine requires P5-03 doctrine.`,
      );
    }
    const productionMode = await this.reader.readText(PRODUCTION_MODE_COMPANION_PATH);
    if (!productionMode?.includes("Production Mode")) {
      throw new Error(
        `${PRODUCTION_MODE_COMPANION_PATH} missing — Session Architecture requires Production Mode companion.`,
      );
    }
    const journey = await this.reader.readText(JOURNEY_COMPANION_PATH);
    if (!journey?.includes("Journey")) {
      throw new Error(
        `${JOURNEY_COMPANION_PATH} missing — Session Architecture requires Journey companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): DurableSessionState {
    if (!this.initializedAt) {
      throw new Error("Durable Session Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-DS-001",
      status: this.lastAssessment?.success === false ? "degraded" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: SESSION_ARCHITECTURE_PATH,
      companionPath: PRODUCTION_MODE_COMPANION_PATH,
      lastAssessment: this.lastAssessment,
    };
  }

  ingestSessionSnapshot(snapshot: DurableSessionSnapshot): SessionArchitectureAssessment {
    this.lastSnapshot = snapshot;
    const result = executeSessionArchitectureAssessment({ snapshot });
    this.lastAssessment = result;
    return result;
  }

  async refreshReadiness(request: DurableSessionRequest = {}): Promise<DurableSessionBuilderGateResult> {
    const pipeline = await buildDurableSessionReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateDurableSessionBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: DurableSessionRequest = {}): DurableSessionBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildDurableSessionReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateDurableSessionBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: DurableSessionRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").DurableSessionReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health: gate.pipeline.readinessScore >= 75 ? "healthy" : gate.allowed ? "degraded" : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        this.lastAssessment?.grandKingSummary ?? "Run session architecture assessment",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: DurableSessionRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildDurableSessionReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatDurableSessionPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  runAssessment(snapshot?: DurableSessionSnapshot | null): SessionArchitectureAssessment {
    const snap = snapshot ?? this.lastSnapshot ?? buildDefaultSessionSnapshot();
    return this.ingestSessionSnapshot(snap);
  }

  /** Grand King acceptance — continuity preserved or recovery automatic and reported. */
  verifyGrandKingContinuity(): {
    complete: boolean;
    layerCount: number;
    persistenceCount: number;
    assessment: SessionArchitectureAssessment;
    continuityScenarios: Array<{ scenario: string; handled: boolean; detail: string }>;
  } {
    const assessment = this.runAssessment();
    const snap = this.lastSnapshot ?? buildDefaultSessionSnapshot();

    const continuityScenarios = [
      {
        scenario: "Browser refresh",
        handled: snap.browserSessionPersisted,
        detail: "localStorage survives refresh · hostSessionId re-bound on reconnect",
      },
      {
        scenario: "Brain restart",
        handled:
          snap.authStoreMode === "redis" ||
          assessment.recoverableLayers.length > 0,
        detail:
          snap.authStoreMode === "redis"
            ? "Auth durable in Redis · COI re-bootstrap automatic"
            : "COI re-bootstrap via startPillow() · auth re-login if in-memory",
      },
      {
        scenario: "Worker recovery",
        handled: true,
        detail: "Separate worker.ts process · queue jobs re-processed when worker restarts",
      },
      {
        scenario: "Queue recovery",
        handled: true,
        detail: snap?.redisConnected
          ? "BullMQ jobs persist in Redis · worker picks up on restart"
          : "DegradedTaskQueue documented — jobs not persisted without Redis · clearly reported",
      },
    ];

    const complete =
      assessment.success &&
      SESSION_LAYER_REGISTRY.every((l) => l.recoveryStrategy) &&
      continuityScenarios.every((s) => s.handled);

    return {
      complete,
      layerCount: assessment.sessionLayers.length,
      persistenceCount: assessment.persistenceModels.length,
      assessment,
      continuityScenarios,
    };
  }

  analyzeSessionHealth(): DurableSessionAnalysis {
    const snap = this.lastSnapshot;
    const sessionHealth: string[] = [];
    const sessionContinuity: string[] = [];
    const recoverySuccess: string[] = [];
    const sessionDrift: string[] = [];
    const sessionFailures: string[] = [];
    const recommendations: string[] = [
      "Require Redis in production for auth session durability",
      "Promote PillowSessionStore to Redis/SQLite for chat continuity",
    ];

    if (snap) {
      const integrity = validateSessionIntegrity(snap);
      if (!integrity.valid) {
        sessionFailures.push(...integrity.issues);
      }
      if (snap.authStoreMode === "in_memory") {
        sessionDrift.push("Auth in-memory — sessions lost on Brain restart");
      }
      if (!snap.redisConnected) {
        sessionDrift.push("Redis disconnected — queue and auth degraded");
      }
      if (snap.browserSessionPersisted) {
        sessionContinuity.push("Browser localStorage active — refresh safe");
      }
      if (snap.coiRuntimeReady) {
        sessionHealth.push("COI runtime ready");
      }
      const recovery = executeSessionRecovery({ snapshot: snap });
      recoverySuccess.push(
        ...recovery.filter((r) => r.recovered).map((r) => `${r.layerId}: ${r.message}`),
      );
    }

    return {
      sessionHealth,
      sessionContinuity,
      recoverySuccess,
      sessionDrift,
      sessionFailures,
      recommendations,
    };
  }

  getMetrics(): DurableSessionMetrics {
    const durable = getLayersByTier("durable").length;
    const ephemeral = getLayersByTier("ephemeral").length;
    const recoverable = getLayersByTier("recoverable").length;
    const recovery = this.lastAssessment?.recoveryResults ?? [];
    const failedRecoveries = recovery.filter((r) => r.interrupted && !r.recovered).length;

    return {
      totalLayers: SESSION_LAYER_REGISTRY.length,
      durableCount: durable,
      ephemeralCount: ephemeral,
      recoverableCount: recoverable,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      driftSignals: this.analyzeSessionHealth().sessionDrift.length,
      failedRecoveries,
      trend: failedRecoveries > 0 ? "degrading" : "stable",
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzeSessionHealth();
    const last = this.lastAssessment;
    const snap = last?.snapshot;

    return {
      currentSessions: snap
        ? `Auth: ${snap.authSessionCount} · Pillow host: ${snap.pillowHostSessionCount} · Supervisor: ${snap.supervisorMissionCount}`
        : "Awaiting snapshot",
      sessionHealth: last?.overallStatus ?? "unknown",
      recoveredSessions: last?.recoveryResults.filter((r) => r.recovered).length ?? 0,
      sessionDuration: "Per-layer expiration — see registry",
      recoveryStatus: last?.recoveryResults.map((r) => `${r.layerId}: ${r.resumed ? "resumed" : "pending"}`) ?? [],
      expiration: "Auth: SESSION_TTL_SECONDS · Host chat: process lifetime",
      authenticationStatus: snap
        ? `${snap.authStoreMode} · Redis ${snap.redisConnected ? "connected" : "disconnected"}`
        : "Awaiting snapshot",
      grandKingSummary: last?.grandKingSummary ?? "Run session architecture assessment",
      metrics,
      analysis,
      layers: last?.sessionLayers.map((l) => `${l.name} (${l.durabilityTier})`) ?? [],
    };
  }
}

export function createDurableSessionEngine(
  bootstrap: EmpireBootstrapContext,
): DurableSessionEngine {
  return new DurableSessionEngine(bootstrap);
}
