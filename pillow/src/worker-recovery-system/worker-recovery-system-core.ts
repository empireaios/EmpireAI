import type { WorkerRecoverySystemConfiguration } from "./configuration.js";
import { RecoveryBuilder } from "./recovery-builder.js";
import { RecoveryStore } from "./recovery-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  RecoveryValidator,
  WorkerRecoveryMetadataGenerator,
} from "./recovery-validator.js";
import { appendWrsLog } from "./wrs-logging.js";
import {
  FAILURE_TYPES,
  WRS_CAPABILITIES,
  WRS_METADATA_VERSION,
  WORKER_RECOVERY_SYSTEM_ID,
} from "./paths.js";
import type {
  FailureType,
  OperationalState,
  RecoverableWorker,
  RecoveryDecision,
  RecoveryOption,
  RecoveryRecord,
  RecoveryStrategy,
  WorkerRecoveryCatalog,
  WorkerRecoveryEngineRecord,
  WorkerRecoveryInput,
  WorkerRecoveryRunReport,
} from "./types.js";

export class WorkerRecoverySystemCore {
  private engineRecord: WorkerRecoveryEngineRecord | null = null;
  private seeded = false;
  private catalog: WorkerRecoveryCatalog | null = null;
  private readonly store = new RecoveryStore();
  private readonly builder = new RecoveryBuilder();
  private readonly validator = new RecoveryValidator();
  private readonly metadata = new WorkerRecoveryMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerRecoverySystemConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      workers: config.seedWorkers,
      records: config.seedRecords,
    });
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getWorkers() {
    return this.store.listWorkers();
  }

  getRecords() {
    return this.store.listRecords();
  }

  getLatestRecoveryId() {
    return this.store.getLatestRecoveryId();
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkerRecoverySystemConfiguration,
  ): WorkerRecoveryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWrsLog({
      event: "connect",
      details: "Worker Recovery System connected; continuity-recovery mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      null,
      [],
      {
        validationReportId: `wrs-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Recovery System is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WRS_METADATA_VERSION,
      },
      started,
    );
  }

  registerWorker(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("register_worker", input, config, started);
    if (!input.workerId?.trim()) {
      return this.disabled("register_worker", config, "workerId is required to register");
    }
    const worker = this.builder.applyWorker(this.store.getWorker(input.workerId), input);
    this.store.upsertWorker(worker);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateCatalog(
      this.catalog,
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWrsLog({
      event: "register_worker",
      details: `worker=${worker.workerId} mission=${worker.missionId ?? "none"}`,
    });
    return this.report(
      "register_worker",
      this.getCatalog(),
      [worker],
      [],
      null,
      [],
      null,
      [],
      validation,
      started,
    );
  }

  detectFailure(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.detect("detect_failure", input, config, input.failureType || "runtime_failure");
  }

  detectStalled(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.detect("detect_stalled", input, config, "timeout");
  }

  detectHung(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.detect("detect_hung", input, config, "hang");
  }

  analyseOptions(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.detectionRulesEnabled) {
      return this.disabled(
        "analyse_options",
        config,
        !config.enabled
          ? "Worker Recovery System is disabled"
          : "Detection rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail("analyse_options", input, config, started);
    const worker = this.requireWorker(input, config);
    if (!worker) {
      return this.disabled("analyse_options", config, "workerId is required to analyse options");
    }
    const failureType = normalizeFailure(input.failureType || worker.lastFailureType || "unknown_failure");
    const options = this.builder.analyseOptions(worker, failureType, config, input);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateCatalog(
      this.catalog,
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWrsLog({
      event: "analyse_options",
      details: `worker=${worker.workerId} options=${options.map((o) => o.strategy).join("|")}`,
    });
    return this.report(
      "analyse_options",
      this.getCatalog(),
      [worker],
      [],
      null,
      options,
      "valid",
      [],
      validation,
      started,
    );
  }

  recover(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.applyRecovery("recover", input, config, input.recoveryStrategy ?? null);
  }

  restart(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.applyRecovery(
      "restart",
      { ...input, recoveryStrategy: "restart", failureType: input.failureType ?? "crash" },
      config,
      "restart",
    );
  }

  resume(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.applyRecovery(
      "resume",
      { ...input, recoveryStrategy: "resume", failureType: input.failureType ?? "timeout" },
      config,
      "resume",
    );
  }

  reassign(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.applyRecovery(
      "reassign",
      { ...input, recoveryStrategy: "reassign", failureType: input.failureType ?? "resource_exhaustion" },
      config,
      "reassign",
    );
  }

  rollback(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    return this.applyRecovery(
      "rollback",
      { ...input, recoveryStrategy: "rollback", failureType: input.failureType ?? "validation_failure" },
      config,
      "rollback",
    );
  }

  preserveState(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("preserve_state", input, config, started);
    const worker = this.requireWorker(input, config);
    if (!worker) {
      return this.disabled("preserve_state", config, "workerId is required to preserve state");
    }
    const preserved = this.builder.applyWorker(worker, {
      ...input,
      available: worker.available,
    });
    preserved.executionStatePreserved = true;
    this.store.upsertWorker(preserved);
    const failureType = normalizeFailure(input.failureType || worker.lastFailureType || "runtime_failure");
    const plan = this.builder.planRecovery(preserved, failureType, config, {
      ...input,
      recoveryStrategy: "resume",
    });
    plan.action = "execution_state_preserved";
    plan.recoveryStatus = "recovered";
    plan.missionContinued = true;
    const record = this.builder.buildRecord({
      input,
      worker: preserved,
      failureType,
      plan,
      durationMs: Date.now() - started,
    });
    this.store.saveRecord(record);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "valid");
    appendWrsLog({
      event: "preserve_state",
      details: `worker=${preserved.workerId} preserved=true`,
    });
    return this.report(
      "preserve_state",
      this.getCatalog(),
      [preserved],
      [record],
      record,
      plan.options,
      "valid",
      [],
      validation,
      started,
    );
  }

  escalate(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    if (!config.escalationRulesEnabled) {
      return this.disabled("escalate", config, "Escalation rules are disabled");
    }
    return this.applyRecovery(
      "escalate",
      {
        ...input,
        recoveryStrategy: "escalate_to_pillow",
        unsafeAutomaticRecovery: true,
        failureType: input.failureType ?? "unknown_failure",
      },
      config,
      "escalate_to_pillow",
    );
  }

  produce(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce", input, config, started);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      records.length ? "valid" : "partially_valid",
    );
    appendWrsLog({
      event: "produce",
      details: `workers=${this.store.workerCount()} records=${this.store.recordCount()}`,
    });
    this.metadata.generate(
      this.store.workerCount(),
      this.store.recordCount(),
      this.store.getEscalationCount(),
    );
    return this.report(
      "produce",
      this.getCatalog(),
      this.store.listWorkers(),
      records,
      records[records.length - 1] ?? null,
      [],
      records.length ? "valid" : "partially_valid",
      [],
      validation,
      started,
    );
  }

  list(config: WorkerRecoverySystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { validated: true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listWorkers(),
      records,
      records[records.length - 1] ?? null,
      [],
      "valid",
      [],
      validation,
      started,
    );
  }

  validate(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      this.getCatalog(),
      this.store.listWorkers(),
      records,
      records[records.length - 1] ?? null,
      [],
      validation.decision === "fail" ? "invalid" : "valid",
      [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerRecoverySystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Recovery System is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWrsLog({
      event: "diagnostics",
      details: `workers=${this.store.workerCount()} records=${this.store.recordCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listWorkers(),
      this.store.listRecords(),
      null,
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private detect(
    action: WorkerRecoveryRunReport["action"],
    input: WorkerRecoveryInput,
    config: WorkerRecoverySystemConfiguration,
    failureTypeRaw: string,
  ): WorkerRecoveryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.detectionRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Worker Recovery System is disabled"
          : "Detection rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const existing = this.requireWorker(input, config);
    if (!existing && !input.workerId?.trim()) {
      return this.disabled(action, config, "workerId is required for failure detection");
    }
    const failureType = normalizeFailure(failureTypeRaw);
    const worker = this.builder.applyWorker(existing, {
      ...input,
      failureType,
      failureCount: (existing?.failureCount ?? 0) + 1,
      available: failureType === "hang" || failureType === "crash" ? false : input.available,
      lifecycleStatus:
        failureType === "hang" || failureType === "crash"
          ? "recovering"
          : input.lifecycleStatus ?? existing?.lifecycleStatus,
    });
    this.store.upsertWorker(worker);
    const options = this.builder.analyseOptions(worker, failureType, config, input);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateCatalog(
      this.catalog,
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWrsLog({
      event: action,
      details: `worker=${worker.workerId} failure=${failureType} count=${worker.failureCount}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [worker],
      [],
      null,
      options,
      "valid",
      [],
      validation,
      started,
    );
  }

  private applyRecovery(
    action: WorkerRecoveryRunReport["action"],
    input: WorkerRecoveryInput,
    config: WorkerRecoverySystemConfiguration,
    forcedStrategy: RecoveryStrategy | string | null = null,
  ): WorkerRecoveryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.recoveryRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Worker Recovery System is disabled"
          : "Recovery rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const existing = this.requireWorker(input, config);
    if (!existing && !input.workerId?.trim()) {
      return this.disabled(action, config, "workerId is required for recovery");
    }

    const failureType = normalizeFailure(
      input.failureType || existing?.lastFailureType || "runtime_failure",
    );
    const worker = this.builder.applyWorker(existing, {
      ...input,
      failureType,
      failureCount: input.failureCount ?? existing?.failureCount ?? 1,
    });
    const plan = this.builder.planRecovery(worker, failureType, config, {
      ...input,
      recoveryStrategy: forcedStrategy ?? input.recoveryStrategy,
    });
    if (plan.errors.length) {
      const validation = this.validator.validateRecords(
        null,
        { ...input, validated: input.validated ?? true },
        started,
        plan.errors,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed", "invalid");
      return this.report(
        action,
        this.getCatalog(),
        [worker],
        [],
        null,
        plan.options,
        "invalid",
        plan.errors,
        validation,
        started,
      );
    }

    const recoveredWorker = this.builder.applyWorker(worker, {
      ...input,
      available: plan.strategy === "escalate_to_pillow" ? worker.available : true,
      lifecycleStatus:
        plan.strategy === "escalate_to_pillow"
          ? "recovering"
          : plan.strategy === "pause_mission"
            ? "suspended"
            : "active",
      failureCount:
        plan.recoveryStatus === "recovered"
          ? Math.max(0, worker.failureCount - 1)
          : worker.failureCount,
    });
    recoveredWorker.executionStatePreserved = true;
    this.store.upsertWorker(recoveredWorker);

    const record = this.builder.buildRecord({
      input,
      worker: recoveredWorker,
      failureType,
      plan,
      durationMs: Date.now() - started,
    });
    this.store.saveRecord(record);
    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      record,
    );
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.recoveryDecision,
    );
    appendWrsLog({
      event: action,
      details: `worker=${recoveredWorker.workerId} strategy=${record.recoveryStrategy} status=${record.recoveryStatus} continued=${record.missionContinued}`,
    });
    this.metadata.generate(
      this.store.workerCount(),
      this.store.recordCount(),
      this.store.getEscalationCount(),
    );
    return this.report(
      action,
      this.getCatalog(),
      [recoveredWorker],
      [record],
      record,
      plan.options,
      evaluation.recoveryDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private requireWorker(input: WorkerRecoveryInput, config: WorkerRecoverySystemConfiguration) {
    this.ensureSeeded(config);
    const workerId = input.workerId?.trim();
    if (!workerId) return null;
    return this.store.getWorker(workerId);
  }

  private boundaryFail(
    action: WorkerRecoveryRunReport["action"],
    input: WorkerRecoveryInput,
    config: WorkerRecoverySystemConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRecords(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: WorkerRecoveryRunReport["action"],
    config: WorkerRecoverySystemConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: WorkerRecoveryInput) {
    return (
      input.executeWorkerBusinessLogic === true ||
      input.replaceWorkerMonitoring === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerRecoverySystemConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastRecoveryDecision: RecoveryDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wrs-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_RECOVERY_SYSTEM_ID,
      engineVersion: "PILLOW-WRS-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WRS_CAPABILITIES],
      totalWorkers: this.store.workerCount(),
      totalRecords: this.store.recordCount(),
      totalEscalations: this.store.getEscalationCount(),
      lastRecoveryDecision,
      metadataVersion: WRS_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerRecoveryRunReport["action"],
    catalog: WorkerRecoveryCatalog | null,
    workers: RecoverableWorker[],
    records: RecoveryRecord[],
    latestRecord: RecoveryRecord | null,
    options: RecoveryOption[],
    recoveryDecision: RecoveryDecision | string | null,
    rulesFailed: string[],
    validation: WorkerRecoveryRunReport["validation"],
    started: number,
  ): WorkerRecoveryRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      recoveryRunReportId: `wrs-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      workers,
      records,
      latestRecord,
      options,
      recoveryDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WRS_METADATA_VERSION,
    };
  }
}

function normalizeFailure(value: string): FailureType | string {
  const normalized = value.trim();
  return (FAILURE_TYPES as readonly string[]).includes(normalized)
    ? normalized
    : "unknown_failure";
}

function cloneCatalog(catalog: WorkerRecoveryCatalog): WorkerRecoveryCatalog {
  return {
    ...catalog,
    strategies: [...catalog.strategies],
    failureTypes: [...catalog.failureTypes],
    workers: catalog.workers.map((w) => ({
      ...w,
      duplicateExecutionPrevented: true,
      neverExecuteWorkerBusinessLogic: true,
    })),
    records: catalog.records.map((r) => ({
      ...r,
      supportingEvidence: [...r.supportingEvidence],
      optionsConsidered: r.optionsConsidered.map((o) => ({ ...o })),
    })),
  };
}
