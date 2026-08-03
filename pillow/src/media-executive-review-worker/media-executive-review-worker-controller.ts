import type { MediaExecutiveReviewWorkerConfiguration } from "./configuration.js";
import type { MediaExecutiveReviewWorkerDependencies } from "./integrations.js";
import { ReviewManager } from "./review-manager.js";
import type {
  EngineStatus,
  MediaExecutiveReviewWorkerInput,
  MediaExecutiveReviewWorkerRunReport,
} from "./types.js";

export class MediaExecutiveReviewWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: MediaExecutiveReviewWorkerRunReport | null = null;

  constructor(
    private readonly manager: ReviewManager,
    private readonly config: MediaExecutiveReviewWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MediaExecutiveReviewWorkerDependencies = {}) {
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
      executiveRecommendations: [...this.config.executiveRecommendations],
      reportingLine: [...this.config.reportingLine],
      seedReviewReports: this.config.seedReviewReports.map((report) => ({
        ...report,
        assetCompleteness: {
          ...report.assetCompleteness,
          missingItems: [...report.assetCompleteness.missingItems],
        },
        qualityAssessment: { ...report.qualityAssessment },
        complianceAssessment: { ...report.complianceAssessment },
        outstandingIssues: report.outstandingIssues.map((f) => ({
          ...f,
          evidenceRefs: [...f.evidenceRefs],
        })),
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
        prerequisiteWorkerStatuses: report.prerequisiteWorkerStatuses.map((p) => ({
          ...p,
        })),
        verifiedFindings: report.verifiedFindings.map((f) => ({
          ...f,
          evidenceRefs: [...f.evidenceRefs],
        })),
        recommendationFindings: report.recommendationFindings.map((f) => ({
          ...f,
          evidenceRefs: [...f.evidenceRefs],
        })),
        sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
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

  receiveAllCompletedMediaFactoryOutputs(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveAllCompletedMediaFactoryOutputs(input, this.config),
    );
  }

  verifyEditorialCompliance(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "verifying";
    return this.finish(this.manager.verifyEditorialCompliance(input, this.config));
  }

  verifyScriptQuality(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "verifying";
    return this.finish(this.manager.verifyScriptQuality(input, this.config));
  }

  verifyThumbnailQuality(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "verifying";
    return this.finish(this.manager.verifyThumbnailQuality(input, this.config));
  }

  verifyVisualAssetReadiness(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "verifying";
    return this.finish(this.manager.verifyVisualAssetReadiness(input, this.config));
  }

  verifyVoiceAndSubtitleReadiness(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "verifying";
    return this.finish(this.manager.verifyVoiceAndSubtitleReadiness(input, this.config));
  }

  verifyPublishingPackageCompleteness(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "verifying";
    return this.finish(
      this.manager.verifyPublishingPackageCompleteness(input, this.config),
    );
  }

  verifyAnalyticsAndLearningTraceability(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "verifying";
    return this.finish(
      this.manager.verifyAnalyticsAndLearningTraceability(input, this.config),
    );
  }

  identifyOutstandingIssues(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.identifyOutstandingIssues(input, this.config));
  }

  recommendApproveReviseOrReject(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendApproveReviseOrReject(input, this.config));
  }

  produceMediaExecutiveReviewReport(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceMediaExecutiveReviewReport(input, this.config));
  }

  submitReport(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MediaExecutiveReviewWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MediaExecutiveReviewWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
