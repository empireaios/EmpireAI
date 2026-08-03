import type { WorkerMonitoringConfiguration } from "./configuration.js";
import { MonitoringBuilder } from "./monitoring-builder.js";
import { MonitoringStore } from "./monitoring-store.js";
import {
  HealthMonitor,
  MonitoringValidator,
  RecoveryManager,
  WorkerMonitoringMetadataGenerator,
} from "./monitoring-validator.js";
import { appendWmoLog } from "./wmo-logging.js";
import {
  MONITORING_EVENTS,
  WMO_CAPABILITIES,
  WMO_METADATA_VERSION,
  WORKER_MONITORING_ID,
} from "./paths.js";
import type {
  MonitoredWorker,
  MonitoringAlert,
  MonitoringDecision,
  MonitoringRecord,
  OperationalState,
  WorkerMonitoringCatalog,
  WorkerMonitoringEngineRecord,
  WorkerMonitoringInput,
  WorkerMonitoringRunReport,
} from "./types.js";

export class WorkerMonitoringCore {
  private engineRecord: WorkerMonitoringEngineRecord | null = null;
  private seeded = false;
  private catalog: WorkerMonitoringCatalog | null = null;
  private readonly store = new MonitoringStore();
  private readonly builder = new MonitoringBuilder();
  private readonly validator = new MonitoringValidator();
  private readonly metadata = new WorkerMonitoringMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerMonitoringConfiguration) {
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

  getAlerts() {
    return this.store.listAlerts();
  }

  getLatestMonitoringId() {
    return this.store.getLatestMonitoringId();
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkerMonitoringConfiguration,
  ): WorkerMonitoringRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWmoLog({
      event: "connect",
      details: "Worker Monitoring connected; observe-and-report mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      [],
      null,
      [],
      {
        validationReportId: `wmo-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Monitoring is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WMO_METADATA_VERSION,
      },
      started,
    );
  }

  registerWorker(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("register_worker", input, config, started);
    if (!input.workerId?.trim()) {
      return this.disabled("register_worker", config, "workerId is required to register");
    }
    const worker = this.builder.applyObservation(this.store.getWorker(input.workerId), {
      ...input,
      active: input.active ?? true,
      available: input.available ?? true,
    });
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
    appendWmoLog({
      event: "register_worker",
      details: `worker=${worker.workerId} department=${worker.department}`,
    });
    return this.report(
      "register_worker",
      this.getCatalog(),
      [worker],
      [],
      null,
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  observe(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.observationRulesEnabled) {
      return this.disabled(
        "observe",
        config,
        !config.enabled ? "Worker Monitoring is disabled" : "Observation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail("observe", input, config, started);
    const workerId = input.workerId?.trim();
    if (!workerId) {
      return this.disabled("observe", config, "workerId is required for observation");
    }
    const worker = this.builder.applyObservation(this.store.getWorker(workerId), input);
    this.store.upsertWorker(worker);
    const assessment = this.builder.assess(worker, config);
    const record = this.builder.buildRecord({ input, worker, assessment });
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
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      "valid",
    );
    appendWmoLog({
      event: "observe",
      details: `worker=${worker.workerId} health=${record.healthStatus} drift=${record.driftStatus}`,
    });
    this.metadata.generate(
      this.store.workerCount(),
      this.store.recordCount(),
      this.store.alertCount(),
    );
    return this.report(
      "observe",
      this.getCatalog(),
      [worker],
      [record],
      record,
      record.alerts,
      ["warning", "critical", "offline"].includes(String(record.healthStatus)) ? [record] : [],
      "valid",
      [],
      validation,
      started,
    );
  }

  scanActive(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
    return this.scan("scan_active", input, config, (workers) =>
      workers.filter((w) => w.active),
    );
  }

  detectAnomalies(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
    return this.scan("detect_anomalies", input, config, (workers) => workers);
  }

  generateAlerts(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
    if (!config.alertRulesEnabled) {
      return this.disabled("generate_alerts", config, "Alert rules are disabled");
    }
    return this.scan("generate_alerts", input, config, (workers) => workers);
  }

  recordEvent(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("record_event", input, config, started);
    const event = input.event?.trim();
    if (!event || !(MONITORING_EVENTS as readonly string[]).includes(event)) {
      return this.disabled(
        "record_event",
        config,
        `Unsupported or missing monitoring event: ${event ?? "null"}`,
      );
    }
    const workerId = input.workerId?.trim();
    if (!workerId) {
      return this.disabled("record_event", config, "workerId is required for event recording");
    }
    let worker = this.store.getWorker(workerId);
    if (!worker) {
      worker = this.builder.applyObservation(null, input);
      this.store.upsertWorker(worker);
    }
    const patched = this.builder.applyObservation(worker, {
      ...input,
      active:
        event === "worker_offline" || event === "worker_suspended"
          ? false
          : event === "worker_started"
            ? true
            : input.active ?? worker.active,
      available: event === "worker_offline" ? false : input.available ?? worker.available,
      progress: event === "worker_completed" ? 1 : input.progress ?? worker.progress,
      errorCount:
        event === "worker_failed"
          ? Math.max(worker.errorCount + 1, 1)
          : input.errorCount ?? worker.errorCount,
      currentWorkload:
        event === "worker_overloaded"
          ? Math.max(worker.currentWorkload, config.overloadWorkloadThreshold)
          : input.currentWorkload ?? worker.currentWorkload,
      performanceScore:
        event === "performance_degraded"
          ? Math.min(worker.performanceScore, config.performanceDegradeThreshold - 0.01)
          : input.performanceScore ?? worker.performanceScore,
      lastHeartbeatAt:
        event === "worker_stalled" || event === "worker_offline"
          ? new Date(Date.now() - config.offlineHeartbeatMs - 1000).toISOString()
          : input.lastHeartbeatAt ?? new Date().toISOString(),
      executionTimeMs:
        event === "worker_stalled"
          ? Math.max(
              worker.executionTimeMs,
              Math.floor(worker.expectedExecutionTimeMs * config.driftRatioThreshold),
            )
          : input.executionTimeMs ?? worker.executionTimeMs,
    });
    this.store.upsertWorker(patched);
    const assessment = this.builder.assess(patched, config);
    if (!assessment.events.includes(event as never)) {
      assessment.events.push(event as never);
    }
    const record = this.builder.buildRecord({ input, worker: patched, assessment });
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
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWmoLog({
      event: "record_event",
      details: `worker=${patched.workerId} event=${event}`,
    });
    return this.report(
      "record_event",
      this.getCatalog(),
      [patched],
      [record],
      record,
      record.alerts,
      [],
      "valid",
      [],
      validation,
      started,
    );
  }

  produce(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
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
    appendWmoLog({
      event: "produce",
      details: `workers=${this.store.workerCount()} records=${this.store.recordCount()}`,
    });
    this.metadata.generate(
      this.store.workerCount(),
      this.store.recordCount(),
      this.store.alertCount(),
    );
    return this.report(
      "produce",
      this.getCatalog(),
      this.store.listWorkers(),
      records,
      records[records.length - 1] ?? null,
      this.store.listAlerts(),
      records.filter((r) =>
        ["warning", "critical", "offline"].includes(String(r.healthStatus)),
      ),
      records.length ? "valid" : "partially_valid",
      [],
      validation,
      started,
    );
  }

  list(config: WorkerMonitoringConfiguration) {
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
      this.store.listAlerts(),
      [],
      "valid",
      [],
      validation,
      started,
    );
  }

  validate(input: WorkerMonitoringInput, config: WorkerMonitoringConfiguration) {
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
      this.store.listAlerts(),
      [],
      validation.decision === "fail" ? "invalid" : "valid",
      [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerMonitoringConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Monitoring is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWmoLog({
      event: "diagnostics",
      details: `workers=${this.store.workerCount()} records=${this.store.recordCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listWorkers(),
      this.store.listRecords(),
      null,
      this.store.listAlerts(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private scan(
    action: WorkerMonitoringRunReport["action"],
    input: WorkerMonitoringInput,
    config: WorkerMonitoringConfiguration,
    select: (workers: MonitoredWorker[]) => MonitoredWorker[],
  ): WorkerMonitoringRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.anomalyRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Worker Monitoring is disabled" : "Anomaly rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    if (input.workers?.length) {
      for (const worker of input.workers) this.store.upsertWorker(worker);
    }

    const targets = select(this.store.listWorkers());
    const scanned: MonitoringRecord[] = [];
    for (const worker of targets) {
      const assessment = this.builder.assess(worker, config);
      const record = this.builder.buildRecord({
        input: { ...input, workerId: worker.workerId },
        worker,
        assessment,
      });
      this.store.saveRecord(record);
      scanned.push(record);
    }

    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      scanned,
    );
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateRecords(
      scanned.length ? scanned : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.monitoringDecision,
    );
    appendWmoLog({
      event: action,
      details: `scanned=${scanned.length} anomalies=${evaluation.anomalies.length} alerts=${evaluation.alerts.length}`,
    });
    this.metadata.generate(
      this.store.workerCount(),
      this.store.recordCount(),
      this.store.alertCount(),
    );
    return this.report(
      action,
      this.getCatalog(),
      targets,
      scanned,
      scanned[scanned.length - 1] ?? null,
      evaluation.alerts,
      evaluation.anomalies,
      evaluation.monitoringDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: WorkerMonitoringRunReport["action"],
    input: WorkerMonitoringInput,
    config: WorkerMonitoringConfiguration,
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
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: WorkerMonitoringRunReport["action"],
    config: WorkerMonitoringConfiguration,
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
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: WorkerMonitoringInput) {
    return (
      input.executeWorkerTasks === true ||
      input.restartWorkersAutomatically === true ||
      input.replaceWorkforceCertificationMonitor === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerMonitoringConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastMonitoringDecision: MonitoringDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wmo-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_MONITORING_ID,
      engineVersion: "PILLOW-WMO-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WMO_CAPABILITIES],
      totalWorkers: this.store.workerCount(),
      totalRecords: this.store.recordCount(),
      totalAlerts: this.store.alertCount(),
      lastMonitoringDecision,
      metadataVersion: WMO_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerMonitoringRunReport["action"],
    catalog: WorkerMonitoringCatalog | null,
    workers: MonitoredWorker[],
    records: MonitoringRecord[],
    latestRecord: MonitoringRecord | null,
    alerts: MonitoringAlert[],
    anomalies: MonitoringRecord[],
    monitoringDecision: MonitoringDecision | string | null,
    rulesFailed: string[],
    validation: WorkerMonitoringRunReport["validation"],
    started: number,
  ): WorkerMonitoringRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      monitoringRunReportId: `wmo-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      workers,
      records,
      latestRecord,
      alerts,
      anomalies,
      monitoringDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WMO_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: WorkerMonitoringCatalog): WorkerMonitoringCatalog {
  return {
    ...catalog,
    healthStates: [...catalog.healthStates],
    monitoringEvents: [...catalog.monitoringEvents],
    workers: catalog.workers.map((w) => ({ ...w, neverExecuteWorkerTasks: true })),
    records: catalog.records.map((r) => ({
      ...r,
      alerts: r.alerts.map((a) => ({ ...a, reportedToPillow: true as const })),
      events: [...r.events],
    })),
  };
}
