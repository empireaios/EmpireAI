import type { ProfitabilityWorkerConfiguration } from "./configuration.js";
import type { ProfitabilityWorkerDependencies } from "./integrations.js";
import { ProfitabilityWorkerManager } from "./profitability-manager.js";
import type { EngineStatus, PrfwInput, PrfwRunReport } from "./types.js";

export class ProfitabilityWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: PrfwRunReport | null = null;

  constructor(
    private readonly manager: ProfitabilityWorkerManager,
    private readonly config: ProfitabilityWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ProfitabilityWorkerDependencies = {}) {
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
      costCategories: [...this.config.costCategories],
      feeTypes: [...this.config.feeTypes],
      analysisScopes: [...this.config.analysisScopes],
      currencies: [...this.config.currencies],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedFinancialLineItems: this.config.seedFinancialLineItems.map((item) => ({ ...item })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  consumeAccountingRecords(input: PrfwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeAccountingRecords(input, this.config));
  }

  consumeCashflowReports(input: PrfwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeCashflowReports(input, this.config));
  }

  consumeBudgetReports(input: PrfwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeBudgetReports(input, this.config));
  }

  calculateGrossProfit(input: PrfwInput = {}) {
    this.status = "calculating_gross";
    return this.finish(this.manager.calculateGrossProfit(input, this.config));
  }

  calculateOperatingProfit(input: PrfwInput = {}) {
    this.status = "calculating_operating";
    return this.finish(this.manager.calculateOperatingProfit(input, this.config));
  }

  calculateNetProfit(input: PrfwInput = {}) {
    this.status = "calculating_net";
    return this.finish(this.manager.calculateNetProfit(input, this.config));
  }

  allocateSharedOperationalCosts(input: PrfwInput = {}) {
    this.status = "allocating_costs";
    return this.finish(this.manager.allocateSharedOperationalCosts(input, this.config));
  }

  analyseProfitabilityByBusiness(input: PrfwInput = {}) {
    this.status = "active";
    return this.finish(this.manager.analyseProfitabilityByBusiness(input, this.config));
  }

  analyseProfitabilityByProduct(input: PrfwInput = {}) {
    this.status = "active";
    return this.finish(this.manager.analyseProfitabilityByProduct(input, this.config));
  }

  analyseProfitabilityByProject(input: PrfwInput = {}) {
    this.status = "active";
    return this.finish(this.manager.analyseProfitabilityByProject(input, this.config));
  }

  identifyProfitDrivers(input: PrfwInput = {}) {
    this.status = "identifying_drivers";
    return this.finish(this.manager.identifyProfitDrivers(input, this.config));
  }

  identifyLossDrivers(input: PrfwInput = {}) {
    this.status = "identifying_drivers";
    return this.finish(this.manager.identifyLossDrivers(input, this.config));
  }

  rankProfitability(input: PrfwInput = {}) {
    this.status = "ranking";
    return this.finish(this.manager.rankProfitability(input, this.config));
  }

  produceProfitabilityReport(input: PrfwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceProfitabilityReport(input, this.config));
  }

  submitReport(input: PrfwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: PrfwInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getQ906ConsumableContract() {
    return this.manager.getQ906ConsumableContract(this.config);
  }

  private finish(report: PrfwRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
