import type { CashflowWorkerConfiguration } from "./configuration.js";
import type { CashflowWorkerDependencies } from "./integrations.js";
import { CashflowWorkerManager } from "./cashflow-manager.js";
import type { CfwInput, CfwRunReport, EngineStatus } from "./types.js";

export class CashflowWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: CfwRunReport | null = null;

  constructor(
    private readonly manager: CashflowWorkerManager,
    private readonly config: CashflowWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CashflowWorkerDependencies = {}) {
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
      reportingFrequencies: [...this.config.reportingFrequencies],
      currencies: [...this.config.currencies],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedMovements: this.config.seedMovements.map((m) => ({
        ...m,
        amountMinor: { ...m.amountMinor },
        traceabilityRefs: [...m.traceabilityRefs],
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

  consumeAccountingRecords(input: CfwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeAccountingRecords(input, this.config));
  }

  trackCashInflows(input: CfwInput = {}) {
    this.status = "tracking_inflows";
    return this.finish(this.manager.trackCashInflows(input, this.config));
  }

  trackCashOutflows(input: CfwInput = {}) {
    this.status = "tracking_outflows";
    return this.finish(this.manager.trackCashOutflows(input, this.config));
  }

  calculateNetCashflow(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateNetCashflow(input, this.config));
  }

  maintainOpeningClosingBalances(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.maintainOpeningClosingBalances(input, this.config));
  }

  produceDailyCashflowView(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.produceDailyCashflowView(input, this.config));
  }

  produceWeeklyCashflowView(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.produceWeeklyCashflowView(input, this.config));
  }

  produceMonthlyCashflowView(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.produceMonthlyCashflowView(input, this.config));
  }

  produceAnnualCashflowView(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.produceAnnualCashflowView(input, this.config));
  }

  produceCustomCashflowView(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.produceCustomCashflowView(input, this.config));
  }

  produceBusinessCashflowView(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.produceBusinessCashflowView(input, this.config));
  }

  produceConsolidatedCashflowView(input: CfwInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.produceConsolidatedCashflowView(input, this.config));
  }

  identifyUnreconciledMovements(input: CfwInput = {}) {
    this.status = "reconciling";
    return this.finish(this.manager.identifyUnreconciledMovements(input, this.config));
  }

  comparePeriods(input: CfwInput = {}) {
    this.status = "comparing";
    return this.finish(this.manager.comparePeriods(input, this.config));
  }

  produceCashflowReport(input: CfwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceCashflowReport(input, this.config));
  }

  submitReport(input: CfwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CfwInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getQ904ConsumableContract() {
    return this.manager.getQ904ConsumableContract(this.config);
  }

  private finish(report: CfwRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
