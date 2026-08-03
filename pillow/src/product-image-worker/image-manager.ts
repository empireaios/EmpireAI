import type { ProductImageWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type ProductImageWorkerDependencies,
} from "./integrations.js";
import { appendPiwLog } from "./piw-logging.js";
import {
  INTEGRATION_TARGETS,
  PIW_CAPABILITIES,
  PIW_METADATA_VERSION,
  PRODUCT_IMAGE_WORKER_ID,
} from "./paths.js";
import { ImageBuilder } from "./image-builder.js";
import { ImageStore } from "./image-store.js";
import { HealthMonitor, ImageValidator, RecoveryManager } from "./image-validator.js";
import type {
  IntegrationHandshake,
  OperationalState,
  ProductImageReport,
  ProductImageWorkerCatalog,
  ProductImageWorkerEngineRecord,
  ProductImageWorkerInput,
  ProductImageWorkerRunReport,
  SourceImageInput,
} from "./types.js";

export class ImageManager {
  private engineRecord: ProductImageWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ProductImageWorkerCatalog | null = null;
  private readonly store = new ImageStore();
  private readonly builder = new ImageBuilder();
  private readonly validator = new ImageValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingImages: SourceImageInput[] = [];
  private pendingContext: ProductImageWorkerInput = {};

  bindIntegrations(deps: ProductImageWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ProductImageWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedImageReports);
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

  getImageReports() {
    return this.store.list();
  }

  getLatestImageReportId() {
    return this.store.getLatestImageReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: ProductImageWorkerConfiguration,
  ): ProductImageWorkerRunReport {
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
    appendPiwLog({
      event: "connect",
      details: `Product Image Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `piw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Product Image Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PIW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedImages(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_approved_images", input, config, started);
    }
    const enriched = this.integrations.enrichFromEvaluations(input);
    const images = this.builder.resolveSourceImages(enriched);
    this.pendingImages = images;
    this.pendingContext = enriched;
    if (!images.length) {
      return this.disabled(
        "receive_approved_images",
        config,
        "No approved supplier images received — provide sourceImages",
      );
    }
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received ${images.length} approved supplier image(s)`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendPiwLog({
      event: "receive_approved_images",
      details: `images=${images.length}`,
    });
    return this.report(
      "receive_approved_images",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  validateImageQuality(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("validate_image_quality", input, config);
  }

  detectDuplicates(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("detect_duplicates", input, config);
  }

  organizeImageSets(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("organize_image_sets", input, config);
  }

  prepareCompliantImages(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("prepare_compliant_images", input, config);
  }

  generateVariants(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("generate_variants", input, config);
  }

  preserveMetadata(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("preserve_metadata", input, config);
  }

  validateCompliance(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("validate_compliance", input, config);
  }

  packageAssets(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("package_assets", input, config);
  }

  produceReport(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    return this.runProcessing("produce_report", input, config);
  }

  submitFindings(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_findings", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_findings",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let reports = this.store.list();
    if (input.imageReportId) {
      const one = this.store.get(input.imageReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runProcessing("produce_report", input, config);
      reports = generated.imageReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.imageReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
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
    appendPiwLog({
      event: "submit_findings",
      details: `reports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: ProductImageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
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

  validate(input: ProductImageWorkerInput, config: ProductImageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
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

  diagnostics(config: ProductImageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Product Image Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPiwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runProcessing(
    action: ProductImageWorkerRunReport["action"],
    input: ProductImageWorkerInput,
    config: ProductImageWorkerConfiguration,
  ): ProductImageWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.imageRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Product Image Worker is disabled"
          : "Image rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromEvaluations({
      ...this.pendingContext,
      ...input,
      sourceImages: input.sourceImages?.length
        ? input.sourceImages
        : this.pendingContext.sourceImages ?? this.pendingImages,
    });
    const images = this.builder.resolveSourceImages(enriched);
    if (!images.length) {
      return this.disabled(
        action,
        config,
        "Image processing requires approved supplier images (sourceImages)",
      );
    }
    this.pendingImages = images;
    this.pendingContext = enriched;

    const report = this.builder.buildReport(enriched, config, images);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReports(
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
    appendPiwLog({
      event: action,
      details: `report=${report.imageReportId} quality=${report.imageQualityStatus} compliance=${report.complianceStatus}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: ProductImageWorkerRunReport["action"],
    input: ProductImageWorkerInput,
    config: ProductImageWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ProductImageWorkerRunReport["action"],
    config: ProductImageWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ProductImageWorkerInput) {
    return (
      input.publishListings === true ||
      input.generateAdvertisements === true ||
      input.contactSuppliers === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ308OrLater === true ||
      input.overwriteOriginalSourceAssets === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ProductImageWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ProductImageReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `piw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PRODUCT_IMAGE_WORKER_ID,
      engineVersion: "PILLOW-PIW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PIW_CAPABILITIES],
      totalImageReports: this.store.count(),
      lastImageQualityStatus: report?.imageQualityStatus ?? null,
      lastComplianceStatus: report?.complianceStatus ?? null,
      lastImageReportId: report?.imageReportId ?? this.store.getLatestImageReportId(),
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PIW_METADATA_VERSION,
    };
  }

  private report(
    action: ProductImageWorkerRunReport["action"],
    catalog: ProductImageWorkerCatalog | null,
    imageReports: ProductImageReport[],
    latestImageReport: ProductImageReport | null,
    validation: ProductImageWorkerRunReport["validation"],
    started: number,
  ): ProductImageWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      imageRunReportId: `piw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      imageReports,
      latestImageReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PIW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: ProductImageWorkerCatalog): ProductImageWorkerCatalog {
  return {
    ...catalog,
    imageReports: catalog.imageReports.map((report) => ({
      ...report,
      sourceImages: report.sourceImages.map((s) => ({ ...s })),
      processedImages: report.processedImages.map((p) => ({
        ...p,
        qualityNotes: [...p.qualityNotes],
        originalPreserved: true,
      })),
      imageVariants: report.imageVariants.map((v) => ({ ...v })),
      marketplaceTargets: [...report.marketplaceTargets],
      duplicateImageIds: [...report.duplicateImageIds],
      unusableImageIds: [...report.unusableImageIds],
      preservedMetadata: report.preservedMetadata.map((m) => ({ ...m })),
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
