import type { ResponsibilityMatrixConfiguration } from "./configuration.js";
import { MatrixBuilder } from "./matrix-builder.js";
import { MatrixStore } from "./matrix-store.js";
import {
  HealthMonitor,
  MatrixValidator,
  RecoveryManager,
  ResponsibilityMatrixMetadataGenerator,
} from "./matrix-validator.js";
import { appendRmxLog } from "./rmx-logging.js";
import {
  RESPONSIBILITY_MATRIX_ID,
  RMX_CAPABILITIES,
  RMX_METADATA_VERSION,
} from "./paths.js";
import type {
  MatrixDecision,
  OperationalState,
  ResponsibilityBinding,
  ResponsibilityDefinition,
  ResponsibilityMatrixCatalog,
  ResponsibilityMatrixEngineRecord,
  ResponsibilityMatrixInput,
  ResponsibilityMatrixRunReport,
} from "./types.js";

export class ResponsibilityMatrixCore {
  private engineRecord: ResponsibilityMatrixEngineRecord | null = null;
  private seeded = false;
  private catalog: ResponsibilityMatrixCatalog | null = null;
  private readonly store = new MatrixStore();
  private readonly builder = new MatrixBuilder();
  private readonly validator = new MatrixValidator();
  private readonly metadata = new ResponsibilityMatrixMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: ResponsibilityMatrixConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      responsibilities: config.seedResponsibilities,
      bindings: config.seedBindings,
    });
    this.catalog = this.builder.buildCatalog(config, this.store.listResponsibilities());
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

  getResponsibilities() {
    return this.store.listResponsibilities();
  }

  getBindings() {
    return this.store.listBindings();
  }

  getLatestBinding() {
    return this.store.getLatestBinding();
  }

  connect(
    _input: Record<string, unknown>,
    config: ResponsibilityMatrixConfiguration,
  ): ResponsibilityMatrixRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendRmxLog({
      event: "connect",
      details: "Responsibility Matrix connected; define-and-own mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listResponsibilities(),
      [],
      null,
      [],
      {
        validationReportId: `rmx-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Responsibility Matrix is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: RMX_METADATA_VERSION,
      },
      started,
    );
  }

  defineMatrix(input: ResponsibilityMatrixInput, config: ResponsibilityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.definitionRulesEnabled) {
      return this.disabled(
        "define_matrix",
        config,
        !config.enabled
          ? "Responsibility Matrix is disabled"
          : "Definition rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("define_matrix", input, config, started);
    }
    for (const responsibility of input.responsibilities ?? []) {
      this.store.registerResponsibility(responsibility);
    }
    this.catalog = this.builder.buildCatalog(config, this.store.listResponsibilities());
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listResponsibilities(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendRmxLog({
      event: "define_matrix",
      details: `version=${this.catalog.matrixVersion} responsibilities=${this.catalog.responsibilities.length}`,
    });
    return this.report(
      "define_matrix",
      this.getCatalog(),
      this.store.listResponsibilities(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  registerResponsibility(
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
  ) {
    if (!config.registrationRulesEnabled) {
      return this.disabled(
        "register_responsibility",
        config,
        "Registration rules are disabled",
      );
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_responsibility", input, config, started);
    }
    const responsibility = this.builder.buildResponsibility(input, config);
    this.store.registerResponsibility(responsibility);
    return this.runEvaluate(
      "register_responsibility",
      { ...input, responsibilityId: responsibility.responsibilityId },
      config,
      started,
    );
  }

  deriveOwnership(input: ResponsibilityMatrixInput, config: ResponsibilityMatrixConfiguration) {
    if (!config.derivationRulesEnabled) {
      return this.disabled("derive_ownership", config, "Derivation rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("derive_ownership", input, config, started);
    }
    const available = this.store.listResponsibilities();
    const responsibilityIds =
      input.responsibilityIds?.length
        ? unique(input.responsibilityIds)
        : input.responsibilityId?.trim()
          ? [input.responsibilityId.trim()]
          : [
              available.find((r) => r.department === "operations")?.responsibilityId ??
                available[0]?.responsibilityId ??
                "resp-ops-runbook",
            ];

    const ownerMap: Record<string, string> = {};
    const allFailed: string[] = [];
    const allSatisfied: string[] = [];
    const allApplied: string[] = [];
    let worst: MatrixDecision = "valid";

    for (const responsibilityId of responsibilityIds) {
      const evaluation = this.builder.evaluate(
        { ...input, responsibilityId },
        config,
        available,
      );
      const responsibility = available.find((r) => r.responsibilityId === responsibilityId);
      if (responsibility) ownerMap[responsibilityId] = responsibility.primaryOwner;
      allFailed.push(...evaluation.rulesFailed);
      allSatisfied.push(...evaluation.rulesSatisfied);
      allApplied.push(...evaluation.rulesApplied);
      if (evaluation.matrixDecision === "invalid") worst = "invalid";
      else if (evaluation.matrixDecision === "partially_valid" && worst === "valid") {
        worst = "partially_valid";
      }
    }

    this.catalog = this.builder.buildCatalog(config, available);
    const binding = this.store.buildBinding({
      input,
      subjectId: input.subjectId?.trim() || "subject-unspecified",
      subjectType: input.subjectType?.trim() || "worker",
      responsibilityIds,
      matrixVersion: this.catalog.matrixVersion,
      ownerMap,
      matrixDecision: worst,
      rulesApplied: unique(allApplied),
      rulesSatisfied: unique(allSatisfied),
      rulesFailed: unique(allFailed),
      validationStatus:
        worst === "valid" ? "passed" : worst === "partially_valid" ? "partial" : "failed",
    });
    const validation = this.validator.validateBindings(
      [binding],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      binding.matrixDecision,
    );
    appendRmxLog({
      event: "derive_ownership",
      details: `id=${binding.bindingId} subject=${binding.subjectId} responsibilities=${binding.responsibilityIds.join(",")}`,
    });
    this.metadata.generate(this.store.responsibilityCount(), this.store.count());
    return this.report(
      "derive_ownership",
      this.getCatalog(),
      this.store.listResponsibilities(),
      [binding],
      binding.matrixDecision,
      binding.rulesFailed,
      validation,
      started,
    );
  }

  validateOwnership(input: ResponsibilityMatrixInput, config: ResponsibilityMatrixConfiguration) {
    if (!config.ownershipRulesEnabled) {
      return this.disabled("validate_ownership", config, "Ownership rules are disabled");
    }
    return this.validateScoped(
      "validate_ownership",
      { ...input, responsibilityId: input.responsibilityId ?? "resp-strategy-briefs" },
      config,
    );
  }

  validateInputsOutputs(
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
  ) {
    if (!config.inputsOutputsRulesEnabled) {
      return this.disabled(
        "validate_inputs_outputs",
        config,
        "Inputs/outputs rules are disabled",
      );
    }
    return this.validateScoped(
      "validate_inputs_outputs",
      { ...input, responsibilityId: input.responsibilityId ?? "resp-commerce-listings" },
      config,
    );
  }

  validateDependencies(
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
  ) {
    if (!config.dependencyRulesEnabled) {
      return this.disabled("validate_dependencies", config, "Dependency rules are disabled");
    }
    return this.validateScoped(
      "validate_dependencies",
      { ...input, responsibilityId: input.responsibilityId ?? "resp-engineering-change" },
      config,
    );
  }

  validateApprovals(input: ResponsibilityMatrixInput, config: ResponsibilityMatrixConfiguration) {
    if (!config.approvalRulesEnabled) {
      return this.disabled("validate_approvals", config, "Approval rules are disabled");
    }
    return this.validateScoped(
      "validate_approvals",
      { ...input, responsibilityId: input.responsibilityId ?? "resp-finance-analysis" },
      config,
    );
  }

  produceMatrix(input: ResponsibilityMatrixInput, config: ResponsibilityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_matrix", input, config, started);
    }
    return this.runEvaluate("produce_matrix", input, config, started);
  }

  list(config: ResponsibilityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listResponsibilities());
    const bindings = this.store.listBindings();
    const latest = bindings[bindings.length - 1] ?? null;
    const validation =
      bindings.length === 0
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listResponsibilities(),
            { validated: true },
            started,
          )
        : this.validator.validateBindings(bindings, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listResponsibilities(),
      bindings,
      latest?.matrixDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  validate(input: ResponsibilityMatrixInput, config: ResponsibilityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listResponsibilities());
    const bindings = this.store.listBindings();
    const latest = bindings[bindings.length - 1] ?? null;
    const validation =
      bindings.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listResponsibilities(),
            { ...input, validated: input.validated ?? true },
            started,
          )
        : this.validator.validateBindings(
            bindings.length ? bindings : null,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      this.getCatalog(),
      this.store.listResponsibilities(),
      bindings,
      latest?.matrixDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: ResponsibilityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listResponsibilities());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Responsibility Matrix is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendRmxLog({
      event: "diagnostics",
      details: `responsibilities=${this.store.responsibilityCount()} owners=${this.store.ownerCount()} bindings=${this.store.count()}`,
    });
    const latest = this.getLatestBinding();
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listResponsibilities(),
      this.store.listBindings(),
      latest?.matrixDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  private validateScoped(
    action: ResponsibilityMatrixRunReport["action"],
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    return this.runEvaluate(action, input, config, started);
  }

  private runEvaluate(
    action: ResponsibilityMatrixRunReport["action"],
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
    started: number,
  ): ResponsibilityMatrixRunReport {
    if (!config.enabled) {
      return this.disabled(action, config, "Responsibility Matrix is disabled");
    }
    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listResponsibilities(),
    );
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listResponsibilities(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.matrixDecision,
    );
    appendRmxLog({
      event: action,
      details: `decision=${evaluation.matrixDecision} ownership=${evaluation.ownershipValidated} io=${evaluation.inputsOutputsValidated} deps=${evaluation.dependenciesValidated} approvals=${evaluation.approvalsValidated}`,
    });
    this.metadata.generate(this.store.responsibilityCount(), this.store.count());
    return this.report(
      action,
      this.getCatalog(),
      this.store.listResponsibilities(),
      this.store.listBindings(),
      evaluation.matrixDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: ResponsibilityMatrixRunReport["action"],
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateBindings(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listResponsibilities(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: ResponsibilityMatrixRunReport["action"],
    config: ResponsibilityMatrixConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listResponsibilities(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: ResponsibilityMatrixInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceAuthorityMatrix === true ||
      input.replaceOrganizationCharter === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ResponsibilityMatrixConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastMatrixDecision: MatrixDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `rmx-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: RESPONSIBILITY_MATRIX_ID,
      engineVersion: "PILLOW-RMX-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...RMX_CAPABILITIES],
      matrixVersion: config.matrixVersion,
      totalResponsibilities: this.store.responsibilityCount(),
      totalBindings: this.store.count(),
      ownerCount: this.store.ownerCount(),
      lastMatrixDecision:
        lastMatrixDecision ?? this.getLatestBinding()?.matrixDecision ?? null,
      metadataVersion: RMX_METADATA_VERSION,
    };
  }

  private report(
    action: ResponsibilityMatrixRunReport["action"],
    catalog: ResponsibilityMatrixCatalog | null,
    responsibilities: ResponsibilityDefinition[],
    bindings: ResponsibilityBinding[],
    matrixDecision: MatrixDecision | string | null,
    rulesFailed: string[],
    validation: ResponsibilityMatrixRunReport["validation"],
    started: number,
  ): ResponsibilityMatrixRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      matrixRunReportId: `rmx-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      responsibilities,
      bindings,
      matrixDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: RMX_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneCatalog(catalog: ResponsibilityMatrixCatalog): ResponsibilityMatrixCatalog {
  return {
    ...catalog,
    responsibilities: catalog.responsibilities.map((r) => ({
      ...r,
      supportingWorkers: [...r.supportingWorkers],
      requiredInputs: [...r.requiredInputs],
      expectedOutputs: [...r.expectedOutputs],
      dependencies: [...r.dependencies],
      requiredApprovals: [...r.requiredApprovals],
      successCriteria: [...r.successCriteria],
      failureConditions: [...r.failureConditions],
      escalationPath: [...r.escalationPath],
      qualityRequirements: [...r.qualityRequirements],
      completionCriteria: [...r.completionCriteria],
    })),
  };
}
