import type { AuthorityMatrixConfiguration } from "./configuration.js";
import { MatrixBuilder } from "./matrix-builder.js";
import { MatrixStore } from "./matrix-store.js";
import {
  AuthorityMatrixMetadataGenerator,
  HealthMonitor,
  MatrixValidator,
  RecoveryManager,
} from "./matrix-validator.js";
import { appendAmxLog } from "./amx-logging.js";
import {
  AUTHORITY_MATRIX_ID,
  AMX_CAPABILITIES,
  AMX_METADATA_VERSION,
} from "./paths.js";
import type {
  AuthorityBinding,
  AuthorityMatrixCatalog,
  AuthorityMatrixEngineRecord,
  AuthorityMatrixInput,
  AuthorityMatrixRunReport,
  AuthorityRuleDefinition,
  MatrixDecision,
  OperationalState,
} from "./types.js";

export class AuthorityMatrixCore {
  private engineRecord: AuthorityMatrixEngineRecord | null = null;
  private seeded = false;
  private catalog: AuthorityMatrixCatalog | null = null;
  private readonly store = new MatrixStore();
  private readonly builder = new MatrixBuilder();
  private readonly validator = new MatrixValidator();
  private readonly metadata = new AuthorityMatrixMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: AuthorityMatrixConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      rules: config.seedRules,
      bindings: config.seedBindings,
    });
    this.catalog = this.builder.buildCatalog(config, this.store.listRules());
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

  getRules() {
    return this.store.listRules();
  }

  getBindings() {
    return this.store.listBindings();
  }

  getLatestBinding() {
    return this.store.getLatestBinding();
  }

  connect(
    _input: Record<string, unknown>,
    config: AuthorityMatrixConfiguration,
  ): AuthorityMatrixRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendAmxLog({
      event: "connect",
      details: "Authority Matrix connected; define-and-govern mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listRules(),
      [],
      null,
      [],
      {
        validationReportId: `amx-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Authority Matrix is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: AMX_METADATA_VERSION,
      },
      started,
    );
  }

  defineMatrix(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.definitionRulesEnabled) {
      return this.disabled(
        "define_matrix",
        config,
        !config.enabled ? "Authority Matrix is disabled" : "Definition rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("define_matrix", input, config, started);
    }
    for (const rule of input.rules ?? []) {
      this.store.registerRule(rule);
    }
    this.catalog = this.builder.buildCatalog(config, this.store.listRules());
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listRules(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendAmxLog({
      event: "define_matrix",
      details: `version=${this.catalog.matrixVersion} rules=${this.catalog.rules.length}`,
    });
    return this.report(
      "define_matrix",
      this.getCatalog(),
      this.store.listRules(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  registerRule(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    if (!config.registrationRulesEnabled) {
      return this.disabled("register_rule", config, "Registration rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_rule", input, config, started);
    }
    const rule = this.builder.buildRule(input, config);
    this.store.registerRule(rule);
    return this.runEvaluate("register_rule", { ...input, authorityId: rule.authorityId }, config, started);
  }

  deriveAuthority(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    if (!config.derivationRulesEnabled) {
      return this.disabled("derive_authority", config, "Derivation rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("derive_authority", input, config, started);
    }
    const available = this.store.listRules();
    const authorityIds =
      input.authorityIds?.length
        ? unique(input.authorityIds)
        : input.authorityId?.trim()
          ? [input.authorityId.trim()]
          : [available.find((r) => r.decisionCategory === "planning")?.authorityId ?? available[0]?.authorityId ?? "auth-base-information"];

    const parentChains: Record<string, string[]> = {};
    const allFailed: string[] = [];
    const allSatisfied: string[] = [];
    const allApplied: string[] = [];
    let worst: MatrixDecision = "valid";

    for (const authorityId of authorityIds) {
      const evaluation = this.builder.evaluate({ ...input, authorityId }, config, available);
      parentChains[authorityId] = evaluation.parentChain;
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
      authorityIds,
      matrixVersion: this.catalog.matrixVersion,
      parentChains,
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
    appendAmxLog({
      event: "derive_authority",
      details: `id=${binding.bindingId} subject=${binding.subjectId} rules=${binding.authorityIds.join(",")}`,
    });
    this.metadata.generate(this.store.ruleCount(), this.store.count());
    return this.report(
      "derive_authority",
      this.getCatalog(),
      this.store.listRules(),
      [binding],
      binding.matrixDecision,
      binding.rulesFailed,
      validation,
      started,
    );
  }

  validateWorkerAuthority(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    if (!config.workerAuthorityRulesEnabled) {
      return this.disabled("validate_worker_authority", config, "Worker authority rules are disabled");
    }
    return this.validateScoped(
      "validate_worker_authority",
      { ...input, authorityId: input.authorityId ?? "auth-base-information" },
      config,
    );
  }

  validatePillowAuthority(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    if (!config.pillowAuthorityRulesEnabled) {
      return this.disabled("validate_pillow_authority", config, "Pillow authority rules are disabled");
    }
    return this.validateScoped(
      "validate_pillow_authority",
      { ...input, authorityId: input.authorityId ?? "auth-pillow-executive" },
      config,
    );
  }

  validateGrandKingAuthority(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    if (!config.grandKingAuthorityRulesEnabled) {
      return this.disabled(
        "validate_grand_king_authority",
        config,
        "Grand King authority rules are disabled",
      );
    }
    return this.validateScoped(
      "validate_grand_king_authority",
      { ...input, authorityId: input.authorityId ?? "auth-grand-king-supreme" },
      config,
    );
  }

  validateApprovalRouting(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    if (!config.approvalRoutingRulesEnabled) {
      return this.disabled(
        "validate_approval_routing",
        config,
        "Approval routing rules are disabled",
      );
    }
    return this.validateScoped(
      "validate_approval_routing",
      { ...input, authorityId: input.authorityId ?? "auth-financial" },
      config,
    );
  }

  produceMatrix(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_matrix", input, config, started);
    }
    return this.runEvaluate("produce_matrix", input, config, started);
  }

  list(config: AuthorityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listRules());
    const bindings = this.store.listBindings();
    const latest = bindings[bindings.length - 1] ?? null;
    const validation =
      bindings.length === 0
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listRules(),
            { validated: true },
            started,
          )
        : this.validator.validateBindings(bindings, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listRules(),
      bindings,
      latest?.matrixDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  validate(input: AuthorityMatrixInput, config: AuthorityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listRules());
    const bindings = this.store.listBindings();
    const latest = bindings[bindings.length - 1] ?? null;
    const validation =
      bindings.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listRules(),
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
      this.store.listRules(),
      bindings,
      latest?.matrixDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: AuthorityMatrixConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listRules());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Authority Matrix is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendAmxLog({
      event: "diagnostics",
      details: `rules=${this.store.ruleCount()} categories=${this.store.categoryCount()} bindings=${this.store.count()}`,
    });
    const latest = this.getLatestBinding();
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listRules(),
      this.store.listBindings(),
      latest?.matrixDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  private validateScoped(
    action: AuthorityMatrixRunReport["action"],
    input: AuthorityMatrixInput,
    config: AuthorityMatrixConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    return this.runEvaluate(action, input, config, started);
  }

  private runEvaluate(
    action: AuthorityMatrixRunReport["action"],
    input: AuthorityMatrixInput,
    config: AuthorityMatrixConfiguration,
    started: number,
  ): AuthorityMatrixRunReport {
    if (!config.enabled) {
      return this.disabled(action, config, "Authority Matrix is disabled");
    }
    const evaluation = this.builder.evaluate(input, config, this.store.listRules());
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listRules(),
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
    appendAmxLog({
      event: action,
      details: `decision=${evaluation.matrixDecision} worker=${evaluation.workerAuthorityValidated} pillow=${evaluation.pillowAuthorityValidated} gk=${evaluation.grandKingAuthorityValidated} routing=${evaluation.approvalRoutingValidated}`,
    });
    this.metadata.generate(this.store.ruleCount(), this.store.count());
    return this.report(
      action,
      this.getCatalog(),
      this.store.listRules(),
      this.store.listBindings(),
      evaluation.matrixDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: AuthorityMatrixRunReport["action"],
    input: AuthorityMatrixInput,
    config: AuthorityMatrixConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateBindings(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listRules(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: AuthorityMatrixRunReport["action"],
    config: AuthorityMatrixConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listRules(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: AuthorityMatrixInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceApprovalRouter === true ||
      input.replaceOrganizationCharter === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: AuthorityMatrixConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastMatrixDecision: MatrixDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `amx-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AUTHORITY_MATRIX_ID,
      engineVersion: "PILLOW-AMX-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...AMX_CAPABILITIES],
      matrixVersion: config.matrixVersion,
      totalRules: this.store.ruleCount(),
      totalBindings: this.store.count(),
      authorityLevelCount: config.authorityLevels.length,
      decisionCategoryCount: this.store.categoryCount(),
      lastMatrixDecision:
        lastMatrixDecision ?? this.getLatestBinding()?.matrixDecision ?? null,
      metadataVersion: AMX_METADATA_VERSION,
    };
  }

  private report(
    action: AuthorityMatrixRunReport["action"],
    catalog: AuthorityMatrixCatalog | null,
    rules: AuthorityRuleDefinition[],
    bindings: AuthorityBinding[],
    matrixDecision: MatrixDecision | string | null,
    rulesFailed: string[],
    validation: AuthorityMatrixRunReport["validation"],
    started: number,
  ): AuthorityMatrixRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      matrixRunReportId: `amx-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      rules,
      bindings,
      matrixDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: AMX_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneCatalog(catalog: AuthorityMatrixCatalog): AuthorityMatrixCatalog {
  return {
    ...catalog,
    authorityLevels: [...catalog.authorityLevels],
    decisionCategories: [...catalog.decisionCategories],
    rules: catalog.rules.map((r) => ({
      ...r,
      permittedActions: [...r.permittedActions],
      restrictedActions: [...r.restrictedActions],
      whoMayPerform: [...r.whoMayPerform],
      escalationPath: [...r.escalationPath],
      auditRequirements: [...r.auditRequirements],
    })),
  };
}
