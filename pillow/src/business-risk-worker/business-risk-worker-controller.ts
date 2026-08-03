import type { BusinessRiskWorkerConfiguration } from "./configuration.js";
import type { BusinessRiskWorkerDependencies } from "./integrations.js";
import { RiskManager } from "./risk-manager.js";
import type {
  EngineStatus,
  BusinessRiskWorkerInput,
  BusinessRiskWorkerRunReport,
} from "./types.js";

export class BusinessRiskWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: BusinessRiskWorkerRunReport | null = null;

  constructor(
    private readonly manager: RiskManager,
    private readonly config: BusinessRiskWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: BusinessRiskWorkerDependencies = {}) {
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
      riskCategories: [...this.config.riskCategories],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedReports: this.config.seedReports.map((report) => ({
        ...report,
        risks: report.risks.map((risk) => ({
          ...risk,
          supportingEvidence: risk.supportingEvidence.map((e) => ({ ...e })),
        })),
        prioritizedRiskIds: [...report.prioritizedRiskIds],
        facts: [...report.facts],
        assumptions: [...report.assumptions],
        missingInformation: [...report.missingInformation],
        preservedDecisions: [...report.preservedDecisions],
        traceabilityRefs: [...report.traceabilityRefs],
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

  receiveBlueprint(input: BusinessRiskWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveBlueprint(input, this.config));
  }

  receiveLaunchPlan(input: BusinessRiskWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveLaunchPlan(input, this.config));
  }

  identifyRisks(input: BusinessRiskWorkerInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.identifyRisks(input, this.config));
  }

  scoreRisks(input: BusinessRiskWorkerInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.scoreRisks(input, this.config));
  }

  recommendMitigations(input: BusinessRiskWorkerInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.recommendMitigations(input, this.config));
  }

  produceRiskReport(input: BusinessRiskWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceRiskReport(input, this.config));
  }

  submitRiskReport(input: BusinessRiskWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitRiskReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: BusinessRiskWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: BusinessRiskWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
