import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { TechnicalChiefEngine } from "../technical-chief/engine.js";
import type { UxDesignerEngine } from "../ux-designer/engine.js";
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import type { ContextSynchronizationEngine } from "../context-synchronization/engine.js";
import type { CursorProtocolEngine } from "../cursor-protocol/engine.js";
import type { RecoveryDoctrineEngine } from "../recovery-doctrine/engine.js";
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
import type { EtaEngine } from "../eta-engine/engine.js";
import type { AutonomousRecoveryEngine } from "../autonomous-recovery-engine/engine.js";
import type { ZeroHumanAutomationEngine } from "../zero-human-automation/engine.js";
import type { FounderShellEngine } from "../founder-shell/engine.js";
import { routeBridgeInstruction } from "./intent-router.js";
import { assembleEngineeringMission } from "./mission-assembler.js";
import { dispatchToCursor, isSdkAvailable, resolveDispatchMode } from "./sdk-dispatcher.js";
import { runValidationPipeline } from "./validation-pipeline.js";
import {
  buildExecutiveBridgeReport,
  formatExecutiveBridgeReport,
} from "./executive-reporter.js";
import type {
  BridgeInstruction,
  BridgeProcessResult,
  AutonomousEngineeringMission,
  CursorBridgeState,
  DispatchMode,
  DispatchResult,
  LogSource,
} from "./types.js";

export const CURSOR_BRIDGE_CONTRACT_PATH = "PILLOW_ARCHITECTURE_CONTRACT.md";

/**
 * Autonomous Cursor Bridge (PILLOW-CB-001 / Phase 5).
 * Engineering Chief — NL instruction → mission → Cursor dispatch → validation → executive report.
 * P4-02: Vision Synchronization mandatory before mission assembly.
 * P4-03: Context Synchronization mandatory before implementation.
 * P4-04: Cursor Protocol mandatory constitutional execution format.
 */
