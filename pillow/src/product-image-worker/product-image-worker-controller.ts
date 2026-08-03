import type { ProductImageWorkerConfiguration } from "./configuration.js";
import type { ProductImageWorkerDependencies } from "./integrations.js";
import { ImageManager } from "./image-manager.js";
import type {
  EngineStatus,
  ProductImageWorkerInput,
  ProductImageWorkerRunReport,
} from "./types.js";

export class ProductImageWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ProductImageWorkerRunReport | null = null;

  constructor(
    private readonly manager: ImageManager,
    private readonly config: ProductImageWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ProductImageWorkerDependencies = {}) {
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
      marketplaceTargets: [...this.config.marketplaceTargets],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedImageReports: this.config.seedImageReports.map((report) => ({
        ...report,
        sourceImages: report.sourceImages.map((s) => ({ ...s })),
        processedImages: report.processedImages.map((p) => ({
          ...p,
          qualityNotes: [...p.qualityNotes],
          originalPreserved: true as const,
        })),
        imageVariants: report.imageVariants.map((v) => ({ ...v })),
        marketplaceTargets: [...report.marketplaceTargets],
        duplicateImageIds: [...report.duplicateImageIds],
        unusableImageIds: [...report.unusableImageIds],
        preservedMetadata: report.preservedMetadata.map((m) => ({ ...m })),
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
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

  receiveApprovedImages(input: ProductImageWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedImages(input, this.config));
  }

  validateImageQuality(input: ProductImageWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateImageQuality(input, this.config));
  }

  detectDuplicates(input: ProductImageWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.detectDuplicates(input, this.config));
  }

  organizeImageSets(input: ProductImageWorkerInput = {}) {
    this.status = "organizing";
    return this.finish(this.manager.organizeImageSets(input, this.config));
  }

  prepareCompliantImages(input: ProductImageWorkerInput = {}) {
    this.status = "processing";
    return this.finish(this.manager.prepareCompliantImages(input, this.config));
  }

  generateVariants(input: ProductImageWorkerInput = {}) {
    this.status = "processing";
    return this.finish(this.manager.generateVariants(input, this.config));
  }

  preserveMetadata(input: ProductImageWorkerInput = {}) {
    this.status = "processing";
    return this.finish(this.manager.preserveMetadata(input, this.config));
  }

  validateCompliance(input: ProductImageWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateCompliance(input, this.config));
  }

  packageAssets(input: ProductImageWorkerInput = {}) {
    this.status = "packaging";
    return this.finish(this.manager.packageAssets(input, this.config));
  }

  produceReport(input: ProductImageWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: ProductImageWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ProductImageWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ProductImageWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
