import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMissionCoordinationEngineConfiguration,
  type MissionCoordinationEngineConfiguration,
} from "./configuration.js";
import { appendMceLog, resetMceLogsForTesting } from "./mce-logging.js";
import { MissionCoordinationEngineController } from "./mission-coordination-engine-controller.js";
import { MissionCoordinationEngineCore } from "./mission-coordination-engine-core.js";
import { resetMissionSequenceForTesting } from "./mission-store.js";
import { MISSION_COORDINATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  MissionCoordinationEngineCockpitSnapshot,
  MissionCoordinationEngineInput,
  MissionCoordinationEngineState,
} from "./types.js";

export interface MissionCoordinationEngineOptions {
  configuration?: Partial<MissionCoordinationEngineConfiguration>;
}

/** Authoritative Q0-25 Mission Coordination Engine — coordinate lifecycle only. */
export class MissionCoordinationEngine {
  private initializedAt: string | null = null;
  private readonly controller: MissionCoordinationEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MissionCoordinationEngineOptions = {},
  ) {
    this.controller = new MissionCoordinationEngineController(
      new MissionCoordinationEngineCore(),
      buildMissionCoordinationEngineConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MISSION_COORDINATION_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Mission Coordination Engine")) {
      throw new Error(
        `${MISSION_COORDINATION_ENGINE_SYSTEM_PATH} missing — Q0-25 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMceLog({ event: "initialize", details: "Mission Coordination Engine initialized" });
    return this.getState();
  }

  getState(): MissionCoordinationEngineState {
    if (!this.initializedAt) {
      throw new Error("Mission Coordination Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MCE-001",
      missionId: "Q0-25",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalMissionRecords: this.getRecords().length,
        activeMissions: engineRecord?.activeMissions ?? 0,
        blockedMissions: engineRecord?.blockedMissions ?? 0,
        completedMissions: engineRecord?.completedMissions ?? 0,
        lastPhase: engineRecord?.lastPhase ?? null,
        notes: [
          "Coordinate only: does not execute worker logic, replace Workforce Orchestrator, replace Executive Planner, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectMissionCoordinationEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveMissionPlan(input: MissionCoordinationEngineInput = {}) {
    return this.controller.receivePlan(input);
  }

  createMission(input: MissionCoordinationEngineInput = {}) {
    return this.controller.create(input);
  }

  advanceMissionPhase(input: MissionCoordinationEngineInput = {}) {
    return this.controller.advancePhase(input);
  }

  trackWorkerDependencies(input: MissionCoordinationEngineInput = {}) {
    return this.controller.trackDependencies(input);
  }

  handleApprovalCheckpoint(input: MissionCoordinationEngineInput = {}) {
    return this.controller.handleApproval(input);
  }

  detectBlockedMission(input: MissionCoordinationEngineInput = {}) {
    return this.controller.detectBlocked(input);
  }

  detectStalledMission(input: MissionCoordinationEngineInput = {}) {
    return this.controller.detectStalled(input);
  }

  completeMission(input: MissionCoordinationEngineInput = {}) {
    return this.controller.complete(input);
  }

  closeMission(input: MissionCoordinationEngineInput = {}) {
    return this.controller.close(input);
  }

  listMissions() {
    return this.controller.list();
  }

  validateMissionCoordinationEngine(input: MissionCoordinationEngineInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Mission records: ${state.health.totalMissionRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MissionCoordinationEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-25",
      status: state.status,
      healthStatus: state.health.status,
      totalMissionRecords: state.health.totalMissionRecords,
      latestMissionId: this.getLatestRecord()?.missionId ?? null,
      activeMissions: state.health.activeMissions,
      neverExecuteWorkerLogic: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplaceExecutivePlanner: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createMissionCoordinationEngine(
  bootstrap: EmpireBootstrapContext,
  options?: MissionCoordinationEngineOptions,
) {
  return new MissionCoordinationEngine(bootstrap, options);
}

export function resetMissionCoordinationEngineForTesting() {
  resetMceLogsForTesting();
  resetMissionSequenceForTesting();
}
