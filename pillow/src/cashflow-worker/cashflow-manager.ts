import type { CashflowWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type CashflowWorkerDependencies } from "./integrations.js";
import { appendCfwLog } from "./cfw-logging.js";
import {
  CASHFLOW_SCOPES,
  CASHFLOW_WORKER_ID,
  CFW_METADATA_VERSION,
  INTEGRATION_TARGETS,
  REPORTING_FREQUENCIES,
} from "./paths.js";
import {
  buildCatalog,
  buildEngineRecord,
  buildQ904ConsumableContract,
  buildReport,
  buildView,
  resolvePriorView,
  type BuiltView,
} from "./cashflow-builder.js";
import {
  buildAmountSummary,
  classifyEntryIntoMovements,
  normalizeCurrency,
  resolvePeriodBoundaries,
} from "./cashflow-calculator.js";
import { CfwCashflowStore } from "./cashflow-store.js";
import { CfwValidator, HealthMonitor, RecoveryManager } from "./cashflow-validator.js";
import { moneySub } from "./money.js";
import type {
  CashAmountSummary,
  CashflowReport,
  CashflowScope,
  CashflowWorkerCatalog,
  CashflowWorkerEngineRecord,
  CashMovement,
  CashMovementDirection,
  CfwInput,
  CfwRunReport,
  CfwValidationReport,
  IntegrationHandshake,
  InjectedAccountingEntry,
  OperationalState,
  PeriodCashflowView,
  Q904ConsumableContract,
  ReconciliationStatus,
  ReportingFrequency,
} from "./types.js";

function isValidScope(value: unknown): value is CashflowScope {
  return typeof value === "string" && (CASHFLOW_SCOPES as readonly string[]).includes(value);
}

function normalizeFrequency(value: unknown, fallback: ReportingFrequency): ReportingFrequency {
  return typeof value === "string" && (REPORTING_FREQUENCIES as readonly string[]).includes(value)
    ? (value as ReportingFrequency)
    : fallback;
}

