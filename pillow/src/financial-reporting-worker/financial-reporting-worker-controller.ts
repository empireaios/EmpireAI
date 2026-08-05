import type { FinancialReportingWorkerConfiguration } from "./configuration.js";
import type { FinancialReportingWorkerDependencies } from "./integrations.js";
import { FinancialReportingWorkerManager } from "./reporting-manager.js";
import type { EngineStatus, FrwInput, FrwRunReport } from "./types.js";

export class FinancialReportingWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: FinancialReportingWorkerManager,
    private configuration: FinancialReportingWorkerConfiguration,
  ) {}

  initialize() {
    this.status = "idle";
  }

  bindIntegrations(deps: FinancialReportingWorkerDependencies = {}) {
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

  getQ910ConsumableContract() {
    return this.manager.getQ910ConsumableContract(this.configuration);
  }

  connect(input: FrwInput = {}): FrwRunReport {
    this.status = "connecting";
    const report = this.manager.connect(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeAccountingRecords(input: FrwInput = {}): FrwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeAccounting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeCashflowReports(input: FrwInput = {}): FrwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeCashflow(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeBudgetReports(input: FrwInput = {}): FrwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeBudget(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeProfitabilityReports(input: FrwInput = {}): FrwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeProfitability(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeForecastingReports(input: FrwInput = {}): FrwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeForecasting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeTaxSupportReports(input: FrwInput = {}): FrwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeTaxSupport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeInvestmentPlanningReports(input: FrwInput = {}): FrwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeInvestmentPlanning(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  generateExecutiveDashboard(input: FrwInput = {}): FrwRunReport {
    this.status = "dashboarding";
    const report = this.manager.generateExecutiveDashboard(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  generateCapitalSummary(input: FrwInput = {}): FrwRunReport {
    this.status = "consolidating";
    const report = this.manager.generateCapitalSummary(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  produceFinancialReport(input: FrwInput = {}): FrwRunReport {
    this.status = "reporting";
    const report = this.manager.produceFinancialReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  submitReport(input: FrwInput = {}): FrwRunReport {
    this.status = "reporting";
    const report = this.manager.submitReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list(): FrwRunReport {
    return this.manager.list();
  }

  validate(input: FrwInput = {}): FrwRunReport {
    this.status = "validating";
    const report = this.manager.validate(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  diagnostics(): FrwRunReport {
    return this.manager.diagnostics(this.configuration);
  }

  runDiagnostics(): FrwRunReport {
    return this.diagnostics();
  }
}
