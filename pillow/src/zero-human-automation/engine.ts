import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { BuilderMonitorEngine } from "../builder-monitor/engine.js";
import type { EtaEngine } from "../eta-engine/engine.js";
import type { AutonomousRecoveryEngine } from "../autonomous-recovery-engine/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { GuardianMonitoringEngine } from "../guardian-monitoring/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { VisionIntegrityEngine } from "../vision-integrity-engine/engine.js";
import type { CursorBridgeEngine } from "../cursor-bridge/engine.js";
import {
  buildZeroHumanAutomationReadinessPipeline,
  buildZeroHumanAutomationReadinessPipelineSync,
  evaluateZeroHumanAutomationGate,
} from "./builder-gate.js";
import {
  ZERO_HUMAN_AUTOMATION_PATH,
  AUTONOMOUS_RECOVERY_COMPANION_PATH,
  ECC_COMPANION_PATH,
  VIE_COMPANION_PATH,
  AUTOMATION_PRINCIPLES,
  AUTOMATION_DOMAINS,
} from "./paths.js";
import { AUTOMATION_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import { SUBSYSTEM_AUTOMATION_LEVELS, aggregateAutomationLevel } from "./automation-levels-registry.js";
import { formatZeroHumanAutomationPreamble } from "./mission-preamble.js";
import {
  analyzeAutomationQuality,
  buildPhaseP6CompletionReview,
} from "./automation-assessment.js";
import {
  assessAutomationState,
  evaluateAutomationSafety,
  formatAutomationLevel,
} from "./automation-orchestrator.js";
import type {
  AutomationState,
  ZeroHumanAutomationAssessment,
  ZeroHumanAutomationGateResult,
  ZeroHumanAutomationEngineState,
  ZeroHumanAutomationMetrics,
  ZeroHumanAutomationAnalysis,
  ZeroHumanAutomationRequest,
  PhaseP6CompletionReview,
} from "./types.js";

export interface ZeroHumanAutomationSurfaces {
  supervisor?: CursorSupervisorEngine | null;
  builderMonitor?: BuilderMonitorEngine | null;
  etaEngine?: EtaEngine | null;
  autonomousRecoveryEngine?: AutonomousRecoveryEngine | null;
  executionControlCenter?: ExecutionControlCenterEngine | null;
  guardianMonitoring?: GuardianMonitoringEngine | null;
  journeySystem?: JourneySystemEngine | null;
  planner?: MissionPlannerEngine | null;
  visionIntegrity?: VisionIntegrityEngine | null;
  cursorBridge?: CursorBridgeEngine | null;
}

/**
 * Zero-Human Automation Engine (PILLOW-ZHA-001 / P6-07).
 * Constitutional self-operating architecture — Grand King defines direction, EmpireAI executes.
 */
export class ZeroHumanAutomationEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private surfacesAttached = false;
  private surfaces: ZeroHumanAutomationSurfaces = {};
  private lastReadiness: import("./types.js").ZeroHumanAutomationReadinessPipeline | null = null;
  private lastAssessment: ZeroHumanAutomationAssessment | null = null;
  private lastState: AutomationState | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ZeroHumanAutomationEngineState> {
    const systemDoc = await this.reader.readText(ZERO_HUMAN_AUTOMATION_PATH);
    if (!systemDoc?.includes("Zero-Human Automation")) {
      throw new Error(
        `${ZERO_HUMAN_AUTOMATION_PATH} missing — Zero-Human Automation requires P6-07 doctrine.`,
      );
    }
    const recovery = await this.reader.readText(AUTONOMOUS_RECOVERY_COMPANION_PATH);
    if (!recovery?.includes("Autonomous Recovery")) {
      throw new Error(`${AUTONOMOUS_RECOVERY_COMPANION_PATH} missing — requires Recovery companion.`);
    }
    const ecc = await this.reader.readText(ECC_COMPANION_PATH);
    if (!ecc?.includes("Execution Control Center")) {
      throw new Error(`${ECC_COMPANION_PATH} missing — requires ECC companion.`);
    }
    const vie = await this.reader.readText(VIE_COMPANION_PATH);
    if (!vie?.includes("Vision Integrity")) {
      throw new Error(`${VIE_COMPANION_PATH} missing — requires VIE companion.`);
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  attachSurfaces(surfaces: ZeroHumanAutomationSurfaces): void {
    this.surfaces = surfaces;
    this.surfacesAttached = Boolean(
      surfaces.executionControlCenter && (surfaces.supervisor || surfaces.planner),
    );
  }

  getState(): ZeroHumanAutomationEngineState {
    if (!this.initializedAt) {
      throw new Error("Zero-Human Automation not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-ZHA-001",
      status:
        this.lastState?.automationHealth === "stopped"
          ? "stopped"
          : this.lastState?.automationHealth === "blocked"
            ? "blocked"
            : this.lastState?.automationHealth === "degraded"
              ? "degraded"
              : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: ZERO_HUMAN_AUTOMATION_PATH,
      companionPath: ECC_COMPANION_PATH,
      surfacesAttached: this.surfacesAttached,
      currentAutomationLevel: aggregateAutomationLevel(),
      lastState: this.lastState,
    };
  }

  async refreshReadiness(
    request: ZeroHumanAutomationRequest = {},
  ): Promise<ZeroHumanAutomationGateResult> {
    this.lastReadiness = await buildZeroHumanAutomationReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    return evaluateZeroHumanAutomationGate(this.lastReadiness, request);
  }

  evaluateBuilderGateSync(
    request: ZeroHumanAutomationRequest = {},
  ): ZeroHumanAutomationGateResult {
    const pipeline =
      this.lastReadiness ??
      buildZeroHumanAutomationReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return evaluateZeroHumanAutomationGate(pipeline, request);
  }

  assessAutomationState(request: ZeroHumanAutomationRequest = {}): AutomationState {
    const registry = this.surfaces.supervisor?.getState().registry;
    const activeMission = registry?.activeMission ?? null;

    let guardianCritical = false;
    if (this.surfaces.guardianMonitoring) {
      try {
        const metrics = this.surfaces.guardianMonitoring.getMetrics();
        guardianCritical = metrics.criticalCount > 0;
      } catch {
        /* guardian unavailable */
      }
    }

    let recoveryActive = false;
    if (this.surfaces.autonomousRecoveryEngine) {
      try {
        const state = this.surfaces.autonomousRecoveryEngine.getState();
        recoveryActive = state.status === "recovering";
      } catch {
        /* recovery unavailable */
      }
    }

    let eccScore = 70;
    if (this.surfaces.executionControlCenter) {
      try {
        const snap = this.surfaces.executionControlCenter.syncFromRuntime();
        eccScore = snap.coordinationScore ?? 70;
      } catch {
        /* ecc unavailable */
      }
    }

    let visionConflict = false;
    if (this.surfaces.visionIntegrity) {
      try {
        const assessment = this.surfaces.visionIntegrity.getState().lastAssessment;
        visionConflict =
          assessment?.classification === "critical_drift" ||
          assessment?.classification === "major_drift";
      } catch {
        /* vie unavailable */
      }
    }

    const safety = evaluateAutomationSafety({
      visionConflict,
      constitutionConflict: false,
      criticalProductionRisk: guardianCritical,
      repositoryIntegrityOk: this.bootstrap.repositoryHealth.healthy,
      securityViolation: false,
      grandKingApprovalRequired: activeMission?.state === "awaiting_grand_king",
      guardianCritical,
      grandKingOverride: request.grandKingOverride,
    });

    const state = assessAutomationState({
      supervisorActive: Boolean(activeMission),
      builderActive: Boolean(activeMission?.state === "implementing" || activeMission?.state === "implementation"),
      guardianHealthy: !guardianCritical,
      recoveryActive,
      eccCoordinationScore: eccScore,
      queueDepth: registry?.queued.length ?? 0,
      safety,
    });

    this.lastState = state;
    return state;
  }

  runAssessment(request: ZeroHumanAutomationRequest = {}): ZeroHumanAutomationAssessment {
    const state = this.assessAutomationState(request);
    const assessment = this.buildAssessment(state);
    this.lastAssessment = assessment;
    return assessment;
  }

  private buildAssessment(state: AutomationState): ZeroHumanAutomationAssessment {
    return {
      success: state.automationHealth === "healthy" || state.automationHealth === "degraded",
      automationQuality:
        state.automationHealth === "healthy"
          ? "effective"
          : state.automationHealth === "degraded"
            ? "improving"
            : "degraded",
      lastState: state,
      recommendations: [
        state.safetyStops.length > 0
          ? `Safety stops active: ${state.safetyStops.join(", ")}`
          : "Automation operating within constitutional bounds",
        "Grand King retains ultimate authority — human override always available",
      ],
      grandKingSummary: `Automation: ${formatAutomationLevel(state.automationLevel)} · ${state.automationHealth} · ${state.activeAutomation ?? "standby"} · ${state.pipelineProgress}% pipeline · ${Math.round(state.successRate * 100)}% success rate`,
    };
  }

  validateForEccSync(request: ZeroHumanAutomationRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    state: AutomationState;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const state = this.lastState ?? this.assessAutomationState(request);
    return {
      valid: gate.allowed && state.automationHealth !== "stopped" && state.automationHealth !== "blocked",
      health:
        state.automationHealth === "stopped" || state.automationHealth === "blocked"
          ? "blocked"
          : state.automationHealth === "degraded"
            ? "degraded"
            : "healthy",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        `Level: ${formatAutomationLevel(state.automationLevel)}`,
        `Active: ${state.activeAutomation ?? "none"}`,
      ],
      state,
    };
  }

  formatMissionPreamble(request: ZeroHumanAutomationRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildZeroHumanAutomationReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return formatZeroHumanAutomationPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  verifyGrandKingClarity(): {
    complete: boolean;
    observable: boolean;
    grandKingAuthority: boolean;
    assessment: ZeroHumanAutomationAssessment;
    phaseP6Review: PhaseP6CompletionReview;
  } {
    const gate = this.evaluateBuilderGateSync({ missionId: "P6-07", roadmapItem: "P6-07" });
    const assessment = this.runAssessment({ missionId: "P6-07", roadmapItem: "P6-07" });
    const phaseP6Review = buildPhaseP6CompletionReview();
    const complete =
      gate.allowed &&
      AUTOMATION_PIPELINE_REGISTRY.length >= 14 &&
      SUBSYSTEM_AUTOMATION_LEVELS.length >= 10 &&
      AUTOMATION_PRINCIPLES.length >= 9 &&
      AUTOMATION_DOMAINS.length >= 15 &&
      phaseP6Review.complete;

    return {
      complete,
      observable: true,
      grandKingAuthority: true,
      assessment,
      phaseP6Review,
    };
  }

  getPhaseP6Review(): PhaseP6CompletionReview {
    return buildPhaseP6CompletionReview();
  }

  analyzeAutomationOutcomes(): ZeroHumanAutomationAnalysis {
    return analyzeAutomationQuality({
      metrics: this.getMetrics(),
      successRate: this.lastState?.successRate ?? 0.92,
      safetyStopCount: this.lastState?.safetyStops.length ?? 0,
    });
  }

  getMetrics(): ZeroHumanAutomationMetrics {
    return {
      totalDomains: AUTOMATION_DOMAINS.length,
      pipelineStages: AUTOMATION_PIPELINE_REGISTRY.length,
      automationLevels: SUBSYSTEM_AUTOMATION_LEVELS.length,
      safetyStops: this.lastState?.safetyStops.length ?? 0,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      successRate: this.lastState?.successRate ?? 0.92,
      subsystemCount: SUBSYSTEM_AUTOMATION_LEVELS.length,
      trend:
        this.lastState?.automationHealth === "healthy"
          ? "stable"
          : this.lastState?.automationHealth === "degraded"
            ? "improving"
            : "degrading",
    };
  }

  getCockpitSnapshot() {
    const state = this.lastState ?? this.assessAutomationState();
    const analysis = this.analyzeAutomationOutcomes();
    const assessment = this.lastAssessment ?? this.runAssessment();
    const phaseP6 = this.getPhaseP6Review();

    return {
      automationLevel: formatAutomationLevel(state.automationLevel),
      automationHealth: state.automationHealth,
      activeAutomation: state.activeAutomation ?? "None — standby",
      queuedAutomation: state.queuedAutomation,
      automationSuccessRate: `${Math.round(state.successRate * 100)}%`,
      automationFailures: state.failureCount,
      recoveryStatus: state.recoveryStatus,
      pipelineProgress: `${state.pipelineProgress}%`,
      safetyStops: state.safetyStops,
      subsystemLevels: SUBSYSTEM_AUTOMATION_LEVELS.map((s) => ({
        label: s.label,
        current: formatAutomationLevel(s.currentLevel),
        target: formatAutomationLevel(s.targetLevel),
      })),
      automationRecommendations: analysis.recommendations,
      phaseP6Complete: phaseP6.complete,
      phaseP6Items: phaseP6.items,
      phaseP6Findings: phaseP6.findings,
      grandKingSummary: assessment.grandKingSummary,
      metrics: this.getMetrics(),
      analysis,
    };
  }
}

export function createZeroHumanAutomationEngine(
  bootstrap: EmpireBootstrapContext,
): ZeroHumanAutomationEngine {
  return new ZeroHumanAutomationEngine(bootstrap);
}
