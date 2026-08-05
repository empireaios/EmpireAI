import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildQueueRuntimeConfiguration,
  type QueueRuntimeConfiguration,
} from "./configuration.js";
import type { QueueRuntimeDependencies } from "./integrations.js";
import { QueueRuntimeController } from "./queue-runtime-controller.js";
import { QueueRuntimeManager } from "./queue-runtime-manager.js";
import { resetQrtLogsForTesting } from "./qrt-logging.js";
import { QUEUE_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetQrtSequenceForTesting } from "./queue-store.js";
import type {
  QueueRuntimeCockpitSnapshot,
  QueueRuntimeState,
  QrtInput,
} from "./types.js";

export interface QueueRuntimeOptions {
  configuration?: Partial<QueueRuntimeConfiguration>;
  dependencies?: QueueRuntimeDependencies;
}

/**
 * Authoritative Q10-04 Queue Runtime — enterprise queue management layer.
 *
 * QRT creates queues, accepts/prioritizes/schedules/dispatches jobs with deterministic
 * ordering. It integrates with Shared Runtime Core, Pillow Orchestration Runtime, Mission
 * Runtime, Worker Registry, ERR, Audit, and Recovery — without executing business logic
 * or bypassing governance.
 */
export class QueueRuntime {
  private initializedAt: string | null = null;
  private readonly controller: QueueRuntimeController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: QueueRuntimeOptions = {},
  ) {
    const manager = new QueueRuntimeManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new QueueRuntimeController(
      manager,
      buildQueueRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      QUEUE_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Queue Runtime")) {
      throw new Error(`${QUEUE_RUNTIME_SYSTEM_PATH} missing — Q10-04 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: QueueRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): QueueRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Queue Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-QRT-001",
      missionId: "Q10-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 85 : engineRecord ? 60 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalQueues: engineRecord?.totalQueues ?? 0,
        totalJobs: engineRecord?.totalJobs ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise queue management layer only: does not replace worker/mission logic, execute business-specific work, fabricate queue state, bypass governance, or implement Q10-05+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createQueue(input: QrtInput = {}) {
    return this.controller.createQueue(input);
  }

  enqueue(input: QrtInput = {}) {
    return this.controller.enqueue(input);
  }

  prioritize(input: QrtInput = {}) {
    return this.controller.prioritize(input);
  }

  pauseQueue(input: QrtInput = {}) {
    return this.controller.pauseQueue(input);
  }

  resumeQueue(input: QrtInput = {}) {
    return this.controller.resumeQueue(input);
  }

  cancelJob(input: QrtInput = {}) {
    return this.controller.cancelJob(input);
  }

  dispatchReady(input: QrtInput = {}) {
    return this.controller.dispatchReady(input);
  }

  retryFailed(input: QrtInput = {}) {
    return this.controller.retryFailed(input);
  }

  moveToDeadLetter(input: QrtInput = {}) {
    return this.controller.moveToDeadLetter(input);
  }

  metrics(input: QrtInput = {}) {
    return this.controller.metrics(input);
  }

  produceReport(input: QrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: QrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: QrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: QrtInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  completeJob(input: QrtInput = {}) {
    return this.controller.completeJob(input);
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getHistory() {
    return this.controller.getHistory();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ1005ConsumableContract() {
    return this.controller.getQ1005ConsumableContract();
  }

  getCockpitSnapshot(): QueueRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createQueueRuntime(
  bootstrap: EmpireBootstrapContext,
  options: QueueRuntimeOptions = {},
) {
  return new QueueRuntime(bootstrap, options);
}

export function resetQueueRuntimeForTesting() {
  resetQrtLogsForTesting();
  resetQrtSequenceForTesting();
}
