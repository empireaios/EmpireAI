import type { CapitalRiskWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type CapitalRiskWorkerDependencies } from "./integrations.js";
import { appendCaprwLog } from "./caprw-logging.js";
import {
  buildCatalog,
  buildCapitalRiskReport,
  buildEngineRecord,
  buildEnterpriseRiskDashboard,
  buildExecutiveRiskSummary,
  buildQ911ConsumableContract,
  buildRecommendedMitigations,
} from "./risk-builder.js";
import { computeConfidenceScore, detectAllRisks, prioritiseRisks } from "./risk-detector.js";
import { RiskStore } from "./risk-store.js";
import { CaprwValidator } from "./risk-validator.js";
import type {
  CaprwInput,
  CaprwRunReport,
  DetectionContext,
  Q911ConsumableContract,
} from "./types.js";

export class CapitalRiskWorkerManager {
  private readonly store = new RiskStore();
  private readonly integrations = new IntegrationCoordinator();
  private readonly validator = new CaprwValidator();
  private connected = false;

  bindIntegrations(deps: CapitalRiskWorkerDependencies = {}) {
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

  getQ911ConsumableContract(config: CapitalRiskWorkerConfiguration): Q911ConsumableContract {
    return buildQ911ConsumableContract(config);
  }

  private buildDetectionContext(
    config: CapitalRiskWorkerConfiguration,
    input: CaprwInput,
  ): DetectionContext {
    const currency = (input.currency ?? config.defaultCurrency).trim();
    return {
      currency,
      config,
      budgetSnapshot: input.budgetSnapshot,
      cashflowSnapshot: input.cashflowSnapshot,
      profitabilitySnapshot: input.profitabilitySnapshot,
      revenueSnapshot: input.revenueSnapshot,
      investmentSnapshot: input.investmentSnapshot,
      liquiditySnapshot: input.liquiditySnapshot,
      multiBusinessCash: input.multiBusinessCash,
    };
  }

  private validateAndPrepare(
    config: CapitalRiskWorkerConfiguration,
    input: CaprwInput,
    action: CaprwRunReport["action"],
  ): { ok: true; businessId: string; period: string; currency: string } | { ok: false; report: CaprwRunReport } {
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
    const period = input.reportingPeriod!.trim();
    const currency = (input.currency ?? config.defaultCurrency).trim();
    return { ok: true, businessId, period, currency };
  }

  connect(config: CapitalRiskWorkerConfiguration, _input: CaprwInput = {}): CaprwRunReport {
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
      details: "Capital Risk Worker connected",
    };
  }

  consumeAccounting(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
    const entries = this.integrations.fetchAccountingEntries();
    this.store.appendAudit("consume_accounting", `entries=${entries.length}`);
    appendCaprwLog({ event: "consume_accounting", details: `entries=${entries.length}` });
    return {
      action: "consume_accounting",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${entries.length} accounting entr(y/ies) for traceability`,
    };
  }

  consumeCashflow(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
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

  consumeBudget(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
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

  consumeProfitability(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
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

  consumeForecasting(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
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

  consumeTaxSupport(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
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

  consumeInvestmentPlanning(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
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

  consumeFinancialReporting(_config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
    const reports = this.integrations.fetchFinancialReportingReports();
    const contract = this.integrations.getQ910ConsumableContract();
    this.store.appendAudit(
      "consume_financial_reporting",
      `reports=${reports.length} q910Contract=${contract ? "available" : "unavailable"}`,
    );
    return {
      action: "consume_financial_reporting",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} financial-reporting report(s) and Q910 contract reference`,
    };
  }

  detectRisks(config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
    const prepared = this.validateAndPrepare(config, input, "detect_risks");
    if (!prepared.ok) return prepared.report;
    const ctx = this.buildDetectionContext(config, input);
    const detected = detectAllRisks(ctx);
    this.store.addRisks(detected);
    this.refreshEngineRecord(config, "active", "healthy", "passed", prepared.businessId, prepared.period);
    this.store.appendAudit("detect_risks", `detected=${detected.length}`);
    return {
      action: "detect_risks",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: prepared.businessId,
      reportingPeriod: prepared.period,
      detectedRisks: detected,
      details: `Detected ${detected.length} capital risk(s) from verified snapshots only`,
    };
  }

  prioritiseRisksAction(config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
    const detected = this.detectRisks(config, input);
    if (detected.validation.decision === "fail" || !detected.detectedRisks) return detected;
    const prioritised = prioritiseRisks(detected.detectedRisks);
    return {
      action: "prioritise_risks",
      validation: detected.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: detected.capitalBusinessId,
      reportingPeriod: detected.reportingPeriod,
      detectedRisks: detected.detectedRisks,
      prioritisedRisks: prioritised,
      details: `Prioritised ${prioritised.length} capital risk(s) by severity and impact`,
    };
  }

