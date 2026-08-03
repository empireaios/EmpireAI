import type { LocalMarketResearchWorkerConfiguration } from "./configuration.js";
import type { LocalMarketResearchWorkerDependencies } from "./integrations.js";
import { ResearchManager } from "./research-manager.js";
import type {
  EngineStatus,
  LocalMarketResearchInput,
  LocalMarketResearchWorkerRunReport,
} from "./types.js";

export class LocalMarketResearchWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: LocalMarketResearchWorkerRunReport | null = null;

  constructor(
    private readonly manager: ResearchManager,
    private readonly config: LocalMarketResearchWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: LocalMarketResearchWorkerDependencies = {}) {
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
      seedReports: this.config.seedReports.map((report) => ({ ...report })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  submitResearchRequest(input: LocalMarketResearchInput = {}) {
    this.status = "receiving_request";
    return this.finish(this.manager.submitResearchRequest(input, this.config));
  }

  researchLocalDemand(input: LocalMarketResearchInput = {}) {
    this.status = "researching_demand";
    return this.finish(this.manager.researchLocalDemand(input, this.config));
  }

  identifyCustomerSegments(input: LocalMarketResearchInput = {}) {
    this.status = "researching_demand";
    return this.finish(this.manager.identifyCustomerSegments(input, this.config));
  }

  researchCompetitors(input: LocalMarketResearchInput = {}) {
    this.status = "profiling_competitors";
    return this.finish(this.manager.researchCompetitors(input, this.config));
  }

  profileCompetitors(input: LocalMarketResearchInput = {}) {
    this.status = "profiling_competitors";
    return this.finish(this.manager.profileCompetitors(input, this.config));
  }

  researchCompetitorServices(input: LocalMarketResearchInput = {}) {
    this.status = "profiling_competitors";
    return this.finish(this.manager.researchCompetitorServices(input, this.config));
  }

  researchMarketPricing(input: LocalMarketResearchInput = {}) {
    this.status = "researching_pricing";
    return this.finish(this.manager.researchMarketPricing(input, this.config));
  }

  identifyPainPoints(input: LocalMarketResearchInput = {}) {
    this.status = "identifying_gaps";
    return this.finish(this.manager.identifyPainPoints(input, this.config));
  }

  identifyServiceGaps(input: LocalMarketResearchInput = {}) {
    this.status = "identifying_gaps";
    return this.finish(this.manager.identifyServiceGaps(input, this.config));
  }

  analyzeServiceOpportunities(input: LocalMarketResearchInput = {}) {
    this.status = "identifying_gaps";
    return this.finish(this.manager.analyzeServiceOpportunities(input, this.config));
  }

  assessMarketAttractiveness(input: LocalMarketResearchInput = {}) {
    this.status = "assessing_attractiveness";
    return this.finish(this.manager.assessMarketAttractiveness(input, this.config));
  }

  produceReport(input: LocalMarketResearchInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceLocalMarketResearchReport(input: LocalMarketResearchInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: LocalMarketResearchInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: LocalMarketResearchInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: LocalMarketResearchWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