export class CursorBridgeEngine {
  private initializedAt: string | null = null;
  private totalMissions = 0;
  private totalDispatches = 0;
  private defaultDispatchMode: DispatchMode = "artifact";

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    private readonly planner: MissionPlannerEngine,
    private readonly supervisor: CursorSupervisorEngine,
    private readonly technicalChief: TechnicalChiefEngine,
    private readonly uxDesigner: UxDesignerEngine,
    private readonly visionSync: VisionSynchronizationEngine,
    private readonly contextSync: ContextSynchronizationEngine,
    private readonly cursorProtocol: CursorProtocolEngine,
    private readonly recoveryDoctrine: RecoveryDoctrineEngine,
    private readonly browserTruth: BrowserTruthEngine,
    private readonly e2eTesting: E2eTestingEngine,
    private readonly journeySystem: JourneySystemEngine,
    private readonly brainRuntime: BrainRuntimeEngine,
    private readonly productionMode: ProductionModeEngine,
    private readonly durableSessions: DurableSessionEngine,
    private readonly guardianMonitoring: GuardianMonitoringEngine,
    private readonly scalingArchitecture: ScalingArchitectureEngine,
    private readonly performanceGovernance: PerformanceGovernanceEngine,
    private readonly executionControlCenter: ExecutionControlCenterEngine,
    private readonly visionIntegrity: VisionIntegrityEngine,
    private readonly builderMonitor: BuilderMonitorEngine,
    private readonly etaEngine: EtaEngine,
    private readonly autonomousRecoveryEngine: AutonomousRecoveryEngine,
    private readonly zeroHumanAutomationEngine: ZeroHumanAutomationEngine,
    private readonly founderShellEngine: FounderShellEngine,
  ) {}

  async initialize(): Promise<CursorBridgeState> {
    this.defaultDispatchMode = resolveDispatchMode(process.env.CURSOR_API_KEY);
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CursorBridgeState {
    if (!this.initializedAt) {
      throw new Error("Cursor Bridge not initialized. Call initialize() first.");
    }
    return {
      bridgeVersion: "PILLOW-CB-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalMissions: this.totalMissions,
      totalDispatches: this.totalDispatches,
      sdkAvailable: isSdkAvailable(),
      defaultDispatchMode: this.defaultDispatchMode,
    };
  }

  /** Full pipeline: sync → route → assemble → dispatch → optional validate → executive brief. */
  processInstruction(
    instruction: string,
    options?: {
      autoDispatch?: boolean;
      changedFiles?: string[];
      logs?: Array<{ source: LogSource; text: string }>;
      diffSummary?: string;
      grandKingOverride?: boolean;
    },
  ): BridgeProcessResult {
    const started = performance.now();
    const routed = routeBridgeInstruction(instruction);

    const syncGate = this.visionSync.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!syncGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: syncGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const contextGate = this.contextSync.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!contextGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: contextGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const protocolGate = this.cursorProtocol.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
      contextPipeline: contextGate.pipeline,
    });

    if (!protocolGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: protocolGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const recoveryGate = this.recoveryDoctrine.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!recoveryGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: recoveryGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const browserGate = this.browserTruth.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!browserGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: browserGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const e2eGate = this.e2eTesting.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!e2eGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: e2eGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const journeyGate = this.journeySystem.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!journeyGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: journeyGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const brainRuntimeGate = this.brainRuntime.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!brainRuntimeGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: brainRuntimeGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const productionModeGate = this.productionMode.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!productionModeGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: productionModeGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const durableSessionGate = this.durableSessions.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!durableSessionGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: durableSessionGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const guardianMonitoringGate = this.guardianMonitoring.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!guardianMonitoringGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: guardianMonitoringGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const scalingArchitectureGate = this.scalingArchitecture.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!scalingArchitectureGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: scalingArchitectureGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const performanceGovernanceGate = this.performanceGovernance.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!performanceGovernanceGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: performanceGovernanceGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    const visionIntegrityResult = this.visionIntegrity.evaluateMissionIntegrity({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!visionIntegrityResult.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: visionIntegrityResult.reason,
        bootstrap: this.bootstrap,
      });
    }

    const executionControlCenterGate = this.executionControlCenter.evaluateBuilderGateSync({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    if (!executionControlCenterGate.allowed) {
      return buildRefusedResult({
        started,
        routed,
        reason: executionControlCenterGate.reason,
        bootstrap: this.bootstrap,
      });
    }

    this.executionControlCenter.coordinateExecution({
      missionTitle: instruction.slice(0, 120),
      grandKingOverride: options?.grandKingOverride,
    });

    const mission = assembleEngineeringMission({
      instruction: routed,
      bootstrap: this.bootstrap,
      planner: this.planner,
      technicalChief: this.technicalChief,
      uxDesigner: this.uxDesigner,
      syncPipeline: syncGate.pipeline,
      contextPipeline: contextGate.pipeline,
      cursorProtocol: this.cursorProtocol,
      recoveryDoctrine: this.recoveryDoctrine,
      browserTruth: this.browserTruth,
      e2eTesting: this.e2eTesting,
      journeySystem: this.journeySystem,
      brainRuntime: this.brainRuntime,
      productionMode: this.productionMode,
      durableSessions: this.durableSessions,
      guardianMonitoring: this.guardianMonitoring,
      scalingArchitecture: this.scalingArchitecture,
      performanceGovernance: this.performanceGovernance,
      executionControlCenter: this.executionControlCenter,
      visionIntegrity: this.visionIntegrity,
      supervisor: this.supervisor,
      builderMonitor: this.builderMonitor,
      etaEngine: this.etaEngine,
      autonomousRecoveryEngine: this.autonomousRecoveryEngine,
      zeroHumanAutomationEngine: this.zeroHumanAutomationEngine,
      founderShellEngine: this.founderShellEngine,
    });

    this.journeySystem.publishEvent({
      type: "mission_started",
      label: mission.title,
      detail: `Bridge mission ${mission.bridgeMissionId} assembled`,
      stage: "builder_mission",
    });

    this.builderMonitor.publishTelemetry({
      missionId: mission.bridgeMissionId,
      missionTitle: mission.title,
      missionState: "implementation",
      currentStep: mission.tasks[0]?.action ?? mission.objective.slice(0, 80),
      currentActivity: "Mission assembled — dispatch pending",
      overallProgress: 15,
      stageProgress: 20,
      filesModified: mission.requiredFiles,
      validationState: "not_started",
      recoveryState: "none",
      eventKind: "mission_started",
    });

    this.totalMissions += 1;

    let dispatch: DispatchResult = {
      bridgeMissionId: mission.bridgeMissionId,
      mode: "artifact",
      dispatched: false,
      supervisorMissionId: null,
      artifactPath: mission.artifactPath,
      sdkRunId: null,
      message: "Mission assembled — dispatch skipped",
    };

    if (options?.autoDispatch !== false) {
      dispatch = dispatchToCursor({
        mission,
        supervisor: this.supervisor,
        mode: this.defaultDispatchMode,
        visionSync: this.visionSync,
        contextSync: this.contextSync,
      });
      this.totalDispatches += 1;
      this.builderMonitor.publishTelemetry({
        missionId: mission.bridgeMissionId,
        missionTitle: mission.title,
        missionState: dispatch.dispatched ? "implementation" : "preparing",
        currentActivity: dispatch.message,
        overallProgress: dispatch.dispatched ? 35 : 20,
        eventKind: "mission_updated",
      });
    }

    let validation = null;
    let report = null;

    if (options?.changedFiles || options?.logs) {
      const pipeline = runValidationPipeline({
        mission,
        changedFiles: options.changedFiles ?? [],
        logs: options.logs ?? [],
        technicalChief: this.technicalChief,
        uxDesigner: this.uxDesigner,
        diffSummary: options.diffSummary,
      });
      validation = pipeline.validation;
      report = buildExecutiveBridgeReport({
        mission,
        dispatchMode: dispatch.mode,
        validation: pipeline.validation,
        logSummaries: pipeline.interpretations,
      });
      this.builderMonitor.publishTelemetry({
        missionId: mission.bridgeMissionId,
        missionTitle: mission.title,
        missionState: "validation",
        validationState: pipeline.validation.passed ? "completed" : "in_progress",
        filesModified: options.changedFiles ?? [],
        errors: pipeline.validation.blockers,
        warnings: pipeline.validation.findings,
        overallProgress: pipeline.validation.passed ? 85 : 70,
        eventKind: pipeline.validation.passed ? "validation_completed" : "validation_started",
      });
      this.supervisor.interrogateBuilder({
        missionId: mission.bridgeMissionId,
        missionTitle: mission.title,
      });
    }

    const executiveBrief = report
      ? formatExecutiveBridgeReport(report)
      : formatProcessBrief(routed, mission, dispatch);

    return {
      bridgeMissionId: mission.bridgeMissionId,
      analyzedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      instruction: routed,
      mission,
      dispatch,
      validation,
      report,
      executiveBrief,
      synchronization: syncGate.pipeline,
      contextSynchronization: contextGate.pipeline,
      cursorProtocol: protocolGate.envelope,
    };
  }

  /** Validate completed Cursor work and produce executive report. */
  validateEngineeringWork(input: {
    instruction: string;
    changedFiles: string[];
    logs: Array<{ source: LogSource; text: string }>;
    diffSummary?: string;
  }): BridgeProcessResult {
    return this.processInstruction(input.instruction, {
      autoDispatch: false,
      changedFiles: input.changedFiles,
      logs: input.logs,
      diffSummary: input.diffSummary,
    });
  }
}

