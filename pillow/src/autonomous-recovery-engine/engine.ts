import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { BuilderMonitorEngine } from "../builder-monitor/engine.js";
import type { EtaEngine } from "../eta-engine/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { RecoveryDoctrineEngine } from "../recovery-doctrine/engine.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import { computeRecoveryConfidence } from "../recovery-doctrine/autonomous-actions.js";
import {
  buildAutonomousRecoveryReadinessPipeline,
  buildAutonomousRecoveryReadinessPipelineSync,
  evaluateAutonomousRecoveryGate,
} from "./builder-gate.js";
import {
  AUTONOMOUS_RECOVERY_ENGINE_PATH,
  RECOVERY_DOCTRINE_COMPANION_PATH,
  ETA_ENGINE_COMPANION_PATH,
  AUTONOMOUS_RECOVERY_RESPONSIBILITIES,
  RECOVERY_DETECTION_SIGNALS,
} from "./paths.js";
import { RECOVERY_ORCHESTRATION_REGISTRY } from "./pipeline-registry.js";
import { RECOVERY_STRATEGY_REGISTRY } from "./strategy-registry.js";
import { formatAutonomousRecoveryPreamble } from "./mission-preamble.js";
import { analyzeRecoveryEffectiveness } from "./recovery-assessment.js";
import {
  detectFailureSignals,
  evaluateAutonomousRecoverySafety,
  mapSignalToRecoveryTrigger,
  selectRecoveryStrategy,
} from "./recovery-orchestrator.js";
import type {
  AutonomousRecoveryAssessment,
  AutonomousRecoveryBuilderGateResult,
  AutonomousRecoveryEngineRequest,
  AutonomousRecoveryEngineState,
  AutonomousRecoveryMetrics,
  AutonomousRecoveryAnalysis,
  RecoveryIncident,
} from "./types.js";

export interface AutonomousRecoveryEngineSurfaces {
  supervisor?: CursorSupervisorEngine | null;
  recoveryDoctrine?: RecoveryDoctrineEngine | null;
  recoveryManager?: RecoveryManagerEngine | null;
  builderMonitor?: BuilderMonitorEngine | null;
  etaEngine?: EtaEngine | null;
  executionControlCenter?: ExecutionControlCenterEngine | null;
  journeySystem?: JourneySystemEngine | null;
  planner?: MissionPlannerEngine | null;
}

/**
 * Autonomous Recovery Engine (PILLOW-ARE-001 / P6-06).
 * Continuously detects, diagnoses, and executes safe autonomous recovery.
 */
