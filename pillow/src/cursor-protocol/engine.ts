import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ContextSynchronizationEngine } from "../context-synchronization/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
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
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import {
  buildPostMissionReportTemplate,
  buildProtocolEnvelope,
  formatCursorProtocolDocument,
  validateProtocolDocument,
} from "./format-protocol.js";
import { allPreMissionChecksPassed, runPreMissionChecks } from "./pre-mission-checks.js";
import { CURSOR_PROTOCOL_SYSTEM_PATH } from "./paths.js";
import type {
  CursorProtocolGateResult,
  CursorProtocolRequest,
  CursorProtocolState,
  MissionProgressReport,
  PostMissionReportTemplate,
  ProtocolValidationResult,
} from "./types.js";

/**
 * Cursor Protocol Engine (PILLOW-CP-001 / P4-04).
 * Permanent constitutional execution format for every Builder mission.
 */
export class CursorProtocolEngine {
  private initializedAt: string | null = null;
  private totalApplications = 0;
  private reader: RepositoryReader;
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

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private planner: MissionPlannerEngine,
    private visionSync: VisionSynchronizationEngine,
    private contextSync: ContextSynchronizationEngine,
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CursorProtocolState> {
    const text = await this.reader.readText(CURSOR_PROTOCOL_SYSTEM_PATH);
    if (!text?.includes("Cursor Protocol")) {
      throw new Error(
        `${CURSOR_PROTOCOL_SYSTEM_PATH} missing — Cursor Protocol Engine requires P4-04 system doc.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  /** P4-05 — attach Recovery Doctrine after PILLOW-RD-001 init. */
  setRecoveryDoctrine(engine: RecoveryDoctrineEngine): void {
    this.recoveryDoctrine = engine;
  }

  /** P4-06 — attach Browser Truth after PILLOW-BT-001 init. */
  setBrowserTruth(engine: BrowserTruthEngine): void {
    this.browserTruth = engine;
  }

  /** P4-07 — attach E2E Testing after PILLOW-E2E-001 init. */
  setE2eTesting(engine: E2eTestingEngine): void {
    this.e2eTesting = engine;
  }

  /** P4-08 — attach Journey System after PILLOW-JR-001 init. */
  setJourneySystem(engine: JourneySystemEngine): void {
    this.journeySystem = engine;
  }

  /** P5-01 — attach Brain Runtime after PILLOW-BR-001 init. */
  setBrainRuntime(engine: BrainRuntimeEngine): void {
    this.brainRuntime = engine;
  }

  /** P5-02 — attach Production Mode after PILLOW-PM-001 init. */
  setProductionMode(engine: ProductionModeEngine): void {
    this.productionMode = engine;
  }

  /** P5-03 — attach Durable Sessions after PILLOW-DS-001 init. */
  setDurableSessions(engine: DurableSessionEngine): void {
    this.durableSessions = engine;
  }

  /** P5-04 — attach Guardian Monitoring after PILLOW-GM-001 init. */
  setGuardianMonitoring(engine: GuardianMonitoringEngine): void {
    this.guardianMonitoring = engine;
  }

  /** P5-05 — attach Scaling Architecture after PILLOW-SCL-001 init. */
  setScalingArchitecture(engine: ScalingArchitectureEngine): void {
    this.scalingArchitecture = engine;
  }

  /** P5-06 — attach Performance Governance after PILLOW-PG-001 init. */
  setPerformanceGovernance(engine: PerformanceGovernanceEngine): void {
    this.performanceGovernance = engine;
  }

  /** P6-01 — attach Execution Control Center after PILLOW-ECC-001 init. */
  setExecutionControlCenter(engine: ExecutionControlCenterEngine): void {
    this.executionControlCenter = engine;
  }

  /** P6-02 — attach Vision Integrity Engine after PILLOW-VIE-001 init. */
  setVisionIntegrity(engine: VisionIntegrityEngine): void {
    this.visionIntegrity = engine;
  }

  getState(): CursorProtocolState {
    if (!this.initializedAt) {
      throw new Error("Cursor Protocol Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-CP-001",
      status: "ready",
      initializedAt: this.initializedAt,
      doctrinePath: CURSOR_PROTOCOL_SYSTEM_PATH,
      totalApplications: this.totalApplications,
    };
  }

  /** Apply Cursor Protocol envelope to a mission document body. */
  applyProtocol(request: CursorProtocolRequest): CursorProtocolGateResult {
    const contextGate = this.contextSync.evaluateBuilderGateSync({
      missionId: request.missionId,
      missionTitle: request.missionTitle,
      grandKingOverride: request.grandKingOverride,
    });
    const contextPipeline = request.contextPipeline ?? contextGate.pipeline;

    const preMissionChecks = runPreMissionChecks({
      bootstrap: this.bootstrap,
      planner: this.planner,
      visionSync: this.visionSync,
      contextSync: this.contextSync,
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
      missionId: request.missionId,
      missionTitle: request.missionTitle,
      grandKingOverride: request.grandKingOverride,
    });

    const envelope = buildProtocolEnvelope({
      request,
      contextPipeline,
      preMissionChecks,
    });

    const implementationBody = request.implementationBody ?? "";
    const formattedProtocol = formatCursorProtocolDocument(envelope, implementationBody, {
      acceptanceCriteria: request.acceptanceCriteria,
      validationSteps: request.validationSteps,
    });

    const checksPassed = allPreMissionChecksPassed(
      preMissionChecks,
      request.grandKingOverride,
    );
    const validation = validateProtocolDocument(formattedProtocol);

    this.totalApplications += 1;

    const allowed = checksPassed && validation.valid && contextGate.allowed;

    return {
      allowed,
      reason: allowed
        ? "Cursor Protocol applied — Builder may implement"
        : !checksPassed
          ? "Builder refused — pre-mission checks failed"
          : !validation.valid
            ? `Builder refused — missing protocol sections: ${validation.missingSections.join(", ")}`
            : contextGate.reason,
      overrideApplied: Boolean(request.grandKingOverride),
      envelope,
      formattedProtocol,
    };
  }

  /** Builder gate — pre-mission checks + mandatory section validation. */
  evaluateBuilderGateSync(
    request: CursorProtocolRequest,
  ): CursorProtocolGateResult {
    return this.applyProtocol({
      ...request,
      implementationBody: request.implementationBody ?? "",
    });
  }

  /** Wrap sync preambles + mission body in constitutional protocol envelope. */
  wrapMissionDocument(
    implementationBody: string,
    request: CursorProtocolRequest,
  ): { document: string; gate: CursorProtocolGateResult } {
    const gate = this.applyProtocol({
      ...request,
      implementationBody,
    });
    return {
      document: gate.formattedProtocol,
      gate,
    };
  }

  validateDocument(document: string): ProtocolValidationResult {
    return validateProtocolDocument(document);
  }

  buildProgressReport(request: CursorProtocolRequest): MissionProgressReport {
    const gate = this.applyProtocol(request);
    return {
      currentProgress: gate.envelope.allPreMissionChecksPassed
        ? "Protocol validated — implementation authorized"
        : "Blocked",
      elapsedTime: "0m",
      estimatedRemainingTime: gate.envelope.estimatedCompletionTime,
      currentRisks: gate.envelope.preMissionChecks
        .filter((c) => c.status !== "passed")
        .map((c) => c.detail),
      blockingReason: gate.allowed ? null : gate.reason,
      recoveryAttempts: 0,
      currentOwner: "Builder (Cursor)",
      currentRoadmapItem: gate.envelope.roadmapItem,
    };
  }

  buildPostMissionTemplate(request: CursorProtocolRequest): PostMissionReportTemplate {
    const gate = this.applyProtocol(request);
    return buildPostMissionReportTemplate(gate.envelope);
  }
}

export function createCursorProtocolEngine(
  bootstrap: EmpireBootstrapContext,
  planner: MissionPlannerEngine,
  visionSync: VisionSynchronizationEngine,
  contextSync: ContextSynchronizationEngine,
): CursorProtocolEngine {
  return new CursorProtocolEngine(bootstrap, planner, visionSync, contextSync);
}
