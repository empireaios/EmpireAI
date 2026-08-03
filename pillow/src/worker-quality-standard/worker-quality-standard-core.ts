import type { WorkerQualityStandardConfiguration } from "./configuration.js";
import { QualityEvaluator } from "./quality-evaluator.js";
import { QualityStore } from "./quality-store.js";
import {
  HealthMonitor,
  QualityValidator,
  RecoveryManager,
  WorkerQualityStandardMetadataGenerator,
} from "./quality-validator.js";
import { appendWqsLog } from "./wqs-logging.js";
import {
  WORKER_QUALITY_STANDARD_ID,
  WQS_CAPABILITIES,
  WQS_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  QualityDecision,
  QualityRecord,
  WorkerQualityStandardEngineRecord,
  WorkerQualityStandardInput,
  WorkerQualityStandardRunReport,
} from "./types.js";

export class WorkerQualityStandardCore {
  private engineRecord: WorkerQualityStandardEngineRecord | null = null;
  private seeded = false;
  private readonly store = new QualityStore();
  private readonly evaluator = new QualityEvaluator();
  private readonly validator = new QualityValidator();
  private readonly metadata = new WorkerQualityStandardMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerQualityStandardConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedQualityRecords);
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
    config: WorkerQualityStandardConfiguration,
  ): WorkerQualityStandardRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWqsLog({
      event: "connect",
      details: "Worker Quality Standard connected; validate-only mode",
    });
    return this.report(
      "connect",
      [],
      null,
      null,
      [],
      {
        validationReportId: `wqs-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Quality Standard is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WQS_METADATA_VERSION,
      },
      started,
    );
  }

  validateWorker(input: WorkerQualityStandardInput, config: WorkerQualityStandardConfiguration) {
    return this.evaluateAction("validate_worker", input, config, true);
  }

  scoreConfidence(input: WorkerQualityStandardInput, config: WorkerQualityStandardConfiguration) {
    if (!config.confidenceRulesEnabled) {
      const started = Date.now();
      return this.disabledReport(
        "score_confidence",
        config,
        started,
        "Confidence rules are disabled",
      );
    }
    return this.evaluateAction("score_confidence", input, config, true);
  }

  recordEvidence(input: WorkerQualityStandardInput, config: WorkerQualityStandardConfiguration) {
    if (!config.evidenceRulesEnabled) {
      const started = Date.now();
      return this.disabledReport(
        "record_evidence",
        config,
        started,
        "Evidence rules are disabled",
      );
    }
    return this.evaluateAction(
      "record_evidence",
      {
        ...input,
        evidence: input.evidence?.length ? input.evidence : ["evidence:recorded"],
      },
      config,
      true,
    );
  }

  recordAssumptions(input: WorkerQualityStandardInput, config: WorkerQualityStandardConfiguration) {
    if (!config.assumptionRulesEnabled) {
      const started = Date.now();
      return this.disabledReport(
        "record_assumptions",
        config,
        started,
        "Assumption rules are disabled",
      );
    }
    return this.evaluateAction(
      "record_assumptions",
      {
        ...input,
        assumptions: input.assumptions?.length
          ? input.assumptions
          : ["assumption:recorded"],
      },
      config,
      true,
    );
  }

  reportLimitations(input: WorkerQualityStandardInput, config: WorkerQualityStandardConfiguration) {
    if (!config.limitationRulesEnabled) {
      const started = Date.now();
      return this.disabledReport(
        "report_limitations",
        config,
        started,
        "Limitation rules are disabled",
      );
    }
    return this.evaluateAction(
      "report_limitations",
      {
        ...input,
        limitations: input.limitations?.length
          ? input.limitations
          : ["limitation:recorded"],
      },
      config,
      true,
    );
  }

  checkGovernance(input: WorkerQualityStandardInput, config: WorkerQualityStandardConfiguration) {
    if (!config.governanceRulesEnabled) {
      const started = Date.now();
      return this.disabledReport(
        "check_governance",
        config,
        started,
        "Governance rules are disabled",
      );
    }
    return this.evaluateAction(
      "check_governance",
      { ...input, governanceCompliant: input.governanceCompliant ?? true },
      config,
      true,
    );
  }

  list(config: WorkerQualityStandardConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Quality catalog is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.validationResult ?? null,
      latest?.confidenceScore ?? null,
      latest?.standardsFailed ?? [],
      validation,
      started,
    );
  }

  validate(input: WorkerQualityStandardInput, config: WorkerQualityStandardConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No quality records yet"], started)
        : this.validator.validateRecords(
            records.length ? records : null,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      records,
      latest?.validationResult ?? null,
      latest?.confidenceScore ?? null,
      latest?.standardsFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerQualityStandardConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Quality Standard is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWqsLog({
      event: "diagnostics",
      details: `records=${this.store.count()} compliant=${this.store.compliantCount()} avgConfidence=${this.store.averageConfidence()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.validationResult ?? null,
      latest?.confidenceScore ?? null,
      latest?.standardsFailed ?? [],
      validation,
      started,
    );
  }

  private evaluateAction(
    action: WorkerQualityStandardRunReport["action"],
    input: WorkerQualityStandardInput,
    config: WorkerQualityStandardConfiguration,
    requireWorker: boolean,
  ): WorkerQualityStandardRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.validationRulesEnabled) {
      return this.disabledReport(
        action,
        config,
        started,
        !config.enabled
          ? "Worker Quality Standard is disabled"
          : "Validation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireWorker);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, null, [], validation, started);
    }

    const evaluation = this.evaluator.evaluate(input, config);
    const record = this.store.buildRecord({
      input,
      workerId: evaluation.workerId,
      missionId: evaluation.missionId,
      reasoningSummary: evaluation.reasoningSummary,
      confidenceScore: evaluation.confidenceScore,
      evidence: evaluation.evidence,
      assumptions: evaluation.assumptions,
      limitations: evaluation.limitations,
      validationResult: evaluation.validationResult,
      governanceCompliance: evaluation.governanceCompliance,
      uncertaintyDetected: evaluation.uncertaintyDetected,
      standardsChecked: evaluation.standardsChecked,
      standardsSatisfied: evaluation.standardsSatisfied,
      standardsFailed: evaluation.standardsFailed,
      completionReport: evaluation.completionReport,
      validationStatus:
        evaluation.validationResult === "compliant"
          ? "passed"
          : evaluation.validationResult === "partially_compliant"
            ? "partial"
            : "failed",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireWorker,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.validationResult,
    );
    appendWqsLog({
      event: action,
      details: `id=${record.qualityRecordId} worker=${record.workerId} decision=${record.validationResult} confidence=${record.confidenceScore}`,
    });
    this.metadata.generate(this.store.count(), this.store.compliantCount());
    return this.report(
      action,
      [record],
      record.validationResult,
      record.confidenceScore,
      record.standardsFailed,
      validation,
      started,
    );
  }

  private disabledReport(
    action: WorkerQualityStandardRunReport["action"],
    config: WorkerQualityStandardConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, null, [], validation, started);
  }

  private hasBoundary(input: WorkerQualityStandardInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkerImplementations === true ||
      input.replacePeerReviewRuntime === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerQualityStandardConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastDecision: QualityDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wqs-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_QUALITY_STANDARD_ID,
      engineVersion: "PILLOW-WQS-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WQS_CAPABILITIES],
      totalQualityRecords: this.store.count(),
      compliantCount: this.store.compliantCount(),
      nonCompliantCount: this.store.nonCompliantCount(),
      averageConfidence: this.store.averageConfidence(),
      lastDecision: lastDecision ?? this.getLatestRecord()?.validationResult ?? null,
      metadataVersion: WQS_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerQualityStandardRunReport["action"],
    records: QualityRecord[],
    qualityDecision: QualityDecision | string | null,
    confidenceScore: number | null,
    standardsFailed: string[],
    validation: WorkerQualityStandardRunReport["validation"],
    started: number,
  ): WorkerQualityStandardRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      qualityRunReportId: `wqs-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      qualityDecision,
      confidenceScore,
      standardsFailed: [...standardsFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WQS_METADATA_VERSION,
    };
  }
}
