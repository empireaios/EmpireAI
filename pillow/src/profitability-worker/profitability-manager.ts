import type { ProfitabilityWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type ProfitabilityWorkerDependencies } from "./integrations.js";
import { appendPrfwLog } from "./prfw-logging.js";
import { PRFW_METADATA_VERSION, PROFITABILITY_WORKER_ID, INTEGRATION_TARGETS } from "./paths.js";
import {
  buildAnalysis,
  buildBreakdown,
  buildCatalog,
  buildDrivers,
  buildEngineRecord,
  buildQ906ConsumableContract,
  buildRankings,
  buildReport,
} from "./profitability-builder.js";
import {
  distinctScopeIds,
  filterLineItemsForScope,
  normalizeCurrency,
  resolveReportingPeriodLabel,
} from "./profitability-calculator.js";
import { PrfwStore } from "./profitability-store.js";
import { PrfwValidator, HealthMonitor, RecoveryManager } from "./profitability-validator.js";
import { allocateProportionally } from "./money.js";
import type {
  AnalysisScope,
  FinancialLineItem,
  IntegrationHandshake,
  LossDriver,
  OperationalState,
  ProfitabilityAnalysis,
  ProfitabilityWorkerCatalog,
  ProfitabilityWorkerEngineRecord,
  ProfitDriver,
  PrfwInput,
  PrfwRunReport,
  PrfwValidationReport,
  ProfitabilityRanking,
  Q906ConsumableContract,
} from "./types.js";

function isValidScope(value: unknown, config: ProfitabilityWorkerConfiguration): value is AnalysisScope {
  return typeof value === "string" && config.analysisScopes.includes(value);
}

/**
 * Resolve the analysis scope for a request. Note `capitalProjectId` is a
 * report-metadata field (which capital allocation project a report is filed
 * under) — never a `FinancialLineItem` filtering dimension — so only the raw
 * `projectId` (matching `FinancialLineItem.projectId`) drives "project"
 * scope; `capitalBusinessId`/`businessId` take precedence over it since a
 * request commonly carries both a business identity and a capital-project
 * metadata reference simultaneously.
 */
function resolveScope(input: PrfwInput, config: ProfitabilityWorkerConfiguration): AnalysisScope {
  if (isValidScope(input.scope, config)) return input.scope as AnalysisScope;
  if (input.productId?.trim()) return "product";
  if (input.capitalBusinessId?.trim() || input.businessId?.trim()) return "business";
  if (input.projectId?.trim()) return "project";
  return "enterprise";
}

function scopeFilterFor(scope: AnalysisScope, scopeId: string): { businessId?: string; projectId?: string; productId?: string } {
  if (scope === "business") return { businessId: scopeId };
  if (scope === "project") return { projectId: scopeId };
  if (scope === "product") return { productId: scopeId };
  return {};
}

