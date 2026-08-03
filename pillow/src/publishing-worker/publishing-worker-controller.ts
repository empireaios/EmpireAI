import type { PublishingWorkerConfiguration } from "./configuration.js";
import type { PublishingWorkerDependencies } from "./integrations.js";
import { PublishManager } from "./publish-manager.js";
import type {
  EngineStatus,
  PublishingWorkerInput,
  PublishingWorkerRunReport,
} from "./types.js";

export class PublishingWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: PublishingWorkerRunReport | null = null;

  constructor(
    private readonly manager: PublishManager,
    private readonly config: PublishingWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: PublishingWorkerDependencies = {}) {
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
      supportedPlatforms: [...this.config.supportedPlatforms],
      readinessStatuses: [...this.config.readinessStatuses],
      reportingLine: [...this.config.reportingLine],
      seedPublishingReports: this.config.seedPublishingReports.map((report) => ({
        ...report,
        tags: [...report.tags],
        thumbnailReference: { ...report.thumbnailReference, approved: true as const },
        playlist: { ...report.playlist },
        uploadPackage: {
          ...report.uploadPackage,
          tags: [...report.uploadPackage.tags],
          assetRefs: [...report.uploadPackage.assetRefs],
        },
        publishingReadiness: { ...report.publishingReadiness },
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

  receiveCompletedMediaAssets(input: PublishingWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveCompletedMediaAssets(input, this.config));
  }

  generateOptimizedVideoTitles(input: PublishingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateOptimizedVideoTitles(input, this.config));
  }

  generatePlatformDescriptions(input: PublishingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generatePlatformDescriptions(input, this.config));
  }

  generateTagsAndKeywords(input: PublishingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateTagsAndKeywords(input, this.config));
  }

  selectApprovedThumbnails(input: PublishingWorkerInput = {}) {
    this.status = "selecting";
    return this.finish(this.manager.selectApprovedThumbnails(input, this.config));
  }

  generatePlaylists(input: PublishingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generatePlaylists(input, this.config));
  }

  generatePublishingSchedules(input: PublishingWorkerInput = {}) {
    this.status = "scheduling";
    return this.finish(this.manager.generatePublishingSchedules(input, this.config));
  }

  preparePlatformUploadPackages(input: PublishingWorkerInput = {}) {
    this.status = "packaging";
    return this.finish(this.manager.preparePlatformUploadPackages(input, this.config));
  }

  validatePublishingReadiness(input: PublishingWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validatePublishingReadiness(input, this.config));
  }

  producePublishingReport(input: PublishingWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.producePublishingReport(input, this.config));
  }

  submitReport(input: PublishingWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: PublishingWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: PublishingWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