function buildRefusedResult(input: {
  started: number;
  routed: BridgeInstruction;
  reason: string;
  bootstrap: EmpireBootstrapContext;
}): BridgeProcessResult {
  const bridgeMissionId = randomUUID();
  const mission: AutonomousEngineeringMission = {
    bridgeMissionId,
    title: "Builder refused — synchronization failed",
    objective: input.reason,
    instruction: input.routed,
    requiredFiles: [],
    tasks: [],
    acceptanceCriteria: ["Resolve synchronization failures before retry"],
    validationSteps: ["Re-run Vision and Context Synchronization"],
    deploymentSteps: [],
    riskSummary: "Implementation blocked — constitutional or context drift",
    cursorPrompt: input.reason,
    formattedDocument: input.reason,
    artifactPath: null,
    synchronizationApplied: false,
  };

  return {
    bridgeMissionId,
    analyzedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - input.started),
    instruction: input.routed,
    mission,
    dispatch: {
      bridgeMissionId,
      mode: "artifact",
      dispatched: false,
      supervisorMissionId: null,
      artifactPath: null,
      sdkRunId: null,
      message: input.reason,
    },
    validation: null,
    report: null,
    executiveBrief: input.reason,
    refused: true,
    refusalReason: input.reason,
  };
}

function formatProcessBrief(
  instruction: BridgeInstruction,
  mission: AutonomousEngineeringMission,
  dispatch: DispatchResult,
): string {
  return [
    "--- Autonomous Cursor Bridge (PILLOW-CB-001) ---",
    `Instruction (${instruction.kind}): ${instruction.rawInstruction}`,
    `Mission: ${mission.title}`,
    `Tasks: ${mission.tasks.length}`,
    `Files: ${mission.requiredFiles.slice(0, 4).join(", ") || "TBD"}`,
    `Risk: ${mission.riskSummary}`,
    `Dispatch: ${dispatch.mode} — ${dispatch.message}`,
    "",
    "### Acceptance Criteria",
    ...mission.acceptanceCriteria.slice(0, 4).map((a) => `- ${a}`),
    "",
    "### Cursor Prompt (excerpt)",
    mission.cursorPrompt.split("\n").slice(0, 6).join("\n"),
  ].join("\n");
}

