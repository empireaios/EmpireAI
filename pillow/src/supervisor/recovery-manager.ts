/**
 * @deprecated Use RecoveryManagerEngine from ../recovery/engine.js (PILLOW-008).
 * Thin adapter preserving supervisor RecoveryResult shape.
 */
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  RecoveryManagerEngine,
} from "../recovery/engine.js";
import type { RecoveryExecutionResult } from "../recovery/types.js";
import { RECOVERY_DOCTRINE_PATH } from "./doctrine.js";
import type {
  RecoveryAssessment,
  RecoveryResult,
  SupervisedMission,
} from "./types.js";

export class RecoveryManager {
  private engine: RecoveryManagerEngine;

  constructor(bootstrap: EmpireBootstrapContext) {
    this.engine = new RecoveryManagerEngine(bootstrap, { dryRunValidation: true });
  }

  setEngine(engine: RecoveryManagerEngine): void {
    this.engine = engine;
  }

  async coordinateRecovery(
    mission: SupervisedMission,
    bootstrap: EmpireBootstrapContext,
    reader: RepositoryReader,
    validationAlreadySucceeded = false,
  ): Promise<RecoveryResult> {
    void bootstrap;
    void reader;
    void validationAlreadySucceeded;

    const trigger = mission.health.isDeadAgent ? "dead_agent" : "supervisor_invocation";
    const execution = await this.engine.executeRecovery({
      mission,
      trigger,
      stallSignals: mission.health.stallSignals,
    });

    return toLegacyRecoveryResult(execution);
  }

  doctrinePath(): string {
    return RECOVERY_DOCTRINE_PATH;
  }

  async verifyDoctrinePresent(reader: RepositoryReader): Promise<boolean> {
    return this.engine.verifyDoctrinePresent(reader);
  }

  getEngine(): RecoveryManagerEngine {
    return this.engine;
  }
}

export function toLegacyRecoveryResult(
  execution: RecoveryExecutionResult,
): RecoveryResult {
  const { record } = execution;
  const assessment: RecoveryAssessment = {
    missionId: record.missionId,
    triggeredAt: record.startedAt,
    stallSignals: [],
    steps: record.steps.map((s: RecoveryExecutionResult["record"]["steps"][number]) => ({
      step: s.step,
      label: s.label,
      status: s.status === "failed" ? "pending" : s.status,
      detail: s.detail,
    })),
    validationAlreadySucceeded:
      record.strategy === "mission_already_complete" ||
      record.strategy === "resume_executive_audit",
    repositoryInspection: {
      modifiedFiles: record.inspection.modifiedFiles.length,
      createdFilesHint:
        record.inspection.createdFiles.slice(0, 5).join(", ") || "none",
      gitDiffAvailable: record.inspection.gitDiffAvailable,
    },
    recommendation: execution.recommendation,
  };

  return {
    assessment,
    missionState: "recovery",
    recovered: execution.recovered,
    execution,
  };
}

export function createRecoveryManager(
  bootstrap: EmpireBootstrapContext,
): RecoveryManager {
  return new RecoveryManager(bootstrap);
}
