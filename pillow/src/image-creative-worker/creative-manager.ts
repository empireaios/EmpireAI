import type { ImageCreativeWorkerConfiguration } from "./configuration.js";
import { CreativeBuilder } from "./creative-builder.js";
import { CreativeStore } from "./creative-store.js";
import { CreativeValidator, HealthMonitor, RecoveryManager } from "./creative-validator.js";
import {
  IntegrationCoordinator,
  type ImageCreativeWorkerDependencies,
} from "./integrations.js";
import { appendIcwLog } from "./icw-logging.js";
import {
  ICW_CAPABILITIES,
  ICW_METADATA_VERSION,
  IMAGE_CREATIVE_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  CreativeAssetReport,
  CreativeContext,
  ImageCreativeWorkerCatalog,
  ImageCreativeWorkerEngineRecord,
  ImageCreativeWorkerInput,
  ImageCreativeWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
  SourceAssetRef,
} from "./types.js";

export class CreativeManager {
  private engineRecord: ImageCreativeWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ImageCreativeWorkerCatalog | null = null;
  private readonly store = new CreativeStore();
  private readonly builder = new CreativeBuilder();
  private readonly validator = new CreativeValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: CreativeContext = {};

  bindIntegrations(deps: ImageCreativeWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ImageCreativeWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedCreativeAssetReports);
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

  getCreativeAssetReports() {
    return this.store.list();
  }

  getLatestCreativeAssetId() {
    return this.store.getLatestCreativeAssetId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return { ...this.context };
  }

