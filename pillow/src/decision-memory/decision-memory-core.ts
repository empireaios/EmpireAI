import type { DecisionMemoryConfiguration } from "./configuration.js";
import { appendDmemLog } from "./dmem-logging.js";
import { DecisionMemoryStore } from "./decision-memory-store.js";
import {
  DecisionMemoryValidator,
  DecisionMetadataGenerator,
  HealthMonitor,
  RecoveryManager,
} from "./decision-memory-validator.js";
import {
  DECISION_MEMORY_ID,
  DMEM_CAPABILITIES,
  DMEM_METADATA_VERSION,
} from "./paths.js";
import type {
  DecisionMemoryEngineRecord,
  DecisionMemoryInput,
  DecisionMemoryRunReport,
  DecisionRecord,
  OperationalState,
} from "./types.js";

export class DecisionMemoryCore {
  private engineRecord: DecisionMemoryEngineRecord | null = null;
  private seeded = false;
  private readonly store = new DecisionMemoryStore();
  private readonly validator = new DecisionMemoryValidator();
  private readonly metadata = new DecisionMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: DecisionMemoryConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedDecisions);
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
    return this.store.list();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: DecisionMemoryConfiguration,
  ): DecisionMemoryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendDmemLog({ event: "connect", details: "Decision Memory connected; store-only mode" });
    return this.report("connect", [], [], {
      validationReportId: `dmem-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Decision Memory is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: DMEM_METADATA_VERSION,
    }, started);
  }

  record(input: DecisionMemoryInput, config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    appendDmemLog({
      event: "record_decision",
      details: `objectiveLength=${normalized.executiveObjective?.length ?? 0}; businessId=${normalized.businessId ?? "n/a"}`,
    });

    const decision = this.validator.decide(normalized, true);
    if (decision === "fail" || !config.enabled || !config.recordingRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, normalized, started, true);
      return this.report("record", [], [], validation, started);
    }

    const status = decision === "partial" ? "partial" : "passed";
    const record = this.store.record(normalized, status);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords([record], normalized, started, true);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.metadata.generate(this.store.count(), record.confidenceScore);
    appendDmemLog({
      event: "produce_decision_record",
      details: `decisionId=${record.decisionId}; confidence=${record.confidenceScore}; decisionsMade=false`,
    });
    return this.report("record", [record], [], validation, started);
  }

  retrieve(input: DecisionMemoryInput, config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    if (!config.lookupRulesEnabled || !config.enabled) {
      const validation = this.validator.validateRecords(null, normalized, started);
      return this.report("retrieve", [], [], validation, started);
    }
    const record = normalized.decisionId ? this.store.get(normalized.decisionId) : null;
    const validation = this.validator.validateRecords(
      record ? [record] : null,
      normalized,
      started,
    );
    return this.report("retrieve", record ? [record] : [], [], validation, started);
  }

  search(input: DecisionMemoryInput, config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    const decision = this.validator.decide(normalized);
    if (decision === "fail" || !config.enabled || !config.lookupRulesEnabled) {
      const validation = this.validator.validateRecords(null, normalized, started);
      return this.report("search", [], [], validation, started);
    }
    const records = this.store.search(normalized);
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      normalized,
      started,
    );
    appendDmemLog({
      event: "search_decisions",
      details: `dimension=${normalized.dimension ?? "general"}; results=${records.length}`,
    });
    return this.report("search", records, [], validation, started);
  }

  compare(input: DecisionMemoryInput, config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    const decision = this.validator.decide(normalized);
    if (decision === "fail" || !config.enabled || !config.lookupRulesEnabled) {
      const validation = this.validator.validateRecords(null, normalized, started);
      return this.report("compare", [], [], validation, started);
    }
    const ids = normalized.compareDecisionIds?.filter(Boolean) ?? [];
    const compared = this.store.compare(ids);
    const validation = this.validator.validateRecords(
      compared.records.length ? compared.records : null,
      normalized,
      started,
    );
    return this.report("compare", compared.records, compared.comparisons, validation, started);
  }

  updateOutcome(input: DecisionMemoryInput, config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    const decision = this.validator.decide(normalized);
    if (decision === "fail" || !config.enabled || !normalized.decisionId || !normalized.finalOutcome) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, normalized, started);
      return this.report("update_outcome", [], [], validation, started);
    }
    const updated = this.store.updateOutcome(
      normalized.decisionId,
      normalized.finalOutcome,
      decision === "partial" ? "partial" : "passed",
    );
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(updated ? [updated] : null, normalized, started);
    return this.report("update_outcome", updated ? [updated] : [], [], validation, started);
  }

  list(config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const records = this.store.list();
    return this.report("list", records, [], {
      validationReportId: `dmem-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Decision Memory is disabled"],
      warnings: records.length === 0 ? ["No decision records stored yet"] : [],
      durationMs: Date.now() - started,
      metadataVersion: DMEM_METADATA_VERSION,
    }, started);
  }

  validate(input: DecisionMemoryInput, config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(
      this.store.list().length ? this.store.list() : null,
      normalize(input),
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report("validate", this.store.list().slice(-5), [], validation, started);
  }

  diagnostics(config: DecisionMemoryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const records = this.store.list();
    const validation = records.length
      ? this.validator.validateRecords(records, { validated: true }, started)
      : {
          validationReportId: `dmem-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Decision Memory is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: DMEM_METADATA_VERSION,
        };
    appendDmemLog({
      event: "health_information",
      details: `decisionRecords=${records.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", records.slice(-20), [], validation, started);
  }

  private ensureRecord(state: OperationalState, config: DecisionMemoryConfiguration) {
    const latest = this.getLatestRecord();
    const mapped =
      latest?.validationStatus === "passed"
        ? "passed"
        : latest?.validationStatus === "partial"
          ? "partial"
          : latest?.validationStatus === "failed"
            ? "failed"
            : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `dmem-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DECISION_MEMORY_ID,
      engineVersion: "PILLOW-DMEM-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...DMEM_CAPABILITIES],
      totalDecisionRecords: this.store.count(),
      lastConfidenceScore: latest?.confidenceScore ?? null,
      metadataVersion: DMEM_METADATA_VERSION,
    };
  }

  private report(
    action: DecisionMemoryRunReport["action"],
    records: DecisionRecord[],
    comparisons: DecisionMemoryRunReport["comparisons"],
    validation: DecisionMemoryRunReport["validation"],
    started: number,
  ): DecisionMemoryRunReport {
    return {
      decisionRunReportId: `dmem-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => ({
        ...r,
        alternativeOptions: r.alternativeOptions.map((o) => ({ ...o })),
        supportingEvidence: [...r.supportingEvidence],
        assumptions: [...r.assumptions],
        relatedWorkers: [...r.relatedWorkers],
        riskAssessment: { ...r.riskAssessment, factors: [...r.riskAssessment.factors] },
      })),
      comparisons: comparisons.map((c) => ({
        ...c,
        sharedAssumptions: [...c.sharedAssumptions],
        differingOptions: [...c.differingOptions],
      })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: DMEM_METADATA_VERSION,
    };
  }
}

function normalize(input: DecisionMemoryInput): DecisionMemoryInput {
  return { ...input, validated: input.validated !== false };
}