  generateExecutiveRiskDashboard(
    config: CapitalRiskWorkerConfiguration,
    input: CaprwInput = {},
  ): CaprwRunReport {
    const prioritised = this.prioritiseRisksAction(config, input);
    if (prioritised.validation.decision === "fail" || !prioritised.prioritisedRisks) return prioritised;
    const executiveRiskSummary = buildExecutiveRiskSummary(prioritised.prioritisedRisks);
    const dashboard = buildEnterpriseRiskDashboard(
      prioritised.prioritisedRisks,
      executiveRiskSummary,
      (input.currency ?? config.defaultCurrency).trim(),
    );
    this.store.addDashboard(dashboard);
    this.refreshEngineRecord(
      config,
      "active",
      "healthy",
      "passed",
      prioritised.capitalBusinessId ?? null,
      prioritised.reportingPeriod ?? null,
    );
    return {
      action: "generate_executive_risk_dashboard",
      validation: prioritised.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: prioritised.capitalBusinessId,
      reportingPeriod: prioritised.reportingPeriod,
      detectedRisks: prioritised.detectedRisks,
      prioritisedRisks: prioritised.prioritisedRisks,
      executiveRiskSummary,
      enterpriseRiskDashboard: dashboard,
      details: `Executive risk dashboard ${dashboard.dashboardId} generated`,
    };
  }

  produceCapitalRiskReport(
    config: CapitalRiskWorkerConfiguration,
    input: CaprwInput = {},
  ): CaprwRunReport {
    const dashboardResult = this.generateExecutiveRiskDashboard(config, input);
    if (dashboardResult.validation.decision === "fail" || !dashboardResult.prioritisedRisks) {
      return { ...dashboardResult, action: "produce_capital_risk_report" };
    }
    const businessId = dashboardResult.capitalBusinessId!;
    const period = dashboardResult.reportingPeriod!;
    const currency = (input.currency ?? config.defaultCurrency).trim();
    const ctx = this.buildDetectionContext(config, input);
    const recommendedMitigations = buildRecommendedMitigations(dashboardResult.prioritisedRisks);
    const evidence = [
      ...dashboardResult.prioritisedRisks.flatMap((r) => r.evidenceRefs),
      ...this.integrations.fetchAccountingEntries().map((e) => e.entryId),
      ...this.integrations.fetchFinancialReportingReports().map((r) => String(r.reportId ?? "frw-report")),
    ];
    const uniqueEvidence = [...new Set(evidence)];
    const snapshotCount = [
      input.budgetSnapshot,
      input.cashflowSnapshot,
      input.profitabilitySnapshot,
      input.revenueSnapshot,
      input.investmentSnapshot,
      input.liquiditySnapshot,
    ].filter(Boolean).length;
    const outstandingIssues =
      dashboardResult.prioritisedRisks.length === 0
        ? ["no_risks_detected_from_supplied_snapshots"]
        : dashboardResult.prioritisedRisks
            .filter((r) => r.severity === "critical" || r.severity === "high")
            .map((r) => `${r.riskId}:${r.category}:${r.severity}`);
    const confidenceScore = computeConfidenceScore({
      riskCount: dashboardResult.prioritisedRisks.length,
      evidenceRefCount: uniqueEvidence.length,
      snapshotCount,
    });
    const draftValidation = { decision: "pass" as const, errors: [] as string[], warnings: [] as string[] };
    const report = buildCapitalRiskReport({
      capitalBusinessId: businessId,
      capitalProjectId: input.capitalProjectId?.trim() || `project-${businessId}`,
      reportingPeriod: period,
      currency,
      detectedRisks: dashboardResult.detectedRisks ?? [],
      prioritisedRisks: dashboardResult.prioritisedRisks,
      executiveRiskSummary: dashboardResult.executiveRiskSummary!,
      enterpriseRiskDashboard: dashboardResult.enterpriseRiskDashboard!,
      recommendedMitigations,
      ctx,
      supportingEvidence: uniqueEvidence,
      outstandingIssues,
      confidenceScore,
      validation: draftValidation,
      config,
    });
    const reportValidation = this.validator.validateReport(report);
    report.validation = reportValidation;
    this.store.addReport(report);
    this.refreshEngineRecord(
      config,
      "active",
      "healthy",
      reportValidation.decision === "fail" ? "failed" : "passed",
      businessId,
      period,
    );
    this.store.appendAudit("produce_capital_risk_report", `report=${report.reportId}`);
    return {
      action: "produce_capital_risk_report",
      validation: reportValidation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: businessId,
      reportingPeriod: period,
      detectedRisks: report.detectedRisks,
      prioritisedRisks: report.prioritisedRisks,
      executiveRiskSummary: report.executiveRiskSummary,
      enterpriseRiskDashboard: report.enterpriseRiskDashboard,
      capitalRiskReport: report,
      details: `Capital Risk Report ${report.reportId} produced — signals only, never auto-mitigation`,
    };
  }

  submitReport(config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
    const produced = this.produceCapitalRiskReport(config, input);
    if (produced.validation.decision === "fail" || !produced.capitalRiskReport) return produced;
    const report = { ...produced.capitalRiskReport };
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
      capitalRiskReport: report,
      details: report.submittedThroughExecutiveReportingRuntime
        ? `Submitted via ERR: ${report.executiveReportId}`
        : "Report stored locally — ERR unavailable",
    };
  }

  list(): CaprwRunReport {
    const reports = this.store.getReports();
    return {
      action: "list",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      details: `Reports=${reports.length} risks=${this.store.getRisks().length}`,
    };
  }

  validate(config: CapitalRiskWorkerConfiguration, input: CaprwInput = {}): CaprwRunReport {
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

  diagnostics(config: CapitalRiskWorkerConfiguration): CaprwRunReport {
    return {
      action: "diagnostics",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      handshakes: this.integrations.getHandshakes(),
      details: `connected=${this.connected} reports=${this.store.getReports().length} engineEnabled=${config.enabled}`,
    };
  }

  private refreshEngineRecord(
    config: CapitalRiskWorkerConfiguration,
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
        totalRisks: this.store.getRisks().length,
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