export class CashflowWorkerManager {
  private engineRecord: CashflowWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: CashflowWorkerCatalog | null = null;
  private readonly store = new CfwCashflowStore();
  private readonly validator = new CfwValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: CashflowWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CashflowWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedMovements);
    this.catalog = buildCatalog(config, this.store.listMovements(), this.store.listViews(), this.store.listReports(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getMovements() {
    return this.store.listMovements();
  }

  getViews() {
    return this.store.listViews();
  }

  getReports() {
    return this.store.listReports();
  }

  getLatestBusinessId() {
    return this.store.getLatestBusinessId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getQ904ConsumableContract(config: CashflowWorkerConfiguration): Q904ConsumableContract {
    return buildQ904ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.integrationTargets.length
        ? (config.integrationTargets as (typeof INTEGRATION_TARGETS)[number][])
        : [...INTEGRATION_TARGETS],
    );
    this.rebuildCatalog(config);
    this.ensureRecord("connected", config);
    appendCfwLog({ event: "connect", details: `Cashflow Worker connected; integrations=${this.handshakes.length}` });
    return this.report(
      "connect",
      [],
      null,
      [],
      null,
      null,
      null,
      [],
      config.enabled ? "pass" : "fail",
      started,
      [],
      null,
      config.enabled ? [] : ["Cashflow Worker is disabled"],
    );
  }

  consumeAccountingRecords(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.cashflowRulesEnabled) {
      return this.disabled(
        "consume_accounting_records",
        config,
        started,
        !config.enabled ? "Cashflow Worker is disabled" : "Cashflow rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("consume_accounting_records", input, config, started);
    }

    const injected = input.accountingEntries ?? [];
    const fromIntegration = this.integrations.fetchAccountingEntries();
    const byId = new Map<string, InjectedAccountingEntry>();
    for (const entry of [...fromIntegration, ...injected]) {
      if (entry?.entryId) byId.set(entry.entryId, entry);
    }
    const entries = [...byId.values()];

    if (!entries.length) {
      const validation = this.validator.validateMovements([], { ...input, validated: input.validated ?? true }, started, true);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      appendCfwLog({ event: "consume_accounting_records", details: "no accounting records available" });
      return this.report("consume_accounting_records", [], null, [], null, null, null, [], validation, started);
    }

    const producedMovements: CashMovement[] = [];
    const issues: string[] = [];
    for (const entry of entries) {
      const classified = classifyEntryIntoMovements(entry, config.defaultCurrency);
      for (const movement of classified.movements) {
        this.store.upsertMovement(movement);
        producedMovements.push(movement);
      }
      issues.push(...classified.issues);
    }

    let validation = this.validator.validateMovements(
      producedMovements,
      { ...input, validated: input.validated ?? true },
      started,
      false,
    );
    if (issues.length) validation = mergeIssuesAsWarnings(validation, issues);

    this.rebuildCatalog(config);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", this.store.getLatestBusinessId());
    appendCfwLog({ event: "consume_accounting_records", details: `entries=${entries.length} movements=${producedMovements.length}` });
    return this.report("consume_accounting_records", this.store.listMovements(), null, [], null, null, null, [], validation, started, issues);
  }

  trackCashInflows(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.trackDirection("track_cash_inflows", "inflow", input, config);
  }

  trackCashOutflows(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.trackDirection("track_cash_outflows", "outflow", input, config);
  }

  private trackDirection(
    action: "track_cash_inflows" | "track_cash_outflows",
    direction: CashMovementDirection,
    input: CfwInput,
    config: CashflowWorkerConfiguration,
  ): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const { scope, scopeId } = this.resolveScopeAndId(input, config, null);
    const scoped = this.filterMovementsForScope(this.store.listMovements(), scope, scopeId, config);
    const filtered = this.applyOptionalPeriodFilter(scoped, input).filter((m) => m.direction === direction);
    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const summary = summarizeMovements(filtered, currency);

    const validation = this.validator.validateMovements(filtered, { ...input, validated: input.validated ?? true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCfwLog({ event: action, details: `scope=${scope}:${scopeId} count=${filtered.length}` });
    return this.report(
      action,
      filtered,
      null,
      [],
      direction === "inflow" ? summary : null,
      direction === "outflow" ? summary : null,
      null,
      [],
      validation,
      started,
    );
  }

  calculateNetCashflow(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("calculate_net_cashflow", input, config, started);
    }
    const { scope, scopeId } = this.resolveScopeAndId(input, config, null);
    const scoped = this.filterMovementsForScope(this.store.listMovements(), scope, scopeId, config);
    const periodScoped = this.applyOptionalPeriodFilter(scoped, input);
    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const inflowSummary = summarizeMovements(periodScoped.filter((m) => m.direction === "inflow"), currency);
    const outflowSummary = summarizeMovements(periodScoped.filter((m) => m.direction === "outflow"), currency);
    const netCashflow = moneySub(inflowSummary.totalMinor, outflowSummary.totalMinor);

    const validation = this.validator.validateMovements(periodScoped, { ...input, validated: input.validated ?? true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCfwLog({ event: "calculate_net_cashflow", details: `scope=${scope}:${scopeId} net=${netCashflow.minorUnits}` });
    return this.report(
      "calculate_net_cashflow",
      periodScoped,
      null,
      [],
      inflowSummary,
      outflowSummary,
      netCashflow,
      [],
      validation,
      started,
    );
  }

  maintainOpeningClosingBalances(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("maintain_opening_closing_balances", input, config, null, null);
  }

  produceDailyCashflowView(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("produce_daily_view", input, config, "daily", null);
  }

  produceWeeklyCashflowView(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("produce_weekly_view", input, config, "weekly", null);
  }

  produceMonthlyCashflowView(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("produce_monthly_view", input, config, "monthly", null);
  }

  produceAnnualCashflowView(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("produce_annual_view", input, config, "annual", null);
  }

  produceCustomCashflowView(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("produce_custom_view", input, config, "custom", null);
  }

  produceBusinessCashflowView(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("produce_business_view", input, config, null, "business");
  }

  produceConsolidatedCashflowView(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("produce_consolidated_view", input, config, null, "enterprise");
  }

  private produceView(
    action: CfwRunReport["action"],
    input: CfwInput,
    config: CashflowWorkerConfiguration,
    forcedFrequency: ReportingFrequency | null,
    forcedScope: CashflowScope | null,
  ): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.cashflowRulesEnabled) {
      return this.disabled(action, config, started, !config.enabled ? "Cashflow Worker is disabled" : "Cashflow rules are disabled");
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    let built: BuiltView;
    try {
      built = this.buildViewInternal(input, config, forcedFrequency, forcedScope);
    } catch (error) {
      const validation = this.validator.finalize(
        "fail",
        [error instanceof Error ? error.message : "Cashflow Worker could not resolve deterministic period boundaries"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, [], null, null, null, [], validation, started);
    }

    // `built.issues` (e.g. missing prior-period opening balance) is expected
    // and transparently surfaced via `notes`/outstanding issues rather than
    // downgrading validation — a first-ever period never has a prior close.
    const validation = this.validator.validateView(built.view, { ...input, validated: input.validated ?? true }, started);

    this.rebuildCatalog(config);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      this.store.getLatestBusinessId(),
      built.view.reconciliationStatus,
    );
    appendCfwLog({
      event: action,
      details: `scope=${built.view.scope}:${built.view.scopeId} period=${built.view.periodLabel} net=${built.view.netCashflow.minorUnits}`,
    });
    return this.report(
      action,
      built.periodMovements,
      built.view,
      [built.view],
      built.inflowSummary,
      built.outflowSummary,
      built.view.netCashflow,
      built.view.unreconciledMovements,
      validation,
      started,
      built.issues,
    );
  }

  identifyUnreconciledMovements(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("identify_unreconciled_movements", input, config, started);
    }
    let movements = this.store.listMovements();
    if (input.businessId?.trim() || input.capitalBusinessId?.trim()) {
      const businessId = (input.capitalBusinessId ?? input.businessId)!.trim();
      movements = movements.filter((m) => m.businessId === businessId);
    }
    if (input.accountId?.trim()) {
      movements = movements.filter((m) => m.accountId === input.accountId!.trim());
    }
    const unreconciled = movements.filter((m) => m.amountStatus === "pending" || m.amountStatus === "disputed");

    const validation = this.validator.validateMovements(movements, { ...input, validated: input.validated ?? true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCfwLog({ event: "identify_unreconciled_movements", details: `count=${unreconciled.length}` });
    return this.report(
      "identify_unreconciled_movements",
      movements,
      null,
      [],
      null,
      null,
      null,
      unreconciled,
      validation,
      started,
    );
  }

  comparePeriods(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    return this.produceView("compare_periods", input, config, null, null);
  }

  produceCashflowReport(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_cashflow_report", input, config, started);
    }

    let built: BuiltView;
    try {
      built = this.buildViewInternal(input, config, null, null);
    } catch (error) {
      const validation = this.validator.finalize(
        "fail",
        [error instanceof Error ? error.message : "Cashflow Worker could not resolve deterministic period boundaries"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("produce_cashflow_report", [], null, [], null, null, null, [], validation, started);
    }

    const businessId = this.resolveBusinessId(input);
    const capitalProjectId = input.capitalProjectId?.trim() || null;
    const scopeViews = this.store
      .listViews()
      .filter((v) => v.scope === built.view.scope && v.scopeId === built.view.scopeId);

    const report = buildReport({
      capitalBusinessId: businessId,
      capitalProjectId,
      primaryView: built.view,
      inflowSummary: built.inflowSummary,
      outflowSummary: built.outflowSummary,
      scopeViews,
      extraOutstandingIssues: built.issues,
      validation: null,
    });

    let validation = this.validator.validateReport(report, { ...input, validated: input.validated ?? true }, started);
    const finalReport: CashflowReport = { ...report, validation };
    this.store.addReport(finalReport);
    this.rebuildCatalog(config);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      businessId,
      finalReport.reconciliationStatus,
    );
    appendCfwLog({ event: "produce_cashflow_report", details: `business=${businessId} reconciliation=${finalReport.reconciliationStatus}` });
    return this.report(
      "produce_cashflow_report",
      built.periodMovements,
      built.view,
      Object.values(finalReport.views).flat(),
      built.inflowSummary,
      built.outflowSummary,
      finalReport.netCashflow,
      built.view.unreconciledMovements,
      validation,
      started,
      built.issues,
      finalReport,
    );
  }

  submitReport(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, started, "Executive reporting submission is disabled");
    }

    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceCashflowReport(input, config);
      report = produced.latestReport;
    }
    if (!report) {
      return this.disabled("submit_report", config, started, "No Cashflow Report available for submission");
    }

    const audit = this.integrations.recordAudit(report);
    if (audit.audited) {
      report = { ...report, auditStatus: "passed" };
      this.store.replaceLatestReport(report);
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report = { ...report, submittedToExecutiveReporting: true, executiveReportId: submission.executiveReportId };
      this.store.replaceLatestReport(report);
    }
    this.integrations.recordMemory(report);

    this.rebuildCatalog(config);
    let validation = this.validator.validateReport(report, { ...input, validated: input.validated ?? true }, started);
    if (!submission.submitted) validation = mergeIssuesAsWarnings(validation, ["executive_reporting_runtime_unavailable"]);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report.capitalBusinessId,
      report.reconciliationStatus,
    );
    return this.report("submit_report", [], null, [], null, null, null, [], validation, started, [], report);
  }

  list(config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const movements = this.store.listMovements();
    const validation = this.validator.validateMovements(movements, { validated: true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("list", movements, null, this.store.listViews(), null, null, null, [], validation, started, [], this.store.getLatestReport());
  }

  validate(input: CfwInput, config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const movements = this.store.listMovements();
    const validation = this.validator.validateMovements(movements, { ...input, validated: input.validated ?? true }, started, false);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("validate", movements, null, this.store.listViews(), null, null, null, [], validation, started, [], this.store.getLatestReport());
  }

  diagnostics(config: CashflowWorkerConfiguration): CfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const validation = this.validator.finalize(config.enabled ? "pass" : "fail", config.enabled ? [] : ["Cashflow Worker is disabled"], [], started);
    this.ensureRecord("active", config);
    appendCfwLog({ event: "diagnostics", details: `movements=${this.store.countMovements()} views=${this.store.countViews()}` });
    return this.report("diagnostics", this.store.listMovements(), null, [], null, null, null, [], validation, started);
  }

  runDiagnostics(config: CashflowWorkerConfiguration) {
    return this.diagnostics(config);
  }

  private buildViewInternal(
    input: CfwInput,
    config: CashflowWorkerConfiguration,
    forcedFrequency: ReportingFrequency | null,
    forcedScope: CashflowScope | null,
  ): BuiltView {
    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const frequency = forcedFrequency ?? normalizeFrequency(input.reportingFrequency, "monthly");
    const { scope, scopeId } = this.resolveScopeAndId(input, config, forcedScope);
    const scopeMovements = this.filterMovementsForScope(this.store.listMovements(), scope, scopeId, config);

    const priorView = resolvePriorView(frequency, input.reportingPeriod, input.periodStart, input.periodEnd, (periodLabel) =>
      this.store.getView(scope, scopeId, frequency, periodLabel),
    );

    const built = buildView({
      scope,
      scopeId,
      frequency,
      reportingPeriod: input.reportingPeriod,
      periodStartInput: input.periodStart,
      periodEndInput: input.periodEnd,
      currency,
      scopeMovements,
      openingOverrideMinor: typeof input.openingCashBalanceMinor === "number" ? input.openingCashBalanceMinor : null,
      restrictedOverrideMinor: typeof input.restrictedCashMinor === "number" ? input.restrictedCashMinor : null,
      priorView,
    });

    this.store.saveView(built.view);
    return built;
  }

  private applyOptionalPeriodFilter(movements: CashMovement[], input: CfwInput): CashMovement[] {
    if (!input.reportingFrequency && !input.reportingPeriod && !input.periodStart && !input.periodEnd) {
      return movements;
    }
    try {
      const frequency = normalizeFrequency(input.reportingFrequency, "monthly");
      const boundaries =
        frequency === "custom" && input.periodStart && input.periodEnd
          ? { periodStart: input.periodStart, periodEnd: input.periodEnd, periodLabel: "" }
          : resolvePeriodBoundaries(frequency, input.reportingPeriod, input.periodStart, input.periodEnd);
      if (!boundaries) return movements;
      const startMs = new Date(boundaries.periodStart).getTime();
      const endMs = new Date(boundaries.periodEnd).getTime();
      return movements.filter((m) => {
        const ts = new Date(m.timestamp).getTime();
        return Number.isFinite(ts) && ts >= startMs && ts <= endMs;
      });
    } catch {
      return movements;
    }
  }

  private resolveScopeAndId(
    input: CfwInput,
    config: CashflowWorkerConfiguration,
    forcedScope: CashflowScope | null,
  ): { scope: CashflowScope; scopeId: string } {
    const scope: CashflowScope =
      forcedScope ?? (isValidScope(input.scope) ? input.scope : input.accountId ? "account" : "business");
    if (scope === "account") {
      return { scope, scopeId: input.accountId?.trim() || this.resolveBusinessId(input) };
    }
    if (scope === "factory") {
      return { scope, scopeId: input.factoryId?.trim() || config.factory };
    }
    if (scope === "enterprise") {
      return { scope, scopeId: "enterprise" };
    }
    return { scope: "business", scopeId: this.resolveBusinessId(input) };
  }

  private filterMovementsForScope(
    movements: CashMovement[],
    scope: CashflowScope,
    scopeId: string,
    _config: CashflowWorkerConfiguration,
  ): CashMovement[] {
    if (scope === "account") return movements.filter((m) => m.accountId === scopeId);
    if (scope === "business") return movements.filter((m) => m.businessId === scopeId);
    // factory and enterprise scopes span every business currently tracked by the Cashflow Worker.
    return movements;
  }

  private resolveBusinessId(input: CfwInput): string {
    return (
      input.capitalBusinessId?.trim() ||
      input.businessId?.trim() ||
      this.integrations.resolveCapitalBusinessId(null) ||
      this.store.getLatestBusinessId() ||
      "unspecified"
    );
  }

  private rebuildCatalog(config: CashflowWorkerConfiguration) {
    this.catalog = buildCatalog(config, this.store.listMovements(), this.store.listViews(), this.store.listReports(), this.handshakes);
  }

  private hasBoundary(input: CfwInput) {
    return (
      input.fabricateBalancesOrFlows === true ||
      input.createBudgets === true ||
      input.forecastFutureCashflow === true ||
      input.calculateCompleteBusinessProfitability === true ||
      input.approveSpending === true ||
      input.moveMoney === true ||
      input.modifyVerifiedAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ904OrLater === true ||
      (!!input.missionId && /^(Q9-0[4-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i.test(input.missionId.trim()))
    );
  }

  private boundaryFail(action: CfwRunReport["action"], input: CfwInput, config: CashflowWorkerConfiguration, started: number) {
    const validation = this.validator.validateGeneric(input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.store.listMovements(), null, [], null, null, null, [], validation, started);
  }

  private disabled(action: CfwRunReport["action"], config: CashflowWorkerConfiguration, started: number, message: string) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.store.listMovements(), null, [], null, null, null, [], validation, started);
  }

  private ensureRecord(
    state: OperationalState,
    config: CashflowWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastBusinessId: string | null = null,
    lastReconciliationStatus: ReconciliationStatus | null = null,
  ) {
    this.engineRecord = buildEngineRecord({
      existingId: this.engineRecord?.engineRecordId ?? null,
      engineId: CASHFLOW_WORKER_ID,
      state,
      healthStatus: this.healthMonitor.status(validationStatus === "failed" ? "fail" : "pass", config.enabled),
      validationStatus,
      totalMovements: this.store.countMovements(),
      totalViews: this.store.countViews(),
      lastReconciliationStatus: lastReconciliationStatus ?? this.engineRecord?.lastReconciliationStatus ?? null,
      lastBusinessId: lastBusinessId ?? this.store.getLatestBusinessId(),
      lastReportId: this.store.getLatestReport()?.reportId ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
    });
  }

  private report(
    action: CfwRunReport["action"],
    movements: CashMovement[],
    view: PeriodCashflowView | null,
    views: PeriodCashflowView[],
    inflowSummary: CashAmountSummary | null,
    outflowSummary: CashAmountSummary | null,
    netCashflow: CfwRunReport["netCashflow"],
    unreconciledMovements: CashMovement[],
    validationOrDecision: CfwValidationReport | CfwValidationReport["decision"],
    started: number,
    notes: string[] = [],
    latestReport: CashflowReport | null = null,
    extraErrors: string[] = [],
    extraWarnings: string[] = [],
  ): CfwRunReport {
    const validation: CfwValidationReport =
      typeof validationOrDecision === "string"
        ? this.validator.finalize(validationOrDecision, extraErrors, extraWarnings, started)
        : validationOrDecision;
    const engineRecord = this.getEngineRecord()!;
    return {
      cfwRunReportId: `cfw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog: this.getCatalog(),
      movements,
      view,
      views,
      inflowSummary,
      outflowSummary,
      netCashflow,
      unreconciledMovements,
      latestReport: latestReport ?? this.store.getLatestReport(),
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CFW_METADATA_VERSION,
      notes,
    };
  }
}

function summarizeMovements(movements: CashMovement[], currency: string): CashAmountSummary {
  return buildAmountSummary(movements, currency);
}

function mergeIssuesAsWarnings(validation: CfwValidationReport, issues: string[]): CfwValidationReport {
  const warnings = Array.from(new Set([...validation.warnings, ...issues]));
  const decision = validation.decision === "fail" ? "fail" : warnings.length ? "partial" : validation.decision;
  return { ...validation, warnings, decision };
}

function cloneCatalog(catalog: CashflowWorkerCatalog): CashflowWorkerCatalog {
  return {
    ...catalog,
    reportingFrequencies: [...catalog.reportingFrequencies],
    liquidityStatuses: [...catalog.liquidityStatuses],
    reconciliationStatuses: [...catalog.reconciliationStatuses],
    amountStatuses: [...catalog.amountStatuses],
    currencies: [...catalog.currencies],
    movements: catalog.movements.map((m) => ({ ...m, amountMinor: { ...m.amountMinor }, traceabilityRefs: [...m.traceabilityRefs] })),
    views: catalog.views.map((v) => ({ ...v })),
    reports: catalog.reports.map((r) => ({ ...r })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
