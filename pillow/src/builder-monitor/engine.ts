import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { CursorBridgeEngine } from "../cursor-bridge/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import {
  buildBuilderMonitorReadinessPipeline,
  buildBuilderMonitorReadinessPipelineSync,
  evaluateBuilderMonitorGate,
} from "./builder-gate.js";
import {
  BUILDER_MONITOR_PATH,
  SUPERVISOR_SYSTEM_COMPANION_PATH,
  BUILDER_ARCHITECTURE_COMPANION_PATH,
  INTERROGATION_FREQUENCIES,
} from "./paths.js";
import { formatBuilderMonitorPreamble } from "./mission-preamble.js";
import {
  buildDefaultTelemetry,
  buildTimelineEntry,
  executeSupervisorInterrogation,
  telemetryFromSupervisedMission,
} from "./monitor-assessment.js";
import { BUILDER_EVENT_REGISTRY } from "./event-registry.js";
import { BUILDER_TELEMETRY_REGISTRY } from "./telemetry-registry.js";
import type {
  BuilderMonitorAnalysis,
  BuilderMonitorAssessment,
  BuilderMonitorBuilderGateResult,
  BuilderMonitorEngineState,
  BuilderMonitorEventKind,
  BuilderMonitorEventRecord,
  BuilderMonitorMetrics,
  BuilderMonitorRequest,
  BuilderTelemetrySnapshot,
  MissionTimelineEntry,
  SupervisorInterrogationReport,
} from "./types.js";

export interface BuilderMonitorSurfaces {
  supervisor?: CursorSupervisorEngine | null;
  cursorBridge?: CursorBridgeEngine | null;
  journeySystem?: JourneySystemEngine | null;
  executionControlCenter?: ExecutionControlCenterEngine | null;
  planner?: MissionPlannerEngine | null;
  etaEngine?: import("../eta-engine/engine.js").EtaEngine | null;
}

/**
 * Builder Monitor (PILLOW-BM-001 / P6-04).
 * Enables Supervisor to continuously interrogate Builder — complete execution transparency.
 */
