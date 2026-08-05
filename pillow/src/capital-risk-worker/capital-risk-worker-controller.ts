import type { CapitalRiskWorkerConfiguration } from "./configuration.js";
import type { CapitalRiskWorkerDependencies } from "./integrations.js";
import { CapitalRiskWorkerManager } from "./risk-manager.js";
import type { CaprwInput, CaprwRunReport, EngineStatus } from "./types.js";

export class CapitalRiskWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: CapitalRiskWorkerManager,
    private configuration: CapitalRiskWorkerConfiguration,
  ) {}

  initialize() {
    this.status = "idle";
  }

  bindIntegrations(deps: CapitalRiskWorkerDependencies = {}) {
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

  getQ911ConsumableContract() {
    return this.manager.getQ911ConsumableContract(this.configuration);
  }

  connect(input: CaprwInput = {}): CaprwRunReport {
    this.status = "connecting";
    const report = this.manager.connect(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeAccountingRecords(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeAccounting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeCashflowReports(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeCashflow(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeBudgetReports(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeBudget(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeProfitabilityReports(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeProfitability(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeForecastingReports(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeForecasting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeTaxSupportReports(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeTaxSupport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeInvestmentPlanningReports(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeInvestmentPlanning(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeFinancialReportingReports(input: CaprwInput = {}): CaprwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeFinancialReporting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  detectRisks(input: CaprwInput = {}): CaprwRunReport {
    this.status = "detecting_risks";
    const report = this.manager.detectRisks(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  prioritiseRisks(input: CaprwInput = {}): CaprwRunReport {
    this.status = "prioritising_risks";
    const report = this.manager.prioritiseRisksAction(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  generateExecutiveRiskDashboard(input: CaprwInput = {}): CaprwRunReport {
    this.status = "dashboarding";
    const report = this.manager.generateExecutiveRiskDashboard(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  produceCapitalRiskReport(input: CaprwInput = {}): CaprwRunReport {
    this.status = "reporting";
    const report = this.manager.produceCapitalRiskReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  submitReport(input: CaprwInput = {}): CaprwRunReport {
    this.status = "reporting";
    const report = this.manager.submitReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list(): CaprwRunReport {
    return this.manager.list();
  }

  validate(input: CaprwInput = {}): CaprwRunReport {
    this.status = "validating";
    const report = this.manager.validate(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  diagnostics(): CaprwRunReport {
    return this.manager.diagnostics(this.configuration);
  }

  runDiagnostics(): CaprwRunReport {
    return this.diagnostics();
  }
}
