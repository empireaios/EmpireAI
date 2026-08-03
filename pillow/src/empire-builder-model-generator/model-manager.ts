import type { EmpireBuilderModelGeneratorConfiguration } from "./configuration.js";
import { ModelBuilder } from "./model-builder.js";
import { ModelStore } from "./model-store.js";
import { HealthMonitor, ModelValidator, RecoveryManager } from "./model-validator.js";
import { appendEmgLog } from "./emg-logging.js";
import {
  EMG_CAPABILITIES,
  EMG_METADATA_VERSION,
  EMPIRE_BUILDER_MODEL_GENERATOR_ID,
} from "./paths.js";
import type {
  EmpireBuilderBusinessModel,
  EmpireBuilderModelGeneratorCatalog,
  EmpireBuilderModelGeneratorEngineRecord,
  EmpireBuilderModelGeneratorInput,
  EmpireBuilderModelGeneratorRunReport,
  OperationalState,
} from "./types.js";

export class EmpireBuilderModelGeneratorManager {
  private engineRecord: EmpireBuilderModelGeneratorEngineRecord | null = null;
  private seeded = false;
  private catalog: EmpireBuilderModelGeneratorCatalog | null = null;
  private readonly store = new ModelStore();
  private readonly builder = new ModelBuilder();
  private readonly validator = new ModelValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: EmpireBuilderModelGeneratorConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedModels);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
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

  getModels() {
    return this.store.list();
  }

  getLatestModelId() {
    return this.store.getLatestModelId();
  }

  connect(
    _input: Record<string, unknown>,
    config: EmpireBuilderModelGeneratorConfiguration,
  ): EmpireBuilderModelGeneratorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendEmgLog({
      event: "connect",
      details: "Empire Builder Model Generator connected; blueprint-only mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `emg-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Empire Builder Model Generator is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EMG_METADATA_VERSION,
      },
      started,
    );
  }

  receiveIntent(
    input: EmpireBuilderModelGeneratorInput,
    config: EmpireBuilderModelGeneratorConfiguration,
  ) {
    return this.runGenerate("receive_intent", input, config);
  }

  generateModel(
    input: EmpireBuilderModelGeneratorInput,
    config: EmpireBuilderModelGeneratorConfiguration,
  ) {
    return this.runGenerate("generate_model", input, config);
  }

  produce(
    input: EmpireBuilderModelGeneratorInput,
    config: EmpireBuilderModelGeneratorConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce", input, config, started);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const models = this.store.list();
    const latest = models[models.length - 1] ?? null;
    const validation = this.validator.validateModels(
      models.length ? models : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendEmgLog({ event: "produce", details: `models=${this.store.count()}` });
    return this.report("produce", this.getCatalog(), models, latest, validation, started);
  }

  list(config: EmpireBuilderModelGeneratorConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const models = this.store.list();
    const latest = models[models.length - 1] ?? null;
    const validation = this.validator.validateModels(
      models.length ? models : null,
      { validated: true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("list", this.getCatalog(), models, latest, validation, started);
  }

  validate(
    input: EmpireBuilderModelGeneratorInput,
    config: EmpireBuilderModelGeneratorConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const models = this.store.list();
    const latest = models[models.length - 1] ?? null;
    const validation = this.validator.validateModels(
      models.length ? models : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("validate", this.getCatalog(), models, latest, validation, started);
  }

  diagnostics(config: EmpireBuilderModelGeneratorConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Empire Builder Model Generator is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendEmgLog({ event: "diagnostics", details: `models=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runGenerate(
    action: EmpireBuilderModelGeneratorRunReport["action"],
    input: EmpireBuilderModelGeneratorInput,
    config: EmpireBuilderModelGeneratorConfiguration,
  ): EmpireBuilderModelGeneratorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.generationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Empire Builder Model Generator is disabled"
          : "Generation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const intent = this.builder.resolveIntent(input);
    if (
      !intent.businessType &&
      !intent.businessIdea &&
      !intent.originalCommand &&
      !input.businessType
    ) {
      return this.disabled(
        action,
        config,
        "Structured Business Intent fields are required (businessType, businessIdea, or originalCommand)",
      );
    }

    const model = this.builder.generate(input, config);
    this.store.save(model);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.validateModels(
      [model],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", model);
    appendEmgLog({
      event: action,
      details: `model=${model.businessModelId} type=${model.businessType} modelType=${model.businessModelType}`,
    });
    return this.report(action, this.getCatalog(), [model], model, validation, started);
  }

  private boundaryFail(
    action: EmpireBuilderModelGeneratorRunReport["action"],
    input: EmpireBuilderModelGeneratorInput,
    config: EmpireBuilderModelGeneratorConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateModels(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: EmpireBuilderModelGeneratorRunReport["action"],
    config: EmpireBuilderModelGeneratorConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: EmpireBuilderModelGeneratorInput) {
    return (
      input.validateDemand === true ||
      input.performMarketResearch === true ||
      input.buildBranding === true ||
      input.assignWorkers === true ||
      input.launchBusiness === true ||
      input.implementQ204OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: EmpireBuilderModelGeneratorConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: EmpireBuilderBusinessModel | null = null,
  ) {
    const model = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `emg-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EMPIRE_BUILDER_MODEL_GENERATOR_ID,
      engineVersion: "PILLOW-EMG-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...EMG_CAPABILITIES],
      totalModels: this.store.count(),
      lastBusinessType: model?.businessType ?? null,
      lastBusinessModelId: model?.businessModelId ?? this.store.getLatestModelId(),
      metadataVersion: EMG_METADATA_VERSION,
    };
  }

  private report(
    action: EmpireBuilderModelGeneratorRunReport["action"],
    catalog: EmpireBuilderModelGeneratorCatalog | null,
    models: EmpireBuilderBusinessModel[],
    latestModel: EmpireBuilderBusinessModel | null,
    validation: EmpireBuilderModelGeneratorRunReport["validation"],
    started: number,
  ): EmpireBuilderModelGeneratorRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      modelRunReportId: `emg-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      models,
      latestModel,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EMG_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: EmpireBuilderModelGeneratorCatalog,
): EmpireBuilderModelGeneratorCatalog {
  return {
    ...catalog,
    businessModelTypes: [...catalog.businessModelTypes],
    models: catalog.models.map((model) => ({
      ...model,
      productsServices: [...model.productsServices],
      customerSegments: [...model.customerSegments],
      requiredCapabilities: [...model.requiredCapabilities],
      requiredIntegrations: [...model.requiredIntegrations],
      businessAssumptions: [...model.businessAssumptions],
    })),
  };
}
