import type { VisualResearchWorkerConfiguration } from "./configuration.js";
import type { VisualResearchWorkerDependencies } from "./integrations.js";
import { VisualManager } from "./visual-manager.js";
import type {
  EngineStatus,
  VisualResearchWorkerInput,
  VisualResearchWorkerRunReport,
} from "./types.js";

export class VisualResearchWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: VisualResearchWorkerRunReport | null = null;

  constructor(
    private readonly manager: VisualManager,
    private readonly config: VisualResearchWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: VisualResearchWorkerDependencies = {}) {
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
      supportedAssetTypes: [...this.config.supportedAssetTypes],
      approvedVisualSources: [...this.config.approvedVisualSources],
      reportingLine: [...this.config.reportingLine],
      seedVisualResearchReports: this.config.seedVisualResearchReports.map((report) => ({
        ...report,
        scenes: report.scenes.map((s) => ({ ...s })),
        missingAssets: [...report.missingAssets],
        licensingRestrictions: report.licensingRestrictions.map((l) => ({ ...l })),
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

  receiveApprovedScript(input: VisualResearchWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedScript(input, this.config));
  }

  breakIntoVisualScenes(input: VisualResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.breakIntoVisualScenes(input, this.config));
  }

  identifyRequiredVisualAssets(input: VisualResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.identifyRequiredVisualAssets(input, this.config));
  }

  searchApprovedStockLibraries(input: VisualResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.searchApprovedStockLibraries(input, this.config));
  }

  searchPublicDomainSources(input: VisualResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.searchPublicDomainSources(input, this.config));
  }

  identifyInternallyGeneratedAssets(input: VisualResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.identifyInternallyGeneratedAssets(input, this.config));
  }

  classifyCopyrightStatus(input: VisualResearchWorkerInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.classifyCopyrightStatus(input, this.config));
  }

  matchVisualsToScriptTimeline(input: VisualResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.matchVisualsToScriptTimeline(input, this.config));
  }

  detectMissingVisualCoverage(input: VisualResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.detectMissingVisualCoverage(input, this.config));
  }

  produceVisualResearchReport(input: VisualResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceVisualResearchReport(input, this.config));
  }

  submitReport(input: VisualResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: VisualResearchWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: VisualResearchWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
