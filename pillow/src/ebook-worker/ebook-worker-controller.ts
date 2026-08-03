import type { EbookWorkerConfiguration } from "./configuration.js";
import type { EbookWorkerDependencies } from "./integrations.js";
import { EbookManager } from "./ebook-manager.js";
import type {
  EbookWorkerInput,
  EbookWorkerRunReport,
  EngineStatus,
} from "./types.js";

export class EbookWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: EbookWorkerRunReport | null = null;

  constructor(
    private readonly manager: EbookManager,
    private readonly config: EbookWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: EbookWorkerDependencies = {}) {
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
      supportedProductTypes: [...this.config.supportedProductTypes],
      reportingLine: [...this.config.reportingLine],
      seedEbooks: this.config.seedEbooks.map((ebook) => ({
        ...ebook,
        chapterStructure: ebook.chapterStructure.map((c) => ({ ...c })),
        includedResources: [...ebook.includedResources],
        exportFormats: [...ebook.exportFormats],
        chapters: ebook.chapters.map((c) => ({ ...c })),
        outline: ebook.outline
          ? {
              ...ebook.outline,
              tableOfContents: [...ebook.outline.tableOfContents],
              sections: ebook.outline.sections.map((s) => ({ ...s })),
              learningObjectives: [...ebook.outline.learningObjectives],
            }
          : null,
        selfReviewFindings: ebook.selfReviewFindings.map((f) => ({ ...f })),
        traceabilityRefs: [...ebook.traceabilityRefs],
        preservedDecisions: ebook.preservedDecisions.map((d) => ({ ...d })),
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

  receiveApprovedDigitalProductResearch(input: EbookWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveApprovedDigitalProductResearch(input, this.config),
    );
  }

  createProductOutline(input: EbookWorkerInput = {}) {
    this.status = "outlining";
    return this.finish(this.manager.createProductOutline(input, this.config));
  }

  createChapterStructure(input: EbookWorkerInput = {}) {
    this.status = "structuring";
    return this.finish(this.manager.createChapterStructure(input, this.config));
  }

  generateCompleteWrittenContent(input: EbookWorkerInput = {}) {
    this.status = "writing";
    return this.finish(this.manager.generateCompleteWrittenContent(input, this.config));
  }

  generateTablesChecklistsAndSummaries(input: EbookWorkerInput = {}) {
    this.status = "writing";
    return this.finish(
      this.manager.generateTablesChecklistsAndSummaries(input, this.config),
    );
  }

  generateReferencesAndAppendices(input: EbookWorkerInput = {}) {
    this.status = "writing";
    return this.finish(this.manager.generateReferencesAndAppendices(input, this.config));
  }

  applyConsistentFormatting(input: EbookWorkerInput = {}) {
    this.status = "formatting";
    return this.finish(this.manager.applyConsistentFormatting(input, this.config));
  }

  performSelfReview(input: EbookWorkerInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.performSelfReview(input, this.config));
  }

  selfReviewEbook(input: EbookWorkerInput = {}) {
    return this.performSelfReview(input);
  }

  prepareExportReadyEbookAssets(input: EbookWorkerInput = {}) {
    this.status = "exporting";
    return this.finish(this.manager.prepareExportReadyEbookAssets(input, this.config));
  }

  produceEbookReport(input: EbookWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceEbookReport(input, this.config));
  }

  submitReport(input: EbookWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: EbookWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: EbookWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
