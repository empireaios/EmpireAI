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
import { createMissionRegistry, MissionRegistry } from "./registry.js";
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
  SupervisionTickResult,
  SupervisedMission,
  CursorMissionState,
} from "./types.js";
import { DEFAULT_HEARTBEAT_CONFIG as DEFAULT_CONFIG } from "./types.js";

/**
 * Cursor Supervisor (PILLOW-007).
 * Engineering orchestration — launch, monitor, recover Cursor missions. Read-only.
 */
export class CursorSupervisorEngine {
  private registry: MissionRegistry;
  private recoveryManager: RecoveryManager;
  private reader: RepositoryReader;
  private heartbeatConfig: HeartbeatConfig;
  private now: () => number;
  private initializedAt: string | null = null;
  private lastRecoveryByMission = new Map<string, RecoveryResult>();
  private recoveryEngine: RecoveryManagerEngine | null = null;
  private auditReviewer: ExecutiveAuditReviewerEngine | null = null;
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
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.heartbeatConfig = { ...DEFAULT_CONFIG, ...options.heartbeatConfig };
    this.now = options.now ?? (() => Date.now());
  }

  /** Initialize supervisor after Mission Planner (PILLOW-007). */
  async initialize(): Promise<CursorSupervisorState> {
    this.memory.ensureFresh();
    const doctrineOk = await this.recoveryManager.verifyDoctrinePresent(
      this.reader,
    );
    if (!doctrineOk) {
      throw new Error(
        `${RECOVERY_DOCTRINE_PATH} missing — Cursor Supervisor requires Recovery Doctrine.`,
      );
    }
    this.initializedAt = new Date(this.now()).toISOString();
    return this.getState();
  }

  getState(): CursorSupervisorState {
    if (!this.initializedAt) {
      throw new Error(
        "Cursor Supervisor not initialized. Call initialize() first.",
      );
    }
    return {
      supervisorVersion: "PILLOW-007",
      status: "ready",
      initializedAt: this.initializedAt,
      doctrinePath: RECOVERY_DOCTRINE_PATH,
      registry: this.registry.snapshot(this.now()),
      heartbeatConfig: this.heartbeatConfig,
    };
  }

  /** Launch a Cursor engineering mission from planner output. */
  launchMission(request: LaunchMissionRequest): LaunchMissionResult {
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
    return { mission, launched: true };
  }

  /** Launch next mission from Mission Planner when available. */
  launchNextPlannedMission(): LaunchMissionResult | null {
    const document = this.planner.generateNextMission();
    if (!document) return null;
    return this.launchMission({ document });
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
    const at = new Date(this.now()).toISOString();
    let updated = transitionMissionState(mission, state, at);
    updated = {
      ...updated,
      health: evaluateMissionHealth(updated, this.heartbeatConfig, this.now()),
    };
    this.registry.update(updated);
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
        const recovery = await this.invokeRecovery(updated);
        recoveriesInvoked++;
        this.lastRecoveryByMission.set(updated.id, recovery);
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
      }
    }

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