export class AutonomousRecoveryEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private surfacesAttached = false;
  private surfaces: AutonomousRecoveryEngineSurfaces = {};
  private lastReadiness: import("./types.js").AutonomousRecoveryReadinessPipeline | null = null;
  private lastAssessment: AutonomousRecoveryAssessment | null = null;
  private activeIncident: RecoveryIncident | null = null;
  private incidentHistory: RecoveryIncident[] = [];
  private totalRecoveriesSucceeded = 0;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AutonomousRecoveryEngineState> {
    const systemDoc = await this.reader.readText(AUTONOMOUS_RECOVERY_ENGINE_PATH);
    if (!systemDoc?.includes("Autonomous Recovery Engine")) {
      throw new Error(
        `${AUTONOMOUS_RECOVERY_ENGINE_PATH} missing — Autonomous Recovery requires P6-06 doctrine.`,
      );
    }
    const doctrine = await this.reader.readText(RECOVERY_DOCTRINE_COMPANION_PATH);
    if (!doctrine?.includes("Recovery Doctrine")) {
      throw new Error(
        `${RECOVERY_DOCTRINE_COMPANION_PATH} missing — requires Recovery Doctrine companion.`,
      );
    }
    const eta = await this.reader.readText(ETA_ENGINE_COMPANION_PATH);
    if (!eta?.includes("ETA Engine")) {
      throw new Error(`${ETA_ENGINE_COMPANION_PATH} missing — requires ETA Engine companion.`);
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  attachSurfaces(surfaces: AutonomousRecoveryEngineSurfaces): void {
    this.surfaces = surfaces;
    this.surfacesAttached = Boolean(
      surfaces.recoveryDoctrine && (surfaces.builderMonitor || surfaces.supervisor),
    );
  }

  getState(): AutonomousRecoveryEngineState {
    if (!this.initializedAt) {
      throw new Error("Autonomous Recovery Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-ARE-001",
      status: this.activeIncident
        ? this.activeIncident.recovered
          ? "ready"
          : "recovering"
        : this.lastAssessment?.recoveryQuality === "degraded"
          ? "degraded"
          : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: AUTONOMOUS_RECOVERY_ENGINE_PATH,
      companionPath: RECOVERY_DOCTRINE_COMPANION_PATH,
      surfacesAttached: this.surfacesAttached,
      activeIncident: this.activeIncident,
      totalIncidents: this.incidentHistory.length,
      totalRecoveriesSucceeded: this.totalRecoveriesSucceeded,
    };
  }

  async refreshReadiness(
    request: AutonomousRecoveryEngineRequest = {},
  ): Promise<AutonomousRecoveryBuilderGateResult> {
    this.lastReadiness = await buildAutonomousRecoveryReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    return evaluateAutonomousRecoveryGate(this.lastReadiness, request);
  }

  evaluateBuilderGateSync(
    request: AutonomousRecoveryEngineRequest = {},
  ): AutonomousRecoveryBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildAutonomousRecoveryReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return evaluateAutonomousRecoveryGate(pipeline, request);
  }

  /** Scan live evidence for recoverable failures. */
  scanForFailures(request: AutonomousRecoveryEngineRequest = {}): RecoveryIncident | null {
    const registry = this.surfaces.supervisor?.getState().registry;
    const activeMission = registry?.activeMission ?? null;

    let telemetry = null;
    if (this.surfaces.builderMonitor) {
      const sync = this.surfaces.builderMonitor.validateForEccSync(request);
      telemetry = sync.telemetry;
    }

    const failures = detectFailureSignals({ telemetry, activeMission });
    if (failures.length === 0) return null;

    const primary =
      failures.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0]!;
    const strategy = selectRecoveryStrategy(primary);
    const confidence = computeRecoveryConfidence({
      classification: "transient",
      repositoryIntegrityOk: true,
      recoveryAttempts: activeMission?.recoveryAttempts ?? 0,
    });

    const safety = evaluateAutonomousRecoverySafety({
      failure: primary,
      strategy,
      confidence,
      recoveryAttempts: activeMission?.recoveryAttempts ?? 0,
    });

    const incident: RecoveryIncident = {
      incidentId: randomUUID(),
      detectedAt: primary.detectedAt,
      resolvedAt: null,
      failure: primary,
      strategy,
      confidence,
      escalationLevel: safety.escalationLevel,
      attempts: activeMission?.recoveryAttempts ?? 0,
      recovered: false,
      pipelineResult: null,
      timeline: [
        { at: primary.detectedAt, stage: "failure_detected", detail: primary.signal },
        { at: new Date().toISOString(), stage: "recovery_strategy_selection", detail: strategy },
      ],
    };

    this.activeIncident = incident;
    return incident;
  }

  /** Execute autonomous recovery when constitutionally safe. */
  async orchestrateRecovery(
    request: AutonomousRecoveryEngineRequest = {},
  ): Promise<RecoveryIncident | null> {
    const incident = this.scanForFailures(request) ?? this.activeIncident;
    if (!incident) return null;

    const registry = this.surfaces.supervisor?.getState().registry;
    const activeMission = registry?.activeMission;
    if (!activeMission || !this.surfaces.recoveryDoctrine) {
      incident.timeline.push({
        at: new Date().toISOString(),
        stage: "safety_validation",
        detail: "No active mission or Recovery Doctrine unavailable — standby",
      });
      return incident;
    }

    const safety = evaluateAutonomousRecoverySafety({
      failure: incident.failure,
      strategy: incident.strategy ?? "escalate",
      confidence: incident.confidence,
      recoveryAttempts: incident.attempts,
    });

    incident.timeline.push({
      at: new Date().toISOString(),
      stage: "safety_validation",
      detail: safety.reason,
    });

    if (!safety.safe && !request.grandKingOverride) {
      incident.escalationLevel = safety.escalationLevel;
      this.lastAssessment = this.buildAssessment(incident, false);
      return incident;
    }

    this.surfaces.builderMonitor?.publishTelemetry({
      missionId: activeMission.id,
      missionTitle: activeMission.title,
      recoveryState: "active",
      eventKind: "recovery_started",
    });
    this.surfaces.etaEngine?.onExecutionEvidence({
      eventKind: "recovery_started",
      missionId: activeMission.id,
      missionTitle: activeMission.title,
    });

    const trigger =
      request.trigger ?? mapSignalToRecoveryTrigger(incident.failure.signal);

    incident.timeline.push({
      at: new Date().toISOString(),
      stage: "recovery_execution",
      detail: `Executing via Recovery Doctrine · strategy: ${incident.strategy}`,
    });

    const pipelineResult = await this.surfaces.recoveryDoctrine.handleMissionFailure({
      mission: activeMission,
      trigger,
      grandKingOverride: request.grandKingOverride,
    });

    incident.pipelineResult = pipelineResult;
    incident.recovered = pipelineResult.recovered;
    incident.resolvedAt = pipelineResult.completedAt;
    incident.attempts += 1;

    if (pipelineResult.recovered) {
      this.totalRecoveriesSucceeded += 1;
      this.surfaces.builderMonitor?.publishTelemetry({
        missionId: activeMission.id,
        missionTitle: activeMission.title,
        recoveryState: "none",
        eventKind: "recovery_completed",
      });
      this.surfaces.etaEngine?.onExecutionEvidence({
        eventKind: "recovery_completed",
        missionId: activeMission.id,
        missionTitle: activeMission.title,
      });
      incident.timeline.push({
        at: pipelineResult.completedAt,
        stage: "recovery_verification",
        detail: "Recovery verified — mission resumed",
      });
      incident.timeline.push({
        at: pipelineResult.completedAt,
        stage: "journey_recording",
        detail: "Recovery journey recorded",
      });
    } else {
      incident.escalationLevel = pipelineResult.escalated ? "grand_king" : "pillow";
      incident.timeline.push({
        at: pipelineResult.completedAt,
        stage: "escalation_triggered",
        detail: `Escalated to ${incident.escalationLevel}`,
      });
    }

    this.incidentHistory.push(incident);
    if (this.incidentHistory.length > 50) {
      this.incidentHistory = this.incidentHistory.slice(-50);
    }
    this.activeIncident = incident.recovered ? null : incident;
    this.lastAssessment = this.buildAssessment(incident, incident.recovered);
    return incident;
  }

  runAssessment(request: AutonomousRecoveryEngineRequest = {}): AutonomousRecoveryAssessment {
    const incident = this.scanForFailures(request) ?? this.activeIncident;
    const assessment = this.buildAssessment(incident, incident?.recovered ?? false);
    this.lastAssessment = assessment;
    return assessment;
  }

  private buildAssessment(
    incident: RecoveryIncident | null,
    recovered: boolean,
  ): AutonomousRecoveryAssessment {
    return {
      success: recovered || !incident,
      recoveryQuality: recovered
        ? "effective"
        : incident
          ? "degraded"
          : "unknown",
      lastIncident: incident,
      recommendations: incident
        ? [
            incident.recovered
              ? "Continue mission execution — recovery successful"
              : `Escalation recommended: ${incident.escalationLevel}`,
          ]
        : ["Autonomous recovery standby — no active incidents"],
      grandKingSummary: incident
        ? `Recovery: ${incident.failure.missionTitle ?? "mission"} · ${incident.failure.signal.replace(/_/g, " ")} · strategy ${incident.strategy} · ${Math.round(incident.confidence * 100)}% confidence · ${recovered ? "recovered" : "in progress"}`
        : "Autonomous Recovery: standby — continuous failure detection active",
    };
  }

  validateForEccSync(request: AutonomousRecoveryEngineRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    activeIncident: RecoveryIncident | null;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const incident = this.activeIncident ?? this.scanForFailures(request);
    return {
      valid: gate.allowed && (!incident || incident.recovered),
      health: incident && !incident.recovered
        ? "degraded"
        : gate.readinessScore >= 75
          ? "healthy"
          : "degraded",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        incident
          ? `Active incident: ${incident.failure.signal} · ${incident.strategy}`
          : "No active recovery incident",
      ],
      activeIncident: incident,
    };
  }

  formatMissionPreamble(request: AutonomousRecoveryEngineRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildAutonomousRecoveryReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return formatAutonomousRecoveryPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  verifyGrandKingClarity(): {
    complete: boolean;
    autoRecovery: boolean;
    assessment: AutonomousRecoveryAssessment;
  } {
    const gate = this.evaluateBuilderGateSync({ missionId: "P6-06", roadmapItem: "P6-06" });
    const assessment = this.runAssessment({ missionId: "P6-06", roadmapItem: "P6-06" });
    const complete =
      gate.allowed &&
      RECOVERY_ORCHESTRATION_REGISTRY.length >= 10 &&
      RECOVERY_STRATEGY_REGISTRY.length >= 11 &&
      RECOVERY_DETECTION_SIGNALS.length >= 12 &&
      AUTONOMOUS_RECOVERY_RESPONSIBILITIES.length >= 10;

    return {
      complete,
      autoRecovery: true,
      assessment,
    };
  }

  analyzeRecoveryOutcomes(): AutonomousRecoveryAnalysis {
    return analyzeRecoveryEffectiveness({
      incidents: this.incidentHistory,
      metrics: this.getMetrics(),
    });
  }

  getMetrics(): AutonomousRecoveryMetrics {
    const total = Math.max(this.incidentHistory.length, 1);
    const succeeded = this.totalRecoveriesSucceeded;
    return {
      totalResponsibilities: AUTONOMOUS_RECOVERY_RESPONSIBILITIES.length,
      pipelineStages: RECOVERY_ORCHESTRATION_REGISTRY.length,
      detectionSignals: RECOVERY_DETECTION_SIGNALS.length,
      strategyCount: RECOVERY_STRATEGY_REGISTRY.length,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      successRate: total > 0 ? succeeded / total : 1,
      totalIncidents: this.incidentHistory.length,
      totalRecoveriesSucceeded: succeeded,
      trend:
        succeeded >= this.incidentHistory.filter((i) => !i.recovered).length
          ? "stable"
          : "degrading",
    };
  }

  getCockpitSnapshot() {
    const incident = this.activeIncident;
    const analysis = this.analyzeRecoveryOutcomes();
    const assessment = this.lastAssessment ?? this.runAssessment();

    return {
      currentIncident: incident
        ? `${incident.failure.missionTitle ?? "Mission"} — ${incident.failure.signal.replace(/_/g, " ")}`
        : "No active incident",
      recoveryStrategy: incident?.strategy?.replace(/_/g, " ") ?? "Standby",
      recoveryProgress: incident
        ? `${incident.timeline.length} stages · ${incident.recovered ? "complete" : "in progress"}`
        : "Idle",
      recoveryAttempts: incident?.attempts ?? 0,
      recoveryConfidence: incident ? Math.round(incident.confidence * 100) : 100,
      currentRisks: incident?.failure.evidence ?? [],
      escalationLevel: incident?.escalationLevel ?? "supervisor",
      recoveryTimeline: incident?.timeline ?? [],
      recoveryHistory: this.incidentHistory.slice(-10).map((i) => ({
        incidentId: i.incidentId,
        signal: i.failure.signal,
        strategy: i.strategy,
        recovered: i.recovered,
        at: i.detectedAt,
      })),
      grandKingSummary: assessment.grandKingSummary,
      metrics: this.getMetrics(),
      analysis,
    };
  }
}

function severityRank(severity: import("./types.js").DetectedFailure["severity"]): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

export function createAutonomousRecoveryEngine(
  bootstrap: EmpireBootstrapContext,
): AutonomousRecoveryEngine {
  return new AutonomousRecoveryEngine(bootstrap);
}
