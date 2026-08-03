import type { TrendResearchWorkerConfiguration } from "./configuration.js";
import type { TrendResearchWorkerDependencies } from "./integrations.js";
import { TrendManager } from "./trend-manager.js";
import type {
  EngineStatus,
  TrendResearchWorkerInput,
  TrendResearchWorkerRunReport,
} from "./types.js";

export class TrendResearchWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: TrendResearchWorkerRunReport | null = null;

  constructor(
    private readonly manager: TrendManager,
    private readonly config: TrendResearchWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: TrendResearchWorkerDependencies = {}) {
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
        searchDemand: { ...report.searchDemand },
        socialSignals: { ...report.socialSignals },
        competitorActivity: { ...report.competitorActivity },
        currentEventRelevance: { ...report.currentEventRelevance },
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

  monitorSearchTrends(input: TrendResearchWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorSearchTrends(input, this.config));
  }

  monitorCompetitorChannels(input: TrendResearchWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorCompetitorChannels(input, this.config));
  }

  monitorSocialPlatformTrends(input: TrendResearchWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorSocialPlatformTrends(input, this.config));
  }

  monitorAudienceBehaviourSignals(input: TrendResearchWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorAudienceBehaviourSignals(input, this.config));
  }

  monitorCurrentEvents(input: TrendResearchWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorCurrentEvents(input, this.config));
  }

  identifyEmergingTrends(input: TrendResearchWorkerInput = {}) {
    this.status = "identifying";
    return this.finish(this.manager.identifyEmergingTrends(input, this.config));
  }

  identifyDecliningTrends(input: TrendResearchWorkerInput = {}) {
    this.status = "identifying";
    return this.finish(this.manager.identifyDecliningTrends(input, this.config));
  }

  categorizeOpportunities(input: TrendResearchWorkerInput = {}) {
    this.status = "identifying";
    return this.finish(this.manager.categorizeOpportunities(input, this.config));
  }

  scoreTrendConfidence(input: TrendResearchWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreTrendConfidence(input, this.config));
  }

  produceReport(input: TrendResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: TrendResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: TrendResearchWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: TrendResearchWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
