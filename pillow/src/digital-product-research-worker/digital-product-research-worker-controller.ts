import type { DigitalProductResearchWorkerConfiguration } from "./configuration.js";
import type { DigitalProductResearchWorkerDependencies } from "./integrations.js";
import { ResearchManager } from "./research-manager.js";
import type {
  DigitalProductResearchWorkerInput,
  DigitalProductResearchWorkerRunReport,
  EngineStatus,
} from "./types.js";

export class DigitalProductResearchWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: DigitalProductResearchWorkerRunReport | null = null;

  constructor(
    private readonly manager: ResearchManager,
    private readonly config: DigitalProductResearchWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: DigitalProductResearchWorkerDependencies = {}) {
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
      reportingLine: [...this.config.reportingLine],
      seedReports: this.config.seedReports.map((report) => ({
        ...report,
        customerPainPoints: [...report.customerPainPoints],
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
        evidenceKinds: [...report.evidenceKinds],
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

  analyseCustomerPainPoints(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.analyseCustomerPainPoints(input, this.config));
  }

  analyseSearchDemand(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.analyseSearchDemand(input, this.config));
  }

  analyseMarketGaps(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.analyseMarketGaps(input, this.config));
  }

  analyseCompetitorProducts(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.analyseCompetitorProducts(input, this.config));
  }

  analyseEmergingTrends(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.analyseEmergingTrends(input, this.config));
  }

  discoverUnderservedNiches(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.discoverUnderservedNiches(input, this.config));
  }

  estimateDemand(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.estimateDemand(input, this.config));
  }

  estimateCommercialOpportunity(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.estimateCommercialOpportunity(input, this.config));
  }

  rankOpportunities(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "ranking";
    return this.finish(this.manager.rankOpportunities(input, this.config));
  }

  produceReport(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: DigitalProductResearchWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DigitalProductResearchWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
