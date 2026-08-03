import type { ImageCreativeWorkerConfiguration } from "./configuration.js";
import type { ImageCreativeWorkerDependencies } from "./integrations.js";
import { CreativeManager } from "./creative-manager.js";
import type {
  EngineStatus,
  ImageCreativeWorkerInput,
  ImageCreativeWorkerRunReport,
} from "./types.js";

export class ImageCreativeWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ImageCreativeWorkerRunReport | null = null;

  constructor(
    private readonly manager: CreativeManager,
    private readonly config: ImageCreativeWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ImageCreativeWorkerDependencies = {}) {
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
      reportingLine: [...this.config.reportingLine],
      seedCreativeAssetReports: this.config.seedCreativeAssetReports.map((report) => ({
        ...report,
        sourceAssets: [...report.sourceAssets],
        generatedAssets: [...report.generatedAssets],
        editOperations: report.editOperations.map((e) => ({ ...e })),
        variants: report.variants.map((v) => ({ ...v })),
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

  receiveVisualResearchReport(input: ImageCreativeWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveVisualResearchReport(input, this.config));
  }

  receiveThumbnailSpecifications(input: ImageCreativeWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveThumbnailSpecifications(input, this.config));
  }

  generateOriginalGraphics(input: ImageCreativeWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateOriginalGraphics(input, this.config));
  }

  editExistingImages(input: ImageCreativeWorkerInput = {}) {
    this.status = "editing";
    return this.finish(this.manager.editExistingImages(input, this.config));
  }

  createDiagramsAndInfographics(input: ImageCreativeWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.createDiagramsAndInfographics(input, this.config));
  }

  createCoversAndBanners(input: ImageCreativeWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.createCoversAndBanners(input, this.config));
  }

  createSocialMediaAssets(input: ImageCreativeWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.createSocialMediaAssets(input, this.config));
  }

  generateMultipleCreativeVariants(input: ImageCreativeWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateMultipleCreativeVariants(input, this.config));
  }

  validateAssetQualityAndCompliance(input: ImageCreativeWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateAssetQualityAndCompliance(input, this.config));
  }

  produceCreativeAssetReport(input: ImageCreativeWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceCreativeAssetReport(input, this.config));
  }

  submitReport(input: ImageCreativeWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ImageCreativeWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ImageCreativeWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