export class ProfitabilityWorkerManager {
  private engineRecord: ProfitabilityWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ProfitabilityWorkerCatalog | null = null;
  private readonly store = new PrfwStore();
  private readonly validator = new PrfwValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: ProfitabilityWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ProfitabilityWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedFinancialLineItems);
    this.rebuildCatalog(config);
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

  getAnalyses(scope?: AnalysisScope) {
    return this.store.listAnalyses(scope);
  }

  getRankings() {
    return this.store.listRankings();
  }

  getProfitDrivers() {
    return this.store.listProfitDrivers();
  }

  getLossDrivers() {
    return this.store.listLossDrivers();
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

  getQ906ConsumableContract(config: ProfitabilityWorkerConfiguration): Q906ConsumableContract {
    return buildQ906ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.integrationTargets.length
        ? (config.integrationTargets as (typeof INTEGRATION_TARGETS)[number][])
        : [...INTEGRATION_TARGETS],
    );
    this.rebuildCatalog(config);
    this.ensureRecord("connected", config);
    appendPrfwLog({ event: "connect", details: `Profitability Worker connected; integrations=${this.handshakes.length}` });
    return this.report("connect", [], null, null, [], [], [], [], config.enabled ? "pass" : "fail", started, [], null, config.enabled ? [] : ["Profitability Worker is disabled"]);
  }

  consumeAccountingRecords(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("consume_accounting_records", input, started);
    const provided = input.accountingEntries ?? [];
    const entries = provided.length ? provided : this.integrations.fetchAccountingEntries();
    this.store.addAccountingEntries(entries);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.ensureRecord("active", config);
    appendPrfwLog({ event: "consume_accounting_records", details: `count=${entries.length}` });
    return this.report(
      "consume_accounting_records",
      [],
      null,
      null,
      [],
      [],
      [],
      [],
      validation,
      started,
      [`Consumed ${entries.length} verified accounting entries for traceability/context.`],
    );
  }

  consumeCashflowReports(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("consume_cashflow_reports", input, started);
    const provided = input.cashflowReports ?? [];
    const reports = provided.length ? provided : this.integrations.fetchCashflowReports();
    this.store.addCashflowReports(reports);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.ensureRecord("active", config);
    appendPrfwLog({ event: "consume_cashflow_reports", details: `count=${reports.length}` });
    return this.report(
      "consume_cashflow_reports",
      [],
      null,
      null,
      [],
      [],
      [],
      [],
      validation,
      started,
      [`Consumed ${reports.length} verified cashflow reports for traceability/context.`],
    );
  }

  consumeBudgetReports(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("consume_budget_reports", input, started);
    const provided = input.budgetReports ?? [];
    const reports = provided.length ? provided : this.integrations.fetchBudgetReports();
    this.store.addBudgetReports(reports);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.ensureRecord("active", config);
    appendPrfwLog({ event: "consume_budget_reports", details: `count=${reports.length}` });
    return this.report(
      "consume_budget_reports",
      [],
      null,
      null,
      [],
      [],
      [],
      [],
      validation,
      started,
      [`Consumed ${reports.length} verified budget reports for traceability/context.`],
    );
  }

  calculateGrossProfit(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.calculateInternal("calculate_gross_profit", "calculating_gross", input, config);
  }

  calculateOperatingProfit(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.calculateInternal("calculate_operating_profit", "calculating_operating", input, config);
  }

  calculateNetProfit(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.calculateInternal("calculate_net_profit", "calculating_net", input, config);
  }

  private calculateInternal(
    action: PrfwRunReport["action"],
    _stage: string,
    input: PrfwInput,
    config: ProfitabilityWorkerConfiguration,
  ): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.profitabilityRulesEnabled) {
      return this.disabled(
        action,
        config,
        started,
        !config.enabled ? "Profitability Worker is disabled" : "Profitability rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, started);

    const { breakdown, issues } = this.computeBreakdownForInput(input, config);
    const validation = this.validator.finalize(issues.length ? "partial" : "pass", [], issues, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", breakdown.scope, breakdown.scopeId);
    appendPrfwLog({ event: action, details: `scope=${breakdown.scope}:${breakdown.scopeId} netProfit=${breakdown.netProfit.minorUnits}` });
    return this.report(action, [], null, breakdown, [], [], [], [], validation, started, issues);
  }

  allocateSharedOperationalCosts(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("allocate_shared_operational_costs", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    this.mergeInputLineItems(input);
    const allItems = this.store.listLineItems();
    const dimensionScope: AnalysisScope = isValidScope(input.scope, config) ? (input.scope as AnalysisScope) : "business";
    const dimensionField = dimensionScope === "product" ? "productId" : dimensionScope === "project" ? "projectId" : "businessId";
    const scopeIds = distinctScopeIds(allItems, dimensionField);

    const poolMinor = typeof input.sharedCostPoolMinor === "number" ? Math.round(input.sharedCostPoolMinor) : 0;
    const issues: string[] = [];
    if (poolMinor === 0) {
      issues.push("No sharedCostPoolMinor was provided — shared operational cost allocation recorded as zero pending a real cost pool.");
    }
    if (!scopeIds.length) {
      issues.push(`No verified financial line items were available to weight shared cost allocation by ${dimensionScope} net revenue.`);
    }

    const weights = scopeIds.map((scopeId) => {
      const items = filterLineItemsForScope(allItems, { [dimensionField]: scopeId, currency } as Record<string, string>);
      const revenue = sumCategoryOnly(items, "revenue", currency) - sumCategoryOnly(items, "discount", currency) - sumCategoryOnly(items, "refund", currency);
      return { scopeId, weightMinor: Math.max(revenue, 0) };
    });

    const allocations = allocateProportionally(poolMinor, currency, weights);
    if (weights.length && weights.every((w) => w.weightMinor <= 0) && poolMinor !== 0) {
      issues.push(`No positive net-revenue weight basis found across ${dimensionScope} scopes — shared cost pool of ${poolMinor} ${currency} minor units was not allocated.`);
    }
    this.store.setSharedAllocations(allocations);
    this.rebuildCatalog(config);

    const validation = this.validator.finalize(issues.length ? "partial" : "pass", [], issues, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendPrfwLog({ event: "allocate_shared_operational_costs", details: `pool=${poolMinor} scopes=${scopeIds.length}` });
    return this.report(
      "allocate_shared_operational_costs",
      [],
      null,
      null,
      [],
      [],
      [],
      this.store.listSharedAllocations(),
      validation,
      started,
      issues,
    );
  }

  analyseProfitabilityByBusiness(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.analyseByDimension("analyse_profitability_by_business", "business", "businessId", input, config);
  }

  analyseProfitabilityByProduct(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.analyseByDimension("analyse_profitability_by_product", "product", "productId", input, config);
  }

  analyseProfitabilityByProject(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.analyseByDimension("analyse_profitability_by_project", "project", "projectId", input, config);
  }

  private analyseByDimension(
    action: PrfwRunReport["action"],
    scope: AnalysisScope,
    dimensionField: "businessId" | "projectId" | "productId",
    input: PrfwInput,
    config: ProfitabilityWorkerConfiguration,
  ): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    this.mergeInputLineItems(input);
    const allItems = this.store.listLineItems();

    const explicitId =
      dimensionField === "businessId"
        ? input.capitalBusinessId?.trim() || input.businessId?.trim()
        : dimensionField === "projectId"
          ? input.capitalProjectId?.trim() || input.projectId?.trim()
          : input.productId?.trim();

    const scopeIds = explicitId ? [explicitId] : distinctScopeIds(allItems, dimensionField);
    const reportingPeriod = resolveReportingPeriodLabel(input.reportingPeriod);

    const analyses: ProfitabilityAnalysis[] = [];
    for (const scopeId of scopeIds) {
      const filter = { [dimensionField]: scopeId, currency } as Record<string, string>;
      const items = filterLineItemsForScope(allItems, filter);
      const sharedAllocation = this.store.getSharedAllocation(scopeId)?.minorUnits ?? 0;
      const { breakdown, issues, taxEstimated } = buildBreakdown({
        scope,
        scopeId,
        currency,
        reportingPeriod,
        items,
        sharedCostAllocationMinor: sharedAllocation,
        taxRateBps: input.taxRateBps,
      });
      const existing = this.store.getAnalysis(scope, scopeId);
      const name = this.integrations.resolveScopeName(scopeId) ?? scopeId;
      const analysis = buildAnalysis({
        breakdown,
        name,
        taxEstimated,
        outstandingIssues: issues,
        existingAnalysisId: existing?.analysisId ?? null,
      });
      this.store.upsertAnalysis(analysis);
      analyses.push(analysis);
    }

    this.rebuildCatalog(config);
    const validation = this.validator.validateAnalyses(analyses, { ...input, validated: input.validated ?? true }, started, !explicitId ? false : true);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", scope, analyses[analyses.length - 1]?.scopeId);
    appendPrfwLog({ event: action, details: `scope=${scope} analyses=${analyses.length}` });
    return this.report(action, analyses, analyses[0] ?? null, null, [], [], [], [], validation, started);
  }

  identifyProfitDrivers(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.identifyDriversInternal("identify_profit_drivers", input, config);
  }

  identifyLossDrivers(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    return this.identifyDriversInternal("identify_loss_drivers", input, config);
  }

  private identifyDriversInternal(
    action: PrfwRunReport["action"],
    input: PrfwInput,
    config: ProfitabilityWorkerConfiguration,
  ): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, started);

    const { breakdown, issues } = this.computeBreakdownForInput(input, config);
    const { profitDrivers, lossDrivers } = buildDrivers({
      breakdown,
      topN: config.driverTopN,
      minimumPercentOfNetBps: config.driverMinimumPercentOfNetBps,
    });
    this.store.setProfitDrivers(profitDrivers);
    this.store.setLossDrivers(lossDrivers);
    this.rebuildCatalog(config);

    const validation = this.validator.finalize(issues.length ? "partial" : "pass", [], issues, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", breakdown.scope, breakdown.scopeId);
    appendPrfwLog({ event: action, details: `profitDrivers=${profitDrivers.length} lossDrivers=${lossDrivers.length}` });
    return this.report(action, [], null, breakdown, [], profitDrivers, lossDrivers, [], validation, started, issues);
  }

  rankProfitability(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("rank_profitability", input, started);

    const scope: AnalysisScope = isValidScope(input.scope, config) ? (input.scope as AnalysisScope) : "business";
    const analyses = this.store.listAnalyses(scope);
    const rankings = buildRankings(analyses);
    this.store.setRankings(rankings);
    this.rebuildCatalog(config);

    const validation = this.validator.validateAnalyses(analyses, { ...input, validated: input.validated ?? true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", scope);
    appendPrfwLog({ event: "rank_profitability", details: `scope=${scope} rankings=${rankings.length}` });
    return this.report("rank_profitability", analyses, null, null, rankings, [], [], [], validation, started);
  }

  produceProfitabilityReport(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce_profitability_report", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    this.mergeInputLineItems(input);
    const allItems = this.store.listLineItems();
    const reportingPeriod = resolveReportingPeriodLabel(input.reportingPeriod);

    const scope = resolveScope(input, config);
    const scopeId = this.resolveScopeId(scope, input, config);
    const topLevelItems = filterLineItemsForScope(allItems, { ...scopeFilterFor(scope, scopeId), currency });
    const sharedAllocation = this.store.getSharedAllocation(scopeId)?.minorUnits ?? 0;

    const { breakdown, issues: breakdownIssues, taxEstimated } = buildBreakdown({
      scope,
      scopeId,
      currency,
      reportingPeriod,
      items: topLevelItems,
      sharedCostAllocationMinor: sharedAllocation,
      taxRateBps: input.taxRateBps,
    });

    const businessIds = distinctScopeIds(topLevelItems, "businessId");
    const analyses: ProfitabilityAnalysis[] = [];
    for (const businessId of businessIds) {
      const items = filterLineItemsForScope(topLevelItems, { businessId, currency });
      const businessSharedAllocation = this.store.getSharedAllocation(businessId)?.minorUnits ?? 0;
      const built = buildBreakdown({
        scope: "business",
        scopeId: businessId,
        currency,
        reportingPeriod,
        items,
        sharedCostAllocationMinor: businessSharedAllocation,
        taxRateBps: input.taxRateBps,
      });
      const existing = this.store.getAnalysis("business", businessId);
      const analysis = buildAnalysis({
        breakdown: built.breakdown,
        name: this.integrations.resolveScopeName(businessId) ?? businessId,
        taxEstimated: built.taxEstimated,
        outstandingIssues: built.issues,
        existingAnalysisId: existing?.analysisId ?? null,
      });
      this.store.upsertAnalysis(analysis);
      analyses.push(analysis);
    }

    const rankings = analyses.length ? buildRankings(analyses) : [];
    if (rankings.length) this.store.setRankings(rankings);

    const { profitDrivers, lossDrivers } = buildDrivers({
      breakdown,
      topN: config.driverTopN,
      minimumPercentOfNetBps: config.driverMinimumPercentOfNetBps,
    });
    this.store.setProfitDrivers(profitDrivers);
    this.store.setLossDrivers(lossDrivers);

    const capitalBusinessId =
      input.capitalBusinessId?.trim() ||
      input.businessId?.trim() ||
      (scope === "business" ? scopeId : null) ||
      businessIds[0] ||
      this.integrations.resolveCapitalBusinessId(null) ||
      this.store.getLatestBusinessId() ||
      "unspecified";
    const capitalProjectId = input.capitalProjectId?.trim() || input.projectId?.trim() || null;
    const refundLineCount = topLevelItems.filter((item) => item.category === "refund").length;

    const draft = buildReport({
      capitalBusinessId,
      capitalProjectId,
      reportingPeriod,
      breakdown,
      lineItemCount: topLevelItems.length,
      refundLineCount,
      taxEstimated,
      taxRateBpsUsed: taxEstimated ? (input.taxRateBps ?? null) : null,
      analyses,
      rankings: rankings.length ? rankings : this.store.listRankings(),
      profitDrivers,
      lossDrivers,
      extraOutstandingIssues: breakdownIssues,
      validation: null,
    });

    const validation = this.validator.validateReport(draft, { ...input, validated: input.validated ?? true }, started);
    const finalReport = { ...draft, validation };
    this.store.addReport(finalReport);
    this.rebuildCatalog(config);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", scope, capitalBusinessId);
    appendPrfwLog({ event: "produce_profitability_report", details: `business=${capitalBusinessId} scope=${scope}:${scopeId}` });
    return this.report(
      "produce_profitability_report",
      analyses,
      null,
      breakdown,
      rankings.length ? rankings : this.store.listRankings(),
      profitDrivers,
      lossDrivers,
      this.store.listSharedAllocations(),
      validation,
      started,
      [],
      finalReport,
    );
  }

  submitReport(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, started, "Executive reporting submission is disabled");
    }

    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceProfitabilityReport(input, config);
      report = produced.latestReport;
    }
    if (!report) {
      return this.disabled("submit_report", config, started, "No Profitability Report available for submission");
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
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", undefined, report.capitalBusinessId);
    return this.report("submit_report", [], null, null, [], [], [], [], validation, started, [], report);
  }

  list(config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const analyses = this.store.listAnalyses();
    const validation = this.validator.validateAnalyses(analyses, { validated: true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      analyses,
      null,
      null,
      this.store.listRankings(),
      this.store.listProfitDrivers(),
      this.store.listLossDrivers(),
      this.store.listSharedAllocations(),
      validation,
      started,
      [],
      this.store.getLatestReport(),
    );
  }

  validate(input: PrfwInput, config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const analyses = this.store.listAnalyses();
    const validation = this.validator.validateAnalyses(analyses, { ...input, validated: input.validated ?? true }, started, false);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      analyses,
      null,
      null,
      this.store.listRankings(),
      this.store.listProfitDrivers(),
      this.store.listLossDrivers(),
      this.store.listSharedAllocations(),
      validation,
      started,
      [],
      this.store.getLatestReport(),
    );
  }

  diagnostics(config: ProfitabilityWorkerConfiguration): PrfwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Profitability Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPrfwLog({ event: "diagnostics", details: `analyses=${this.store.countAnalyses()} lineItems=${this.store.countLineItems()}` });
    return this.report("diagnostics", this.store.listAnalyses(), null, null, [], [], [], [], validation, started);
  }

  runDiagnostics(config: ProfitabilityWorkerConfiguration) {
    return this.diagnostics(config);
  }

  private computeBreakdownForInput(input: PrfwInput, config: ProfitabilityWorkerConfiguration) {
    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    this.mergeInputLineItems(input);
    const allItems = this.store.listLineItems();
    const scope = resolveScope(input, config);
    const scopeId = this.resolveScopeId(scope, input, config);
    const items = filterLineItemsForScope(allItems, { ...scopeFilterFor(scope, scopeId), currency });
    const sharedAllocation = this.store.getSharedAllocation(scopeId)?.minorUnits ?? 0;
    return buildBreakdown({
      scope,
      scopeId,
      currency,
      reportingPeriod: resolveReportingPeriodLabel(input.reportingPeriod),
      items,
      sharedCostAllocationMinor: sharedAllocation,
      taxRateBps: input.taxRateBps,
    });
  }

  private resolveScopeId(scope: AnalysisScope, input: PrfwInput, config: ProfitabilityWorkerConfiguration): string {
    if (scope === "product") return input.productId?.trim() || "unspecified-product";
    if (scope === "project") return input.projectId?.trim() || "unspecified-project";
    if (scope === "business") {
      return (
        input.capitalBusinessId?.trim() ||
        input.businessId?.trim() ||
        this.integrations.resolveCapitalBusinessId(null) ||
        this.store.getLatestBusinessId() ||
        "unspecified-business"
      );
    }
    if (scope === "factory") return config.factory;
    return "enterprise";
  }

  private mergeInputLineItems(input: PrfwInput) {
    const items = input.financialLineItems ?? [];
    if (items.length) this.store.addLineItems(items as FinancialLineItem[]);
  }

  private rebuildCatalog(config: ProfitabilityWorkerConfiguration) {
    this.catalog = buildCatalog(
      config,
      this.store.listAnalyses(),
      this.store.listRankings(),
      this.store.listProfitDrivers(),
      this.store.listLossDrivers(),
      this.store.listReports(),
      this.handshakes,
    );
  }

  private hasBoundary(input: PrfwInput) {
    return (
      input.fabricateRevenueCostFeeRefundOrProfitabilityFigures === true ||
      input.forecastFutureProfitability === true ||
      input.approveSpending === true ||
      input.executeFinancialTransactions === true ||
      input.replaceForecastingWorker === true ||
      input.modifyAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ906OrLater === true ||
      (!!input.missionId && /^(Q9-0[6-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i.test(input.missionId.trim()))
    );
  }

  private boundaryFail(action: PrfwRunReport["action"], input: PrfwInput, started: number) {
    const validation = this.validator.validateGeneric(input, started);
    this.recovery.recordFailure();
    return this.report(action, this.store.listAnalyses(), null, null, [], [], [], [], validation, started);
  }

  private disabled(action: PrfwRunReport["action"], config: ProfitabilityWorkerConfiguration, started: number, message: string) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config);
    return this.report(action, this.store.listAnalyses(), null, null, [], [], [], [], validation, started);
  }

  private ensureRecord(
    state: OperationalState,
    config: ProfitabilityWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastScope?: AnalysisScope,
    lastBusinessId?: string | null,
  ) {
    this.engineRecord = buildEngineRecord({
      existingId: this.engineRecord?.engineRecordId ?? null,
      engineId: PROFITABILITY_WORKER_ID,
      state,
      healthStatus: this.healthMonitor.status(validationStatus === "failed" ? "fail" : "pass", config.enabled),
      validationStatus,
      totalAnalyses: this.store.countAnalyses(),
      totalRankings: this.store.listRankings().length,
      lastScope: lastScope ?? this.engineRecord?.lastScope ?? (this.store.getLatestScope() as AnalysisScope | null) ?? null,
      lastBusinessId: lastBusinessId ?? this.store.getLatestBusinessId(),
      lastReportId: this.store.getLatestReport()?.reportId ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
    });
  }

  private report(
    action: PrfwRunReport["action"],
    analyses: ProfitabilityAnalysis[],
    analysis: ProfitabilityAnalysis | null,
    breakdown: PrfwRunReport["breakdown"],
    rankings: ProfitabilityRanking[],
    profitDrivers: ProfitDriver[],
    lossDrivers: LossDriver[],
    sharedCostAllocations: PrfwRunReport["sharedCostAllocations"],
    validationOrDecision: PrfwValidationReport | PrfwValidationReport["decision"],
    started: number,
    notes: string[] = [],
    latestReport: PrfwRunReport["latestReport"] = null,
    extraErrors: string[] = [],
    extraWarnings: string[] = [],
  ): PrfwRunReport {
    const validation: PrfwValidationReport =
      typeof validationOrDecision === "string"
        ? this.validator.finalize(validationOrDecision, extraErrors, extraWarnings, started)
        : validationOrDecision;
    const engineRecord = this.getEngineRecord()!;
    return {
      prfwRunReportId: `prfw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog: this.getCatalog(),
      analyses,
      analysis,
      breakdown,
      rankings,
      profitDrivers,
      lossDrivers,
      sharedCostAllocations,
      latestReport: latestReport ?? this.store.getLatestReport(),
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PRFW_METADATA_VERSION,
      notes,
    };
  }
}

function sumCategoryOnly(items: FinancialLineItem[], category: FinancialLineItem["category"], currency: string): number {
  return items.filter((i) => i.category === category && i.currency === currency).reduce((sum, i) => sum + i.amountMinor, 0);
}

function mergeIssuesAsWarnings(validation: PrfwValidationReport, issues: string[]): PrfwValidationReport {
  const warnings = Array.from(new Set([...validation.warnings, ...issues]));
  const decision = validation.decision === "fail" ? "fail" : warnings.length ? "partial" : validation.decision;
  return { ...validation, warnings, decision };
}

function cloneCatalog(catalog: ProfitabilityWorkerCatalog): ProfitabilityWorkerCatalog {
  return {
    ...catalog,
    costCategories: [...catalog.costCategories],
    feeTypes: [...catalog.feeTypes],
    analysisScopes: [...catalog.analysisScopes],
    currencies: [...catalog.currencies],
    analyses: catalog.analyses.map((a) => ({ ...a })),
    rankings: catalog.rankings.map((r) => ({ ...r })),
    profitDrivers: catalog.profitDrivers.map((d) => ({ ...d })),
    lossDrivers: catalog.lossDrivers.map((d) => ({ ...d })),
    reports: catalog.reports.map((r) => ({ ...r })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
