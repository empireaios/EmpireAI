import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { CursorBridgeEngine } from "../cursor-bridge/engine.js";
import type { GuardianMonitoringEngine } from "../guardian-monitoring/engine.js";
import type { PerformanceGovernanceEngine } from "../performance-governance/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { VisionIntegrityEngine } from "../vision-integrity-engine/engine.js";
import {
  buildExecutionControlReadinessPipeline,
  buildExecutionControlReadinessPipelineSync,
  evaluateExecutionControlBuilderGate,
} from "./builder-gate.js";
import {
  EXECUTION_CONTROL_CENTER_PATH,
  PERFORMANCE_GOVERNANCE_COMPANION_PATH,
  JOURNEY_SYSTEM_COMPANION_PATH,
} from "./paths.js";
import { formatExecutionControlPreamble } from "./mission-preamble.js";
import {
  buildDefaultExecutionSnapshot,
  executeExecutionControlAssessment,
} from "./execution-assessment.js";
import { EXECUTION_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { EXECUTION_DEPENDENCY_REGISTRY, getCriticalPath } from "./dependency-registry.js";
import { EXECUTION_RESOURCE_REGISTRY } from "./resource-registry.js";
import { mapSupervisorStateToEcc, inferPipelineStageFromState } from "./state-mapper.js";
import type {
  ExecutionControlAnalysis,
  ExecutionControlAssessment,
  ExecutionControlBuilderGateResult,
  ExecutionControlCenterRequest,
  ExecutionControlMetrics,
  ExecutionControlSnapshot,
  ExecutionControlCenterState,
  ExecutionCoordinationResult,
  ExecutionQueueEntry,
} from "./types.js";

export interface ExecutionCoordinationSurfaces {
  planner?: MissionPlannerEngine | null;
  supervisor?: CursorSupervisorEngine | null;
  cursorBridge?: CursorBridgeEngine | null;
  guardianMonitoring?: GuardianMonitoringEngine | null;
  performanceGovernance?: PerformanceGovernanceEngine | null;
  journeySystem?: JourneySystemEngine | null;
  visionIntegrity?: VisionIntegrityEngine | null;
  builderMonitor?: import("../builder-monitor/engine.js").BuilderMonitorEngine | null;
  etaEngine?: import("../eta-engine/engine.js").EtaEngine | null;
  autonomousRecoveryEngine?: import("../autonomous-recovery-engine/engine.js").AutonomousRecoveryEngine | null;
  zeroHumanAutomationEngine?: import("../zero-human-automation/engine.js").ZeroHumanAutomationEngine | null;
}

/**
 * Execution Control Center Engine (PILLOW-ECC-001 / P6-01).
 * Constitutional execution coordination — NOT another AI or Builder.
 */
export class ExecutionControlCenterEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private surfacesAttached = false;
  private surfaces: ExecutionCoordinationSurfaces = {};
  private lastReadiness: import("./types.js").ExecutionControlReadinessPipeline | null = null;
  private lastAssessment: ExecutionControlAssessment | null = null;
  private lastSnapshot: ExecutionControlSnapshot | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutionControlCenterState> {
    const systemDoc = await this.reader.readText(EXECUTION_CONTROL_CENTER_PATH);
    if (!systemDoc?.includes("Execution Control Center")) {
      throw new Error(
        `${EXECUTION_CONTROL_CENTER_PATH} missing — ECC requires P6-01 doctrine.`,
      );
    }
    const performance = await this.reader.readText(PERFORMANCE_GOVERNANCE_COMPANION_PATH);
    if (!performance?.includes("Performance Governance")) {
      throw new Error(
        `${PERFORMANCE_GOVERNANCE_COMPANION_PATH} missing — ECC requires Performance Governance companion.`,
      );
    }
    const journey = await this.reader.readText(JOURNEY_SYSTEM_COMPANION_PATH);
    if (!journey?.includes("JOURNEY")) {
      throw new Error(
        `${JOURNEY_SYSTEM_COMPANION_PATH} missing — ECC requires Journey System companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  attachCoordinationSurfaces(surfaces: ExecutionCoordinationSurfaces): void {
    this.surfaces = surfaces;
    this.surfacesAttached = Boolean(surfaces.supervisor || surfaces.planner);
  }

  getState(): ExecutionControlCenterState {
    if (!this.initializedAt) {
      throw new Error("Execution Control Center not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-ECC-001",
      status: this.lastAssessment?.executionGrade === "blocked" ? "degraded" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: EXECUTION_CONTROL_CENTER_PATH,
      companionPath: PERFORMANCE_GOVERNANCE_COMPANION_PATH,
      surfacesAttached: this.surfacesAttached,
      lastAssessment: this.lastAssessment,
    };
  }

  syncFromRuntime(): ExecutionControlSnapshot {
    const base = this.lastSnapshot ?? buildDefaultExecutionSnapshot();
    let snapshot = { ...base, capturedAt: new Date().toISOString() };

    if (this.surfaces.supervisor) {
      try {
        const state = this.surfaces.supervisor.getState();
        const registry = state.registry;
        const active = registry.activeMission;
        snapshot.activeMissionId = active?.id ?? null;
        snapshot.activeMissionTitle = active?.title ?? null;
        snapshot.executionState = active
          ? mapSupervisorStateToEcc(active.state)
          : "ready";
        snapshot.currentPipelineStage = inferPipelineStageFromState(snapshot.executionState);
        snapshot.queueDepth = registry.queued.length;
        snapshot.queuedMissions = registry.queued.length;
        snapshot.overallProgressPercent = active
          ? Math.min(95, Math.round(active.durationMs / 60000 * 10))
          : 0;
        const supervisorSync = this.surfaces.supervisor.validateForEccSync();
        if (supervisorSync.events.length > 0) {
          snapshot.openRisks = (snapshot.openRisks ?? 0) + supervisorSync.events.filter(
            (e) => e.health === "critical" || e.health === "blocked",
          ).length;
        }
      } catch {
        /* supervisor unavailable */
      }
    }

    if (this.surfaces.planner) {
      try {
        const next = this.surfaces.planner.determineNextMission();
        if (next && !snapshot.activeMissionId) {
          snapshot.activeMissionTitle = next.title;
        }
      } catch {
        /* planner unavailable */
      }
    }

    if (this.surfaces.guardianMonitoring) {
      try {
        const metrics = this.surfaces.guardianMonitoring.getMetrics();
        const state = this.surfaces.guardianMonitoring.getState();
        snapshot.openRisks = metrics.openAlerts;
        const health = state.lastAssessment?.overallHealth;
        snapshot.runtimeCapacity =
          health === "critical" || metrics.criticalCount > 0
            ? "critical"
            : health === "degraded" || metrics.degradedCount > 0
              ? "degraded"
              : "healthy";
      } catch {
        /* guardian unavailable */
      }
    }

    if (this.surfaces.performanceGovernance) {
      try {
        const metrics = this.surfaces.performanceGovernance.getMetrics();
        snapshot.openBottlenecks = metrics.criticalBottlenecks;
      } catch {
        /* performance unavailable */
      }
    }

    if (this.surfaces.builderMonitor) {
      try {
        const sync = this.surfaces.builderMonitor.validateForEccSync();
        if (sync.telemetry.currentMission && !snapshot.activeMissionTitle) {
          snapshot.activeMissionTitle = sync.telemetry.currentMission;
        }
        snapshot.overallProgressPercent = Math.max(
          snapshot.overallProgressPercent,
          sync.telemetry.overallProgress,
        );
        if (sync.telemetry.executionHealth === "critical") {
          snapshot.runtimeCapacity = "critical";
        }
      } catch {
        /* builder monitor unavailable */
      }
    }

    if (this.surfaces.etaEngine) {
      try {
        const sync = this.surfaces.etaEngine.validateForEccSync();
        snapshot.overallProgressPercent = Math.max(
          snapshot.overallProgressPercent,
          sync.estimate.completionPercent,
        );
        if (sync.estimate.blockingDependencies.length > 0) {
          snapshot.activeDependencies = Math.max(
            snapshot.activeDependencies,
            sync.estimate.blockingDependencies.length,
          );
        }
        if (sync.health === "blocked") {
          snapshot.executionState = "blocked";
        } else if (sync.estimate.currentDelayReason && snapshot.executionState === "ready") {
          snapshot.executionState = "executing";
        }
      } catch {
        /* eta engine unavailable */
      }
    }

    if (this.surfaces.autonomousRecoveryEngine) {
      try {
        const sync = this.surfaces.autonomousRecoveryEngine.validateForEccSync();
        if (sync.activeIncident && !sync.activeIncident.recovered) {
          snapshot.executionState = "recovering";
          snapshot.openRisks = (snapshot.openRisks ?? 0) + 1;
        }
        if (sync.health === "blocked") {
          snapshot.executionState = "blocked";
        }
      } catch {
        /* autonomous recovery unavailable */
      }
    }

    if (this.surfaces.zeroHumanAutomationEngine) {
      try {
        const sync = this.surfaces.zeroHumanAutomationEngine.validateForEccSync();
        snapshot.queuedMissions = Math.max(snapshot.queuedMissions, sync.state.queuedAutomation);
        if (sync.state.automationHealth === "stopped" || sync.state.automationHealth === "blocked") {
          snapshot.executionState = "blocked";
        }
        if (sync.state.safetyStops.length > 0) {
          snapshot.openRisks = (snapshot.openRisks ?? 0) + sync.state.safetyStops.length;
        }
      } catch {
        /* zero-human automation unavailable */
      }
    }

    snapshot.activeDependencies = getCriticalPath().length;
    snapshot.criticalPathLength = getCriticalPath().length;
    snapshot.coordinationScore = this.computeCoordinationScore(snapshot);
    this.lastSnapshot = snapshot;
    return snapshot;
  }

  private computeCoordinationScore(snapshot: ExecutionControlSnapshot): number {
    let score = 70;
    if (this.surfacesAttached) score += 10;
    if (snapshot.runtimeCapacity === "healthy") score += 10;
    if (snapshot.builderCapacity === "available") score += 5;
    if (snapshot.queueDepth < 5) score += 5;
    if (snapshot.openRisks > 3) score -= 10;
    if (snapshot.openBottlenecks > 2) score -= 5;
    if (snapshot.executionState === "blocked") score -= 15;
    return Math.max(0, Math.min(100, score));
  }

  ingestExecutionSnapshot(snapshot: ExecutionControlSnapshot): ExecutionControlAssessment {
    this.lastSnapshot = snapshot;
    const queue = this.buildExecutionQueue();
    const result = executeExecutionControlAssessment({ snapshot, queue });
    this.lastAssessment = result;
    return result;
  }

  buildExecutionQueue(): ExecutionQueueEntry[] {
    const entries: ExecutionQueueEntry[] = [];

    if (this.surfaces.supervisor) {
      try {
        const registry = this.surfaces.supervisor.getState().registry;
        for (const m of registry.queued) {
          entries.push({
            missionId: m.id,
            title: m.title,
            state: mapSupervisorStateToEcc(m.state),
            priority: entries.length + 1,
            dependencies: m.dependencies,
            progressPercent: 0,
          });
        }
        if (registry.activeMission) {
          const m = registry.activeMission;
          entries.unshift({
            missionId: m.id,
            title: m.title,
            state: mapSupervisorStateToEcc(m.state),
            priority: 0,
            dependencies: m.dependencies,
            progressPercent: Math.min(95, Math.round(m.durationMs / 60000 * 10)),
          });
        }
      } catch {
        /* supervisor unavailable */
      }
    }

    if (entries.length === 0 && this.surfaces.planner) {
      try {
        const next = this.surfaces.planner.determineNextMission();
        if (next) {
          entries.push({
            missionId: next.id,
            title: next.title,
            state: next.readiness === "ready" ? "ready" : "waiting",
            priority: 1,
            dependencies: next.blockedBy,
            progressPercent: 0,
          });
        }
      } catch {
        /* planner unavailable */
      }
    }

    return entries;
  }

  coordinateExecution(
    request: ExecutionControlCenterRequest = {},
  ): ExecutionCoordinationResult {
    const snapshot = this.syncFromRuntime();
    const criticalPath = getCriticalPath().map((d) => d.id);
    const dependenciesResolved =
      this.bootstrap.repositoryHealth.healthy &&
      EXECUTION_DEPENDENCY_REGISTRY.filter((d) => d.criticalPath).length > 0;

    if (this.surfaces.visionIntegrity) {
      const vieResult = this.surfaces.visionIntegrity.validateForEccSync({
        missionId: request.missionId,
        missionTitle: request.missionTitle,
        grandKingOverride: request.grandKingOverride,
      });
      if (!vieResult.allowed) {
        return {
          allowed: false,
          reason: vieResult.reason,
          executionState: "blocked",
          pipelineStage: "integrity_evaluation",
          priority: 0,
          dependenciesResolved,
          criticalPath,
        };
      }
    }

    const blocked = snapshot.executionState === "blocked" || snapshot.runtimeCapacity === "critical";
    const allowed = !blocked || Boolean(request.grandKingOverride);

    return {
      allowed,
      reason: allowed
        ? "ECC coordinates execution — ownership preserved (Pillow/Builder/Supervisor)"
        : "ECC blocked execution — runtime critical or dependencies unresolved",
      executionState: snapshot.executionState,
      pipelineStage: snapshot.currentPipelineStage,
      priority: request.missionId ? 1 : snapshot.queueDepth + 1,
      dependenciesResolved,
      criticalPath,
    };
  }

  async refreshReadiness(
    request: ExecutionControlCenterRequest = {},
  ): Promise<ExecutionControlBuilderGateResult> {
    const pipeline = await buildExecutionControlReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateExecutionControlBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(
    request: ExecutionControlCenterRequest = {},
  ): ExecutionControlBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildExecutionControlReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateExecutionControlBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: ExecutionControlCenterRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").ExecutionControlReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health: gate.pipeline.readinessScore >= 75 ? "healthy" : gate.allowed ? "degraded" : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        this.lastAssessment?.grandKingSummary ?? "Run ECC assessment",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: ExecutionControlCenterRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildExecutionControlReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatExecutionControlPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  runAssessment(snapshot?: ExecutionControlSnapshot | null): ExecutionControlAssessment {
    const snap = snapshot ?? this.syncFromRuntime();
    return this.ingestExecutionSnapshot(snap);
  }

  /** Grand King acceptance — one centralized control center without duplicating roles. */
  verifyGrandKingClarity(): {
    complete: boolean;
    coordinationScore: number;
    executionGrade: string;
    queueDepth: number;
    surfacesAttached: boolean;
    assessment: ExecutionControlAssessment;
    ownershipPreserved: boolean;
  } {
    const assessment = this.runAssessment();
    const complete =
      assessment.success &&
      assessment.grandKingSummary.includes("ECC:") &&
      assessment.grandKingSummary.includes("coordinates") &&
      EXECUTION_PIPELINE_REGISTRY.length >= 12;

    return {
      complete,
      coordinationScore: assessment.coordinationScore,
      executionGrade: assessment.executionGrade,
      queueDepth: assessment.snapshot?.queueDepth ?? 0,
      surfacesAttached: this.surfacesAttached,
      assessment,
      ownershipPreserved: true,
    };
  }

  analyzeExecutionCoordination(): ExecutionControlAnalysis {
    const snap = this.lastSnapshot ?? this.syncFromRuntime();
    const queue = this.buildExecutionQueue();
    const executionTrends: string[] = [];
    const currentRisks: string[] = [];
    const currentBottlenecks: string[] = [];
    const dependencyStatus: string[] = [];
    const resourceStatus: string[] = [];
    const recommendations: string[] = [];

    executionTrends.push(
      `State: ${snap.executionState} · stage: ${snap.currentPipelineStage.replace(/_/g, " ")}`,
      `Queue depth: ${snap.queueDepth} · progress: ${snap.overallProgressPercent}%`,
    );

    if (snap.openRisks > 0) {
      currentRisks.push(`${snap.openRisks} Guardian risks open`);
    }
    if (snap.runtimeCapacity !== "healthy") {
      currentRisks.push(`Runtime capacity: ${snap.runtimeCapacity}`);
    }
    if (snap.openBottlenecks > 0) {
      currentBottlenecks.push(`${snap.openBottlenecks} critical performance bottlenecks`);
    }

    for (const d of getCriticalPath()) {
      dependencyStatus.push(`${d.id}: ${d.name} (critical path)`);
    }

    for (const r of EXECUTION_RESOURCE_REGISTRY.slice(0, 4)) {
      resourceStatus.push(`${r.name}: ${r.currentCapacity}`);
    }

    recommendations.push(
      "Pillow governs priority — ECC coordinates handoff to Builder",
      "Supervisor events feed ECC execution timeline",
      "Guardian health incorporated before execution planning",
    );

    if (queue.length === 0) {
      recommendations.push("No missions queued — Planner next mission available for coordination");
    }

    return {
      executionTrends,
      currentRisks,
      currentBottlenecks,
      dependencyStatus,
      resourceStatus,
      recommendations,
    };
  }

  getMetrics(): ExecutionControlMetrics {
    const assessment = this.lastAssessment;
    return {
      totalResponsibilities: 9,
      coordinatedSystems: 12,
      pipelineStages: EXECUTION_PIPELINE_REGISTRY.length,
      executionStates: 11,
      queueDepth: this.lastSnapshot?.queueDepth ?? 0,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      coordinationScore: assessment?.coordinationScore ?? 75,
      trend: assessment?.executionGrade === "coordinated" ? "stable" : "improving",
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzeExecutionCoordination();
    const queue = this.buildExecutionQueue();
    const snap = this.lastSnapshot ?? buildDefaultExecutionSnapshot();
    const criticalPath = getCriticalPath();
    const supervisionEvents =
      this.surfaces.supervisor?.getRecentSupervisionEvents(5).map(
        (e) => `${e.kind.replace(/_/g, " ")}: ${e.detail.slice(0, 60)}`,
      ) ?? [];

    return {
      executionQueue: queue,
      currentMission: snap.activeMissionTitle ?? (queue[0]?.title ?? "None"),
      currentPhase: snap.currentPipelineStage.replace(/_/g, " "),
      executionState: snap.executionState,
      dependencies: criticalPath.map((d) => `${d.id}: ${d.name}`),
      priority: queue[0]?.priority ?? 0,
      overallProgress: `${snap.overallProgressPercent}%`,
      currentRisks: analysis.currentRisks,
      currentBottlenecks: analysis.currentBottlenecks,
      supervisionEvents,
      executionTimeline: EXECUTION_PIPELINE_REGISTRY.map(
        (s) => `${s.order}. ${s.stage.replace(/_/g, " ")} (${s.owner})`,
      ),
      grandKingSummary: this.lastAssessment?.grandKingSummary ?? "Run ECC assessment",
      metrics,
      analysis,
    };
  }
}

export function createExecutionControlCenterEngine(
  bootstrap: EmpireBootstrapContext,
): ExecutionControlCenterEngine {
  return new ExecutionControlCenterEngine(bootstrap);
}
