import type { FinancialReportingWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type FinancialReportingWorkerDependencies } from "./integrations.js";
import { consolidateSummaries } from "./reporting-aggregator.js";
import {
  buildCatalog,
  buildDashboardFromSummaries,
  buildEngineRecord,
  buildFinancialReport,
  buildQ910ConsumableContract,
  buildReportConfidence,
} from "./reporting-builder.js";
import { ReportingStore } from "./reporting-store.js";
import { appendFrwLog } from "./frw-logging.js";
import { FrwValidator } from "./reporting-validator.js";
import type {
  ConsolidationContext,
  FrwInput,
  FrwRunReport,
  Q910ConsumableContract,
} from "./types.js";

export class FinancialReportingWorkerManager {
  private readonly store = new ReportingStore();
  private readonly integrations = new IntegrationCoordinator();
  private readonly validator = new FrwValidator();
  private connected = false;

  bindIntegrations(deps: FinancialReportingWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  getEngineRecord() {
    return this.store.getEngineRecord();
  }

  getCatalog() {
    return this.store.getCatalog();
  }

  getReports() {
    return this.store.getReports();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestBusinessId() {
    return this.store.getLatestBusinessId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ910ConsumableContract(config: FinancialReportingWorkerConfiguration): Q910ConsumableContract {
    return buildQ910ConsumableContract(config);
  }

  private buildContext(config: FinancialReportingWorkerConfiguration, input: FrwInput): ConsolidationContext {
    const currency = (input.currency ?? config.defaultCurrency).trim();
    return {
      currency,
      revenueSnapshot: input.revenueSnapshot,
      expenseSnapshot: input.expenseSnapshot,
      cashflowSnapshot: input.cashflowSnapshot,
      budgetSnapshot: input.budgetSnapshot,
      profitabilitySnapshot: input.profitabilitySnapshot,
      forecastSnapshot: input.forecastSnapshot,
      investmentSnapshot: input.investmentSnapshot,
      taxSupportSnapshot: input.taxSupportSnapshot,
      injectedCashflowReports: this.integrations.fetchCashflowReports(),
      injectedBudgetReports: this.integrations.fetchBudgetReports(),
      injectedProfitabilityReports: this.integrations.fetchProfitabilityReports(),
      injectedForecastingReports: this.integrations.fetchForecastingReports(),
      injectedTaxSupportReports: this.integrations.fetchTaxSupportReports(),
      injectedInvestmentReports: this.integrations.fetchInvestmentPlanningReports(),
    };
  }

  connect(config: FinancialReportingWorkerConfiguration, _input: FrwInput = {}): FrwRunReport {
    const handshakes = this.integrations.connect(config.integrationTargets as never);
    this.connected = true;
    this.store.setCatalog(buildCatalog(config));
    this.refreshEngineRecord(config, "connected", "healthy", "passed");
    this.store.appendAudit("connect", `handshakes=${handshakes.length}`);
    return {
      action: "connect",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      handshakes,
      details: "Financial Reporting Worker connected",
    };
  }

  consumeAccounting(_config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const entries = this.integrations.fetchAccountingEntries();
    this.store.appendAudit("consume_accounting", `entries=${entries.length}`);
    appendFrwLog({ event: "consume_accounting", details: `entries=${entries.length}` });
    return {
      action: "consume_accounting",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${entries.length} accounting entr(y/ies) for traceability`,
    };
  }

  consumeCashflow(_config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const reports = this.integrations.fetchCashflowReports();
    this.store.appendAudit("consume_cashflow", `reports=${reports.length}`);
    return {
      action: "consume_cashflow",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} cashflow report(s)`,
    };
  }

  consumeBudget(_config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const reports = this.integrations.fetchBudgetReports();
    this.store.appendAudit("consume_budget", `reports=${reports.length}`);
    return {
      action: "consume_budget",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} budget report(s)`,
    };
  }

  consumeProfitability(_config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const reports = this.integrations.fetchProfitabilityReports();
    this.store.appendAudit("consume_profitability", `reports=${reports.length}`);
    return {
      action: "consume_profitability",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} profitability report(s)`,
    };
  }

  consumeForecasting(_config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const reports = this.integrations.fetchForecastingReports();
    this.store.appendAudit("consume_forecasting", `reports=${reports.length}`);
    return {
      action: "consume_forecasting",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} forecasting report(s)`,
    };
  }

  consumeTaxSupport(_config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const reports = this.integrations.fetchTaxSupportReports();
    this.store.appendAudit("consume_tax_support", `reports=${reports.length}`);
    return {
      action: "consume_tax_support",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} tax-support report(s)`,
    };
  }

  consumeInvestmentPlanning(_config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const reports = this.integrations.fetchInvestmentPlanningReports();
    this.store.appendAudit("consume_investment_planning", `reports=${reports.length}`);
    return {
      action: "consume_investment_planning",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} investment-planning report(s)`,
    };
  }

  private validateAndPrepare(
    config: FinancialReportingWorkerConfiguration,
    input: FrwInput,
    action: FrwRunReport["action"],
  ): { ok: true; businessId: string; period: string; currency: string } | { ok: false; report: FrwRunReport } {
    const future = this.validator.rejectFutureMissions(
      typeof (input as { missionId?: string }).missionId === "string"
        ? (input as { missionId?: string }).missionId
        : null,
    );
    if (future.decision === "fail") {
      return {
        ok: false,
        report: {
          action,
          validation: future,
          runTimestamp: new Date().toISOString(),
          details: future.errors.join("; "),
        },
      };
    }
    const validation = this.validator.validateInput(input);
    if (validation.decision === "fail") {
      return {
        ok: false,
        report: {
          action,
          validation,
          runTimestamp: new Date().toISOString(),
          capitalBusinessId: input.capitalBusinessId ?? null,
          reportingPeriod: input.reportingPeriod ?? null,
          details: validation.errors.join("; "),
        },
      };
    }
    const businessId =
      this.integrations.resolveCapitalBusinessId(input.capitalBusinessId) ?? input.capitalBusinessId!.trim();
    const reportingPeriod = input.reportingPeriod!.trim();
    const currency = (input.currency ?? config.defaultCurrency).trim();
    return { ok: true, businessId, period: reportingPeriod, currency };
  }

  generateExecutiveDashboard(
    config: FinancialReportingWorkerConfiguration,
    input: FrwInput = {},
  ): FrwRunReport {
    const prep = this.validateAndPrepare(config, input, "generate_executive_dashboard");
    if (!prep.ok) return prep.report;
    const ctx = this.buildContext(config, input);
    const consolidated = consolidateSummaries(ctx);
    const dashboard = buildDashboardFromSummaries({
      currency: prep.currency,
      revenue: consolidated.revenue,
      expense: consolidated.expense,
      cashflow: consolidated.cashflow,
      budget: consolidated.budget,
      profitability: consolidated.profitability,
      forecast: consolidated.forecast,
      investment: consolidated.investment,
      taxSupport: consolidated.taxSupport,
      capital: consolidated.capital,
      kpis: consolidated.kpis,
    });
    this.store.addDashboard(dashboard);
    this.refreshEngineRecord(config, "active", "healthy", "passed", prep.businessId, prep.period);
    this.store.appendAudit("generate_executive_dashboard", `dashboard=${dashboard.dashboardId}`);
    return {
      action: "generate_executive_dashboard",
      validation: { decision: "pass", errors: [], warnings: consolidated.outstandingIssues.length ? consolidated.outstandingIssues : [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: prep.businessId,
      reportingPeriod: prep.period,
      executiveDashboard: dashboard,
      details: `Executive dashboard ${dashboard.dashboardId} generated with ${dashboard.widgets.length} widget(s)`,
    };
  }

  generateCapitalSummary(
    config: FinancialReportingWorkerConfiguration,
    input: FrwInput = {},
  ): FrwRunReport {
    const prep = this.validateAndPrepare(config, input, "generate_capital_summary");
    if (!prep.ok) return prep.report;
    const ctx = this.buildContext(config, input);
    const consolidated = consolidateSummaries(ctx);
    this.refreshEngineRecord(config, "active", "healthy", "passed", prep.businessId, prep.period);
    return {
      action: "generate_capital_summary",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: prep.businessId,
      reportingPeriod: prep.period,
      capitalSummary: consolidated.capital,
      details: `Capital summary status=${consolidated.capital.status}`,
    };
  }

  produceFinancialReport(
    config: FinancialReportingWorkerConfiguration,
    input: FrwInput = {},
  ): FrwRunReport {
    const prep = this.validateAndPrepare(config, input, "produce_financial_report");
    if (!prep.ok) return prep.report;
    const ctx = this.buildContext(config, input);
    const consolidated = consolidateSummaries(ctx);
    const dashboard = buildDashboardFromSummaries({
      currency: prep.currency,
      revenue: consolidated.revenue,
      expense: consolidated.expense,
      cashflow: consolidated.cashflow,
      budget: consolidated.budget,
      profitability: consolidated.profitability,
      forecast: consolidated.forecast,
      investment: consolidated.investment,
      taxSupport: consolidated.taxSupport,
      capital: consolidated.capital,
      kpis: consolidated.kpis,
    });
    const summaries = [
      consolidated.revenue,
      consolidated.expense,
      consolidated.cashflow,
      consolidated.budget,
      consolidated.profitability,
      consolidated.forecast,
      consolidated.investment,
      consolidated.taxSupport,
      consolidated.capital,
    ];
    const evidence = [
      ...summaries.flatMap((s) => s.sourceRefs),
      ...this.integrations.fetchAccountingEntries().map((e) => e.entryId),
      ...this.integrations.fetchCashflowReports().map((r) => String(r.reportId ?? "cashflow")),
      ...this.integrations.fetchBudgetReports().map((r) => String(r.reportId ?? "budget")),
      ...this.integrations.fetchProfitabilityReports().map((r) => String(r.reportId ?? "profitability")),
      ...this.integrations.fetchForecastingReports().map((r) => String(r.reportId ?? "forecast")),
      ...this.integrations.fetchTaxSupportReports().map((r) => String(r.reportId ?? "tax-support")),
      ...this.integrations.fetchInvestmentPlanningReports().map((r) => String(r.reportId ?? "investment")),
    ];
    const uniqueEvidence = [...new Set(evidence)];
    const confidenceScore = buildReportConfidence(summaries);
    const draftValidation = { decision: "pass" as const, errors: [] as string[], warnings: [] as string[] };
    const report = buildFinancialReport({
      capitalBusinessId: prep.businessId,
      capitalProjectId: input.capitalProjectId?.trim() || `project-${prep.businessId}`,
      reportingPeriod: prep.period,
      currency: prep.currency,
      executiveDashboard: dashboard,
      revenueSummary: consolidated.revenue,
      expenseSummary: consolidated.expense,
      cashflowSummary: consolidated.cashflow,
      budgetSummary: consolidated.budget,
      profitabilitySummary: consolidated.profitability,
      forecastSummary: consolidated.forecast,
      investmentSummary: consolidated.investment,
      taxSupportSummary: consolidated.taxSupport,
      capitalSummary: consolidated.capital,
      enterpriseKpis: consolidated.kpis,
      supportingEvidence: uniqueEvidence,
      outstandingIssues: consolidated.outstandingIssues,
      confidenceScore,
      validation: draftValidation,
      config,
    });
    const reportValidation = this.validator.validateReport(report);
    report.validation = reportValidation;
    this.store.addReport(report);
    this.store.addDashboard(dashboard);
    this.refreshEngineRecord(
      config,
      "active",
      "healthy",
      reportValidation.decision === "fail" ? "failed" : "passed",
      prep.businessId,
      prep.period,
    );
    this.store.appendAudit("produce_financial_report", `report=${report.reportId}`);
    return {
      action: "produce_financial_report",
      validation: reportValidation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: prep.businessId,
      reportingPeriod: prep.period,
      executiveDashboard: dashboard,
      capitalSummary: consolidated.capital,
      financialReport: report,
      details: `Financial Report ${report.reportId} produced — consolidation only, never execution`,
    };
  }

  submitReport(config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const produced = this.produceFinancialReport(config, input);
    if (produced.validation.decision === "fail" || !produced.financialReport) return produced;
    const report = { ...produced.financialReport };
    const audit = this.integrations.recordAudit(report);
    report.auditStatus = audit.audited ? "passed" : "pending";
    if (config.executiveReportingEnabled) {
      const submit = this.integrations.submitReport(report);
      report.submittedThroughExecutiveReportingRuntime = submit.submitted;
      report.executiveReportId = submit.executiveReportId;
    }
    this.store.addReport(report);
    return {
      ...produced,
      action: "submit_report",
      financialReport: report,
      details: report.submittedThroughExecutiveReportingRuntime
        ? `Submitted via ERR: ${report.executiveReportId}`
        : "Report stored locally — ERR unavailable",
    };
  }

  list(): FrwRunReport {
    const reports = this.store.getReports();
    return {
      action: "list",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      details: `Reports=${reports.length} dashboards=${this.store.getDashboards().length}`,
    };
  }

  validate(config: FinancialReportingWorkerConfiguration, input: FrwInput = {}): FrwRunReport {
    const inputValidation = this.validator.validateInput(input);
    const latest = this.store.getLatestReport();
    const reportValidation = latest
      ? this.validator.validateReport(latest)
      : { decision: "pass" as const, errors: [], warnings: [] };
    const combined = {
      decision:
        inputValidation.decision === "fail" || reportValidation.decision === "fail"
          ? ("fail" as const)
          : inputValidation.decision === "partial" || reportValidation.decision === "partial"
            ? ("partial" as const)
            : ("pass" as const),
      errors: [...inputValidation.errors, ...reportValidation.errors],
      warnings: [...inputValidation.warnings, ...reportValidation.warnings],
    };
    this.refreshEngineRecord(
      config,
      this.connected ? "active" : "connected",
      combined.decision === "fail" ? "degraded" : "healthy",
      combined.decision === "fail" ? "failed" : "passed",
    );
    return {
      action: "validate",
      validation: combined,
      runTimestamp: new Date().toISOString(),
      details: combined.errors.join("; ") || "Validation complete",
    };
  }

  diagnostics(config: FinancialReportingWorkerConfiguration): FrwRunReport {
    return {
      action: "diagnostics",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      handshakes: this.integrations.getHandshakes(),
      details: `connected=${this.connected} reports=${this.store.getReports().length} engineEnabled=${config.enabled}`,
    };
  }

  private refreshEngineRecord(
    config: FinancialReportingWorkerConfiguration,
    operationalState: "connected" | "active",
    healthStatus: "healthy" | "degraded" | "failed",
    validationStatus: "passed" | "failed",
    lastBusinessId: string | null = this.store.getLatestBusinessId(),
    lastReportingPeriod: string | null = null,
  ) {
    this.store.setEngineRecord(
      buildEngineRecord({
        operationalState,
        healthStatus,
        validationStatus,
        totalReports: this.store.getReports().length,
        totalDashboards: this.store.getDashboards().length,
        lastBusinessId,
        lastReportingPeriod,
        handshakes: this.integrations.getHandshakes(),
      }),
    );
    void config;
  }
}
