import type { RoleTaxonomyConfiguration } from "./configuration.js";
import { TaxonomyBuilder } from "./taxonomy-builder.js";
import { TaxonomyStore } from "./taxonomy-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  RoleTaxonomyMetadataGenerator,
  TaxonomyValidator,
} from "./taxonomy-validator.js";
import { appendRtxLog } from "./rtx-logging.js";
import {
  ROLE_TAXONOMY_ID,
  RTX_CAPABILITIES,
  RTX_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  RoleDefinition,
  RoleInheritanceBinding,
  RoleTaxonomyCatalog,
  RoleTaxonomyEngineRecord,
  RoleTaxonomyInput,
  RoleTaxonomyRunReport,
  TaxonomyDecision,
} from "./types.js";

export class RoleTaxonomyCore {
  private engineRecord: RoleTaxonomyEngineRecord | null = null;
  private seeded = false;
  private catalog: RoleTaxonomyCatalog | null = null;
  private readonly store = new TaxonomyStore();
  private readonly builder = new TaxonomyBuilder();
  private readonly validator = new TaxonomyValidator();
  private readonly metadata = new RoleTaxonomyMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: RoleTaxonomyConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      roles: config.seedRoles,
      records: config.seedInheritanceRecords,
    });
    this.catalog = this.builder.buildCatalog(config, this.store.listRoles());
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

  getRoles() {
    return this.store.listRoles();
  }

  getRecords() {
    return this.store.listRecords();
  }

  getLatestRecord() {
    return this.store.getLatestRecord();
  }

  connect(
    _input: Record<string, unknown>,
    config: RoleTaxonomyConfiguration,
  ): RoleTaxonomyRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendRtxLog({
      event: "connect",
      details: "Role Taxonomy connected; define-and-inherit mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listRoles(),
      [],
      null,
      [],
      {
        validationReportId: `rtx-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Role Taxonomy is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: RTX_METADATA_VERSION,
      },
      started,
    );
  }

  defineTaxonomy(input: RoleTaxonomyInput, config: RoleTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.definitionRulesEnabled) {
      return this.disabled(
        "define_taxonomy",
        config,
        !config.enabled ? "Role Taxonomy is disabled" : "Definition rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("define_taxonomy", input, config, started);
    }
    for (const role of input.roles ?? []) {
      this.store.registerRole(role);
    }
    this.catalog = this.builder.buildCatalog(config, this.store.listRoles());
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listRoles(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendRtxLog({
      event: "define_taxonomy",
      details: `version=${this.catalog.taxonomyVersion} roles=${this.catalog.roles.length}`,
    });
    return this.report(
      "define_taxonomy",
      this.getCatalog(),
      this.store.listRoles(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  registerRole(input: RoleTaxonomyInput, config: RoleTaxonomyConfiguration) {
    if (!config.registrationRulesEnabled) {
      return this.disabled("register_role", config, "Registration rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_role", input, config, started);
    }
    const role = this.builder.buildRole(input, config);
    this.store.registerRole(role);
    return this.runEvaluate("register_role", { ...input, roleId: role.roleId }, config, started);
  }

  inheritRole(input: RoleTaxonomyInput, config: RoleTaxonomyConfiguration) {
    if (!config.inheritanceRulesEnabled) {
      return this.disabled("inherit_role", config, "Inheritance rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("inherit_role", input, config, started);
    }
    const roleId =
      input.roleId?.trim() ||
      this.store.listRoles().find((r) => r.roleCategory === "analyst")?.roleId ||
      this.store.listRoles()[0]?.roleId ||
      "role-system-base";
    const evaluation = this.builder.evaluate(
      { ...input, roleId },
      config,
      this.store.listRoles(),
    );
    this.catalog = evaluation.catalog;
    const record = this.store.buildInheritance({
      input,
      workerId: input.workerId?.trim() || "worker-unspecified",
      workerName: input.workerName?.trim() || input.workerId?.trim() || "Unnamed Worker",
      roleId,
      taxonomyVersion: evaluation.catalog.taxonomyVersion,
      parentChain: evaluation.parentChain,
      taxonomyDecision: evaluation.taxonomyDecision,
      rulesApplied: evaluation.rulesApplied,
      rulesSatisfied: evaluation.rulesSatisfied,
      rulesFailed: evaluation.rulesFailed,
      validationStatus:
        evaluation.taxonomyDecision === "valid"
          ? "passed"
          : evaluation.taxonomyDecision === "partially_valid"
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
      record.taxonomyDecision,
    );
    appendRtxLog({
      event: "inherit_role",
      details: `id=${record.inheritanceId} worker=${record.workerId} role=${record.roleId}`,
    });
    this.metadata.generate(this.store.roleCount(), this.store.count());
    return this.report(
      "inherit_role",
      this.getCatalog(),
      this.store.listRoles(),
      [record],
      record.taxonomyDecision,
      record.rulesFailed,
      validation,
      started,
    );
  }

  validateReporting(input: RoleTaxonomyInput, config: RoleTaxonomyConfiguration) {
    if (!config.reportingRulesEnabled) {
      return this.disabled("validate_reporting", config, "Reporting rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_reporting", input, config, started);
    }
    return this.runEvaluate("validate_reporting", input, config, started);
  }

  validateInheritance(input: RoleTaxonomyInput, config: RoleTaxonomyConfiguration) {
    if (!config.inheritanceRulesEnabled) {
      return this.disabled("validate_inheritance", config, "Inheritance rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_inheritance", input, config, started);
    }
    return this.runEvaluate("validate_inheritance", input, config, started);
  }

  produceTaxonomy(input: RoleTaxonomyInput, config: RoleTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_taxonomy", input, config, started);
    }
    return this.runEvaluate("produce_taxonomy", input, config, started);
  }

  list(config: RoleTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listRoles());
    const records = this.store.listRecords();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listRoles(),
            { validated: true },
            started,
          )
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listRoles(),
      records,
      latest?.taxonomyDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  validate(input: RoleTaxonomyInput, config: RoleTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listRoles());
    const records = this.store.listRecords();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listRoles(),
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
      this.getCatalog(),
      this.store.listRoles(),
      records,
      latest?.taxonomyDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: RoleTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listRoles());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Role Taxonomy is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendRtxLog({
      event: "diagnostics",
      details: `roles=${this.store.roleCount()} categories=${this.store.categoryCount()} inheritance=${this.store.count()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listRoles(),
      this.store.listRecords(),
      latest?.taxonomyDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  private runEvaluate(
    action: RoleTaxonomyRunReport["action"],
    input: RoleTaxonomyInput,
    config: RoleTaxonomyConfiguration,
    started: number,
  ): RoleTaxonomyRunReport {
    if (!config.enabled) {
      return this.disabled(action, config, "Role Taxonomy is disabled");
    }
    const evaluation = this.builder.evaluate(input, config, this.store.listRoles());
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listRoles(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.taxonomyDecision,
    );
    appendRtxLog({
      event: action,
      details: `decision=${evaluation.taxonomyDecision} roles=${evaluation.rolesRegistered.length} reporting=${evaluation.reportingValidated}`,
    });
    this.metadata.generate(this.store.roleCount(), this.store.count());
    return this.report(
      action,
      this.getCatalog(),
      this.store.listRoles(),
      this.store.listRecords(),
      evaluation.taxonomyDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: RoleTaxonomyRunReport["action"],
    input: RoleTaxonomyInput,
    config: RoleTaxonomyConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRecords(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listRoles(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: RoleTaxonomyRunReport["action"],
    config: RoleTaxonomyConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listRoles(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: RoleTaxonomyInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceOrganizationCharter === true ||
      input.replaceWorkerConstitution === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: RoleTaxonomyConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastTaxonomyDecision: TaxonomyDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `rtx-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ROLE_TAXONOMY_ID,
      engineVersion: "PILLOW-RTX-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...RTX_CAPABILITIES],
      taxonomyVersion: config.taxonomyVersion,
      totalRoles: this.store.roleCount(),
      totalInheritanceRecords: this.store.count(),
      categoryCount: this.store.categoryCount(),
      lastTaxonomyDecision:
        lastTaxonomyDecision ?? this.getLatestRecord()?.taxonomyDecision ?? null,
      metadataVersion: RTX_METADATA_VERSION,
    };
  }

  private report(
    action: RoleTaxonomyRunReport["action"],
    catalog: RoleTaxonomyCatalog | null,
    roles: RoleDefinition[],
    inheritanceRecords: RoleInheritanceBinding[],
    taxonomyDecision: TaxonomyDecision | string | null,
    rulesFailed: string[],
    validation: RoleTaxonomyRunReport["validation"],
    started: number,
  ): RoleTaxonomyRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      taxonomyRunReportId: `rtx-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      roles,
      inheritanceRecords,
      taxonomyDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: RTX_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: RoleTaxonomyCatalog): RoleTaxonomyCatalog {
  return {
    ...catalog,
    categories: [...catalog.categories],
    roles: catalog.roles.map((r) => ({
      ...r,
      responsibilities: [...r.responsibilities],
      collaborationRules: [...r.collaborationRules],
      escalationRules: [...r.escalationRules],
      governanceRules: [...r.governanceRules],
      decisionAuthority: [...r.decisionAuthority],
      escalationAuthority: [...r.escalationAuthority],
      requiredSkills: [...r.requiredSkills],
    })),
  };
}
