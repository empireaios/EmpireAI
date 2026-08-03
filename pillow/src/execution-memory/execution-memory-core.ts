import type { ExecutionMemoryConfiguration } from "./configuration.js";
import { appendExmLog } from "./exm-logging.js";
import {
  ExecutionMemoryStore,
  ExecutionMemoryValidator,
  HealthMonitor,
  RecoveryManager,
} from "./execution-memory-store.js";
import {
  EXM_CAPABILITIES,
  EXM_METADATA_VERSION,
  EXECUTION_MEMORY_ID,
} from "./paths.js";
import type {
  ExecutionMemoryEngineRecord,
  ExecutionMemoryRecord,
  ExecutionMemoryRunReport,
  OperationalState,
  RetrieveMemoryInput,
  SearchMemoryInput,
  StoreMemoryInput,
  UpdateMemoryInput,
} from "./types.js";

export class ExecutionMemoryCore {
  private engineRecord: ExecutionMemoryEngineRecord | null = null;
  private readonly store = new ExecutionMemoryStore();
  private readonly validator = new ExecutionMemoryValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecords() {
    return this.store.list();
  }

  getRecord(memoryId: string) {
    return this.store.get(memoryId);
  }

  connect(_input: Record<string, unknown>, config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendExmLog({ event: "connect", details: "Execution Memory connected; store-only mode" });
    return this.report("connect", [], {
      validationReportId: `exm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Execution Memory is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: EXM_METADATA_VERSION,
    }, started);
  }

  storeRecord(input: StoreMemoryInput, config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendExmLog({ event: "store_record", details: `eventType=${input.eventType ?? ""}` });

    if (!config.enabled || !config.recordingRulesEnabled) {
      const validation = this.validator.validateRecords([], input, started);
      return this.report("store_record", [], {
        ...validation,
        decision: "fail",
        errors: [...validation.errors, "Recording disabled"],
      }, started);
    }

    const decision = this.validator.decide(input);
    if (decision === "fail" || !input.eventType) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], input, started);
      if (!input.eventType) validation.errors.push("eventType is required");
      validation.decision = "fail";
      appendExmLog({ event: "validation_failure", details: `store; errors=${validation.errors.join("|")}` });
      return this.report("store_record", [], validation, started);
    }

    if (this.store.count() >= config.maxRecords) {
      this.recovery.recordFailure();
      return this.report("store_record", [], {
        validationReportId: `exm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [`Memory capacity exceeded (${config.maxRecords})`],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EXM_METADATA_VERSION,
      }, started);
    }

    try {
      const status = decision === "partial" ? "partial" : "passed";
      const record = this.store.store(input, status);
      this.ensureRecord("active", config);
      const validation = this.validator.validateRecords([record], input, started);
      if (validation.decision === "fail") this.recovery.recordFailure();
      else this.recovery.reset();
      appendExmLog({
        event: "store_complete",
        details: `memoryId=${record.memoryId}; eventType=${record.eventType}; missionId=${record.missionId ?? "none"}`,
      });
      return this.report("store_record", [record], validation, started);
    } catch (error) {
      this.recovery.recordFailure();
      return this.report("store_record", [], {
        validationReportId: `exm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [error instanceof Error ? error.message : "Store failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EXM_METADATA_VERSION,
      }, started);
    }
  }

  retrieveRecord(input: RetrieveMemoryInput, config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const decision = this.validator.decide(input);
    if (decision === "fail" || !input.memoryId?.trim()) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], input, started);
      if (!input.memoryId?.trim()) validation.errors.push("memoryId is required");
      validation.decision = "fail";
      return this.report("retrieve_record", [], validation, started);
    }
    const record = this.store.get(input.memoryId);
    if (!record) {
      return this.report("retrieve_record", [], {
        validationReportId: `exm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [`Memory record not found: ${input.memoryId}`],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EXM_METADATA_VERSION,
      }, started);
    }
    const validation = this.validator.validateRecords([record], input, started);
    appendExmLog({ event: "retrieve_record", details: `memoryId=${record.memoryId}` });
    return this.report("retrieve_record", [record], validation, started);
  }

  searchRecords(input: SearchMemoryInput, config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const decision = this.validator.decide(input);
    if (decision === "fail") {
      this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], input, started);
      return this.report("search_records", [], validation, started);
    }
    const results = this.store.search(input);
    const validation = this.validator.validateRecords(results, input, started);
    appendExmLog({
      event: "search_records",
      details: `matches=${results.length}; missionId=${input.missionId ?? "*"}; businessId=${input.businessId ?? "*"}; eventType=${input.eventType ?? "*"}`,
    });
    return this.report("search_records", results, validation, started);
  }

  updateRecord(input: UpdateMemoryInput, config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendExmLog({ event: "update_record", details: `memoryId=${input.memoryId ?? ""}` });

    const decision = this.validator.decide(input);
    if (decision === "fail" || !input.memoryId?.trim()) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], input, started);
      if (!input.memoryId?.trim()) validation.errors.push("memoryId is required");
      validation.decision = "fail";
      return this.report("update_record", [], validation, started);
    }

    try {
      const status = decision === "partial" ? "partial" : "passed";
      const record = this.store.update(input, status);
      this.ensureRecord("active", config);
      const validation = this.validator.validateRecords([record], input, started);
      if (validation.decision === "fail") this.recovery.recordFailure();
      else this.recovery.reset();
      appendExmLog({ event: "update_complete", details: `memoryId=${record.memoryId}; version=${record.version}` });
      return this.report("update_record", [record], validation, started);
    } catch (error) {
      this.recovery.recordFailure();
      return this.report("update_record", [], {
        validationReportId: `exm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [error instanceof Error ? error.message : "Update failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EXM_METADATA_VERSION,
      }, started);
    }
  }

  listRecords(config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const results = this.store.list();
    const validation = this.validator.validateRecords(results, { validated: true }, started);
    appendExmLog({ event: "list_records", details: `total=${results.length}` });
    return this.report("list_records", results, validation, started);
  }

  validateRecords(config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const results = this.store.list();
    const validation = this.validator.validateRecords(results, { validated: true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendExmLog({ event: "validate_records", details: `decision=${validation.decision}; total=${results.length}` });
    return this.report("validate_records", results, validation, started);
  }

  diagnostics(config: ExecutionMemoryConfiguration): ExecutionMemoryRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const results = this.store.list();
    const validation = results.length
      ? this.validator.validateRecords(results, { validated: true }, started)
      : {
          validationReportId: `exm-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Execution Memory is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: EXM_METADATA_VERSION,
        };
    appendExmLog({
      event: "health_information",
      details: `records=${results.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", results, validation, started);
  }

  private ensureRecord(state: OperationalState, config: ExecutionMemoryConfiguration) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `exm-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTION_MEMORY_ID,
      engineVersion: "PILLOW-EXM-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status("pass", config.enabled),
      validationStatus: "passed",
      supportedCapabilities: [...EXM_CAPABILITIES],
      totalRecords: this.store.count(),
      metadataVersion: EXM_METADATA_VERSION,
    };
  }

  private report(
    action: ExecutionMemoryRunReport["action"],
    records: ExecutionMemoryRecord[],
    validation: ExecutionMemoryRunReport["validation"],
    started: number,
  ): ExecutionMemoryRunReport {
    return {
      memoryRunReportId: `exm-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => ({ ...r })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EXM_METADATA_VERSION,
    };
  }
}
