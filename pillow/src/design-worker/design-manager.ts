import type { DesignWorkerConfiguration } from "./configuration.js";
import { DesignBuilder } from "./design-builder.js";
import { DesignStore } from "./design-store.js";
import { DesignValidator, HealthMonitor, RecoveryManager } from "./design-validator.js";
import {
  IntegrationCoordinator,
  type DesignWorkerDependencies,
} from "./integrations.js";
import { appendDwLog } from "./dw-logging.js";
import {
  DESIGN_WORKER_ID,
  DW_CAPABILITIES,
  DW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  DesignContext,
  DesignWorkerCatalog,
  DesignWorkerEngineRecord,
  DesignWorkerInput,
  DesignWorkerReport,
  DesignWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class DesignManager {
  private engineRecord: DesignWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: DesignWorkerCatalog | null = null;
  private readonly store = new DesignStore();
  private readonly builder = new DesignBuilder();
  private readonly validator = new DesignValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: DesignContext = {};

  bindIntegrations(deps: DesignWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: DesignWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedDesignReports);
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

  getDesignReports() {
    return this.store.list();
  }

  getLatestDesignReportId() {
    return this.store.getLatestDesignReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return {
      ...this.context,
      customerPainPoints: [...(this.context.customerPainPoints ?? [])],
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: DesignWorkerConfiguration,
  ): DesignWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendDwLog({
      event: "connect",
      details: `Design Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `dw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Design Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: DW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedDigitalProductInformation(
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.designRulesEnabled) {
      return this.disabled(
        "receive_approved_digital_product_information",
        config,
        !config.enabled ? "Design Worker is disabled" : "Design rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(
        "receive_approved_digital_product_information",
        input,
        config,
        started,
      );
    }
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    this.context = {
      ...this.context,
      receivedProductInformation: true,
      productType: this.builder.normalizeProductType(
        enriched.productType ?? this.context.productType ?? config.defaultProductType,
      ),
      brandingTheme: enriched.brandingTheme ?? this.context.brandingTheme ?? null,
    };
    // Always materialize a fresh design report shell for newly received product information.
    const report = this.builder.createDesignReportShell(enriched, config, this.context);
    this.store.save(report, "receive_approved_digital_product_information");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateDesignReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteDesign: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendDwLog({
      event: "receive_approved_digital_product_information",
      details: `researchReportId=${report.researchReportId ?? "none"} designReport=${report.designReportId} type=${report.productType}`,
    });
    return this.report(
      "receive_approved_digital_product_information",
      this.getCatalog(),
      [report],
      report,
      validation,
      started,
    );
  }

  /** Factory-consistency alias — same intake as receiveApprovedDigitalProductInformation. */
  receiveApprovedDigitalProductResearch(
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
  ) {
    return this.receiveApprovedDigitalProductInformation(input, config);
  }

  generateEbookCovers(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runContentStage("generate_ebook_covers", input, config, (report) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const ebookCovers = this.builder.generateEbookCovers(this.context, assetCount);
      return {
        ...report,
        ebookCovers,
        assetTypesCreated: uniqueAssetTypes(report, ebookCovers.map((a) => a.assetType)),
        allAssets: mergeAllAssets(report, ebookCovers, "ebook_cover"),
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dw-dec-ebook-${Date.now()}`,
            topic: report.productTitle,
            decision: `Generated ${ebookCovers.length} ebook cover structural assets`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generateCourseCovers(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runContentStage("generate_course_covers", input, config, (report) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const courseCovers = this.builder.generateCourseCovers(this.context, assetCount);
      return {
        ...report,
        courseCovers,
        assetTypesCreated: uniqueAssetTypes(report, courseCovers.map((a) => a.assetType)),
        allAssets: mergeAllAssets(report, courseCovers, "course_cover"),
      };
    });
  }

  generateProductBrandingAssets(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runContentStage("generate_product_branding_assets", input, config, (report) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const brandingAssets = this.builder.generateProductBrandingAssets(this.context, assetCount);
      return {
        ...report,
        brandingAssets,
        brandingTheme: report.brandingTheme || this.context.brandingTheme || report.brandingTheme,
        assetTypesCreated: uniqueAssetTypes(report, brandingAssets.map((a) => a.assetType)),
        allAssets: mergeAllAssets(report, brandingAssets, "branding_assets", "product_icons"),
      };
    });
  }

  generatePromotionalGraphics(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runContentStage("generate_promotional_graphics", input, config, (report) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const promotionalGraphics = this.builder.generatePromotionalGraphics(
        this.context,
        assetCount,
      );
      return {
        ...report,
        promotionalGraphics,
        assetTypesCreated: uniqueAssetTypes(
          report,
          promotionalGraphics.map((a) => a.assetType),
        ),
        allAssets: mergeAllAssets(report, promotionalGraphics, "promotional_graphics"),
      };
    });
  }

  generateRealisticProductMockups(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runContentStage(
      "generate_realistic_product_mockups",
      input,
      config,
      (report) => {
        const assetCount = input.assetCount ?? config.defaultAssetCount;
        const mockupAssets = this.builder.generateRealisticProductMockups(
          this.context,
          assetCount,
        );
        return {
          ...report,
          mockupAssets,
          assetTypesCreated: uniqueAssetTypes(report, mockupAssets.map((a) => a.assetType)),
          allAssets: mergeAllAssets(report, mockupAssets, "mockups"),
        };
      },
    );
  }

  generatePreviewImages(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runContentStage("generate_preview_images", input, config, (report) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const previewAssets = this.builder.generatePreviewImages(this.context, assetCount);
      return {
        ...report,
        previewAssets,
        assetTypesCreated: uniqueAssetTypes(report, previewAssets.map((a) => a.assetType)),
        allAssets: mergeAllAssets(report, previewAssets, "preview_images"),
      };
    });
  }

  maintainVisualBrandingConsistency(
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
  ) {
    return this.runContentStage(
      "maintain_visual_branding_consistency",
      input,
      config,
      (report) => {
        const consistency = this.builder.maintainVisualBrandingConsistency(report);
        return {
          ...report,
          brandingConsistencyValidated: consistency.brandingConsistencyValidated,
          preservedDecisions: [
            ...report.preservedDecisions,
            {
              decisionId: `dw-dec-branding-${Date.now()}`,
              topic: report.productTitle,
              decision: consistency.notes,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
      false,
    );
  }

  prepareExportReadyDesignAssets(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runContentStage(
      "prepare_export_ready_design_assets",
      input,
      config,
      (report) => {
        const withExports: DesignWorkerReport = {
          ...report,
          exportFormats: this.builder.prepareExportFormats(),
        };
        const review = this.builder.performQualityReview(withExports, this.context);
        return {
          ...withExports,
          qualityReview: review.qualityReview,
          selfReviewPassed: review.passed,
          selfReviewFindings: review.findings,
          selfReviewSummary: review.summary,
          confidenceScore: review.confidenceScore,
          researchCompliance: review.researchCompliance,
          researchComplianceNotes: review.researchComplianceNotes,
          brandingConsistencyValidated: review.brandingConsistencyValidated,
          preservedDecisions: [
            ...report.preservedDecisions,
            {
              decisionId: `dw-dec-export-${Date.now()}`,
              topic: report.productTitle,
              decision:
                "Prepared export-ready structural formats (png_ready/jpg_ready/svg_ready/pdf_ready/zip_ready) without publishing or delivering; quality review applied",
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
      false,
    );
  }

  produceDesignWorkerReport(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    return this.runFullBuild("produce_design_worker_report", input, config);
  }

  submitReport(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.designReportId) {
      const one = this.store.get(input.designReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullBuild("produce_design_worker_report", input, config);
      reports = generated.designReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.designReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateDesignReports(
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
    appendDwLog({
      event: "submit_report",
      details: `designReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: DesignWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateDesignReports(
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

  validate(input: DesignWorkerInput, config: DesignWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateDesignReports(
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

  diagnostics(config: DesignWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Design Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendDwLog({ event: "diagnostics", details: `designReports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runContentStage(
    action: DesignWorkerRunReport["action"],
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
    mutate: (report: DesignWorkerReport) => DesignWorkerReport,
    allowIncomplete = true,
  ): DesignWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.designRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Design Worker is disabled" : "Design rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingReport(enriched, config);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No design report available — approved product information required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: DesignWorkerReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateDesignReports(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      allowIncomplete ? { allowIncompleteDesign: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendDwLog({
      event: action,
      details: `designReport=${updated.designReportId} assets=${updated.allAssets.length} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: DesignWorkerRunReport["action"],
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
  ): DesignWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.designRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Design Worker is disabled" : "Design rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.researchReportId || enriched.researchTopic || enriched.productTitle) {
      this.context = { ...this.context, receivedProductInformation: true };
    }
    const readiness = this.builder.canBuildDesignReport(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize(
        "fail",
        [readiness.reason ?? "Not ready"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildDesignReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateDesignReports(
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
    appendDwLog({
      event: action,
      details: `designReport=${report.designReportId} type=${report.productType} assets=${report.allAssets.length} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private ensureWorkingReport(
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
  ): DesignWorkerReport | null {
    if (input.designReportId) {
      const existing = this.store.get(input.designReportId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildDesignReport(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.createDesignReportShell(input, config, this.context);
    this.store.save(created, "bootstrap_design_report");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: DesignWorkerRunReport["action"],
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateDesignReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: DesignWorkerRunReport["action"],
    config: DesignWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: DesignWorkerInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.publishAssetsDirectly === true ||
      input.publishProductsDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ508OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: DesignWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: DesignWorkerReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `dw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DESIGN_WORKER_ID,
      engineVersion: "PILLOW-DW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...DW_CAPABILITIES],
      totalDesignReports: this.store.count(),
      lastDesignReportId: report?.designReportId ?? this.store.getLatestDesignReportId(),
      lastProductType: report?.productType ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: DW_METADATA_VERSION,
    };
  }

  private report(
    action: DesignWorkerRunReport["action"],
    catalog: DesignWorkerCatalog | null,
    designReports: DesignWorkerReport[],
    latestDesignReport: DesignWorkerReport | null,
    validation: DesignWorkerRunReport["validation"],
    started: number,
  ): DesignWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      designRunReportId: `dw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      designReports,
      latestDesignReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: DW_METADATA_VERSION,
    };
  }
}

function uniqueAssetTypes(report: DesignWorkerReport, nextTypes: string[]) {
  return [...new Set([...report.assetTypesCreated, ...nextTypes].filter(Boolean))];
}

function mergeAllAssets(
  report: DesignWorkerReport,
  next: DesignWorkerReport["allAssets"],
  ...replaceTypes: string[]
) {
  const kept = report.allAssets.filter((a) => !replaceTypes.includes(a.assetType));
  return [...kept, ...next];
}

function cloneCatalog(catalog: DesignWorkerCatalog): DesignWorkerCatalog {
  return {
    ...catalog,
    designReports: catalog.designReports.map((report) => ({
      ...report,
      assetTypesCreated: [...report.assetTypesCreated],
      exportFormats: [...report.exportFormats],
      previewAssets: report.previewAssets.map((a) => ({ ...a })),
      mockupAssets: report.mockupAssets.map((a) => ({ ...a })),
      ebookCovers: report.ebookCovers.map((a) => ({ ...a })),
      courseCovers: report.courseCovers.map((a) => ({ ...a })),
      brandingAssets: report.brandingAssets.map((a) => ({ ...a })),
      promotionalGraphics: report.promotionalGraphics.map((a) => ({ ...a })),
      allAssets: report.allAssets.map((a) => ({ ...a })),
      brandingThemeDetails: { ...report.brandingThemeDetails },
      selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
