import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerSelfCritiqueProtocolConfiguration,
  type WorkerSelfCritiqueProtocolConfiguration,
} from "./configuration.js";
import { resetCritiqueSequenceForTesting } from "./critique-store.js";
import { WORKER_SELF_CRITIQUE_PROTOCOL_SYSTEM_PATH } from "./paths.js";
import { WorkerSelfCritiqueProtocolController } from "./worker-self-critique-protocol-controller.js";
import { WorkerSelfCritiqueProtocolCore } from "./worker-self-critique-protocol-core.js";
import { resetWscpLogsForTesting } from "./wscp-logging.js";
import type {
  WorkerSelfCritiqueProtocolCockpitSnapshot,
  WorkerSelfCritiqueProtocolInput,
  WorkerSelfCritiqueProtocolState,
} from "./types.js";

export interface WorkerSelfCritiqueProtocolOptions {
  configuration?: Partial<WorkerSelfCritiqueProtocolConfiguration>;
}

/** Authoritative Q0-28 Worker Self-Critique Protocol — evaluate completed result only. */
export class WorkerSelfCritiqueProtocol {
  private initializedAt: string | null = null;
  private readonly controller: WorkerSelfCritiqueProtocolController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerSelfCritiqueProtocolOptions = {},
  ) {
    this.controller = new WorkerSelfCritiqueProtocolController(
      new WorkerSelfCritiqueProtocolCore(),
      buildWorkerSelfCritiqueProtocolConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_SELF_CRITIQUE_PROTOCOL_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Self-Critique Protocol")) {
      throw new Error(
        `${WORKER_SELF_CRITIQUE_PROTOCOL_SYSTEM_PATH} missing — Q0-28 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerSelfCritiqueProtocolState {
    if (!this.initializedAt) {
      throw new Error(
        "Worker Self-Critique Protocol not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WSCP-001",
      missionId: "Q0-28",
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
        totalCritiqueRecords: this.getRecords().length,
        reviseCount: engineRecord?.reviseCount ?? 0,
        submitCount: engineRecord?.submitCount ?? 0,
        averageRevisedConfidence: engineRecord?.averageRevisedConfidence ?? 0,
        lastDecision: engineRecord?.lastDecision ?? null,
        notes: [
          "Evaluate only: does not replace Peer Review Runtime, replace Worker Quality Standard, execute worker tasks, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerSelfCritiqueProtocol(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  critiqueOutput(input: WorkerSelfCritiqueProtocolInput = {}) {
    return this.controller.critique(input);
  }

  checkCompleteness(input: WorkerSelfCritiqueProtocolInput = {}) {
    return this.controller.checkCompleteness(input);
  }

  checkConsistency(input: WorkerSelfCritiqueProtocolInput = {}) {
    return this.controller.checkConsistency(input);
  }

  identifyWeaknesses(input: WorkerSelfCritiqueProtocolInput = {}) {
    return this.controller.identifyWeaknesses(input);
  }

  recalculateConfidence(input: WorkerSelfCritiqueProtocolInput = {}) {
    return this.controller.recalculateConfidence(input);
  }

  decideSubmission(input: WorkerSelfCritiqueProtocolInput = {}) {
    return this.controller.decideSubmission(input);
  }

  listCritiques() {
    return this.controller.list();
  }

  validateWorkerSelfCritiqueProtocol(input: WorkerSelfCritiqueProtocolInput = {}) {
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
        `Self-critique records: ${state.health.totalCritiqueRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerSelfCritiqueProtocolCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-28",
      status: state.status,
      healthStatus: state.health.status,
      totalCritiqueRecords: state.health.totalCritiqueRecords,
      latestSelfCritiqueId: this.getLatestRecord()?.selfCritiqueId ?? null,
      reviseCount: state.health.reviseCount,
      neverReplacePeerReviewRuntime: true,
      neverReplaceWorkerQualityStandard: true,
      neverExecuteWorkerTasks: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerSelfCritiqueProtocol(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerSelfCritiqueProtocolOptions,
) {
  return new WorkerSelfCritiqueProtocol(bootstrap, options);
}

export function resetWorkerSelfCritiqueProtocolForTesting() {
  resetWscpLogsForTesting();
  resetCritiqueSequenceForTesting();
}
