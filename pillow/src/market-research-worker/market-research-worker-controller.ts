import type { MarketResearchWorkerConfiguration } from "./configuration.js";
import type { MarketResearchWorkerDependencies } from "./integrations.js";
import { ResearchManager } from "./research-manager.js";
import type {
  EngineStatus,
  MarketResearchWorkerInput,
  MarketResearchWorkerRunReport,
} from "./types.js";

export class MarketResearchWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: MarketResearchWorkerRunReport | null = null;

  constructor(
    private readonly manager: ResearchManager,
    private readonly config: MarketResearchWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MarketResearchWorkerDependencies = {}) {
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
      businessTypes: [...this.config.businessTypes],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedReports: this.config.seedReports.map((report) => ({
        ...report,
        customerProblems: [...report.customerProblems],
        customerSegments: [...report.customerSegments],
        industryTrends: [...report.industryTrends],
        barriersToEntry: [...report.barriersToEntry],
        recommendations: [...report.recommendations],
        missingInformation: [...report.missingInformation],
        facts: [...report.facts],
        assumptions: [...report.assumptions],
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
        competitorAnalysis: report.competitorAnalysis.map((c) => ({
          ...c,
          strengths: [...c.strengths],
          weaknesses: [...c.weaknesses],
        })),
        risks: report.risks.map((r) => ({ ...r })),
        marketDemand: {
          ...report.marketDemand,
          demandSignals: [...report.marketDemand.demandSignals],
          facts: [...report.marketDemand.facts],
          assumptions: [...report.marketDemand.assumptions],
        },
        marketSize: {
          ...report.marketSize,
          facts: [...report.marketSize.facts],
          assumptions: [...report.marketSize.assumptions],
        },
        opportunitySize: {
          ...report.opportunitySize,
          facts: [...report.opportunitySize.facts],
          assumptions: [...report.opportunitySize.assumptions],
        },
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

  researchDemand(input: MarketResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.researchDemand(input, this.config));
  }

  analyseCompetitors(input: MarketResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.analyseCompetitors(input, this.config));
  }

  analyseCustomerProblems(input: MarketResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.analyseCustomerProblems(input, this.config));
  }

  estimateOpportunity(input: MarketResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.estimateOpportunity(input, this.config));
  }

  identifyRisks(input: MarketResearchWorkerInput = {}) {
    this.status = "researching";
    return this.finish(this.manager.identifyRisks(input, this.config));
  }

  produceReport(input: MarketResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: MarketResearchWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MarketResearchWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MarketResearchWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
