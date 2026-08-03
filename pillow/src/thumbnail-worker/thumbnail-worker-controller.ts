import type { ThumbnailWorkerConfiguration } from "./configuration.js";
import type { ThumbnailWorkerDependencies } from "./integrations.js";
import { ThumbnailManager } from "./thumbnail-manager.js";
import type {
  EngineStatus,
  ThumbnailWorkerInput,
  ThumbnailWorkerRunReport,
} from "./types.js";

export class ThumbnailWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ThumbnailWorkerRunReport | null = null;

  constructor(
    private readonly manager: ThumbnailManager,
    private readonly config: ThumbnailWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ThumbnailWorkerDependencies = {}) {
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
      supportedContentFormats: [...this.config.supportedContentFormats],
      supportedDesignElements: [...this.config.supportedDesignElements],
      supportedEmotionalTriggers: [...this.config.supportedEmotionalTriggers],
      reportingLine: [...this.config.reportingLine],
      seedThumbnailReports: this.config.seedThumbnailReports.map((report) => ({
        ...report,
        thumbnailConcepts: report.thumbnailConcepts.map((c) => ({ ...c })),
        primaryConcept: { ...report.primaryConcept },
        abVariants: report.abVariants.map((v) => ({ ...v })),
        textOverlays: report.textOverlays.map((t) => ({ ...t })),
        emotionalTriggers: report.emotionalTriggers.map((e) => ({ ...e })),
        compositionGuidance: { ...report.compositionGuidance },
        traceabilityRefs: [...report.traceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
        selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
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

  receiveApprovedScript(input: ThumbnailWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedScript(input, this.config));
  }

  receiveApprovedHooks(input: ThumbnailWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedHooks(input, this.config));
  }

  generateThumbnailConcepts(input: ThumbnailWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateThumbnailConcepts(input, this.config));
  }

  generateEmotionalTriggers(input: ThumbnailWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateEmotionalTriggers(input, this.config));
  }

  generateTextOverlaySuggestions(input: ThumbnailWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateTextOverlaySuggestions(input, this.config));
  }

  recommendCompositionAndFraming(input: ThumbnailWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.recommendCompositionAndFraming(input, this.config));
  }

  generateAbVariants(input: ThumbnailWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateAbVariants(input, this.config));
  }

  validateScriptConsistency(input: ThumbnailWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateScriptConsistency(input, this.config));
  }

  selfReviewThumbnailQuality(input: ThumbnailWorkerInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.selfReviewThumbnailQuality(input, this.config));
  }

  produceThumbnailReport(input: ThumbnailWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceThumbnailReport(input, this.config));
  }

  submitReport(input: ThumbnailWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ThumbnailWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ThumbnailWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
