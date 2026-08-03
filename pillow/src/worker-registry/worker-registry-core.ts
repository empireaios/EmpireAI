import type { WorkerRegistryConfiguration } from "./configuration.js";
import { RegistryBuilder } from "./registry-builder.js";
import { RegistryStore } from "./registry-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  RegistryValidator,
  WorkerRegistryMetadataGenerator,
} from "./registry-validator.js";
import { appendWrgLog } from "./wrg-logging.js";
import {
  WORKER_REGISTRY_ID,
  WRG_CAPABILITIES,
  WRG_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  RegistryDecision,
  WorkerRecord,
  WorkerRegistryCatalog,
  WorkerRegistryEngineRecord,
  WorkerRegistryInput,
  WorkerRegistryRunReport,
} from "./types.js";

export class WorkerRegistryCore {
  private engineRecord: WorkerRegistryEngineRecord | null = null;
  private seeded = false;
  private catalog: WorkerRegistryCatalog | null = null;
  private readonly store = new RegistryStore();
  private readonly builder = new RegistryBuilder();
  private readonly validator = new RegistryValidator();
  private readonly metadata = new WorkerRegistryMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerRegistryConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedWorkers);
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
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

  getLatestWorkerId() {
    return this.store.getLatestWorkerId();
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkerRegistryConfiguration,
  ): WorkerRegistryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWrgLog({
      event: "connect",
      details: "Worker Registry connected; register-and-discover mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      {
        validationReportId: `wrg-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Registry is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WRG_METADATA_VERSION,
      },
      started,
    );
  }

  registerWorker(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    if (!config.registrationRulesEnabled) {
      return this.disabled("register_worker", config, "Registration rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_worker", input, config, started);
    }
    if (!config.enabled) {
      return this.disabled("register_worker", config, "Worker Registry is disabled");
    }
    const requestedId = input.workerId?.trim();
    if (requestedId && this.store.getWorker(requestedId)) {
      const validation = this.validator.finalize(
        "fail",
        [`Worker ID already registered: ${requestedId}`],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "register_worker",
        this.getCatalog(),
        this.store.listWorkers(),
        [],
        "invalid",
        ["unique_worker_id"],
        validation,
        started,
      );
    }
    const worker = this.builder.buildWorker(input, config, this.store.existingIds());
    this.store.registerWorker(worker);
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
    const evaluation = this.builder.evaluate(input, config, this.store.listWorkers(), worker);
    const validation = this.validator.validateWorkers(
      [worker],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.registryDecision,
    );
    appendWrgLog({
      event: "register_worker",
      details: `id=${worker.workerId} role=${worker.role} department=${worker.department}`,
    });
    this.metadata.generate(this.store.workerCount());
    return this.report(
      "register_worker",
      this.getCatalog(),
      this.store.listWorkers(),
      [worker],
      evaluation.registryDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  getWorker(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    if (!config.queryRulesEnabled) {
      return this.disabled("get_worker", config, "Query rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("get_worker", input, config, started);
    }
    const workerId = input.workerId?.trim() || "";
    const worker = workerId ? this.store.getWorker(workerId) : null;
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
    const matched = worker ? [worker] : [];
    const validation = this.validator.validateWorkers(
      matched.length ? matched : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!worker && input.validated !== false) {
      validation.errors.push(`Worker not found: ${workerId || "(missing id)"}`);
      validation.decision = "fail";
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWrgLog({
      event: "get_worker",
      details: `id=${workerId} found=${!!worker}`,
    });
    return this.report(
      "get_worker",
      this.getCatalog(),
      this.store.listWorkers(),
      matched,
      worker ? "valid" : "invalid",
      worker ? [] : ["unique_worker_id"],
      validation,
      started,
    );
  }

  queryByDepartment(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    if (!config.queryRulesEnabled) {
      return this.disabled("query_by_department", config, "Query rules are disabled");
    }
    return this.query("query_by_department", input, config, (i) =>
      this.store.queryByDepartment(i.department?.trim() || ""),
    );
  }

  queryByRole(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    if (!config.queryRulesEnabled) {
      return this.disabled("query_by_role", config, "Query rules are disabled");
    }
    return this.query("query_by_role", input, config, (i) =>
      this.store.queryByRole(i.role?.trim() || ""),
    );
  }

  queryByFactory(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    if (!config.queryRulesEnabled) {
      return this.disabled("query_by_factory", config, "Query rules are disabled");
    }
    return this.query("query_by_factory", input, config, (i) =>
      this.store.queryByFactory(i.factory?.trim() || ""),
    );
  }

  validateReportingLine(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    if (!config.reportingRulesEnabled) {
      return this.disabled(
        "validate_reporting_line",
        config,
        "Reporting rules are disabled",
      );
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_reporting_line", input, config, started);
    }
    const worker =
      this.store.getWorker(input.workerId?.trim() || "") ?? this.store.listWorkers()[0] ?? null;
    return this.runEvaluate("validate_reporting_line", input, config, started, worker);
  }

  updateStatus(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    if (!config.statusRulesEnabled) {
      return this.disabled("update_status", config, "Status rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("update_status", input, config, started);
    }
    const workerId = input.workerId?.trim() || "";
    const status = input.operationalStatus?.toString().trim() || "active";
    if (status && !config.workerStates.includes(status)) {
      const validation = this.validator.finalize(
        "fail",
        [`Unsupported operational status: ${status}`],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "update_status",
        this.getCatalog(),
        this.store.listWorkers(),
        [],
        "invalid",
        [],
        validation,
        started,
      );
    }
    const updated = this.store.updateStatus(workerId, status, input.changeSummary ?? undefined);
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
    const matched = updated ? [updated] : [];
    const validation = this.validator.validateWorkers(
      matched.length ? matched : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!updated) {
      validation.errors.push(`Worker not found: ${workerId}`);
      validation.decision = "fail";
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWrgLog({
      event: "update_status",
      details: `id=${workerId} status=${status}`,
    });
    return this.report(
      "update_status",
      this.getCatalog(),
      this.store.listWorkers(),
      matched,
      updated ? "valid" : "invalid",
      [],
      validation,
      started,
    );
  }

  produceRegistry(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_registry", input, config, started);
    }
    return this.runEvaluate("produce_registry", input, config, started);
  }

  list(config: WorkerRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
    const workers = this.store.listWorkers();
    const validation = this.validator.validateWorkers(workers, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      workers,
      workers,
      "valid",
      [],
      validation,
      started,
    );
  }

  validate(input: WorkerRegistryInput, config: WorkerRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
    const workers = this.store.listWorkers();
    const validation = this.validator.validateWorkers(
      workers.length ? workers : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      this.getCatalog(),
      workers,
      workers,
      validation.decision === "fail" ? "invalid" : "valid",
      [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Registry is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWrgLog({
      event: "diagnostics",
      details: `workers=${this.store.workerCount()} departments=${this.store.departmentCount()} factories=${this.store.factoryCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listWorkers(),
      this.store.listWorkers(),
      null,
      [],
      validation,
      started,
    );
  }

  private query(
    action: WorkerRegistryRunReport["action"],
    input: WorkerRegistryInput,
    config: WorkerRegistryConfiguration,
    matcher: (input: WorkerRegistryInput) => WorkerRecord[],
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const matched = matcher(input);
    this.catalog = this.builder.buildCatalog(config, this.store.listWorkers());
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listWorkers(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWrgLog({
      event: action,
      details: `matched=${matched.length}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      this.store.listWorkers(),
      matched,
      "valid",
      [],
      validation,
      started,
    );
  }

  private runEvaluate(
    action: WorkerRegistryRunReport["action"],
    input: WorkerRegistryInput,
    config: WorkerRegistryConfiguration,
    started: number,
    target?: WorkerRecord | null,
  ): WorkerRegistryRunReport {
    if (!config.enabled) {
      return this.disabled(action, config, "Worker Registry is disabled");
    }
    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listWorkers(),
      target,
    );
    this.catalog = evaluation.catalog;
    const matched = target ? [target] : this.store.listWorkers();
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listWorkers(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.registryDecision,
    );
    appendWrgLog({
      event: action,
      details: `decision=${evaluation.registryDecision} reporting=${evaluation.reportingValidated}`,
    });
    this.metadata.generate(this.store.workerCount());
    return this.report(
      action,
      this.getCatalog(),
      this.store.listWorkers(),
      matched,
      evaluation.registryDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: WorkerRegistryRunReport["action"],
    input: WorkerRegistryInput,
    config: WorkerRegistryConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateWorkers(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), this.store.listWorkers(), [], null, [], validation, started);
  }

  private disabled(
    action: WorkerRegistryRunReport["action"],
    config: WorkerRegistryConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), this.store.listWorkers(), [], null, [], validation, started);
  }

  private hasBoundary(input: WorkerRegistryInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkforceCapabilityRegistry === true ||
      input.replaceOrganizationCharter === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerRegistryConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastRegistryDecision: RegistryDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wrg-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_REGISTRY_ID,
      engineVersion: "PILLOW-WRG-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WRG_CAPABILITIES],
      registryVersion: config.registryVersion,
      totalWorkers: this.store.workerCount(),
      departmentCount: this.store.departmentCount(),
      factoryCount: this.store.factoryCount(),
      lastRegistryDecision,
      metadataVersion: WRG_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerRegistryRunReport["action"],
    catalog: WorkerRegistryCatalog | null,
    workers: WorkerRecord[],
    matchedWorkers: WorkerRecord[],
    registryDecision: RegistryDecision | string | null,
    rulesFailed: string[],
    validation: WorkerRegistryRunReport["validation"],
    started: number,
  ): WorkerRegistryRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      registryRunReportId: `wrg-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      workers,
      matchedWorkers,
      registryDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WRG_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: WorkerRegistryCatalog): WorkerRegistryCatalog {
  return {
    ...catalog,
    workers: catalog.workers.map((w) => ({
      ...w,
      reportingLine: [...w.reportingLine],
      skillProfile: [...w.skillProfile],
      approvedTools: [...w.approvedTools],
      versionHistory: w.versionHistory.map((v) => ({ ...v })),
    })),
  };
}
