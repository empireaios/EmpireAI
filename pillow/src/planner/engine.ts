import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import { prependMissionSynchronization } from "../vision-synchronization/mission-preamble.js";
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import type { ContextSyncPipelineResult } from "../context-synchronization/types.js";
import { prependContextSynchronization } from "../context-synchronization/mission-preamble.js";
import type { ContextSynchronizationEngine } from "../context-synchronization/engine.js";
import type { CursorProtocolEngine } from "../cursor-protocol/engine.js";
import type { RecoveryDoctrineEngine } from "../recovery-doctrine/engine.js";
import { prependRecoveryDoctrine } from "../recovery-doctrine/mission-preamble.js";
import type { BrowserTruthEngine } from "../browser-truth/engine.js";
import { prependBrowserTruth } from "../browser-truth/mission-preamble.js";
import type { E2eTestingEngine } from "../e2e-testing/engine.js";
import { prependE2eTesting } from "../e2e-testing/mission-preamble.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import { prependJourneySystem } from "../journey-system/mission-preamble.js";
import type { BrainRuntimeEngine } from "../brain-runtime/engine.js";
import { prependBrainRuntime } from "../brain-runtime/mission-preamble.js";
import type { ProductionModeEngine } from "../production-mode/engine.js";
import { prependProductionMode } from "../production-mode/mission-preamble.js";
import type { DurableSessionEngine } from "../durable-sessions/engine.js";
import { prependDurableSession } from "../durable-sessions/mission-preamble.js";
import type { GuardianMonitoringEngine } from "../guardian-monitoring/engine.js";
import { prependGuardianMonitoring } from "../guardian-monitoring/mission-preamble.js";
import type { ScalingArchitectureEngine } from "../scaling-architecture/engine.js";
import { prependScalingArchitecture } from "../scaling-architecture/mission-preamble.js";
import type { PerformanceGovernanceEngine } from "../performance-governance/engine.js";
import { prependPerformanceGovernance } from "../performance-governance/mission-preamble.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import { prependExecutionControlCenter } from "../execution-control-center/mission-preamble.js";
import type { VisionIntegrityEngine } from "../vision-integrity-engine/engine.js";
import { prependVisionIntegrityEngine } from "../vision-integrity-engine/mission-preamble.js";
import { generateCursorMission } from "./generator.js";
import { buildMissionPlan } from "./sequencer.js";
import type {
  CursorMissionDocument,
  MissionPlan,
  MissionPlannerOptions,
} from "./types.js";

/**
 * Mission Planner (PILLOW-006).
 * Strategic planning engine — repository-derived mission sequencing and generation.
 */
