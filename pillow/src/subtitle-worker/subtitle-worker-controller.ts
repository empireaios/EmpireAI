import type { SubtitleWorkerConfiguration } from "./configuration.js";
import type { SubtitleWorkerDependencies } from "./integrations.js";
import { SubtitleManager } from "./subtitle-manager.js";
import type {
  EngineStatus,
  SubtitleWorkerInput,
  SubtitleWorkerRunReport,
} from "./types.js";

export class SubtitleWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: SubtitleWorkerRunReport | null = null;

  constructor(
    private readonly manager: SubtitleManager,
    private readonly config: SubtitleWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SubtitleWorkerDependencies = {}) {
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
      supportedLanguages: [...this.config.supportedLanguages],
      supportedExportFormats: [...this.config.supportedExportFormats],
      reportingLine: [...this.config.reportingLine],
      seedSubtitleReports: this.config.seedSubtitleReports.map((report) => ({
        ...report,
        captionTimeline: report.captionTimeline.map((c) => ({ ...c })),
        timingAccuracy: { ...report.timingAccuracy },
        exportFormats: report.exportFormats.map((f) => ({ ...f })),
        qualityValidation: { ...report.qualityValidation },
        languages: [...report.languages],
        syncIssues: report.syncIssues.map((i) => ({ ...i })),
        transcriptHistory: report.transcriptHistory.map((t) => ({ ...t })),
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

  receiveApprovedScripts(input: SubtitleWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedScripts(input, this.config));
  }

  receiveApprovedVoiceAssets(input: SubtitleWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedVoiceAssets(input, this.config));
  }

  generateCompleteTranscripts(input: SubtitleWorkerInput = {}) {
    this.status = "transcribing";
    return this.finish(this.manager.generateCompleteTranscripts(input, this.config));
  }

  generateSynchronizedCaptions(input: SubtitleWorkerInput = {}) {
    this.status = "timing";
    return this.finish(this.manager.generateSynchronizedCaptions(input, this.config));
  }

  generateSubtitleTiming(input: SubtitleWorkerInput = {}) {
    this.status = "timing";
    return this.finish(this.manager.generateSubtitleTiming(input, this.config));
  }

  supportMultipleSubtitleLanguages(input: SubtitleWorkerInput = {}) {
    this.status = "exporting";
    return this.finish(this.manager.supportMultipleSubtitleLanguages(input, this.config));
  }

  validateSubtitleTimingAccuracy(input: SubtitleWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateSubtitleTimingAccuracy(input, this.config));
  }

  detectSynchronizationIssues(input: SubtitleWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.detectSynchronizationIssues(input, this.config));
  }

  produceExportableSubtitleFiles(input: SubtitleWorkerInput = {}) {
    this.status = "exporting";
    return this.finish(this.manager.produceExportableSubtitleFiles(input, this.config));
  }

  produceSubtitleReport(input: SubtitleWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceSubtitleReport(input, this.config));
  }

  submitReport(input: SubtitleWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: SubtitleWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: SubtitleWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