  connect(
    _input: Record<string, unknown>,
    config: ImageCreativeWorkerConfiguration,
  ): ImageCreativeWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendIcwLog({
      event: "connect",
      details: `Image & Creative Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `icw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Image & Creative Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: ICW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveVisualResearchReport(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runStage("receive_visual_research_report", input, config, { receivedVisualResearch: true });
  }

  receiveThumbnailSpecifications(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runStage("receive_thumbnail_specifications", input, config, { receivedThumbnailSpecs: true });
  }

  generateOriginalGraphics(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runGeneration("generate_original_graphics", input, config, (ctx, seq) =>
      this.builder.generateOriginalGraphics(ctx, config, seq),
    );
  }

  editExistingImages(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.creativeRulesEnabled) {
      return this.disabled(
        "edit_existing_images",
        config,
        !config.enabled ? "Image & Creative Worker is disabled" : "Creative rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail("edit_existing_images", input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateCreative(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      return this.report("edit_existing_images", this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const sourceAssets = this.builder.normalizeSourceAssets(this.context.sourceAssets, seq);
    const editOperations = this.builder.recordEditOperations(sourceAssets, seq, this.context.editOperations);
    this.context = { ...this.context, sourceAssets, editOperations };
    const report = this.builder.buildCreativeAssetReport(enriched, config, this.context, {
      editOperations,
      includeVariants: false,
    });
    this.store.save(report, "edit_existing_images");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCreativeAssetReports([report], enriched, started);
    return this.report("edit_existing_images", this.getCatalog(), [report], report, validation, started);
  }

  createDiagramsAndInfographics(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runGeneration("create_diagrams_and_infographics", input, config, (ctx, seq) =>
      this.builder.createDiagramsAndInfographics(ctx, seq),
    );
  }

  createCoversAndBanners(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runGeneration("create_covers_and_banners", input, config, (ctx, seq) =>
      this.builder.createCoversAndBanners(ctx, seq),
    );
  }

  createSocialMediaAssets(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runGeneration("create_social_media_assets", input, config, (ctx, seq) =>
      this.builder.createSocialMediaAssets(ctx, seq),
    );
  }

  generateMultipleCreativeVariants(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runFullGeneration("generate_multiple_creative_variants", input, config);
  }

  validateAssetQualityAndCompliance(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("validate_asset_quality_and_compliance", input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (latest) {
      const sourceAssets = latest.sourceAssets.map((a) =>
        typeof a === "string"
          ? ({ assetId: a, assetPath: `assets/source/${a}.descriptor.json`, assetType: "reference_image" } as SourceAssetRef)
          : a,
      );
      const generated = latest.generatedAssets.map((a) =>
        typeof a === "string"
          ? ({
              assetId: a,
              assetPath: `assets/generated/${a}.descriptor.json`,
              assetType: latest.assetType,
              descriptor: `Asset ${a}`,
            })
          : a,
      );
      const { qualityStatus, complianceNotes } = this.builder.validateQualityAndCompliance(
        generated,
        sourceAssets,
        latest.editOperations,
      );
      this.store.save({ ...latest, qualityStatus, complianceNotes }, "validate_asset_quality_and_compliance");
    }
    const validation = this.validator.validateCreativeAssetReports(
      latest ? [this.store.list().at(-1)!] : null,
      enriched,
      started,
    );
    return this.report(
      "validate_asset_quality_and_compliance",
      this.getCatalog(),
      this.store.list(),
      this.store.list().at(-1) ?? null,
      validation,
      started,
    );
  }

  produceCreativeAssetReport(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    return this.runFullGeneration("produce_creative_asset_report", input, config);
  }

  submitReport(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.creativeAssetId) {
      const one = this.store.get(input.creativeAssetId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullGeneration("produce_creative_asset_report", input, config);
      reports = generated.creativeAssetReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.creativeAssetId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateCreativeAssetReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendIcwLog({
      event: "submit_report",
      details: `creativeAssetReports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: ImageCreativeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateCreativeAssetReports(
      reports.length ? reports : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), reports, latest, validation, started);
  }

  validate(input: ImageCreativeWorkerInput, config: ImageCreativeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateCreativeAssetReports(
      reports.length ? reports : null,
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
    return this.report("validate", this.getCatalog(), reports, latest, validation, started);
  }

  diagnostics(config: ImageCreativeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Image & Creative Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendIcwLog({ event: "diagnostics", details: `creativeAssetReports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runStage(
    action: ImageCreativeWorkerRunReport["action"],
    input: ImageCreativeWorkerInput,
    config: ImageCreativeWorkerConfiguration,
    flags: { receivedVisualResearch?: boolean; receivedThumbnailSpecs?: boolean },
  ): ImageCreativeWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.creativeRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Image & Creative Worker is disabled" : "Creative rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    if (flags.receivedVisualResearch) this.context = { ...this.context, receivedVisualResearch: true };
    if (flags.receivedThumbnailSpecs) this.context = { ...this.context, receivedThumbnailSpecs: true };
    const validation = this.validator.validateCreativeAssetReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendIcwLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"} vrw=${Boolean(this.context.receivedVisualResearch)} thw=${Boolean(this.context.receivedThumbnailSpecs)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runGeneration(
    action: ImageCreativeWorkerRunReport["action"],
    input: ImageCreativeWorkerInput,
    config: ImageCreativeWorkerConfiguration,
    generate: (ctx: CreativeContext, seq: number) => unknown[],
  ): ImageCreativeWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.creativeRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Image & Creative Worker is disabled" : "Creative rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateCreative(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const generated = generate(this.context, seq);
    const report = this.builder.buildCreativeAssetReport(enriched, config, this.context, {
      generatedAssets: generated as ReturnType<CreativeBuilder["generateOriginalGraphics"]>,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCreativeAssetReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", report);
    appendIcwLog({
      event: action,
      details: `creativeAsset=${report.creativeAssetId} script=${report.scriptId} generated=${report.generatedAssets.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFullGeneration(
    action: ImageCreativeWorkerRunReport["action"],
    input: ImageCreativeWorkerInput,
    config: ImageCreativeWorkerConfiguration,
  ): ImageCreativeWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.creativeRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Image & Creative Worker is disabled" : "Creative rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateCreative(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildCreativeAssetReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCreativeAssetReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendIcwLog({
      event: action,
      details: `creativeAsset=${report.creativeAssetId} script=${report.scriptId} variants=${report.variantCount}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: ImageCreativeWorkerRunReport["action"],
    input: ImageCreativeWorkerInput,
    config: ImageCreativeWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateCreativeAssetReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ImageCreativeWorkerRunReport["action"],
    config: ImageCreativeWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ImageCreativeWorkerInput) {
    return (
      input.assembleVideos === true ||
      input.generateVoiceovers === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ410OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ImageCreativeWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: CreativeAssetReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `icw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: IMAGE_CREATIVE_WORKER_ID,
      engineVersion: "PILLOW-ICW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...ICW_CAPABILITIES],
      totalCreativeAssetReports: this.store.count(),
      lastCreativeAssetId: report?.creativeAssetId ?? this.store.getLatestCreativeAssetId(),
      lastScriptId: report?.scriptId ?? null,
      lastAssetType: report?.assetType ?? null,
      lastVariantCount: report?.variantCount ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: ICW_METADATA_VERSION,
    };
  }

  private report(
    action: ImageCreativeWorkerRunReport["action"],
    catalog: ImageCreativeWorkerCatalog | null,
    creativeAssetReports: CreativeAssetReport[],
    latestCreativeAssetReport: CreativeAssetReport | null,
    validation: ImageCreativeWorkerRunReport["validation"],
    started: number,
  ): ImageCreativeWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      creativeRunReportId: `icw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      creativeAssetReports,
      latestCreativeAssetReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ICW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: ImageCreativeWorkerCatalog): ImageCreativeWorkerCatalog {
  return {
    ...catalog,
    creativeAssetReports: catalog.creativeAssetReports.map((r) => ({
      ...r,
      sourceAssets: [...r.sourceAssets],
      generatedAssets: [...r.generatedAssets],
      editOperations: r.editOperations.map((e) => ({ ...e })),
      variants: r.variants.map((v) => ({ ...v })),
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