export class BuilderMonitorEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private surfacesAttached = false;
  private surfaces: BuilderMonitorSurfaces = {};
  private lastReadiness: import("./types.js").BuilderMonitorReadinessPipeline | null = null;
  private lastAssessment: BuilderMonitorAssessment | null = null;
  private lastTelemetry: BuilderTelemetrySnapshot = buildDefaultTelemetry();
  private lastInterrogation: SupervisorInterrogationReport | null = null;
  private recentEvents: BuilderMonitorEventRecord[] = [];
  private timeline: MissionTimelineEntry[] = [];
  private heartbeatsReceived = 0;
  private missionStartedAt: number | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BuilderMonitorEngineState> {
    const systemDoc = await this.reader.readText(BUILDER_MONITOR_PATH);
    if (!systemDoc?.includes("Builder Monitor")) {
      throw new Error(
        `${BUILDER_MONITOR_PATH} missing — Builder Monitor requires P6-04 doctrine.`,
      );
    }
    const supervisor = await this.reader.readText(SUPERVISOR_SYSTEM_COMPANION_PATH);
    if (!supervisor?.includes("Supervisor System")) {
      throw new Error(
        `${SUPERVISOR_SYSTEM_COMPANION_PATH} missing — Builder Monitor requires Supervisor companion.`,
      );
    }
    const builder = await this.reader.readText(BUILDER_ARCHITECTURE_COMPANION_PATH);
    if (!builder?.includes("Builder")) {
      throw new Error(
        `${BUILDER_ARCHITECTURE_COMPANION_PATH} missing — Builder Monitor requires Builder Architecture companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  attachSurfaces(surfaces: BuilderMonitorSurfaces): void {
    this.surfaces = surfaces;
    this.surfacesAttached = Boolean(surfaces.supervisor || surfaces.cursorBridge);
  }

  getState(): BuilderMonitorEngineState {
    if (!this.initializedAt) {
      throw new Error("Builder Monitor not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-BM-001",
      status:
        this.lastTelemetry.executionHealth === "critical"
          ? "blocked"
          : this.lastTelemetry.executionHealth === "degraded"
            ? "degraded"
            : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: BUILDER_MONITOR_PATH,
      companionPath: SUPERVISOR_SYSTEM_COMPANION_PATH,
      surfacesAttached: this.surfacesAttached,
      lastInterrogation: this.lastInterrogation,
    };
  }

  /** Builder publishes telemetry (Cursor Bridge calls this). */
  publishTelemetry(input: {
    missionId?: string | null;
    missionTitle?: string | null;
    roadmapItem?: string | null;
    missionState?: string | null;
    currentStep?: string | null;
    currentActivity?: string | null;
    overallProgress?: number;
    stageProgress?: number;
    filesModified?: string[];
    currentFile?: string | null;
    validationState?: string;
    productionState?: string;
    recoveryState?: string;
    errors?: string[];
    warnings?: string[];
    eventKind?: BuilderMonitorEventKind;
  }): BuilderTelemetrySnapshot {
    const now = Date.now();
    if (input.eventKind === "mission_started") {
      this.missionStartedAt = now;
    }
    const elapsed =
      this.missionStartedAt !== null ? now - this.missionStartedAt : this.lastTelemetry.elapsedTimeMs;

    this.lastTelemetry = {
      ...this.lastTelemetry,
      capturedAt: new Date(now).toISOString(),
      currentMission: input.missionTitle ?? this.lastTelemetry.currentMission,
      currentRoadmapItem: input.roadmapItem ?? input.missionId ?? this.lastTelemetry.currentRoadmapItem,
      currentStep: input.currentStep ?? this.lastTelemetry.currentStep,
      currentActivity: input.currentActivity ?? this.lastTelemetry.currentActivity,
      missionState: input.missionState ?? this.lastTelemetry.missionState,
      overallProgress: input.overallProgress ?? this.lastTelemetry.overallProgress,
      stageProgress: input.stageProgress ?? this.lastTelemetry.stageProgress,
      elapsedTimeMs: elapsed,
      estimatedRemainingTimeMs:
        input.overallProgress && input.overallProgress > 0
          ? Math.round(elapsed * (100 / input.overallProgress - 1))
          : this.lastTelemetry.estimatedRemainingTimeMs,
      filesModified: input.filesModified ?? this.lastTelemetry.filesModified,
      currentFile: input.currentFile ?? this.lastTelemetry.currentFile,
      validationState: input.validationState ?? this.lastTelemetry.validationState,
      productionState: input.productionState ?? this.lastTelemetry.productionState,
      recoveryState: input.recoveryState ?? this.lastTelemetry.recoveryState,
      currentErrors: input.errors ?? this.lastTelemetry.currentErrors,
      currentWarnings: input.warnings ?? this.lastTelemetry.currentWarnings,
      heartbeatAt: new Date(now).toISOString(),
      repositoryActivity:
        input.filesModified && input.filesModified.length > 0
          ? `${input.filesModified.length} files modified`
          : this.lastTelemetry.repositoryActivity,
      executionHealth:
        (input.errors?.length ?? 0) > 0
          ? "critical"
          : (input.warnings?.length ?? 0) > 0
            ? "degraded"
            : "healthy",
    };

    if (input.eventKind) {
      this.emitEvent({
        kind: input.eventKind,
        missionId: input.missionId ?? null,
        detail: input.currentActivity ?? input.currentStep ?? input.eventKind,
      });
    } else {
      this.emitEvent({
        kind: "heartbeat",
        missionId: input.missionId ?? null,
        detail: "Builder heartbeat",
      });
      this.heartbeatsReceived += 1;
    }

    this.surfaces.etaEngine?.onExecutionEvidence({
      eventKind: input.eventKind ?? "heartbeat",
      missionId: input.missionId ?? null,
      missionTitle: input.missionTitle ?? null,
    });

    return this.lastTelemetry;
  }

  emitEvent(input: {
    kind: BuilderMonitorEventKind;
    missionId: string | null;
    detail: string;
  }): BuilderMonitorEventRecord {
    const record: BuilderMonitorEventRecord = {
      at: new Date().toISOString(),
      kind: input.kind,
      missionId: input.missionId,
      detail: input.detail,
      telemetry: { ...this.lastTelemetry },
    };
    this.recentEvents.push(record);
    if (this.recentEvents.length > 100) {
      this.recentEvents = this.recentEvents.slice(-100);
    }
    return record;
  }

  /** Supervisor continuously interrogates Builder — never assumes. */
  interrogateBuilder(request: BuilderMonitorRequest = {}): SupervisorInterrogationReport {
    const registry = this.surfaces.supervisor?.getState().registry;
    const active = registry?.activeMission;
    if (active) {
      this.lastTelemetry = telemetryFromSupervisedMission({
        mission: active,
        roadmapItem: request.roadmapItem ?? request.missionId ?? active.id,
        filesModified: this.lastTelemetry.filesModified,
        now: () => Date.now(),
      });
    }

    const bridge = this.surfaces.cursorBridge?.getState();
    if (bridge && !active) {
      this.lastTelemetry = {
        ...this.lastTelemetry,
        currentWorker: "builder",
        currentQueue: bridge.totalMissions > 0 ? `${bridge.totalMissions} missions processed` : null,
      };
    }

    const report = executeSupervisorInterrogation({
      telemetry: this.lastTelemetry,
      missionId: request.missionId ?? active?.id ?? null,
    });
    this.lastInterrogation = report;

    const timelineEntry = buildTimelineEntry({
      report,
      supervisorObservation: "Supervisor verified Builder telemetry — no assumptions",
    });
    this.timeline.push(timelineEntry);
    if (this.timeline.length > 200) {
      this.timeline = this.timeline.slice(-200);
    }

    this.surfaces.journeySystem?.publishEvent({
      type: "mission_started",
      label: "Builder interrogated",
      detail: report.grandKingSummary,
      stage: "builder_mission",
    });

    this.lastAssessment = this.buildAssessment(report);
    return report;
  }

  private buildAssessment(report: SupervisorInterrogationReport): BuilderMonitorAssessment {
    const telemetry = report.telemetry;
    return {
      success: telemetry.executionHealth !== "critical",
      executionHealth: telemetry.executionHealth,
      telemetryComplete: BUILDER_TELEMETRY_REGISTRY.filter((f) => f.required).every(
        (f) => {
          const key = f.field;
          if (key === "current_mission") return Boolean(telemetry.currentMission);
          if (key === "current_step") return Boolean(telemetry.currentStep);
          if (key === "current_activity") return Boolean(telemetry.currentActivity);
          if (key === "mission_state") return Boolean(telemetry.missionState);
          if (key === "overall_progress") return telemetry.overallProgress >= 0;
          if (key === "heartbeat") return Boolean(telemetry.heartbeatAt);
          return true;
        },
      ),
      interrogationCount: report.results.length,
      timelineEntries: this.timeline.length,
      recommendations: [
        "Supervisor interrogates Builder at configured intervals",
        "Every interrogation result recorded in Journey timeline",
        "ECC consumes Builder Monitor for scheduling and priorities",
      ],
      grandKingSummary: report.grandKingSummary,
    };
  }

  getRecentEvents(limit = 20): BuilderMonitorEventRecord[] {
    return this.recentEvents.slice(-limit);
  }

  getTimeline(limit = 20): MissionTimelineEntry[] {
    return this.timeline.slice(-limit);
  }

  getInterrogationFrequencies() {
    return INTERROGATION_FREQUENCIES;
  }

  async refreshReadiness(
    request: BuilderMonitorRequest = {},
  ): Promise<BuilderMonitorBuilderGateResult> {
    const pipeline = await buildBuilderMonitorReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateBuilderMonitorGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: BuilderMonitorRequest = {}): BuilderMonitorBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildBuilderMonitorReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateBuilderMonitorGate(pipeline, request);
  }

  runAssessment(request: BuilderMonitorRequest = {}): BuilderMonitorAssessment {
    const report = this.lastInterrogation ?? this.interrogateBuilder(request);
    const assessment = this.buildAssessment(report);
    this.lastAssessment = assessment;
    return assessment;
  }

  validateForEccSync(request: BuilderMonitorRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    telemetry: BuilderTelemetrySnapshot;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const report = this.interrogateBuilder(request);
    return {
      valid: gate.allowed && report.telemetry.executionHealth !== "critical",
      health:
        report.telemetry.executionHealth === "critical"
          ? "blocked"
          : report.telemetry.executionHealth === "degraded" ||
              report.telemetry.executionHealth === "attention"
            ? "degraded"
            : "healthy",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        `Execution health: ${report.telemetry.executionHealth}`,
        report.grandKingSummary,
      ],
      telemetry: report.telemetry,
    };
  }

  formatMissionPreamble(request: BuilderMonitorRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildBuilderMonitorReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatBuilderMonitorPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  verifyGrandKingClarity(): {
    complete: boolean;
    executionHealth: string;
    interrogationDomains: number;
    assessment: BuilderMonitorAssessment;
    nearRealTimeObservation: boolean;
  } {
    const assessment = this.runAssessment({
      missionId: "P6-04",
      missionTitle: "Builder Monitor validation",
    });
    this.interrogateBuilder({ missionId: "P6-04", roadmapItem: "P6-04" });
    const complete =
      assessment.grandKingSummary.includes("Builder Monitor:") &&
      BUILDER_EVENT_REGISTRY.length >= 13 &&
      BUILDER_TELEMETRY_REGISTRY.length >= 22;

    return {
      complete,
      executionHealth: assessment.executionHealth,
      interrogationDomains: this.lastInterrogation?.results.length ?? 0,
      assessment,
      nearRealTimeObservation: true,
    };
  }

  analyzeBuilderExecution(): BuilderMonitorAnalysis {
    const t = this.lastTelemetry;
    const recommendations: string[] = [];
    const executionQuality: string[] = [];
    const executionEfficiency: string[] = [];
    const recurringBottlenecks: string[] = t.currentWarnings.slice();
    const missionDuration: string[] = [];
    const repositoryBehaviour: string[] = [];

    if (t.currentMission) {
      executionQuality.push(`Mission: ${t.currentMission} · health ${t.executionHealth}`);
      executionEfficiency.push(`Progress: ${t.overallProgress}% · elapsed ${Math.round(t.elapsedTimeMs / 1000)}s`);
      missionDuration.push(
        t.estimatedRemainingTimeMs
          ? `ETA ~${Math.round(t.estimatedRemainingTimeMs / 1000)}s remaining`
          : "ETA unknown",
      );
    }
    repositoryBehaviour.push(t.repositoryActivity ?? "No repository activity");
    if (t.filesModified.length > 0) {
      repositoryBehaviour.push(`Files modified: ${t.filesModified.length}`);
    }
    recurringBottlenecks.push(...t.currentErrors);

    if (this.lastAssessment) {
      recommendations.push(...this.lastAssessment.recommendations);
    }
    recommendations.push("Pillow analyses Builder execution quality and bottlenecks");

    return {
      executionQuality,
      executionEfficiency,
      recurringBottlenecks,
      missionDuration,
      repositoryBehaviour,
      recommendations,
    };
  }

  getMetrics(): BuilderMonitorMetrics {
    return {
      totalResponsibilities: 10,
      telemetryFields: BUILDER_TELEMETRY_REGISTRY.length,
      eventTypes: BUILDER_EVENT_REGISTRY.length,
      interrogationDomains: this.lastInterrogation?.results.length ?? 12,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      timelineEntries: this.timeline.length,
      heartbeatsReceived: this.heartbeatsReceived,
      trend:
        this.lastTelemetry.executionHealth === "healthy"
          ? "stable"
          : this.lastTelemetry.executionHealth === "critical"
            ? "degrading"
            : "improving",
    };
  }

  getTelemetrySnapshot(): BuilderTelemetrySnapshot {
    return this.lastTelemetry;
  }

  getCockpitSnapshot() {
    const report =
      this.lastInterrogation ??
      executeSupervisorInterrogation({
        telemetry: this.lastTelemetry,
        missionId: "P6-04",
      });
    const t = report.telemetry;
    const analysis = this.analyzeBuilderExecution();

    return {
      currentMission: t.currentMission ?? "No active mission",
      currentStep: t.currentStep ?? "—",
      currentActivity: t.currentActivity ?? "—",
      progress: `${t.overallProgress}%`,
      overallProgressPercent: t.overallProgress,
      elapsedTimeMs: t.elapsedTimeMs,
      estimatedRemainingTimeMs: t.estimatedRemainingTimeMs,
      heartbeat: t.heartbeatAt ?? "No heartbeat",
      repositoryActivity: t.repositoryActivity ?? "None",
      filesModified: t.filesModified,
      validationStatus: t.validationState,
      recoveryStatus: t.recoveryState,
      executionHealth: t.executionHealth,
      recentEvents: this.recentEvents.slice(-10),
      timeline: this.timeline.slice(-5),
      interrogationFrequencies: INTERROGATION_FREQUENCIES,
      grandKingSummary: report.grandKingSummary,
      metrics: this.getMetrics(),
      analysis,
    };
  }
}

export function createBuilderMonitorEngine(
  bootstrap: EmpireBootstrapContext,
): BuilderMonitorEngine {
  return new BuilderMonitorEngine(bootstrap);
}
