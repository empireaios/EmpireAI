import type { WorkerRecoverySystemConfiguration } from "./configuration.js";
import { WorkerRecoverySystemCore } from "./worker-recovery-system-core.js";
import type {
  EngineStatus,
  WorkerRecoveryInput,
  WorkerRecoveryRunReport,
} from "./types.js";

export class WorkerRecoverySystemController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerRecoveryRunReport | null = null;

  constructor(
    private readonly manager: WorkerRecoverySystemCore,
    private readonly config: WorkerRecoverySystemConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      recoveryStrategies: [...this.config.recoveryStrategies],
      failureTypes: [...this.config.failureTypes],
      recoveryRules: [...this.config.recoveryRules],
      seedWorkers: this.config.seedWorkers.map((w) => ({
        ...w,
        duplicateExecutionPrevented: true as const,
        neverExecuteWorkerBusinessLogic: true as const,
      })),
      seedRecords: this.config.seedRecords.map((r) => ({
        ...r,
        supportingEvidence: [...r.supportingEvidence],
        optionsConsidered: r.optionsConsidered.map((o) => ({ ...o })),
        executionStatePreserved: true as const,
        neverExecuteWorkerBusinessLogic: true as const,
        neverReplaceWorkerMonitoring: true as const,
        neverReplaceWorkforceOrchestrator: true as const,
        neverOverridePillow: true as const,
        neverOverrideGrandKing: true as const,
        respectAuthorityMatrix: true as const,
        respectWorkerLifecycle: true as const,
        respectMissionCoordinationEngine: true as const,
        preserveMissionIntegrity: true as const,
        preserveAuditHistory: true as const,
        preserveExecutionHistory: true as const,
        preventDuplicateExecution: true as const,
        structuralSignalOnly: true as const,
        maskSensitiveValues: true as const,
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  registerWorker(input: WorkerRecoveryInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  detectFailure(input: WorkerRecoveryInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectFailure(input, this.config));
  }

  detectStalled(input: WorkerRecoveryInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectStalled(input, this.config));
  }

  detectHung(input: WorkerRecoveryInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectHung(input, this.config));
  }

  analyseOptions(input: WorkerRecoveryInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.analyseOptions(input, this.config));
  }

  recover(input: WorkerRecoveryInput = {}) {
    this.status = "recovering";
    return this.finish(this.manager.recover(input, this.config));
  }

  restart(input: WorkerRecoveryInput = {}) {
    this.status = "recovering";
    return this.finish(this.manager.restart(input, this.config));
  }

  resume(input: WorkerRecoveryInput = {}) {
    this.status = "recovering";
    return this.finish(this.manager.resume(input, this.config));
  }

  reassign(input: WorkerRecoveryInput = {}) {
    this.status = "recovering";
    return this.finish(this.manager.reassign(input, this.config));
  }

  rollback(input: WorkerRecoveryInput = {}) {
    this.status = "recovering";
    return this.finish(this.manager.rollback(input, this.config));
  }

  preserveState(input: WorkerRecoveryInput = {}) {
    this.status = "recovering";
    return this.finish(this.manager.preserveState(input, this.config));
  }

  escalate(input: WorkerRecoveryInput = {}) {
    this.status = "escalating";
    return this.finish(this.manager.escalate(input, this.config));
  }

  produce(input: WorkerRecoveryInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerRecoveryInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerRecoveryRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