export function createCursorBridgeEngine(
  bootstrap: EmpireBootstrapContext,
  planner: MissionPlannerEngine,
  supervisor: CursorSupervisorEngine,
  technicalChief: TechnicalChiefEngine,
  uxDesigner: UxDesignerEngine,
  visionSync: VisionSynchronizationEngine,
  contextSync: ContextSynchronizationEngine,
  cursorProtocol: CursorProtocolEngine,
  recoveryDoctrine: RecoveryDoctrineEngine,
  browserTruth: BrowserTruthEngine,
  e2eTesting: E2eTestingEngine,
  journeySystem: JourneySystemEngine,
  brainRuntime: BrainRuntimeEngine,
  productionMode: ProductionModeEngine,
  durableSessions: DurableSessionEngine,
  guardianMonitoring: GuardianMonitoringEngine,
  scalingArchitecture: ScalingArchitectureEngine,
  performanceGovernance: PerformanceGovernanceEngine,
  executionControlCenter: ExecutionControlCenterEngine,
  visionIntegrity: VisionIntegrityEngine,
  builderMonitor: BuilderMonitorEngine,
  etaEngine: EtaEngine,
  autonomousRecoveryEngine: AutonomousRecoveryEngine,
  zeroHumanAutomationEngine: ZeroHumanAutomationEngine,
  founderShellEngine: FounderShellEngine,
): CursorBridgeEngine {
  return new CursorBridgeEngine(
    bootstrap,
    planner,
    supervisor,
    technicalChief,
    uxDesigner,
    visionSync,
    contextSync,
    cursorProtocol,
    recoveryDoctrine,
    browserTruth,
    e2eTesting,
    journeySystem,
    brainRuntime,
    productionMode,
    durableSessions,
    guardianMonitoring,
    scalingArchitecture,
    performanceGovernance,
    executionControlCenter,
    visionIntegrity,
    builderMonitor,
    etaEngine,
    autonomousRecoveryEngine,
    zeroHumanAutomationEngine,
    founderShellEngine,
  );
}
