import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorMissionDocument } from "../planner/types.js";
import {
  canMarkMissionComplete,
  verifyExecutiveAuditCompletion,
} from "./audit-supervision.js";
import { RECOVERY_DOCTRINE_PATH } from "./doctrine.js";
import {
  evaluateMissionHealth,
  hasQualifyingStall,
  recordHeartbeat,
  recordProgress,
  transitionMissionState,
} from "./monitor.js";
import { createRecoveryManager, RecoveryManager, toLegacyRecoveryResult } from "./recovery-manager.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import type { RecoveryTrigger } from "../recovery/types.js";
import type { ExecutiveAuditReviewerEngine } from "../audit-reviewer/engine.js";
import type { ReviewExecutionResult } from "../audit-reviewer/types.js";
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import type { ContextSynchronizationEngine } from "../context-synchronization/engine.js";
import type { BrowserTruthEngine } from "../browser-truth/engine.js";
import type { E2eTestingEngine } from "../e2e-testing/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { BrainRuntimeEngine } from "../brain-runtime/engine.js";
import type { ProductionModeEngine } from "../production-mode/engine.js";
import type { DurableSessionEngine } from "../durable-sessions/engine.js";
import type { GuardianMonitoringEngine } from "../guardian-monitoring/engine.js";
import type { ScalingArchitectureEngine } from "../scaling-architecture/engine.js";
import type { PerformanceGovernanceEngine } from "../performance-governance/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { VisionIntegrityEngine } from "../vision-integrity-engine/engine.js";
import type { BuilderMonitorEngine } from "../builder-monitor/engine.js";
import type { RecoveryDoctrineEngine } from "../recovery-doctrine/engine.js";
import { createMissionRegistry, MissionRegistry } from "./registry.js";
import {
  buildSupervisorReadinessPipeline,
  buildSupervisorReadinessPipelineSync,
  evaluateSupervisorBuilderGate,
} from "./builder-gate.js";
import {
  SUPERVISOR_SYSTEM_PATH,
  SUPERVISOR_GOVERNANCE_COMPANION_PATH,
  VISION_INTEGRITY_COMPANION_PATH,
} from "./paths.js";
import { formatSupervisorPreamble } from "./mission-preamble.js";
import {
  executeSupervisorSystemAssessment,
  mapStateToSupervisionEvent,
} from "./supervision-assessment.js";
import { SUPERVISION_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { SUPERVISION_EVENT_REGISTRY } from "./event-registry.js";
import { classifyMissionHealthStatus } from "./health-classifier.js";
import type {
  CursorSupervisorOptions,
  CursorSupervisorState,
  ExecutiveAuditVerification,
  HeartbeatConfig,
  HeartbeatKind,
  LaunchMissionRequest,
  LaunchMissionResult,
  ProgressEvent,
  RecoveryResult,
  SupervisionEventRecord,
  SupervisionTickResult,
  SupervisedMission,
  CursorMissionState,
  SupervisorSystemAnalysis,
  SupervisorSystemAssessment,
  SupervisorSystemMetrics,
  SupervisorSystemRequest,
  SupervisorBuilderGateResult,
} from "./types.js";
import { DEFAULT_HEARTBEAT_CONFIG as DEFAULT_CONFIG } from "./types.js";

/**
 * Supervisor System (PILLOW-SV-001 / P6-03).
 * Constitutional execution supervisor — observes, never coordinates.
 */
export class CursorSupervisorEngine {
  private registry: MissionRegistry;
  private recoveryManager: RecoveryManager;
  private reader: RepositoryReader;
  private heartbeatConfig: HeartbeatConfig;
  private now: () => number;
  private initializedAt: string | null = null;
  private lastRecoveryByMission = new Map<string, RecoveryResult>();
  private lastReadiness: import("./types.js").SupervisorReadinessPipeline | null = null;
  private lastAssessment: SupervisorSystemAssessment | null = null;
  private recentEvents: SupervisionEventRecord[] = [];
  private recoveryEngine: RecoveryManagerEngine | null = null;
  private auditReviewer: ExecutiveAuditReviewerEngine | null = null;
  private visionSync: VisionSynchronizationEngine | null = null;
  private contextSync: ContextSynchronizationEngine | null = null;
  private recoveryDoctrine: RecoveryDoctrineEngine | null = null;
  private browserTruth: BrowserTruthEngine | null = null;
  private e2eTesting: E2eTestingEngine | null = null;
  private journeySystem: JourneySystemEngine | null = null;
  private brainRuntime: BrainRuntimeEngine | null = null;
  private productionMode: ProductionModeEngine | null = null;
  private durableSessions: DurableSessionEngine | null = null;
  private guardianMonitoring: GuardianMonitoringEngine | null = null;
  private scalingArchitecture: ScalingArchitectureEngine | null = null;
  private performanceGovernance: PerformanceGovernanceEngine | null = null;
  private executionControlCenter: ExecutionControlCenterEngine | null = null;
  private visionIntegrity: VisionIntegrityEngine | null = null;
  private builderMonitor: BuilderMonitorEngine | null = null;
  private lastReviewByMission = new Map<string, ReviewExecutionResult>();

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private memory: RepositoryMemoryEngine,
    private planner: MissionPlannerEngine,
    options: CursorSupervisorOptions = {},
  ) {
    this.registry = createMissionRegistry();
    this.recoveryManager = createRecoveryManager(bootstrap);
    if (options.recoveryManager) {
      this.recoveryEngine = options.recoveryManager;
      this.recoveryManager.setEngine(options.recoveryManager);
    }
    if (options.auditReviewer) {
      this.auditReviewer = options.auditReviewer;
    }
    if (options.visionSync) {
      this.visionSync = options.visionSync;
    }
    if (options.contextSync) {
      this.contextSync = options.contextSync;
    }
    if (options.recoveryDoctrine) {
      this.recoveryDoctrine = options.recoveryDoctrine;
    }
    if (options.browserTruth) {
      this.browserTruth = options.browserTruth;
    }
    if (options.e2eTesting) {
      this.e2eTesting = options.e2eTesting;
    }
    if (options.journeySystem) {
      this.journeySystem = options.journeySystem;
    }
    if (options.brainRuntime) {
      this.brainRuntime = options.brainRuntime;
    }
    if (options.productionMode) {
      this.productionMode = options.productionMode;
    }
    if (options.durableSessions) {
      this.durableSessions = options.durableSessions;
    }
    if (options.guardianMonitoring) {
      this.guardianMonitoring = options.guardianMonitoring;
    }
    if (options.scalingArchitecture) {
      this.scalingArchitecture = options.scalingArchitecture;
    }
    if (options.performanceGovernance) {
      this.performanceGovernance = options.performanceGovernance;
    }
    if (options.executionControlCenter) {
      this.executionControlCenter = options.executionControlCenter;
    }
    if (options.visionIntegrity) {
      this.visionIntegrity = options.visionIntegrity;
    }
    if (options.builderMonitor) {
      this.builderMonitor = options.builderMonitor;
    }
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.heartbeatConfig = { ...DEFAULT_CONFIG, ...options.heartbeatConfig };
    this.now = options.now ?? (() => Date.now());
  }

  /** Initialize Supervisor System after Mission Planner (P6-03). */
  async initialize(): Promise<CursorSupervisorState> {
    this.memory.ensureFresh();
    const systemDoc = await this.reader.readText(SUPERVISOR_SYSTEM_PATH);
    if (!systemDoc?.includes("Supervisor System")) {
      throw new Error(
        `${SUPERVISOR_SYSTEM_PATH} missing — Supervisor requires P6-03 doctrine.`,
      );
    }
    const governance = await this.reader.readText(SUPERVISOR_GOVERNANCE_COMPANION_PATH);
    if (!governance?.includes("Supervisor")) {
      throw new Error(
        `${SUPERVISOR_GOVERNANCE_COMPANION_PATH} missing — Supervisor requires governance companion.`,
      );
    }
    const vie = await this.reader.readText(VISION_INTEGRITY_COMPANION_PATH);
    if (!vie?.includes("Vision Integrity")) {
      throw new Error(
        `${VISION_INTEGRITY_COMPANION_PATH} missing — Supervisor requires VIE companion.`,
      );
    }
    const doctrineOk = await this.recoveryManager.verifyDoctrinePresent(
      this.reader,
    );
    if (!doctrineOk) {
      throw new Error(
        `${RECOVERY_DOCTRINE_PATH} missing — Supervisor requires Recovery Doctrine.`,
      );
    }
    this.initializedAt = new Date(this.now()).toISOString();
    return this.getState();
  }

  getState(): CursorSupervisorState {
    if (!this.initializedAt) {
      throw new Error(
        "Supervisor System not initialized. Call initialize() first.",
      );
    }
    const assessment = this.lastAssessment;
    return {
      supervisorVersion: "PILLOW-SV-001",
      status:
        assessment?.supervisionGrade === "blocked"
          ? "blocked"
          : assessment?.supervisionGrade === "degraded"
            ? "degraded"
            : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: RECOVERY_DOCTRINE_PATH,
      systemDoctrinePath: SUPERVISOR_SYSTEM_PATH,
      registry: this.registry.snapshot(this.now()),
      heartbeatConfig: this.heartbeatConfig,
      lastAssessment: this.lastAssessment,
      recentEvents: this.recentEvents.slice(-20),
    };
  }

  /** Launch a Cursor engineering mission from planner output. */
  launchMission(request: LaunchMissionRequest): LaunchMissionResult {
    if (this.visionSync && !request.grandKingOverride) {
      const validation = this.visionSync.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Vision Synchronization incomplete: ${validation.alignmentNotes.join("; ")}`,
        );
      }
    }

    if (this.contextSync && !request.grandKingOverride) {
      const validation = this.contextSync.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Context Synchronization incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.recoveryDoctrine && !request.grandKingOverride) {
      const validation = this.recoveryDoctrine.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Recovery Doctrine readiness incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.browserTruth && !request.grandKingOverride) {
      const validation = this.browserTruth.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Browser Truth readiness incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.e2eTesting && !request.grandKingOverride) {
      const validation = this.e2eTesting.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — E2E Testing readiness incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.journeySystem && !request.grandKingOverride) {
      const validation = this.journeySystem.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Journey System readiness incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.brainRuntime && !request.grandKingOverride) {
      const validation = this.brainRuntime.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Brain Runtime readiness incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.productionMode && !request.grandKingOverride) {
      const validation = this.productionMode.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Production Mode readiness incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.durableSessions && !request.grandKingOverride) {
      const validation = this.durableSessions.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Durable Session readiness incomplete: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.guardianMonitoring && !request.grandKingOverride) {
      const validation = this.guardianMonitoring.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Guardian Monitoring blocked: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.scalingArchitecture && !request.grandKingOverride) {
      const validation = this.scalingArchitecture.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Scaling Architecture blocked: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.performanceGovernance && !request.grandKingOverride) {
      const validation = this.performanceGovernance.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Performance Governance blocked: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.executionControlCenter && !request.grandKingOverride) {
      const validation = this.executionControlCenter.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Execution Control Center blocked: ${validation.notes.join("; ")}`,
        );
      }
    }

    if (this.visionIntegrity && !request.grandKingOverride) {
      const validation = this.visionIntegrity.validateForSupervisorSync({
        missionId: request.document.missionId,
        missionTitle: request.document.title,
      });
      if (!validation.valid) {
        throw new Error(
          `Supervisor refused launch — Vision Integrity blocked: ${validation.notes.join("; ")}`,
        );
      }
    }

    const at = new Date(this.now()).toISOString();
    const initialState = request.initialState ?? "preparing";
    let mission = this.registry.register(
      request.document,
      at,
      "queued",
    );
    mission = transitionMissionState(mission, initialState, at);
    this.registry.update(mission);
    this.registry.setActive(mission.id);

    this.recordSupervisionEvent({
      kind: "mission_started",
      missionId: mission.id,
      missionTitle: mission.title,
      detail: `Mission accepted and started in state ${initialState}`,
    });

    this.journeySystem?.recordMission(request.document);
    this.journeySystem?.recordSupervisorEvent({
      missionId: request.document.missionId,
      label: "Mission Launched",
      detail: `Supervisor launched ${request.document.missionId} in state ${initialState}`,
      stage: "implementation",
    });

    return { mission, launched: true };
  }

  /** Record constitutional supervision event (P6-03). */
  recordSupervisionEvent(input: {
    kind: import("./types.js").SupervisionEventKind;
    missionId: string;
    missionTitle: string;
    detail: string;
  }): SupervisionEventRecord {
    const mission = this.registry.get(input.missionId);
    const health = mission
      ? classifyMissionHealthStatus(mission)
      : ("healthy" as const);
    const record: SupervisionEventRecord = {
      at: new Date(this.now()).toISOString(),
      kind: input.kind,
      missionId: input.missionId,
      missionTitle: input.missionTitle,
      detail: input.detail,
      health,
    };
    this.recentEvents.push(record);
    if (this.recentEvents.length > 100) {
      this.recentEvents = this.recentEvents.slice(-100);
    }
    this.refreshAssessment();
    this.journeySystem?.recordSupervisorEvent({
      missionId: input.missionId,
      label: input.kind.replace(/_/g, " "),
      detail: input.detail,
      stage: "implementation",
    });
    return record;
  }

  getRecentSupervisionEvents(limit = 20): SupervisionEventRecord[] {
    return this.recentEvents.slice(-limit);
  }

  async refreshReadiness(
    request: SupervisorSystemRequest = {},
  ): Promise<SupervisorBuilderGateResult> {
    const pipeline = await buildSupervisorReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateSupervisorBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(
    request: SupervisorSystemRequest = {},
  ): SupervisorBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildSupervisorReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateSupervisorBuilderGate(pipeline, request);
  }

  runAssessment(request: SupervisorSystemRequest = {}): SupervisorSystemAssessment {
    const assessment = executeSupervisorSystemAssessment({
      bootstrap: this.bootstrap,
      registry: this.registry.snapshot(this.now()),
      request,
      now: this.now,
    });
    this.lastAssessment = assessment;
    return assessment;
  }

  private refreshAssessment(): void {
    this.lastAssessment = executeSupervisorSystemAssessment({
      bootstrap: this.bootstrap,
      registry: this.registry.snapshot(this.now()),
      now: this.now,
    });
  }

  /** ECC consumes Supervisor observations — Supervisor never coordinates. */
  validateForEccSync(request: SupervisorSystemRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    events: SupervisionEventRecord[];
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const assessment = this.runAssessment(request);
    return {
      valid: gate.allowed && assessment.supervisionGrade !== "blocked",
      health:
        assessment.supervisionGrade === "blocked"
          ? "blocked"
          : assessment.supervisionGrade === "degraded"
            ? "degraded"
            : "healthy",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        `Mission health: ${assessment.missionHealth}`,
        assessment.grandKingSummary,
      ],
      events: this.getRecentSupervisionEvents(10),
    };
  }

  formatMissionPreamble(request: SupervisorSystemRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildSupervisorReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatSupervisorPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  verifyGrandKingClarity(): {
    complete: boolean;
    missionHealth: string;
    activeMissions: number;
    assessment: SupervisorSystemAssessment;
    continuousObservation: boolean;
  } {
    const assessment = this.runAssessment({
      missionId: "P6-03",
      missionTitle: "Supervisor System validation",
    });
    const complete =
      assessment.success &&
      assessment.grandKingSummary.includes("Supervisor:") &&
      SUPERVISION_PIPELINE_REGISTRY.length >= 10 &&
      SUPERVISION_EVENT_REGISTRY.length >= 10;

    return {
      complete,
      missionHealth: assessment.missionHealth,
      activeMissions: assessment.activeMissions,
      assessment,
      continuousObservation: true,
    };
  }

  analyzeSupervisionEfficiency(): SupervisorSystemAnalysis {
    const assessment = this.lastAssessment;
    const registry = this.registry.snapshot(this.now());
    const executionEfficiency: string[] = [];
    const missionQuality: string[] = [];
    const engineeringBottlenecks: string[] = [];
    const architectureBottlenecks: string[] = [];
    const repositoryBottlenecks: string[] = [];
    const recommendations: string[] = [];

    if (registry.activeMission) {
      executionEfficiency.push(
        `Active: ${registry.activeMission.title} · ${registry.activeMission.health.score}/100 health`,
      );
      if (registry.activeMission.health.stallSignals.length > 0) {
        engineeringBottlenecks.push(
          ...registry.activeMission.health.stallSignals.map((s) => s.message),
        );
      }
    }

    missionQuality.push(`Completed: ${registry.completed.length} · Failed: ${registry.failed.length}`);
    architectureBottlenecks.push("Supervisor observes — architecture changes tracked via mission progress");
    repositoryBottlenecks.push(
      `Repository health: ${this.getRepositoryAwareness().repositoryHealthScore}/100`,
    );

    if (assessment) {
      recommendations.push(...assessment.recommendations);
    }
    recommendations.push(
      "Grand King observes missions via Cockpit — no log or repository queries required",
      "Guardian infrastructure health remains separate from Supervisor execution health",
    );

    return {
      executionEfficiency,
      missionQuality,
      engineeringBottlenecks,
      architectureBottlenecks,
      repositoryBottlenecks,
      recommendations,
    };
  }

  getMetrics(): SupervisorSystemMetrics {
    const registry = this.registry.snapshot(this.now());
    const assessment = this.lastAssessment;
    return {
      totalResponsibilities: 10,
      pipelineStages: SUPERVISION_PIPELINE_REGISTRY.length,
      supervisionEvents: SUPERVISION_EVENT_REGISTRY.length,
      healthClassifications: 7,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      activeMissions: registry.history.filter(
        (m) => !["completed", "cancelled", "failed"].includes(m.state),
      ).length,
      completedMissions: registry.completed.length,
      trend:
        assessment?.missionHealth === "healthy" || assessment?.missionHealth === "completed"
          ? "stable"
          : assessment?.missionHealth === "critical"
            ? "degrading"
            : "improving",
    };
  }

  getCockpitSnapshot() {
    const assessment =
      this.lastAssessment ??
      this.runAssessment({ missionId: "P6-03", roadmapItem: "P6-03" });
    const snap = assessment.snapshot;
    const analysis = this.analyzeSupervisionEfficiency();

    return {
      currentMission: snap.activeMissionTitle ?? "No active mission",
      currentPhase: snap.currentPhase ?? "—",
      currentStep: snap.currentStep ?? "—",
      missionHealth: snap.missionHealth.replace(/_/g, " "),
      executionState: snap.executionState ?? "ready",
      progress: `${snap.overallProgressPercent}%`,
      overallProgressPercent: snap.overallProgressPercent,
      dependencies: snap.activeDependencies,
      currentRisks: snap.currentRisks,
      warnings: snap.currentWarnings,
      recoveryStatus: snap.recoveryStatus ?? "None",
      validationStatus: snap.validationStatus ?? "Not started",
      recentEvents: this.recentEvents.slice(-10),
      grandKingSummary: assessment.grandKingSummary,
      metrics: this.getMetrics(),
      analysis,
    };
  }

  /** Launch next mission from Mission Planner when available. */
  launchNextPlannedMission(): LaunchMissionResult | null {
    const document = this.planner.generateNextMission();
    if (!document) return null;
    return this.launchMission({ document });
  }

  setBuilderMonitor(engine: BuilderMonitorEngine): void {
    this.builderMonitor = engine;
  }

  /** P6-04 — Supervisor continuously interrogates Builder. */
  interrogateBuilder(request: import("../builder-monitor/types.js").BuilderMonitorRequest = {}) {
    if (!this.builderMonitor) {
      throw new Error("Builder Monitor not attached — cannot interrogate Builder.");
    }
    const report = this.builderMonitor.interrogateBuilder({
      missionId: request.missionId,
      missionTitle: request.missionTitle,
      roadmapItem: request.roadmapItem,
    });
    this.refreshAssessment();
    return report;
  }

  getRegistry(): CursorSupervisorState["registry"] {
    return this.registry.snapshot(this.now());
  }

  getMission(id: string): SupervisedMission | undefined {
    return this.registry.get(id);
  }

  recordMissionHeartbeat(
    missionId: string,
    kind: HeartbeatKind,
    detail: string,
  ): SupervisedMission | null {
    const mission = this.registry.get(missionId);
    if (!mission) return null;
    const at = new Date(this.now()).toISOString();
    let updated = recordHeartbeat(mission, { kind, detail }, at);
    updated = {
      ...updated,
      health: evaluateMissionHealth(updated, this.heartbeatConfig, this.now()),
    };
    this.registry.update(updated);
    return updated;
  }

  recordMissionProgress(
    missionId: string,
    event: Omit<ProgressEvent, "at">,
  ): SupervisedMission | null {
    const mission = this.registry.get(missionId);
    if (!mission) return null;
    const at = new Date(this.now()).toISOString();
    let updated = recordProgress(mission, event, at);
    if (event.kind === "validation_executed") {
      updated = { ...updated, validationCompleted: true };
      this.recordSupervisionEvent({
        kind: "validation_completed",
        missionId: updated.id,
        missionTitle: updated.title,
        detail: event.detail,
      });
    }
    if (event.kind === "executive_audit_generated") {
      updated = { ...updated, executiveAuditProduced: true };
    }
    updated = {
      ...updated,
      health: evaluateMissionHealth(updated, this.heartbeatConfig, this.now()),
    };
    this.registry.update(updated);
    return updated;
  }

  transitionMission(
    missionId: string,
    state: CursorMissionState,
  ): SupervisedMission | null {
    const mission = this.registry.get(missionId);
    if (!mission) return null;
    const previousState = mission.state;
    const at = new Date(this.now()).toISOString();
    let updated = transitionMissionState(mission, state, at);
    updated = {
      ...updated,
      health: evaluateMissionHealth(updated, this.heartbeatConfig, this.now()),
    };
    this.registry.update(updated);

    const eventKind = mapStateToSupervisionEvent(updated, previousState);
    if (eventKind) {
      this.recordSupervisionEvent({
        kind: eventKind,
        missionId: updated.id,
        missionTitle: updated.title,
        detail: `Transitioned ${previousState} → ${state}`,
      });
    } else if (
      (state === "validation" || state === "validating") &&
      previousState !== "validation" &&
      previousState !== "validating"
    ) {
      this.recordSupervisionEvent({
        kind: "validation_started",
        missionId: updated.id,
        missionTitle: updated.title,
        detail: `Validation phase entered from ${previousState}`,
      });
    }

    if (state === "completed") {
      this.registry.setActive(null);
    }
    return updated;
  }

  /** Evaluate all active missions — heartbeat, progress, stall, recovery. */
  async tick(): Promise<SupervisionTickResult> {
    const evaluatedAt = new Date(this.now()).toISOString();
    let stallsDetected = 0;
    let recoveriesInvoked = 0;
    let deadAgentsDetected = 0;
    let missionsEvaluated = 0;

    const snapshot = this.registry.snapshot(this.now());
    const activeList = snapshot.history.filter((m) =>
      [
        "preparing",
        "repository_inspection",
        "implementation",
        "validation",
        "executive_audit",
        "recovery",
      ].includes(m.state),
    );

    for (const mission of activeList) {
      missionsEvaluated++;
      const health = evaluateMissionHealth(
        mission,
        this.heartbeatConfig,
        this.now(),
      );
      let updated = { ...mission, health };
      this.registry.update(updated);

      if (health.isDeadAgent) deadAgentsDetected++;
      if (hasQualifyingStall(health)) {
        stallsDetected++;
        this.recordSupervisionEvent({
          kind: "mission_delayed",
          missionId: updated.id,
          missionTitle: updated.title,
          detail: `Stall detected — ${health.stallSignals.map((s) => s.message).join("; ")}`,
        });
        const recovery = await this.invokeRecovery(updated);
        recoveriesInvoked++;
        this.lastRecoveryByMission.set(updated.id, recovery);
        this.recordSupervisionEvent({
          kind: "recovery_started",
          missionId: updated.id,
          missionTitle: updated.title,
          detail: recovery.assessment.recommendation,
        });
        const nextState =
          recovery.execution?.resumeState ??
          (recovery.recovered ? "executive_audit" : "recovery");
        updated = transitionMissionState(
          { ...updated, recoveryAttempts: updated.recoveryAttempts + 1 },
          nextState,
          evaluatedAt,
        );
        updated = {
          ...updated,
          outcome: recovery.recovered ? "recovered" : updated.outcome,
        };
        this.registry.update(updated);
        if (recovery.recovered) {
          this.recordSupervisionEvent({
            kind: "recovery_completed",
            missionId: updated.id,
            missionTitle: updated.title,
            detail: "Recovery succeeded — execution may resume",
          });
        }
      }
    }

    this.refreshAssessment();

    return {
      evaluatedAt,
      missionsEvaluated,
      stallsDetected,
      recoveriesInvoked,
      deadAgentsDetected,
    };
  }

  getRecoveryEngine(): RecoveryManagerEngine | null {
    return this.recoveryEngine ?? this.recoveryManager.getEngine();
  }

  getLastRecoveryRecord(missionId: string) {
    return this.getRecoveryEngine()?.getLastRecovery(missionId) ?? null;
  }

  async invokeRecovery(mission: SupervisedMission): Promise<RecoveryResult> {
    const trigger: RecoveryTrigger = mission.health.isDeadAgent
      ? "dead_agent"
      : mission.health.stallSignals.some((s) =>
            /detached|background|npm|build|reconnecting/i.test(s.message),
          )
        ? "detached_background_process"
        : mission.state === "validation"
          ? "interrupted_validation"
          : mission.state === "executive_audit"
            ? "interrupted_executive_audit"
            : "stalled_mission";

    const engine = this.getRecoveryEngine();
    void engine;

    if (this.recoveryDoctrine) {
      const pipeline = await this.recoveryDoctrine.handleMissionFailure({
        mission,
        trigger,
        stallSignals: mission.health.stallSignals,
      });
      const execution = pipeline.execution;
      if (execution) {
        const result = toLegacyRecoveryResult(execution);
        if (execution.recovered && execution.resumeState !== mission.state) {
          result.missionState = execution.resumeState;
        }
        return result;
      }
      return {
        assessment: {
          missionId: mission.id,
          triggeredAt: new Date().toISOString(),
          stallSignals: mission.health.stallSignals,
          steps: pipeline.steps.map((s, i) => ({
            step: i + 1,
            label: s.label,
            status: s.status === "failed" ? "pending" : s.status === "completed" ? "completed" : "pending",
            detail: s.detail,
          })),
          validationAlreadySucceeded: false,
          repositoryInspection: {
            modifiedFiles: 0,
            createdFilesHint: "escalated",
            gitDiffAvailable: false,
          },
          recommendation: pipeline.report.summary,
        },
        recovered: false,
        missionState: "recovery",
      };
    }

    if (this.recoveryEngine) {
      const execution = await this.recoveryEngine.executeRecovery({
        mission,
        trigger,
        stallSignals: mission.health.stallSignals,
      });
      const result = toLegacyRecoveryResult(execution);
      if (execution.recovered && execution.resumeState !== mission.state) {
        result.missionState = execution.resumeState;
      }
      return result;
    }

    return this.recoveryManager.coordinateRecovery(
      mission,
      this.bootstrap,
      this.reader,
      mission.validationCompleted,
    );
  }

  getLastRecovery(missionId: string): RecoveryResult | undefined {
    return this.lastRecoveryByMission.get(missionId);
  }

  verifyMissionAudit(
    missionId: string,
    auditText?: string | null,
  ): ExecutiveAuditVerification {
    const mission = this.registry.get(missionId);
    if (!mission) {
      return {
        missionId,
        complete: false,
        hasExecutiveAudit: false,
        hasValidation: false,
        hasAcceptanceVerification: false,
        hasRepositoryContinuity: false,
        issues: ["Mission not found"],
      };
    }
    return verifyExecutiveAuditCompletion(mission, auditText);
  }

  /** Complete mission only when Executive Audit Reviewer approves (PILLOW-009). */
  async completeMission(
    missionId: string,
    auditText?: string | null,
  ): Promise<SupervisedMission | null> {
    const mission = this.registry.get(missionId);
    if (!mission) return null;

    if (this.auditReviewer) {
      const review = await this.auditReviewer.reviewMission({
        mission,
        auditText,
        typecheckPassed: mission.validationCompleted,
        buildPassed: mission.validationCompleted,
      });
      this.lastReviewByMission.set(missionId, review);
      if (!review.approved) {
        return null;
      }
    } else {
      const verification = verifyExecutiveAuditCompletion(mission, auditText);
      if (!verification.complete && !mission.executiveAuditProduced) {
        return null;
      }
    }

    const at = new Date(this.now()).toISOString();
    let updated = transitionMissionState(mission, "completed", at);
    updated = {
      ...updated,
      outcome: "success",
      executiveAuditProduced: true,
      validationCompleted: true,
    };
    this.registry.update(updated);
    this.registry.setActive(null);
    this.recordSupervisionEvent({
      kind: "mission_completed",
      missionId: updated.id,
      missionTitle: updated.title,
      detail: "Mission constitutionally complete",
    });
    return updated;
  }

  getLastReviewRecord(missionId: string) {
    return this.auditReviewer?.getLastReview(missionId) ?? null;
  }

  getLastReviewResult(missionId: string): ReviewExecutionResult | undefined {
    return this.lastReviewByMission.get(missionId);
  }

  configureHeartbeat(config: Partial<HeartbeatConfig>): HeartbeatConfig {
    this.heartbeatConfig = { ...this.heartbeatConfig, ...config };
    return this.heartbeatConfig;
  }

  /** Repository awareness snapshot from Memory + Planner */
  getRepositoryAwareness(): {
    journeyPosition: string | null;
    currentMission: string | null;
    repositoryHealthScore: number;
    pendingMissions: number;
    plannedNext: string | null;
  } {
    this.memory.ensureFresh();
    const mem = this.memory.getMemory();
    const plan = this.planner.getPlan();
    return {
      journeyPosition: mem.domains.journeyPosition.value,
      currentMission: mem.domains.currentMission.value,
      repositoryHealthScore: mem.domains.repositoryHealth.value.score,
      pendingMissions: mem.domains.pendingMissions.value.length,
      plannedNext: plan.nextMission?.id ?? null,
    };
  }

  isMissionComplete(missionId: string, auditText?: string | null): boolean {
    const mission = this.registry.get(missionId);
    if (!mission) return false;
    return canMarkMissionComplete(mission, auditText);
  }
}

export function createCursorSupervisorEngine(
  bootstrap: EmpireBootstrapContext,
  memory: RepositoryMemoryEngine,
  planner: MissionPlannerEngine,
  options?: CursorSupervisorOptions,
): CursorSupervisorEngine {
  return new CursorSupervisorEngine(bootstrap, memory, planner, options);
}
