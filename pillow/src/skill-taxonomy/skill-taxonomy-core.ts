import type { SkillTaxonomyConfiguration } from "./configuration.js";
import { TaxonomyBuilder } from "./taxonomy-builder.js";
import { TaxonomyStore } from "./taxonomy-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  SkillTaxonomyMetadataGenerator,
  TaxonomyValidator,
} from "./taxonomy-validator.js";
import { appendStxLog } from "./stx-logging.js";
import {
  SKILL_TAXONOMY_ID,
  STX_CAPABILITIES,
  STX_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  SkillDefinition,
  SkillTaxonomyCatalog,
  SkillTaxonomyEngineRecord,
  SkillTaxonomyInput,
  SkillTaxonomyRunReport,
  TaxonomyDecision,
  WorkerSkillBinding,
} from "./types.js";

export class SkillTaxonomyCore {
  private engineRecord: SkillTaxonomyEngineRecord | null = null;
  private seeded = false;
  private catalog: SkillTaxonomyCatalog | null = null;
  private readonly store = new TaxonomyStore();
  private readonly builder = new TaxonomyBuilder();
  private readonly validator = new TaxonomyValidator();
  private readonly metadata = new SkillTaxonomyMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: SkillTaxonomyConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      skills: config.seedSkills,
      records: config.seedDerivationRecords,
    });
    this.catalog = this.builder.buildCatalog(config, this.store.listSkills());
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

  getSkills() {
    return this.store.listSkills();
  }

  getRecords() {
    return this.store.listRecords();
  }

  getLatestRecord() {
    return this.store.getLatestRecord();
  }

  connect(
    _input: Record<string, unknown>,
    config: SkillTaxonomyConfiguration,
  ): SkillTaxonomyRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendStxLog({
      event: "connect",
      details: "Skill Taxonomy connected; define-and-derive mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listSkills(),
      [],
      null,
      [],
      {
        validationReportId: `stx-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Skill Taxonomy is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: STX_METADATA_VERSION,
      },
      started,
    );
  }

  defineTaxonomy(input: SkillTaxonomyInput, config: SkillTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.definitionRulesEnabled) {
      return this.disabled(
        "define_taxonomy",
        config,
        !config.enabled ? "Skill Taxonomy is disabled" : "Definition rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("define_taxonomy", input, config, started);
    }
    for (const skill of input.skills ?? []) {
      this.store.registerSkill(skill);
    }
    this.catalog = this.builder.buildCatalog(config, this.store.listSkills());
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listSkills(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendStxLog({
      event: "define_taxonomy",
      details: `version=${this.catalog.taxonomyVersion} skills=${this.catalog.skills.length}`,
    });
    return this.report(
      "define_taxonomy",
      this.getCatalog(),
      this.store.listSkills(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  registerSkill(input: SkillTaxonomyInput, config: SkillTaxonomyConfiguration) {
    if (!config.registrationRulesEnabled) {
      return this.disabled("register_skill", config, "Registration rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_skill", input, config, started);
    }
    const skill = this.builder.buildSkill(input, config);
    this.store.registerSkill(skill);
    return this.runEvaluate("register_skill", { ...input, skillId: skill.skillId }, config, started);
  }

  deriveWorkerSkills(input: SkillTaxonomyInput, config: SkillTaxonomyConfiguration) {
    if (!config.derivationRulesEnabled) {
      return this.disabled("derive_worker_skills", config, "Derivation rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("derive_worker_skills", input, config, started);
    }
    const available = this.store.listSkills();
    const skillIds =
      input.skillIds?.length
        ? unique(input.skillIds)
        : input.skillId?.trim()
          ? [input.skillId.trim()]
          : [available.find((s) => s.skillCategory === "analytics")?.skillId ?? available[0]?.skillId ?? "skill-ops-foundation"];

    const parentChains: Record<string, string[]> = {};
    const proficiencyLevels: Record<string, string> = {};
    const allFailed: string[] = [];
    const allSatisfied: string[] = [];
    const allApplied: string[] = [];
    let worst: TaxonomyDecision = "valid";

    for (const skillId of skillIds) {
      const evaluation = this.builder.evaluate(
        { ...input, skillId },
        config,
        available,
      );
      parentChains[skillId] = evaluation.parentChain;
      const skill = available.find((s) => s.skillId === skillId);
      if (skill) proficiencyLevels[skillId] = String(skill.proficiencyLevel);
      allFailed.push(...evaluation.rulesFailed);
      allSatisfied.push(...evaluation.rulesSatisfied);
      allApplied.push(...evaluation.rulesApplied);
      if (evaluation.taxonomyDecision === "invalid") worst = "invalid";
      else if (evaluation.taxonomyDecision === "partially_valid" && worst === "valid") {
        worst = "partially_valid";
      }
    }

    this.catalog = this.builder.buildCatalog(config, available);
    const record = this.store.buildDerivation({
      input,
      workerId: input.workerId?.trim() || "worker-unspecified",
      workerName: input.workerName?.trim() || input.workerId?.trim() || "Unnamed Worker",
      skillIds,
      taxonomyVersion: this.catalog.taxonomyVersion,
      parentChains,
      proficiencyLevels,
      taxonomyDecision: worst,
      rulesApplied: unique(allApplied),
      rulesSatisfied: unique(allSatisfied),
      rulesFailed: unique(allFailed),
      validationStatus:
        worst === "valid" ? "passed" : worst === "partially_valid" ? "partial" : "failed",
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
    appendStxLog({
      event: "derive_worker_skills",
      details: `id=${record.derivationId} worker=${record.workerId} skills=${record.skillIds.join(",")}`,
    });
    this.metadata.generate(this.store.skillCount(), this.store.count());
    return this.report(
      "derive_worker_skills",
      this.getCatalog(),
      this.store.listSkills(),
      [record],
      record.taxonomyDecision,
      record.rulesFailed,
      validation,
      started,
    );
  }

  validateHierarchy(input: SkillTaxonomyInput, config: SkillTaxonomyConfiguration) {
    if (!config.hierarchyRulesEnabled) {
      return this.disabled("validate_hierarchy", config, "Hierarchy rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_hierarchy", input, config, started);
    }
    return this.runEvaluate("validate_hierarchy", input, config, started);
  }

  validateProficiency(input: SkillTaxonomyInput, config: SkillTaxonomyConfiguration) {
    if (!config.proficiencyRulesEnabled) {
      return this.disabled("validate_proficiency", config, "Proficiency rules are disabled");
    }
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_proficiency", input, config, started);
    }
    return this.runEvaluate("validate_proficiency", input, config, started);
  }

  produceTaxonomy(input: SkillTaxonomyInput, config: SkillTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_taxonomy", input, config, started);
    }
    return this.runEvaluate("produce_taxonomy", input, config, started);
  }

  list(config: SkillTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listSkills());
    const records = this.store.listRecords();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listSkills(),
            { validated: true },
            started,
          )
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listSkills(),
      records,
      latest?.taxonomyDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  validate(input: SkillTaxonomyInput, config: SkillTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listSkills());
    const records = this.store.listRecords();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listSkills(),
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
      this.store.listSkills(),
      records,
      latest?.taxonomyDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: SkillTaxonomyConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.listSkills());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Skill Taxonomy is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendStxLog({
      event: "diagnostics",
      details: `skills=${this.store.skillCount()} categories=${this.store.categoryCount()} derivations=${this.store.count()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listSkills(),
      this.store.listRecords(),
      latest?.taxonomyDecision ?? null,
      latest?.rulesFailed ?? [],
      validation,
      started,
    );
  }

  private runEvaluate(
    action: SkillTaxonomyRunReport["action"],
    input: SkillTaxonomyInput,
    config: SkillTaxonomyConfiguration,
    started: number,
  ): SkillTaxonomyRunReport {
    if (!config.enabled) {
      return this.disabled(action, config, "Skill Taxonomy is disabled");
    }
    const evaluation = this.builder.evaluate(input, config, this.store.listSkills());
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listSkills(),
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
    appendStxLog({
      event: action,
      details: `decision=${evaluation.taxonomyDecision} skills=${evaluation.skillsRegistered.length} hierarchy=${evaluation.hierarchyValidated} proficiency=${evaluation.proficiencyValidated}`,
    });
    this.metadata.generate(this.store.skillCount(), this.store.count());
    return this.report(
      action,
      this.getCatalog(),
      this.store.listSkills(),
      this.store.listRecords(),
      evaluation.taxonomyDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: SkillTaxonomyRunReport["action"],
    input: SkillTaxonomyInput,
    config: SkillTaxonomyConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRecords(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listSkills(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: SkillTaxonomyRunReport["action"],
    config: SkillTaxonomyConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listSkills(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: SkillTaxonomyInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceRoleTaxonomy === true ||
      input.replaceWorkforceCapabilityRegistry === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: SkillTaxonomyConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastTaxonomyDecision: TaxonomyDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `stx-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SKILL_TAXONOMY_ID,
      engineVersion: "PILLOW-STX-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...STX_CAPABILITIES],
      taxonomyVersion: config.taxonomyVersion,
      totalSkills: this.store.skillCount(),
      totalDerivationRecords: this.store.count(),
      categoryCount: this.store.categoryCount(),
      proficiencyLevelCount: config.proficiencyLevels.length,
      lastTaxonomyDecision:
        lastTaxonomyDecision ?? this.getLatestRecord()?.taxonomyDecision ?? null,
      metadataVersion: STX_METADATA_VERSION,
    };
  }

  private report(
    action: SkillTaxonomyRunReport["action"],
    catalog: SkillTaxonomyCatalog | null,
    skills: SkillDefinition[],
    derivationRecords: WorkerSkillBinding[],
    taxonomyDecision: TaxonomyDecision | string | null,
    rulesFailed: string[],
    validation: SkillTaxonomyRunReport["validation"],
    started: number,
  ): SkillTaxonomyRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      taxonomyRunReportId: `stx-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      skills,
      derivationRecords,
      taxonomyDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: STX_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneCatalog(catalog: SkillTaxonomyCatalog): SkillTaxonomyCatalog {
  return {
    ...catalog,
    categories: [...catalog.categories],
    proficiencyLevels: [...catalog.proficiencyLevels],
    skills: catalog.skills.map((s) => ({
      ...s,
      requiredTools: [...s.requiredTools],
      capabilityLimits: [...s.capabilityLimits],
      validationRules: [...s.validationRules],
      certificationRequirements: [...s.certificationRequirements],
      requiredKnowledge: [...s.requiredKnowledge],
      dependencies: [...s.dependencies],
      prerequisites: [...s.prerequisites],
    })),
  };
}
