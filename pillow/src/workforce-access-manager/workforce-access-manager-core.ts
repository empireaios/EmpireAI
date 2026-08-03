import type { WorkforceAccessManagerConfiguration } from "./configuration.js";
import { appendWamLog } from "./wam-logging.js";
import { AccessDirectory } from "./access-directory.js";
import { AccessController } from "./access-controller.js";
import {
  AccessMetadataGenerator,
  AccessValidator,
  HealthMonitor,
  RecoveryManager,
} from "./access-validator.js";
import {
  WAM_CAPABILITIES,
  WAM_METADATA_VERSION,
  WORKFORCE_ACCESS_MANAGER_ID,
} from "./paths.js";
import type {
  AccessRecord,
  ExecutiveAction,
  OperationalState,
  WorkforceAccessManagerEngineRecord,
  WorkforceAccessManagerInput,
  WorkforceAccessManagerRunReport,
} from "./types.js";

export class WorkforceAccessManagerCore {
  private engineRecord: WorkforceAccessManagerEngineRecord | null = null;
  private records: AccessRecord[] = [];
  private seeded = false;
  private readonly directory = new AccessDirectory();
  private readonly controller = new AccessController(this.directory);
  private readonly validator = new AccessValidator();
  private readonly metadata = new AccessMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkforceAccessManagerConfiguration) {
    if (this.seeded) return;
    this.directory.seed(config.workerDirectory);
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

  getRecords() {
    return this.records.map((r) => this.clone(r));
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  getWorkers() {
    return this.directory.list();
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkforceAccessManagerConfiguration,
  ): WorkforceAccessManagerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWamLog({ event: "connect", details: "Workforce Access Manager connected; access-only mode" });
    return this.report("connect", [], this.directory.list(), {
      validationReportId: `wam-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Workforce Access Manager is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: WAM_METADATA_VERSION,
    }, started);
  }

  locate(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("locate", { ...input, requestedAction: "locate" }, config);
  }

  invoke(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("invoke", { ...input, requestedAction: "invoke" }, config);
  }

  suspend(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("suspend", { ...input, requestedAction: "suspend" }, config);
  }

  resume(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("resume", { ...input, requestedAction: "resume" }, config);
  }

  pause(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("pause", { ...input, requestedAction: "pause" }, config);
  }

  continueAccess(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("continue", { ...input, requestedAction: "continue" }, config);
  }

  reassign(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("reassign", { ...input, requestedAction: "reassign" }, config);
  }

  inspect(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("inspect", { ...input, requestedAction: "inspect" }, config);
  }

  restart(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("restart", { ...input, requestedAction: "restart" }, config);
  }

  stop(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    return this.run("stop", { ...input, requestedAction: "stop" }, config);
  }

  listAccess(config: WorkforceAccessManagerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = {
      validationReportId: `wam-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? ("pass" as const) : ("fail" as const),
      errors: config.enabled ? [] : ["Workforce Access Manager is disabled"],
      warnings: this.records.length === 0 ? ["No access records stored yet"] : [],
      durationMs: Date.now() - started,
      metadataVersion: WAM_METADATA_VERSION,
    };
    return this.report("list_access", this.getRecords(), this.directory.list(), validation, started);
  }

  validateAccess(input: WorkforceAccessManagerInput, config: WorkforceAccessManagerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(
      this.records,
      input.executiveRequest
        ? input
        : {
            ...input,
            executiveRequest: this.records[this.records.length - 1]?.executiveRequest ?? "validate",
            validated: true,
            requestedAction: "inspect",
          },
      config.supportedActions,
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report("validate_access", this.getRecords().slice(-5), this.directory.list(), validation, started);
  }

  diagnostics(config: WorkforceAccessManagerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.records.length
      ? this.validator.validateRecords(
          this.records,
          {
            executiveRequest: this.records[this.records.length - 1]!.executiveRequest,
            validated: true,
            requestedAction: "inspect",
          },
          config.supportedActions,
          started,
        )
      : {
          validationReportId: `wam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Workforce Access Manager is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: WAM_METADATA_VERSION,
        };
    appendWamLog({
      event: "health_information",
      details: `accessRecords=${this.records.length}; connected=${this.directory.connectedCount()}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", this.getRecords().slice(-20), this.directory.list(), validation, started);
  }

  private run(
    action: WorkforceAccessManagerRunReport["action"],
    input: WorkforceAccessManagerInput,
    config: WorkforceAccessManagerConfiguration,
  ): WorkforceAccessManagerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const requested = (input.requestedAction ?? action) as ExecutiveAction | string;
    appendWamLog({
      event: "executive_access_request",
      details: `action=${requested}; workerId=${input.workerId ?? "auto"}; requestLength=${input.executiveRequest?.length ?? 0}`,
    });

    const decision = this.validator.decide({ ...input, requestedAction: requested }, config.supportedActions);
    if (decision === "fail" || !config.enabled || !config.accessRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, { ...input, requestedAction: requested }, config.supportedActions, started);
      appendWamLog({ event: "validation_failure", details: `action=${requested}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], this.directory.list(), validation, started);
    }

    const status = decision === "partial" ? "partial" : "passed";
    const result = this.controller.execute(requested, { ...input, requestedAction: requested }, status);
    this.records.push(result.record);
    this.ensureRecord("active", config);

    const validation = this.validator.validateRecords([result.record], { ...input, requestedAction: requested }, config.supportedActions, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendWamLog({
      event: "produce_access_record",
      details: `accessId=${result.record.accessId}; action=${result.record.requestedAction}; status=${result.record.accessStatus}; workerLogicExecuted=false`,
    });
    this.metadata.generate(this.records.length, this.directory.connectedCount());
    return this.report(action, [result.record], result.workers, validation, started);
  }

  private ensureRecord(state: OperationalState, config: WorkforceAccessManagerConfiguration) {
    const latest = this.records[this.records.length - 1]?.validationStatus ?? "pending";
    const mapped =
      latest === "passed" ? "passed" : latest === "partial" ? "partial" : latest === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wam-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKFORCE_ACCESS_MANAGER_ID,
      engineVersion: "PILLOW-WAM-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...WAM_CAPABILITIES],
      totalAccessRecords: this.records.length,
      connectedWorkers: this.directory.connectedCount(),
      metadataVersion: WAM_METADATA_VERSION,
    };
  }

  private report(
    action: WorkforceAccessManagerRunReport["action"],
    records: AccessRecord[],
    workers: WorkforceAccessManagerRunReport["workers"],
    validation: WorkforceAccessManagerRunReport["validation"],
    started: number,
  ): WorkforceAccessManagerRunReport {
    return {
      accessRunReportId: `wam-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => this.clone(r)),
      workers: workers.map((w) => ({ ...w, capabilities: [...w.capabilities] })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WAM_METADATA_VERSION,
    };
  }

  private clone(record: AccessRecord): AccessRecord {
    return {
      ...record,
      capabilitiesInspected: [...record.capabilitiesInspected],
    };
  }
}