export class MissionPlannerEngine {
  private plan: MissionPlan | null = null;
  private visionSync: VisionSynchronizationEngine | null = null;
  private contextSync: ContextSynchronizationEngine | null = null;
  private cursorProtocol: CursorProtocolEngine | null = null;
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
    private intelligence: RepositoryIntelligenceContext,
    private memory: RepositoryMemoryEngine,
    private options: MissionPlannerOptions = {},
  ) {}

  /** P4-02 — attach Vision Synchronization engine after PILLOW-VS-001 init. */
  setVisionSynchronization(engine: VisionSynchronizationEngine): void {
    this.visionSync = engine;
  }

  /** P4-03 — attach Context Synchronization engine after PILLOW-CS-001 init. */
  setContextSynchronization(engine: ContextSynchronizationEngine): void {
    this.contextSync = engine;
  }

  /** P4-04 — attach Cursor Protocol engine after PILLOW-CP-001 init. */
  setCursorProtocol(engine: CursorProtocolEngine): void {
    this.cursorProtocol = engine;
  }

  /** P4-05 — attach Recovery Doctrine engine after PILLOW-RD-001 init. */
  setRecoveryDoctrine(engine: RecoveryDoctrineEngine): void {
    this.recoveryDoctrine = engine;
  }

  /** P4-06 — attach Browser Truth engine after PILLOW-BT-001 init. */
  setBrowserTruth(engine: BrowserTruthEngine): void {
    this.browserTruth = engine;
  }

  /** P4-07 — attach E2E Testing engine after PILLOW-E2E-001 init. */
  setE2eTesting(engine: E2eTestingEngine): void {
    this.e2eTesting = engine;
  }

  /** P4-08 — attach Journey System engine after PILLOW-JR-001 init. */
  setJourneySystem(engine: JourneySystemEngine): void {
    this.journeySystem = engine;
  }

  /** P5-01 — attach Brain Runtime engine after PILLOW-BR-001 init. */
  setBrainRuntime(engine: BrainRuntimeEngine): void {
    this.brainRuntime = engine;
  }

  /** P5-02 — attach Production Mode engine after PILLOW-PM-001 init. */
  setProductionMode(engine: ProductionModeEngine): void {
    this.productionMode = engine;
  }

  /** P5-03 — attach Durable Session engine after PILLOW-DS-001 init. */
  setDurableSessions(engine: DurableSessionEngine): void {
    this.durableSessions = engine;
  }

  /** P5-04 — attach Guardian Monitoring engine after PILLOW-GM-001 init. */
  setGuardianMonitoring(engine: GuardianMonitoringEngine): void {
    this.guardianMonitoring = engine;
  }

  /** P5-05 — attach Scaling Architecture engine after PILLOW-SCL-001 init. */
  setScalingArchitecture(engine: ScalingArchitectureEngine): void {
    this.scalingArchitecture = engine;
  }

  /** P5-06 — attach Performance Governance engine after PILLOW-PG-001 init. */
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

  /** Initialize plan after Memory is ready (PILLOW-006). */
  initialize(): MissionPlan {
    this.memory.ensureFresh();
    this.plan = buildMissionPlan(
      this.bootstrap,
      this.intelligence,
      this.memory.getMemory(),
    );
    return this.plan;
  }

  /** Rebuild plan from current repository memory. */
  refresh(): MissionPlan {
    this.memory.ensureFresh();
    this.plan = buildMissionPlan(
      this.bootstrap,
      this.intelligence,
      this.memory.getMemory(),
    );
    return this.plan;
  }

  getPlan(): MissionPlan {
    if (!this.plan) {
      throw new Error("Mission Planner not initialized. Call initialize() first.");
    }
    return this.plan;
  }

  /** Determine the correct next mission from repository state. */
  determineNextMission(): MissionPlan["nextMission"] {
    const plan = this.refresh();
    if (this.options.forceMissionId) {
      return (
        plan.queue.find((c) => c.id === this.options.forceMissionId) ??
        plan.nextMission
      );
    }
    return plan.nextMission;
  }

  /**
   * Generate a Cursor-ready mission for the next repository-valid mission.
   * Returns null if mandatory dependencies are incomplete.
   */
  generateNextMission(): CursorMissionDocument | null {
    const next = this.determineNextMission();
    if (!next) return null;
    if (next.readiness !== "ready") return null;
    if (next.blockedBy.length > 0) return null;
    return this.enrichWithSynchronization(generateCursorMission(next), next.id, next.title);
  }

  /** Generate Cursor-ready mission for a specific candidate id when ready. */
  generateMission(missionId: string): CursorMissionDocument | null {
    const plan = this.refresh();
    const candidate = plan.queue.find((c) => c.id === missionId);
    if (!candidate) return null;
    if (candidate.readiness !== "ready" || candidate.blockedBy.length > 0) {
      return null;
    }
    return this.enrichWithSynchronization(
      generateCursorMission(candidate),
      candidate.id,
      candidate.title,
    );
  }

  private enrichWithSynchronization(
    document: CursorMissionDocument | null,
    missionId: string,
    missionTitle: string,
  ): CursorMissionDocument | null {
    if (!document) return document;
    let formatted = document.formatted;
    if (this.visionSync) {
      const visionGate = this.visionSync.evaluateBuilderGateSync({ missionId, missionTitle });
      formatted = prependMissionSynchronization(formatted, visionGate.pipeline);
    }
    let contextPipeline: ContextSyncPipelineResult | undefined;
    if (this.contextSync) {
      const contextGate = this.contextSync.evaluateBuilderGateSync({ missionId, missionTitle });
      contextPipeline = contextGate.pipeline;
      formatted = prependContextSynchronization(formatted, contextGate.pipeline);
    }
    if (this.recoveryDoctrine) {
      const preamble = this.recoveryDoctrine.formatMissionPreamble({ missionId, missionTitle });
      formatted = prependRecoveryDoctrine(formatted, preamble);
    }
    if (this.e2eTesting) {
      const preamble = this.e2eTesting.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependE2eTesting(formatted, preamble);
    }
    if (this.journeySystem) {
      const preamble = this.journeySystem.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependJourneySystem(formatted, preamble);
    }
    if (this.brainRuntime) {
      const preamble = this.brainRuntime.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependBrainRuntime(formatted, preamble);
    }
    if (this.productionMode) {
      const preamble = this.productionMode.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependProductionMode(formatted, preamble);
    }
    if (this.durableSessions) {
      const preamble = this.durableSessions.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependDurableSession(formatted, preamble);
    }
    if (this.guardianMonitoring) {
      const preamble = this.guardianMonitoring.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependGuardianMonitoring(formatted, preamble);
    }
    if (this.scalingArchitecture) {
      const preamble = this.scalingArchitecture.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependScalingArchitecture(formatted, preamble);
    }
    if (this.performanceGovernance) {
      const preamble = this.performanceGovernance.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependPerformanceGovernance(formatted, preamble);
    }
    if (this.executionControlCenter) {
      const preamble = this.executionControlCenter.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependExecutionControlCenter(formatted, preamble);
    }
    if (this.visionIntegrity) {
      const preamble = this.visionIntegrity.formatMissionPreamble({ missionId, missionTitle, roadmapItem: missionId });
      formatted = prependVisionIntegrityEngine(formatted, preamble);
    }
    if (this.browserTruth) {
      const preamble = this.browserTruth.formatMissionPreamble({ missionId, missionTitle });
      formatted = prependBrowserTruth(formatted, preamble);
    }
    if (this.cursorProtocol) {
      const wrapped = this.cursorProtocol.wrapMissionDocument(formatted, {
        missionId,
        missionTitle,
        missionPurpose: document.objective,
        acceptanceCriteria: document.acceptanceCriteria,
        validationSteps: document.validation,
        contextPipeline: contextPipeline ?? undefined,
      });
      formatted = wrapped.document;
    }
    return { ...document, formatted };
  }

  updateSources(
    bootstrap: EmpireBootstrapContext,
    intelligence: RepositoryIntelligenceContext,
    memory: RepositoryMemoryEngine,
  ): MissionPlan {
    this.bootstrap = bootstrap;
    this.intelligence = intelligence;
    this.memory = memory;
    return this.refresh();
  }
}

export function createMissionPlannerEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryEngine,
  options?: MissionPlannerOptions,
): MissionPlannerEngine {
  const engine = new MissionPlannerEngine(
    bootstrap,
    intelligence,
    memory,
    options,
  );
  engine.initialize();
  return engine;
}

export { buildMissionPlan, generateCursorMission };
