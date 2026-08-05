import type { InvestmentPlanningWorkerConfiguration } from "./configuration.js";
import type { InvestmentPlanningWorkerDependencies } from "./integrations.js";
import { InvestmentPlanningWorkerManager } from "./investment-manager.js";
import type { EngineStatus, IpwInput, IpwRunReport } from "./types.js";

export class InvestmentPlanningWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: InvestmentPlanningWorkerManager,
    private configuration: InvestmentPlanningWorkerConfiguration,
  ) {}

  initialize() {
    this.status = "idle";
  }

  bindIntegrations(deps: InvestmentPlanningWorkerDependencies = {}) {
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

  getQ909ConsumableContract() {
    return this.manager.getQ909ConsumableContract(this.configuration);
  }

  connect(input: IpwInput = {}): IpwRunReport {
    this.status = "connecting";
    const report = this.manager.connect(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeAccountingRecords(input: IpwInput = {}): IpwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeAccounting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeCashflowReports(input: IpwInput = {}): IpwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeCashflow(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeProfitabilityReports(input: IpwInput = {}): IpwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeProfitability(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeForecastingReports(input: IpwInput = {}): IpwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeForecasting(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeTaxSupportReports(input: IpwInput = {}): IpwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeTaxSupport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  consumeBudgetReports(input: IpwInput = {}): IpwRunReport {
    this.status = "consuming_records";
    const report = this.manager.consumeBudget(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  evaluateOpportunities(input: IpwInput = {}): IpwRunReport {
    this.status = "evaluating_opportunities";
    const report = this.manager.evaluateOpportunities(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  compareAlternatives(input: IpwInput = {}): IpwRunReport {
    this.status = "comparing_alternatives";
    const report = this.manager.compareAlternatives(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  rankOpportunities(input: IpwInput = {}): IpwRunReport {
    this.status = "ranking_opportunities";
    const report = this.manager.rankOpportunities(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  assessRisks(input: IpwInput = {}): IpwRunReport {
    this.status = "assessing_risks";
    const report = this.manager.assessRisks(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  produceInvestmentPlanningReport(input: IpwInput = {}): IpwRunReport {
    this.status = "reporting";
    const report = this.manager.produceInvestmentPlanningReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  submitReport(input: IpwInput = {}): IpwRunReport {
    this.status = "reporting";
    const report = this.manager.submitReport(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list(): IpwRunReport {
    return this.manager.list();
  }

  validate(input: IpwInput = {}): IpwRunReport {
    this.status = "validating";
    const report = this.manager.validate(this.configuration, input);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  diagnostics(): IpwRunReport {
    return this.manager.diagnostics(this.configuration);
  }

  runDiagnostics(): IpwRunReport {
    return this.diagnostics();
  }
}
