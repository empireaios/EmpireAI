import type { BusinessBlueprintWorkerConfiguration } from "./configuration.js";
import { BlueprintBuilder } from "./blueprint-builder.js";
import { BlueprintStore } from "./blueprint-store.js";
import {
  BlueprintValidator,
  HealthMonitor,
  RecoveryManager,
} from "./blueprint-validator.js";
import {
  IntegrationCoordinator,
  type BusinessBlueprintWorkerDependencies,
} from "./integrations.js";
import { appendBbwLog } from "./bbw-logging.js";
import {
  BBW_CAPABILITIES,
  BBW_METADATA_VERSION,
  BUSINESS_BLUEPRINT_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  BusinessBlueprint,
  BusinessBlueprintWorkerCatalog,
  BusinessBlueprintWorkerEngineRecord,
  BusinessBlueprintWorkerInput,
  BusinessBlueprintWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class BlueprintManager {
  private engineRecord: BusinessBlueprintWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: BusinessBlueprintWorkerCatalog | null = null;
  private readonly store = new BlueprintStore();
  private readonly builder = new BlueprintBuilder();
  private readonly validator = new BlueprintValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingModel: BusinessBlueprintWorkerInput["businessModel"] = null;
  private pendingResearch: BusinessBlueprintWorkerInput["marketResearch"] = null;
  private pendingEvaluation: BusinessBlueprintWorkerInput["opportunityEvaluation"] =
    null;

  bindIntegrations(deps: BusinessBlueprintWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: BusinessBlueprintWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedBlueprints);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getBlueprints() {
    return this.store.list();
  }

  getLatestBlueprintId() {
    return this.store.getLatestBlueprintId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: BusinessBlueprintWorkerConfiguration,
  ): BusinessBlueprintWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendBbwLog({
      event: "connect",
      details: `Business Blueprint Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `bbw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Business Blueprint Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BBW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveBusinessModel(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    this.pendingModel = input.businessModel ?? this.pendingModel;
    return this.runBlueprint("receive_business_model", input, config, "partial");
  }

  receiveMarketResearch(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    this.pendingResearch = input.marketResearch ?? this.pendingResearch;
    return this.runBlueprint("receive_market_research", input, config, "partial");
  }

  receiveOpportunityEvaluation(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    this.pendingEvaluation = input.opportunityEvaluation ?? this.pendingEvaluation;
    return this.runBlueprint("receive_opportunity_evaluation", input, config, "partial");
  }

  consolidate(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    return this.runBlueprint("consolidate", input, config);
  }

  defineArchitecture(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    return this.runBlueprint("define_architecture", input, config);
  }

  defineWorkflow(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    return this.runBlueprint("define_workflow", input, config);
  }

  defineWorkers(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    return this.runBlueprint("define_workers", input, config);
  }

  defineMilestones(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    return this.runBlueprint("define_milestones", input, config);
  }

  produceBlueprint(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    return this.runBlueprint("produce_blueprint", input, config);
  }

  submitBlueprint(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_blueprint", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_blueprint",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let blueprint =
      (input.blueprintId ? this.store.get(input.blueprintId) : null) ??
      this.store.list().at(-1) ??
      null;
    if (!blueprint) {
      const generated = this.runBlueprint("produce_blueprint", input, config);
      blueprint = generated.latestBlueprint;
      if (!blueprint || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitBlueprint(blueprint);
    if (submission.submitted && submission.executiveReportId) {
      blueprint =
        this.store.markSubmitted(blueprint.blueprintId, submission.executiveReportId) ??
        blueprint;
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateBlueprints(
      blueprint ? [blueprint] : null,
      { ...input, validated: input.validated ?? true },
      started,
      { requireProceedRecommendation: false },
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      blueprint,
    );
    appendBbwLog({
      event: "submit_blueprint",
      details: `blueprint=${blueprint?.blueprintId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_blueprint",
      this.getCatalog(),
      blueprint ? [blueprint] : [],
      blueprint,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: BusinessBlueprintWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const blueprints = this.store.list();
    const latest = blueprints[blueprints.length - 1] ?? null;
    const validation = this.validator.validateBlueprints(
      blueprints.length ? blueprints : null,
      { validated: true },
      started,
      { requireProceedRecommendation: false },
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), blueprints, latest, validation, started);
  }

  validate(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const blueprints = this.store.list();
    const latest = blueprints[blueprints.length - 1] ?? null;
    const validation = this.validator.validateBlueprints(
      blueprints.length ? blueprints : null,
      { ...input, validated: input.validated ?? true },
      started,
      { requireProceedRecommendation: false },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), blueprints, latest, validation, started);
  }

  diagnostics(config: BusinessBlueprintWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Business Blueprint Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendBbwLog({ event: "diagnostics", details: `blueprints=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runBlueprint(
    action: BusinessBlueprintWorkerRunReport["action"],
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
    mode: "full" | "partial" = "full",
  ): BusinessBlueprintWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.blueprintRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Business Blueprint Worker is disabled"
          : "Blueprint rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const merged: BusinessBlueprintWorkerInput = {
      ...input,
      businessModel: input.businessModel ?? this.pendingModel,
      marketResearch: input.marketResearch ?? this.pendingResearch,
      opportunityEvaluation: input.opportunityEvaluation ?? this.pendingEvaluation,
    };
    if (merged.businessModel) this.pendingModel = merged.businessModel;
    if (merged.marketResearch) this.pendingResearch = merged.marketResearch;
    if (merged.opportunityEvaluation) this.pendingEvaluation = merged.opportunityEvaluation;

    const hasModel = !!merged.businessModel;
    const hasResearch = !!merged.marketResearch;
    const hasEvaluation = !!merged.opportunityEvaluation;

    if (mode === "partial") {
      if (!hasModel && !hasResearch && !hasEvaluation) {
        return this.disabled(
          action,
          config,
          "Receive actions require a businessModel, marketResearch, or opportunityEvaluation payload",
        );
      }
      if (!hasModel || !hasResearch || !hasEvaluation) {
        const missing = [
          !hasModel ? "businessModel" : "",
          !hasResearch ? "marketResearch" : "",
          !hasEvaluation ? "opportunityEvaluation" : "",
        ].filter(Boolean);
        const validation = this.validator.finalize(
          "partial",
          [],
          [`Received partial inputs; still awaiting: ${missing.join(", ")}`],
          started,
        );
        this.ensureRecord("active", config, "partial");
        appendBbwLog({
          event: action,
          details: `partial_receive model=${hasModel} research=${hasResearch} evaluation=${hasEvaluation}`,
        });
        return this.report(action, this.getCatalog(), [], null, validation, started);
      }
    }

    if (!hasModel || !hasResearch || !hasEvaluation) {
      return this.disabled(
        action,
        config,
        "Blueprint production requires businessModel, marketResearch, and opportunityEvaluation from prior Q2 workers",
      );
    }

    const recommendation = String(
      merged.opportunityEvaluation?.recommendation ?? "",
    ).toLowerCase();
    const approved =
      merged.opportunityApproved === true || recommendation === "proceed";
    if (config.requireProceedRecommendation && !approved) {
      return this.disabled(
        action,
        config,
        "Business Blueprint Worker requires an approved opportunity (Proceed recommendation or opportunityApproved=true)",
      );
    }

    const blueprint = this.builder.build(merged, config);
    this.store.saveCanonical(blueprint, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateBlueprints(
      [blueprint],
      { ...merged, validated: merged.validated ?? true },
      started,
      { requireProceedRecommendation: config.requireProceedRecommendation },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      blueprint,
    );
    appendBbwLog({
      event: action,
      details: `blueprint=${blueprint.blueprintId} workers=${blueprint.requiredWorkers.length} milestones=${blueprint.milestones.length}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [blueprint],
      blueprint,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: BusinessBlueprintWorkerRunReport["action"],
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateBlueprints(null, input, started, {
      requireProceedRecommendation: false,
    });
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: BusinessBlueprintWorkerRunReport["action"],
    config: BusinessBlueprintWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: BusinessBlueprintWorkerInput) {
    return (
      input.executeBusiness === true ||
      input.launchProducts === true ||
      input.createBranding === true ||
      input.buildWebsites === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ207OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: BusinessBlueprintWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: BusinessBlueprint | null = null,
  ) {
    const blueprint = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `bbw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_BLUEPRINT_WORKER_ID,
      engineVersion: "PILLOW-BBW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...BBW_CAPABILITIES],
      totalBlueprints: this.store.count(),
      lastBusinessType: blueprint?.businessType ?? null,
      lastBlueprintId: blueprint?.blueprintId ?? this.store.getLatestBlueprintId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: BBW_METADATA_VERSION,
    };
  }

  private report(
    action: BusinessBlueprintWorkerRunReport["action"],
    catalog: BusinessBlueprintWorkerCatalog | null,
    blueprints: BusinessBlueprint[],
    latestBlueprint: BusinessBlueprint | null,
    validation: BusinessBlueprintWorkerRunReport["validation"],
    started: number,
  ): BusinessBlueprintWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      blueprintRunReportId: `bbw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      blueprints,
      latestBlueprint,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BBW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: BusinessBlueprintWorkerCatalog,
): BusinessBlueprintWorkerCatalog {
  return {
    ...catalog,
    blueprints: catalog.blueprints.map((blueprint) => ({
      ...blueprint,
      productsServices: [...blueprint.productsServices],
      customerSegments: [...blueprint.customerSegments],
      requiredIntegrations: [...blueprint.requiredIntegrations],
      requiredAssets: [...blueprint.requiredAssets],
      preservedDecisions: [...blueprint.preservedDecisions],
      traceabilityRefs: [...blueprint.traceabilityRefs],
      operationalWorkflow: blueprint.operationalWorkflow.map((s) => ({
        ...s,
        dependsOn: [...s.dependsOn],
      })),
      requiredWorkers: blueprint.requiredWorkers.map((w) => ({
        ...w,
        skills: [...w.skills],
      })),
      milestones: blueprint.milestones.map((m) => ({
        ...m,
        dependsOn: [...m.dependsOn],
        successCriteria: [...m.successCriteria],
      })),
      dependencies: blueprint.dependencies.map((d) => ({
        ...d,
        blocks: [...d.blocks],
      })),
      businessArchitecture: {
        ...blueprint.businessArchitecture,
        deliveryChannels: [...blueprint.businessArchitecture.deliveryChannels],
        customerProblemsAddressed: [
          ...blueprint.businessArchitecture.customerProblemsAddressed,
        ],
      },
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
