import type { DesignWorkerConfiguration } from "./configuration.js";
import type { DesignWorkerDependencies } from "./integrations.js";
import { DesignManager } from "./design-manager.js";
import type {
  DesignWorkerInput,
  DesignWorkerRunReport,
  EngineStatus,
} from "./types.js";

export class DesignWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: DesignWorkerRunReport | null = null;

  constructor(
    private readonly manager: DesignManager,
    private readonly config: DesignWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: DesignWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      supportedAssetTypes: [...this.config.supportedAssetTypes],
      supportedProductTypes: [...this.config.supportedProductTypes],
      reportingLine: [...this.config.reportingLine],
      seedDesignReports: this.config.seedDesignReports.map((report) => ({
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
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveApprovedDigitalProductInformation(input: DesignWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveApprovedDigitalProductInformation(input, this.config),
    );
  }

  /** Alias for factory consistency — delegates to receiveApprovedDigitalProductInformation. */
  receiveApprovedDigitalProductResearch(input: DesignWorkerInput = {}) {
    return this.receiveApprovedDigitalProductInformation(input);
  }

  generateEbookCovers(input: DesignWorkerInput = {}) {
    this.status = "generating_ebook_covers";
    return this.finish(this.manager.generateEbookCovers(input, this.config));
  }

  generateCourseCovers(input: DesignWorkerInput = {}) {
    this.status = "generating_course_covers";
    return this.finish(this.manager.generateCourseCovers(input, this.config));
  }

  generateProductBrandingAssets(input: DesignWorkerInput = {}) {
    this.status = "generating_branding";
    return this.finish(this.manager.generateProductBrandingAssets(input, this.config));
  }

  generatePromotionalGraphics(input: DesignWorkerInput = {}) {
    this.status = "generating_promos";
    return this.finish(this.manager.generatePromotionalGraphics(input, this.config));
  }

  generateRealisticProductMockups(input: DesignWorkerInput = {}) {
    this.status = "generating_mockups";
    return this.finish(this.manager.generateRealisticProductMockups(input, this.config));
  }

  generatePreviewImages(input: DesignWorkerInput = {}) {
    this.status = "generating_previews";
    return this.finish(this.manager.generatePreviewImages(input, this.config));
  }

  maintainVisualBrandingConsistency(input: DesignWorkerInput = {}) {
    this.status = "maintaining_branding";
    return this.finish(this.manager.maintainVisualBrandingConsistency(input, this.config));
  }

  prepareExportReadyDesignAssets(input: DesignWorkerInput = {}) {
    this.status = "exporting";
    return this.finish(this.manager.prepareExportReadyDesignAssets(input, this.config));
  }

  produceDesignWorkerReport(input: DesignWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceDesignWorkerReport(input, this.config));
  }

  submitReport(input: DesignWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: DesignWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DesignWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
