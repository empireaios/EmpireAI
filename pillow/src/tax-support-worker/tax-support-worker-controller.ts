import type { TaxSupportWorkerConfiguration } from "./configuration.js";
import type { TaxSupportWorkerDependencies } from "./integrations.js";
import { TaxSupportWorkerManager } from "./tax-manager.js";
import type { EngineStatus, TswInput, TswRunReport } from "./types.js";

export class TaxSupportWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: TaxSupportWorkerManager,
    private configuration: TaxSupportWorkerConfiguration,
  ) {}

  initialize() {
    this.status = "idle";
  }

  bindIntegrations(deps: TaxSupportWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getConfiguration() {
    return this.configuration;
  }

  getManager() {
    return this.manager;
  }

  getStatus() {
    return this.status;
  }

  getLatestReport() {
    return this.manager.getLatestReport();
  }

  getQ908ConsumableContract() {
    return this.manager.getQ908ConsumableContract(this.configuration);
  }

  connect(input: TswInput = {}): TswRunReport {
    this.status = "connecting";
    const report = this.manager.connect(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeAccountingRecords(input: TswInput = {}): TswRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeAccounting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeCashflowReports(input: TswInput = {}): TswRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeCashflow(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeProfitabilityReports(input: TswInput = {}): TswRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeProfitability(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeForecastingReports(input: TswInput = {}): TswRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeForecasting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  organiseRecords(input: TswInput = {}): TswRunReport {
    this.status = "organising_records";
    const report = this.manager.organiseRecords(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  prepareIncomeSummary(input: TswInput = {}): TswRunReport {
    this.status = "preparing_summaries";
    const report = this.manager.prepareIncomeSummary(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  prepareExpenseSummary(input: TswInput = {}): TswRunReport {
    this.status = "preparing_summaries";
    const report = this.manager.prepareExpenseSummary(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  detectMissingDocumentation(input: TswInput = {}): TswRunReport {
    this.status = "detecting_missing_docs";
    const report = this.manager.detectMissingDocs(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  generateFilingReminders(input: TswInput = {}): TswRunReport {
    this.status = "scheduling_reminders";
    const report = this.manager.generateReminders(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  flagProfessionalReview(input: TswInput = {}): TswRunReport {
    this.status = "flagging_review";
    const report = this.manager.flagProfessionalReview(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  produceTaxSupportReport(input: TswInput = {}): TswRunReport {
    this.status = "reporting";
    const report = this.manager.produceTaxSupportReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  submitReport(input: TswInput = {}): TswRunReport {
    this.status = "reporting";
    const report = this.manager.submitReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list(): TswRunReport {
    return this.manager.list();
  }

  validate(input: TswInput = {}): TswRunReport {
    this.status = "validating";
    const report = this.manager.validate(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  diagnostics(): TswRunReport {
    return this.manager.diagnostics(this.configuration);
  }

  runDiagnostics(): TswRunReport {
    return this.diagnostics();
  }
}
