import type { AccountingWorkerConfiguration } from "./configuration.js";
import type { AccountingWorkerDependencies } from "./integrations.js";
import { AccountingWorkerManager } from "./accounting-manager.js";
import type { AccwInput, AccwRunReport, EngineStatus } from "./types.js";

export class AccountingWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: AccwRunReport | null = null;

  constructor(
    private readonly manager: AccountingWorkerManager,
    private readonly config: AccountingWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: AccountingWorkerDependencies = {}) {
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
      accountTypes: [...this.config.accountTypes],
      entryTypes: [...this.config.entryTypes],
      currencies: [...this.config.currencies],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedAccounts: this.config.seedAccounts.map((a) => ({ ...a, metadata: { ...a.metadata } })),
      seedEntries: this.config.seedEntries.map((e) => ({
        ...e,
        lines: e.lines.map((l) => ({ ...l })),
        traceabilityRefs: [...e.traceabilityRefs],
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

  recordIncome(input: AccwInput = {}) {
    this.status = "recording_income";
    return this.finish(this.manager.recordIncome(input, this.config));
  }

  recordExpense(input: AccwInput = {}) {
    this.status = "recording_expense";
    return this.finish(this.manager.recordExpense(input, this.config));
  }

  maintainAsset(input: AccwInput = {}) {
    this.status = "maintaining_assets";
    return this.finish(this.manager.maintainAsset(input, this.config));
  }

  maintainLiability(input: AccwInput = {}) {
    this.status = "maintaining_liabilities";
    return this.finish(this.manager.maintainLiability(input, this.config));
  }

  recordTransfer(input: AccwInput = {}) {
    this.status = "recording_transfer";
    return this.finish(this.manager.recordTransfer(input, this.config));
  }

  postJournalEntry(input: AccwInput = {}) {
    this.status = "posting_ledger";
    return this.finish(this.manager.postJournalEntry(input, this.config));
  }

  maintainGeneralLedger(input: AccwInput = {}) {
    this.status = "posting_ledger";
    return this.finish(this.manager.maintainGeneralLedger(input, this.config));
  }

  generateAccountingSummary(input: AccwInput = {}) {
    this.status = "summarizing";
    return this.finish(this.manager.generateAccountingSummary(input, this.config));
  }

  produceAccountingReport(input: AccwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceAccountingReport(input, this.config));
  }

  submitReport(input: AccwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: AccwInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getQ903ConsumableContract() {
    return this.manager.getQ903ConsumableContract(this.config);
  }

  private finish(report: AccwRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
