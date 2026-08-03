import type { WorkerConstitutionConfiguration } from "./configuration.js";
import { ConstitutionBuilder } from "./constitution-builder.js";
import { ConstitutionStore } from "./constitution-store.js";
import {
  ConstitutionValidator,
  HealthMonitor,
  RecoveryManager,
  WorkerConstitutionMetadataGenerator,
} from "./constitution-validator.js";
import { appendWctLog } from "./wct-logging.js";
import {
  WORKER_CONSTITUTION_ID,
  WCT_CAPABILITIES,
  WCT_METADATA_VERSION,
} from "./paths.js";
import type {
  ComplianceDecision,
  OperationalState,
  WorkerConstitutionDefinition,
  WorkerConstitutionEngineRecord,
  WorkerConstitutionInput,
  WorkerConstitutionRunReport,
  WorkerInheritanceRecord,
} from "./types.js";

export class WorkerConstitutionCore {
  private engineRecord: WorkerConstitutionEngineRecord | null = null;
  private seeded = false;
  private constitution: WorkerConstitutionDefinition | null = null;
  private readonly store = new ConstitutionStore();
  private readonly builder = new ConstitutionBuilder();
  private readonly validator = new ConstitutionValidator();
  private readonly metadata = new WorkerConstitutionMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerConstitutionConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedInheritanceRecords);
    this.constitution = this.builder.define(config);
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

  getConstitution() {
    return this.constitution ? cloneConstitution(this.constitution) : null;
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
    config: WorkerConstitutionConfiguration,
  ): WorkerConstitutionRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWctLog({
      event: "connect",
      details: "Worker Constitution connected; define-and-govern mode",
    });
    return this.report(
      "connect",
      this.getConstitution(),
      [],
      null,
      [],
      {
        validationReportId: `wct-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Constitution is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WCT_METADATA_VERSION,
      },
      started,
    );
  }

  defineConstitution(
    input: WorkerConstitutionInput,
    config: WorkerConstitutionConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.definitionRulesEnabled) {
      return this.disabled(
        "define_constitution",
        config,
        !config.enabled
          ? "Worker Constitution is disabled"
          : "Definition rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateConstitution(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("define_constitution", null, [], null, [], validation, started);
    }
    this.constitution = this.builder.define(config);
    const validation = this.validator.validateConstitution(
      this.constitution,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWctLog({
      event: "define_constitution",
      details: `version=${this.constitution.constitutionVersion} rules=${this.constitution.constitutionalRules.length}`,
    });
    return this.report(
      "define_constitution",
      this.getConstitution(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  inheritWorker(input: WorkerConstitutionInput, config: WorkerConstitutionConfiguration) {
    return this.runInherit("inherit_worker", input, config, true);
  }

  validateCompliance(
    input: WorkerConstitutionInput,
    config: WorkerConstitutionConfiguration,
  ) {
    if (!config.complianceRulesEnabled) {
      return this.disabled("validate_compliance", config, "Compliance rules are disabled");
    }
    return this.runInherit("validate_compliance", input, config, true);
  }

  produceConstitution(
    input: WorkerConstitutionInput,
    config: WorkerConstitutionConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateConstitution(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("produce_constitution", null, [], null, [], validation, started);
    }
    this.constitution = this.builder.define(config);
    const validation = this.validator.validateConstitution(
      this.constitution,
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWctLog({
      event: "produce_constitution",
      details: `version=${this.constitution.constitutionVersion}`,
    });
    return this.report(
      "produce_constitution",
      this.getConstitution(),
      this.store.list(),
      this.getLatestRecord()?.complianceDecision ?? null,
      this.getLatestRecord()?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  list(config: WorkerConstitutionConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Inheritance catalog is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getConstitution(),
      records,
      latest?.complianceDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  validate(input: WorkerConstitutionInput, config: WorkerConstitutionConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.validateConstitution(
            this.constitution,
            { ...input, validated: input.validated ?? true },
            started,
          )
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
      this.getConstitution(),
      records,
      latest?.complianceDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerConstitutionConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Constitution is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWctLog({
      event: "diagnostics",
      details: `records=${this.store.count()} compliant=${this.store.compliantCount()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.getConstitution(),
      this.store.list(),
      latest?.complianceDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  private runInherit(
    action: WorkerConstitutionRunReport["action"],
    input: WorkerConstitutionInput,
    config: WorkerConstitutionConfiguration,
    requireWorker: boolean,
  ): WorkerConstitutionRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.inheritanceRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Worker Constitution is disabled"
          : "Inheritance rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireWorker);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getConstitution(), [], null, [], validation, started);
    }

    this.constitution = this.builder.define(config);
    const evaluation = this.builder.evaluateCompliance(input, config);
    const record = this.store.buildRecord({
      input,
      workerId: evaluation.workerId,
      workerName: evaluation.workerName,
      department: evaluation.department,
      constitutionVersion: this.constitution.constitutionVersion,
      lifecycleStage: evaluation.lifecycleStage,
      complianceDecision: evaluation.complianceDecision,
      rulesApplied: evaluation.rulesApplied,
      rulesSatisfied: evaluation.rulesSatisfied,
      rulesFailed: evaluation.rulesFailed,
      validationStatus:
        evaluation.complianceDecision === "compliant"
          ? "passed"
          : evaluation.complianceDecision === "partially_compliant"
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
      record.complianceDecision,
    );
    appendWctLog({
      event: action,
      details: `id=${record.inheritanceId} worker=${record.workerId} decision=${record.complianceDecision}`,
    });
    this.metadata.generate(this.store.count(), this.store.compliantCount());
    return this.report(
      action,
      this.getConstitution(),
      [record],
      record.complianceDecision,
      record.rulesFailed,
      validation,
      started,
    );
  }

  private disabled(
    action: WorkerConstitutionRunReport["action"],
    config: WorkerConstitutionConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getConstitution(), [], null, [], validation, started);
  }

  private hasBoundary(input: WorkerConstitutionInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkerQualityStandard === true ||
      input.replaceGovernance === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerConstitutionConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastComplianceDecision: ComplianceDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wct-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_CONSTITUTION_ID,
      engineVersion: "PILLOW-WCT-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WCT_CAPABILITIES],
      constitutionVersion: config.constitutionVersion,
      totalInheritanceRecords: this.store.count(),
      compliantCount: this.store.compliantCount(),
      nonCompliantCount: this.store.nonCompliantCount(),
      lastComplianceDecision:
        lastComplianceDecision ?? this.getLatestRecord()?.complianceDecision ?? null,
      metadataVersion: WCT_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerConstitutionRunReport["action"],
    constitution: WorkerConstitutionDefinition | null,
    inheritanceRecords: WorkerInheritanceRecord[],
    complianceDecision: ComplianceDecision | string | null,
    rulesFailed: string[],
    validation: WorkerConstitutionRunReport["validation"],
    started: number,
  ): WorkerConstitutionRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      constitutionRunReportId: `wct-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      constitution,
      inheritanceRecords,
      complianceDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WCT_METADATA_VERSION,
    };
  }
}

function cloneConstitution(definition: WorkerConstitutionDefinition): WorkerConstitutionDefinition {
  return {
    ...definition,
    workerResponsibilities: [...definition.workerResponsibilities],
    workerAuthority: [...definition.workerAuthority],
    workerRestrictions: [...definition.workerRestrictions],
    workerObligations: [...definition.workerObligations],
    communicationStandards: [...definition.communicationStandards],
    reportingStandards: [...definition.reportingStandards],
    qualityStandards: [...definition.qualityStandards],
    governanceStandards: [...definition.governanceStandards],
    escalationStandards: [...definition.escalationStandards],
    auditStandards: [...definition.auditStandards],
    traceabilityStandards: [...definition.traceabilityStandards],
    constitutionalRules: [...definition.constitutionalRules],
    lifecycleStages: [...definition.lifecycleStages],
  };
}
