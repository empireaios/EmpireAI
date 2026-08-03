import type { OrganizationCharterConfiguration } from "./configuration.js";
import { CharterBuilder } from "./charter-builder.js";
import { CharterStore } from "./charter-store.js";
import {
  CharterValidator,
  HealthMonitor,
  OrganizationCharterMetadataGenerator,
  RecoveryManager,
} from "./charter-validator.js";
import { appendOchLog } from "./och-logging.js";
import {
  ORGANIZATION_CHARTER_ID,
  OCH_CAPABILITIES,
  OCH_METADATA_VERSION,
} from "./paths.js";
import type {
  OrganizationCharterDefinition,
  OrganizationCharterEngineRecord,
  OrganizationCharterInput,
  OrganizationCharterRunReport,
  OrganizationStructureRecord,
  OperationalState,
  StructureDecision,
} from "./types.js";

export class OrganizationCharterCore {
  private engineRecord: OrganizationCharterEngineRecord | null = null;
  private seeded = false;
  private charter: OrganizationCharterDefinition | null = null;
  private readonly store = new CharterStore();
  private readonly builder = new CharterBuilder();
  private readonly validator = new CharterValidator();
  private readonly metadata = new OrganizationCharterMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: OrganizationCharterConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      factories: config.seedFactories,
      departments: config.seedDepartments,
      workers: config.seedWorkers,
      records: config.seedStructureRecords,
    });
    this.charter = this.builder.define(config, this.orgState());
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

  getCharter() {
    return this.charter ? cloneCharter(this.charter) : null;
  }

  getRecords() {
    return this.store.listRecords();
  }

  getLatestRecord() {
    return this.store.getLatestRecord();
  }

  connect(
    _input: Record<string, unknown>,
    config: OrganizationCharterConfiguration,
  ): OrganizationCharterRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendOchLog({
      event: "connect",
      details: "Organization Charter connected; define-and-register mode",
    });
    return this.report(
      "connect",
      this.getCharter(),
      [],
      null,
      [],
      {
        validationReportId: `och-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Organization Charter is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: OCH_METADATA_VERSION,
      },
      started,
    );
  }

  defineCharter(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.definitionRulesEnabled) {
      return this.disabled(
        "define_charter",
        config,
        !config.enabled
          ? "Organization Charter is disabled"
          : "Definition rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateCharter(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("define_charter", null, [], null, [], validation, started);
    }
    this.applyInputRegistrations(input, config);
    this.charter = this.builder.define(config, this.orgState());
    const validation = this.validator.validateCharter(
      this.charter,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendOchLog({
      event: "define_charter",
      details: `version=${this.charter.charterVersion} factories=${this.charter.factories.length} departments=${this.charter.departments.length}`,
    });
    return this.report(
      "define_charter",
      this.getCharter(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  registerFactory(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    if (!config.registrationRulesEnabled) {
      return this.disabled("register_factory", config, "Registration rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_factory", input, config, started);
    }
    const factoryId = input.factoryId?.trim() || "factory-unspecified";
    this.store.registerFactory({
      factoryId,
      name: input.factoryName?.trim() || factoryId,
      responsibilities: unique(input.factoryResponsibilities ?? ["factory_operations"]),
      reportsTo: "pillow",
    });
    return this.runStructure("register_factory", input, config, started);
  }

  registerDepartment(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    if (!config.registrationRulesEnabled) {
      return this.disabled("register_department", config, "Registration rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_department", input, config, started);
    }
    const departmentId = input.departmentId?.trim() || "department-unspecified";
    const factoryId =
      input.departmentFactoryId?.trim() ||
      this.store.listFactories()[0]?.factoryId ||
      "workforce-factory-foundation";
    this.store.registerDepartment({
      departmentId,
      name: input.departmentName?.trim() || departmentId,
      factoryId,
      responsibilities: unique(input.departmentResponsibilities ?? ["department_operations"]),
      reportsTo: factoryId,
    });
    return this.runStructure("register_department", input, config, started);
  }

  registerWorker(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    if (!config.registrationRulesEnabled) {
      return this.disabled("register_worker", config, "Registration rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_worker", input, config, started);
    }
    const workerId = input.workerId?.trim() || "worker-unspecified";
    const departmentId =
      input.workerDepartmentId?.trim() ||
      this.store.listDepartments()[0]?.departmentId ||
      "operations";
    this.store.registerWorker({
      workerId,
      workerName: input.workerName?.trim() || workerId,
      departmentId,
      reportsTo: input.reportsTo?.trim() || departmentId,
    });
    return this.runStructure("register_worker", input, config, started);
  }

  validateReporting(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    if (!config.reportingRulesEnabled) {
      return this.disabled("validate_reporting", config, "Reporting rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_reporting", input, config, started);
    }
    return this.runStructure("validate_reporting", input, config, started);
  }

  validateEscalation(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    if (!config.escalationRulesEnabled) {
      return this.disabled("validate_escalation", config, "Escalation rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_escalation", input, config, started);
    }
    return this.runStructure("validate_escalation", input, config, started);
  }

  produceStructure(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_structure", input, config, started);
    }
    return this.runStructure("produce_structure", input, config, started);
  }

  list(config: OrganizationCharterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.charter = this.builder.define(config, this.orgState());
    const records = this.store.listRecords();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.validateCharter(
            this.charter,
            { validated: true },
            started,
          )
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCharter(),
      records,
      latest?.structureDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  validate(input: OrganizationCharterInput, config: OrganizationCharterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.charter = this.builder.define(config, this.orgState());
    const records = this.store.listRecords();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.validateCharter(
            this.charter,
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
      this.getCharter(),
      records,
      latest?.structureDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: OrganizationCharterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.charter = this.builder.define(config, this.orgState());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Organization Charter is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendOchLog({
      event: "diagnostics",
      details: `factories=${this.store.factoryCount()} departments=${this.store.departmentCount()} workers=${this.store.workerCount()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.getCharter(),
      this.store.listRecords(),
      latest?.structureDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  private runStructure(
    action: OrganizationCharterRunReport["action"],
    input: OrganizationCharterInput,
    config: OrganizationCharterConfiguration,
    started: number,
  ): OrganizationCharterRunReport {
    if (!config.enabled) {
      return this.disabled(action, config, "Organization Charter is disabled");
    }
    this.applyInputRegistrations(input, config);
    const evaluation = this.builder.evaluate(input, config, this.orgState());
    this.charter = evaluation.charter;
    const record = this.store.buildRecord({
      input,
      charterVersion: evaluation.charter.charterVersion,
      structureDecision: evaluation.structureDecision,
      factoriesRegistered: evaluation.factoriesRegistered,
      departmentsRegistered: evaluation.departmentsRegistered,
      workersRegistered: evaluation.workersRegistered,
      reportingValidated: evaluation.reportingValidated,
      escalationValidated: evaluation.escalationValidated,
      rulesApplied: evaluation.rulesApplied,
      rulesSatisfied: evaluation.rulesSatisfied,
      rulesFailed: evaluation.rulesFailed,
      validationStatus:
        evaluation.structureDecision === "valid"
          ? "passed"
          : evaluation.structureDecision === "partially_valid"
            ? "partial"
            : "failed",
    });
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
      record.structureDecision,
    );
    appendOchLog({
      event: action,
      details: `id=${record.structureRecordId} decision=${record.structureDecision} factories=${record.factoriesRegistered.length}`,
    });
    this.metadata.generate(this.store.count(), this.store.factoryCount());
    return this.report(
      action,
      this.getCharter(),
      [record],
      record.structureDecision,
      record.rulesFailed,
      validation,
      started,
    );
  }

  private applyInputRegistrations(
    input: OrganizationCharterInput,
    _config: OrganizationCharterConfiguration,
  ) {
    for (const factory of input.factories ?? []) {
      this.store.registerFactory({ ...factory, reportsTo: "pillow" });
    }
    for (const department of input.departments ?? []) {
      this.store.registerDepartment(department);
    }
    for (const worker of input.workers ?? []) {
      this.store.registerWorker(worker);
    }
  }

  private orgState() {
    return {
      factories: this.store.listFactories(),
      departments: this.store.listDepartments(),
      workers: this.store.listWorkers(),
    };
  }

  private boundaryFail(
    action: OrganizationCharterRunReport["action"],
    input: OrganizationCharterInput,
    config: OrganizationCharterConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRecords(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCharter(), [], null, [], validation, started);
  }

  private disabled(
    action: OrganizationCharterRunReport["action"],
    config: OrganizationCharterConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCharter(), [], null, [], validation, started);
  }

  private hasBoundary(input: OrganizationCharterInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkforceOperatingSystem === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: OrganizationCharterConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastStructureDecision: StructureDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `och-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ORGANIZATION_CHARTER_ID,
      engineVersion: "PILLOW-OCH-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...OCH_CAPABILITIES],
      charterVersion: config.charterVersion,
      totalStructureRecords: this.store.count(),
      factoryCount: this.store.factoryCount(),
      departmentCount: this.store.departmentCount(),
      workerCount: this.store.workerCount(),
      lastStructureDecision:
        lastStructureDecision ?? this.getLatestRecord()?.structureDecision ?? null,
      metadataVersion: OCH_METADATA_VERSION,
    };
  }

  private report(
    action: OrganizationCharterRunReport["action"],
    charter: OrganizationCharterDefinition | null,
    structureRecords: OrganizationStructureRecord[],
    structureDecision: StructureDecision | string | null,
    rulesFailed: string[],
    validation: OrganizationCharterRunReport["validation"],
    started: number,
  ): OrganizationCharterRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      charterRunReportId: `och-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      charter,
      structureRecords,
      structureDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: OCH_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneCharter(definition: OrganizationCharterDefinition): OrganizationCharterDefinition {
  return {
    ...definition,
    organizationalHierarchy: [...definition.organizationalHierarchy],
    departments: definition.departments.map((d) => ({
      ...d,
      responsibilities: [...d.responsibilities],
    })),
    factories: definition.factories.map((f) => ({
      ...f,
      responsibilities: [...f.responsibilities],
      reportsTo: "pillow" as const,
    })),
    reportingRelationships: definition.reportingRelationships.map((r) => ({ ...r })),
    authorityLevels: [...definition.authorityLevels],
    responsibilityMatrix: definition.responsibilityMatrix.map((r) => ({ ...r })),
    escalationHierarchy: definition.escalationHierarchy.map((s) => ({ ...s })),
    governanceRules: [...definition.governanceRules],
    collaborationRules: [...definition.collaborationRules],
    organizationalRules: [...definition.organizationalRules],
    workerOwnership: definition.workerOwnership.map((w) => ({ ...w })),
  };
}
