import type { BudgetPlanningWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type BudgetPlanningWorkerDependencies } from "./integrations.js";
import { appendBpwLog } from "./bpw-logging.js";
import {
  BUDGET_PERIODS,
  BUDGET_PLANNING_WORKER_ID,
  BUDGET_SCOPES,
  BPW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import {
  buildBudget,
  buildCatalog,
  buildCrossBudgetVarianceFindings,
  buildEfficiencySignalFindings,
  buildEngineRecord,
  buildQ905ConsumableContract,
  buildRecommendationsFromFindings,
  buildReport,
  buildSignificantDeviationFindings,
  buildVarianceFindingsForBudget,
} from "./budget-builder.js";
import { normalizeCurrency } from "./budget-calculator.js";
import { BpwBudgetStore } from "./budget-store.js";
import { BpwValidator, HealthMonitor, RecoveryManager } from "./budget-validator.js";
import { moneyFromDecimal, moneyFromMinor, moneySum, moneyZero, type MoneyMinor } from "./money.js";
import type {
  ApprovalStatus,
  BpwInput,
  BpwRunReport,
  BpwValidationReport,
  BudgetAdjustmentRecommendation,
  BudgetCategory,
  BudgetPeriod,
  BudgetPlanningReport,
  BudgetPlanningWorkerCatalog,
  BudgetPlanningWorkerEngineRecord,
  BudgetRecord,
  BudgetScope,
  BudgetSubject,
  IntegrationHandshake,
  OperationalState,
  Q905ConsumableContract,
  VarianceFinding,
} from "./types.js";

function isValidCategory(value: unknown, config: BudgetPlanningWorkerConfiguration): value is BudgetCategory {
  return typeof value === "string" && config.budgetCategories.includes(value);
}

function isValidApprovalStatus(value: unknown, config: BudgetPlanningWorkerConfiguration): value is ApprovalStatus {
  return typeof value === "string" && config.approvalStatuses.includes(value);
}

function isValidScope(value: unknown): value is BudgetScope {
  return typeof value === "string" && (BUDGET_SCOPES as readonly string[]).includes(value);
}

function normalizeNotes(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

/** Parse a flexible budgetPeriod input: either a bare granularity keyword or a concrete period label. */
function resolveBudgetPeriodInput(
  raw: string | null | undefined,
  fallback: BudgetPeriod,
): { period: BudgetPeriod; label: string | null } {
  const value = raw?.trim();
  if (!value) return { period: fallback, label: null };
  if ((BUDGET_PERIODS as readonly string[]).includes(value)) {
    return { period: value as BudgetPeriod, label: null };
  }
  if (/^\d{4}$/.test(value)) return { period: "annual", label: value };
  if (/^\d{4}-Q[1-4]$/i.test(value)) return { period: "quarterly", label: value.toUpperCase() };
  if (/^\d{4}-\d{2}$/.test(value)) return { period: "monthly", label: value };
  return { period: fallback, label: null };
}

export class BudgetPlanningWorkerManager {
  private engineRecord: BudgetPlanningWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: BudgetPlanningWorkerCatalog | null = null;
  private readonly store = new BpwBudgetStore();
  private readonly validator = new BpwValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: BudgetPlanningWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: BudgetPlanningWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedBudgets);
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

  getBudgets() {
    return this.store.listBudgets();
  }

  getVariances() {
    return this.store.listFindings();
  }

  getRecommendations() {
    return this.store.listRecommendations();
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

  getQ905ConsumableContract(config: BudgetPlanningWorkerConfiguration): Q905ConsumableContract {
    return buildQ905ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.integrationTargets.length
        ? (config.integrationTargets as (typeof INTEGRATION_TARGETS)[number][])
        : [...INTEGRATION_TARGETS],
    );
    this.rebuildCatalog(config);
    this.ensureRecord("connected", config);
    appendBpwLog({ event: "connect", details: `Budget Planning Worker connected; integrations=${this.handshakes.length}` });
    return this.report("connect", [], null, [], [], config.enabled ? "pass" : "fail", started, [], null, config.enabled ? [] : ["Budget Planning Worker is disabled"]);
  }

  createProjectBudget(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    return this.createBudgetInternal("create_project_budget", input, config, "project");
  }

  createBusinessBudget(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    return this.createBudgetInternal("create_business_budget", input, config, "business");
  }

  createAdvertisingBudget(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    return this.createBudgetInternal("create_advertising_budget", input, config, "advertising");
  }

  createInfrastructureBudget(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    return this.createBudgetInternal("create_infrastructure_budget", input, config, "infrastructure");
  }

  createBudget(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    return this.createBudgetInternal("create_budget", input, config, null);
  }

  private createBudgetInternal(
    action: BpwRunReport["action"],
    input: BpwInput,
    config: BudgetPlanningWorkerConfiguration,
    forcedCategory: BudgetCategory | null,
  ): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.budgetRulesEnabled) {
      return this.disabled(action, config, started, !config.enabled ? "Budget Planning Worker is disabled" : "Budget rules are disabled");
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const budgetId = input.budgetId?.trim() || null;
    const existing = budgetId ? this.store.getBudget(budgetId) : null;
    const currency = normalizeCurrency(input.currency, existing?.currency ?? config.defaultCurrency);

    const category: BudgetCategory =
      forcedCategory ?? (isValidCategory(input.budgetCategory, config) ? (input.budgetCategory as BudgetCategory) : existing?.budgetCategory ?? "unknown");

    const { period, label } = resolveBudgetPeriodInput(
      typeof input.budgetPeriod === "string" ? input.budgetPeriod : null,
      existing?.budgetPeriod ?? "monthly",
    );

    const businessId = input.businessId?.trim() || input.capitalBusinessId?.trim() || existing?.businessOrProject.businessId || this.integrations.resolveCapitalBusinessId(null) || null;
    const projectId = input.projectId?.trim() || input.capitalProjectId?.trim() || existing?.businessOrProject.projectId || null;
    const name = input.name?.trim() || existing?.businessOrProject.name || null;
    const businessOrProject: BudgetSubject = { businessId, projectId, name };

    const plannedResult = this.resolvePlannedAmount(input, currency, existing);
    const actualResult = this.resolveActualExpenditure(input, currency, budgetId, category, existing);
    const approvalStatus: ApprovalStatus =
      isValidApprovalStatus(input.approvalStatus, config) ? (input.approvalStatus as ApprovalStatus) : existing?.approvalStatus ?? "draft";

    let built;
    try {
      built = buildBudget({
        budgetId,
        existing,
        budgetOwner: input.budgetOwner?.trim() || existing?.budgetOwner || null,
        businessOrProject,
        budgetCategory: category,
        budgetPeriod: period,
        periodLabelInput: label,
        periodStartInput: input.periodStart ?? null,
        periodEndInput: input.periodEnd ?? null,
        plannedAmount: plannedResult.amount,
        actualExpenditure: actualResult.amount,
        actualExpenditureEvidencePresent: actualResult.evidencePresent,
        approvalStatus,
        supportingNotes: normalizeNotes(input.supportingNotes),
        currency,
        capitalProjectId: input.capitalProjectId?.trim() || existing?.capitalProjectId || projectId,
        capitalBusinessId: businessId,
        extraTraceabilityRefs: [...plannedResult.sourceRefs, ...actualResult.sourceRefs],
        revisionReason: input.reason?.trim() || null,
      });
    } catch (error) {
      const validation = this.validator.finalize(
        "fail",
        [error instanceof Error ? error.message : "Budget Planning Worker could not resolve deterministic period boundaries"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report(action, [], null, [], [], validation, started);
    }

    const issues = [...plannedResult.issues, ...built.issues];
    this.store.upsertBudget(built.budget);
    this.rebuildCatalog(config);

    let validation = this.validator.validateBudget(built.budget, { ...input, validated: input.validated ?? true }, started);
    if (issues.length) validation = mergeIssuesAsWarnings(validation, issues);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", built.budget.approvalStatus, businessId ?? undefined);
    appendBpwLog({ event: action, details: `budget=${built.budget.budgetId} category=${category} revision=${built.isRevision}` });
    return this.report(action, [built.budget], built.budget, [], [], validation, started, issues);
  }

  trackBudgetUtilisation(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("track_budget_utilisation", input, config, started);
    }

    const scoped = this.filterBudgets(input, config);
    if (!scoped.length) {
      const validation = this.validator.validateBudgets([], { ...input, validated: input.validated ?? true }, started, true);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report("track_budget_utilisation", [], null, [], [], validation, started);
    }

    const updated: BudgetRecord[] = [];
    for (const budget of scoped) {
      const actualResult = this.resolveActualExpenditure(input, budget.currency, budget.budgetId, budget.budgetCategory, budget);
      if (actualResult.evidencePresent && actualResult.amount.minorUnits !== budget.actualExpenditure.minorUnits) {
        const built = buildBudget({
          budgetId: budget.budgetId,
          existing: budget,
          budgetOwner: budget.budgetOwner,
          businessOrProject: budget.businessOrProject,
          budgetCategory: budget.budgetCategory,
          budgetPeriod: budget.budgetPeriod,
          periodLabelInput: budget.periodLabel,
          periodStartInput: budget.periodStart,
          periodEndInput: budget.periodEnd,
          plannedAmount: budget.plannedAmount,
          actualExpenditure: actualResult.amount,
          actualExpenditureEvidencePresent: true,
          approvalStatus: budget.approvalStatus,
          supportingNotes: budget.supportingNotes,
          currency: budget.currency,
          capitalProjectId: budget.capitalProjectId,
          capitalBusinessId: budget.capitalBusinessId,
          extraTraceabilityRefs: actualResult.sourceRefs,
          revisionReason: null,
        });
        this.store.upsertBudget(built.budget);
        updated.push(built.budget);
      } else {
        updated.push(budget);
      }
    }

    this.rebuildCatalog(config);
    const validation = this.validator.validateBudgets(updated, { ...input, validated: input.validated ?? true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendBpwLog({ event: "track_budget_utilisation", details: `count=${updated.length}` });
    return this.report("track_budget_utilisation", updated, updated[0] ?? null, [], [], validation, started);
  }

  detectBudgetOverruns(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("detect_budget_overruns", input, config, started);
    }
    const scoped = this.filterBudgets(input, config);
    const findings = scoped
      .flatMap((budget) => buildVarianceFindingsForBudget(budget, config))
      .filter((f) => f.signal === "overspending" || f.signal === "depletion_risk");
    this.store.addFindings(findings);
    this.rebuildCatalog(config);
    const validation = this.validator.validateBudgets(scoped, { ...input, validated: input.validated ?? true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendBpwLog({ event: "detect_budget_overruns", details: `budgets=${scoped.length} findings=${findings.length}` });
    return this.report("detect_budget_overruns", scoped, null, findings, [], validation, started);
  }

  detectUnderutilisedBudgets(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("detect_underutilised_budgets", input, config, started);
    }
    const scoped = this.filterBudgets(input, config);
    const findings = scoped
      .flatMap((budget) => buildVarianceFindingsForBudget(budget, config))
      .filter((f) => f.signal === "underspending");
    this.store.addFindings(findings);
    this.rebuildCatalog(config);
    const validation = this.validator.validateBudgets(scoped, { ...input, validated: input.validated ?? true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendBpwLog({ event: "detect_underutilised_budgets", details: `budgets=${scoped.length} findings=${findings.length}` });
    return this.report("detect_underutilised_budgets", scoped, null, findings, [], validation, started);
  }

  compareActualVsBudget(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("compare_actual_vs_budget", input, config, started);
    }
    const scoped = this.filterBudgets(input, config);
    const findings = this.computeAllFindings(scoped, config);
    this.store.addFindings(findings);
    this.rebuildCatalog(config);
    const validation = this.validator.validateBudgets(scoped, { ...input, validated: input.validated ?? true }, started, true);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendBpwLog({ event: "compare_actual_vs_budget", details: `budgets=${scoped.length} findings=${findings.length}` });
    return this.report("compare_actual_vs_budget", scoped, null, findings, [], validation, started);
  }

  recommendBudgetAdjustments(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("recommend_budget_adjustments", input, config, started);
    }
    const scoped = this.filterBudgets(input, config);
    const findings = this.computeAllFindings(scoped, config);
    this.store.addFindings(findings);
    const recommendations = buildRecommendationsFromFindings(findings);
    this.store.addRecommendations(recommendations);
    this.rebuildCatalog(config);
    const validation = this.validator.validateBudgets(scoped, { ...input, validated: input.validated ?? true }, started, true);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendBpwLog({ event: "recommend_budget_adjustments", details: `budgets=${scoped.length} recommendations=${recommendations.length}` });
    return this.report("recommend_budget_adjustments", scoped, null, findings, recommendations, validation, started);
  }

  produceBudgetPlanningReport(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_budget_planning_report", input, config, started);
    }

    const scope: BudgetScope = isValidScope(input.scope)
      ? (input.scope as BudgetScope)
      : input.projectId?.trim() || input.capitalProjectId?.trim()
        ? "project"
        : input.businessId?.trim() || input.capitalBusinessId?.trim()
          ? "business"
          : "enterprise";

    const scoped = this.filterBudgetsForScope(scope, input, config);

    const currency = normalizeCurrency(input.currency, scoped[0]?.currency ?? config.defaultCurrency);
    const currencyIssues: string[] = [];
    const currencyScoped = scoped.filter((b) => {
      if (b.currency === currency) return true;
      currencyIssues.push(`Budget ${b.budgetId} currency ${b.currency} does not match report currency ${currency} — excluded from aggregate totals.`);
      return false;
    });

    const businessId = this.resolveBusinessId(input);
    const capitalProjectId = input.capitalProjectId?.trim() || input.projectId?.trim() || null;
    const { period } = resolveBudgetPeriodInput(
      typeof input.budgetPeriod === "string" ? input.budgetPeriod : null,
      (currencyScoped[0]?.budgetPeriod as BudgetPeriod | undefined) ?? "monthly",
    );

    const findings = this.computeAllFindings(currencyScoped, config);
    this.store.addFindings(findings);
    const recommendations = buildRecommendationsFromFindings(findings);
    this.store.addRecommendations(recommendations);

    const report = buildReport({
      capitalBusinessId: businessId,
      capitalProjectId,
      budgetScope: scope,
      budgetPeriod: period,
      budgets: currencyScoped,
      variances: findings,
      recommendations,
      extraOutstandingIssues: currencyIssues,
      currency,
      validation: null,
    });

    const validation = this.validator.validateReport(report, { ...input, validated: input.validated ?? true }, started);
    const finalReport: BudgetPlanningReport = { ...report, validation };
    this.store.addReport(finalReport);
    this.rebuildCatalog(config);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      currencyScoped[currencyScoped.length - 1]?.approvalStatus,
      businessId,
    );
    appendBpwLog({ event: "produce_budget_planning_report", details: `business=${businessId} budgets=${currencyScoped.length}` });
    return this.report(
      "produce_budget_planning_report",
      currencyScoped,
      null,
      findings,
      recommendations,
      validation,
      started,
      currencyIssues,
      finalReport,
    );
  }

  submitReport(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
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
      const produced = this.produceBudgetPlanningReport(input, config);
      report = produced.latestReport;
    }
    if (!report) {
      return this.disabled("submit_report", config, started, "No Budget Planning Report available for submission");
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
    return this.report("submit_report", [], null, [], [], validation, started, [], report);
  }

  list(config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const budgets = this.store.listBudgets();
    const validation = this.validator.validateBudgets(budgets, { validated: true }, started, false);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("list", budgets, null, this.store.listFindings(), this.store.listRecommendations(), validation, started, [], this.store.getLatestReport());
  }

  validate(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const budgets = this.store.listBudgets();
    const validation = this.validator.validateBudgets(budgets, { ...input, validated: input.validated ?? true }, started, false);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("validate", budgets, null, this.store.listFindings(), this.store.listRecommendations(), validation, started, [], this.store.getLatestReport());
  }

  diagnostics(config: BudgetPlanningWorkerConfiguration): BpwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const validation = this.validator.finalize(config.enabled ? "pass" : "fail", config.enabled ? [] : ["Budget Planning Worker is disabled"], [], started);
    this.ensureRecord("active", config);
    appendBpwLog({ event: "diagnostics", details: `budgets=${this.store.countBudgets()} findings=${this.store.countFindings()}` });
    return this.report("diagnostics", this.store.listBudgets(), null, [], [], validation, started);
  }

  runDiagnostics(config: BudgetPlanningWorkerConfiguration) {
    return this.diagnostics(config);
  }

  private computeAllFindings(scoped: BudgetRecord[], config: BudgetPlanningWorkerConfiguration): VarianceFinding[] {
    const perBudget = scoped.flatMap((budget) => buildVarianceFindingsForBudget(budget, config));
    const efficiency = buildEfficiencySignalFindings(scoped);
    const category = buildCrossBudgetVarianceFindings(scoped, "category_variance", config.significantDeviationThresholdPercent);
    const period = buildCrossBudgetVarianceFindings(scoped, "period_variance", config.significantDeviationThresholdPercent);
    const outliers = buildSignificantDeviationFindings(scoped, config.significantDeviationThresholdPercent);
    return [...perBudget, ...efficiency, ...category, ...period, ...outliers];
  }

  private resolvePlannedAmount(
    input: BpwInput,
    currency: string,
    existing: BudgetRecord | null,
  ): { amount: MoneyMinor; sourceRefs: string[]; issues: string[] } {
    if (typeof input.plannedAmountMinor === "number") {
      return { amount: moneyFromMinor(input.plannedAmountMinor, currency), sourceRefs: [], issues: [] };
    }
    if (input.plannedAmount !== undefined && input.plannedAmount !== null) {
      return { amount: moneyFromDecimal(input.plannedAmount, currency), sourceRefs: [], issues: [] };
    }
    if (existing) {
      return { amount: existing.plannedAmount, sourceRefs: [], issues: [] };
    }
    return {
      amount: moneyZero(currency),
      sourceRefs: [],
      issues: ["No plannedAmount was provided — planned amount recorded as zero pending an explicit budget allocation."],
    };
  }

  private resolveActualExpenditure(
    input: BpwInput,
    currency: string,
    budgetId: string | null,
    category: BudgetCategory,
    existing: BudgetRecord | null,
  ): { amount: MoneyMinor; evidencePresent: boolean; sourceRefs: string[] } {
    const matches = (input.spendingActuals ?? []).filter((actual) => {
      if (budgetId && actual.budgetId) return actual.budgetId === budgetId;
      if (actual.category) return actual.category === category;
      return !actual.budgetId && !actual.category;
    });
    if (matches.length) {
      const amounts = matches.map((m) => moneyFromMinor(Math.round(m.amountMinor), normalizeCurrency(m.currency, currency)));
      const sameCurrency = amounts.every((a) => a.currency === currency);
      const amount = sameCurrency ? moneySum(amounts, currency) : amounts[0]!;
      const sourceRefs = matches.flatMap((m, i) => m.sourceRefs ?? [`bpw:spending_actual:${budgetId ?? category}:${i}`]);
      return { amount, evidencePresent: true, sourceRefs };
    }
    if (typeof input.actualExpenditureMinor === "number") {
      return { amount: moneyFromMinor(input.actualExpenditureMinor, currency), evidencePresent: true, sourceRefs: [] };
    }
    if (input.actualExpenditure !== undefined && input.actualExpenditure !== null) {
      return { amount: moneyFromDecimal(input.actualExpenditure, currency), evidencePresent: true, sourceRefs: [] };
    }
    if (existing) {
      return {
        amount: existing.actualExpenditure,
        evidencePresent: existing.actualExpenditureEvidencePresent,
        sourceRefs: [],
      };
    }
    return { amount: moneyZero(currency), evidencePresent: false, sourceRefs: [] };
  }

  private filterBudgets(input: BpwInput, config: BudgetPlanningWorkerConfiguration): BudgetRecord[] {
    let budgets = this.store.listBudgets();
    const budgetId = input.budgetId?.trim();
    if (budgetId) {
      return budgets.filter((b) => b.budgetId === budgetId);
    }
    const businessId = input.capitalBusinessId?.trim() || input.businessId?.trim();
    if (businessId) {
      budgets = budgets.filter((b) => b.capitalBusinessId === businessId || b.businessOrProject.businessId === businessId);
    }
    const projectId = input.capitalProjectId?.trim() || input.projectId?.trim();
    if (projectId) {
      budgets = budgets.filter((b) => b.capitalProjectId === projectId || b.businessOrProject.projectId === projectId);
    }
    if (isValidCategory(input.budgetCategory, config)) {
      budgets = budgets.filter((b) => b.budgetCategory === input.budgetCategory);
    }
    if (isValidApprovalStatus(input.approvalStatus, config)) {
      budgets = budgets.filter((b) => b.approvalStatus === input.approvalStatus);
    }
    return budgets;
  }

  /** Scope resolution dedicated to report production — a scope filters by exactly one dimension at a time. */
  private filterBudgetsForScope(scope: BudgetScope, input: BpwInput, config: BudgetPlanningWorkerConfiguration): BudgetRecord[] {
    const all = this.store.listBudgets();
    const budgetId = input.budgetId?.trim();
    if (budgetId) return all.filter((b) => b.budgetId === budgetId);

    if (scope === "project") {
      const projectId = input.capitalProjectId?.trim() || input.projectId?.trim();
      return projectId ? all.filter((b) => b.capitalProjectId === projectId || b.businessOrProject.projectId === projectId) : all;
    }
    if (scope === "business") {
      const businessId = input.capitalBusinessId?.trim() || input.businessId?.trim();
      return businessId ? all.filter((b) => b.capitalBusinessId === businessId || b.businessOrProject.businessId === businessId) : all;
    }
    if (scope === "department") {
      return isValidCategory(input.budgetCategory, config) ? all.filter((b) => b.budgetCategory === input.budgetCategory) : all;
    }
    // enterprise — every tracked budget.
    return all;
  }

  private resolveBusinessId(input: BpwInput): string {
    return (
      input.capitalBusinessId?.trim() ||
      input.businessId?.trim() ||
      this.integrations.resolveCapitalBusinessId(null) ||
      this.store.getLatestBusinessId() ||
      "unspecified"
    );
  }

  private rebuildCatalog(config: BudgetPlanningWorkerConfiguration) {
    this.catalog = buildCatalog(
      config,
      this.store.listBudgets(),
      this.store.listFindings(),
      this.store.listRecommendations(),
      this.store.listReports(),
      this.handshakes,
    );
  }

  private hasBoundary(input: BpwInput) {
    return (
      input.fabricateBudgetValuesOrSpendingData === true ||
      input.approveExpenditure === true ||
      input.executePayments === true ||
      input.forecastRevenue === true ||
      input.replaceProfitabilityWorker === true ||
      input.modifyAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ905OrLater === true ||
      (!!input.missionId && /^(Q9-0[5-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i.test(input.missionId.trim()))
    );
  }

  private boundaryFail(action: BpwRunReport["action"], input: BpwInput, config: BudgetPlanningWorkerConfiguration, started: number) {
    const validation = this.validator.validateGeneric(input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config);
    return this.report(action, this.store.listBudgets(), null, [], [], validation, started);
  }

  private disabled(action: BpwRunReport["action"], config: BudgetPlanningWorkerConfiguration, started: number, message: string) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config);
    return this.report(action, this.store.listBudgets(), null, [], [], validation, started);
  }

  private ensureRecord(
    state: OperationalState,
    config: BudgetPlanningWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastApprovalStatus?: ApprovalStatus,
    lastBusinessId?: string | null,
  ) {
    this.engineRecord = buildEngineRecord({
      existingId: this.engineRecord?.engineRecordId ?? null,
      engineId: BUDGET_PLANNING_WORKER_ID,
      state,
      healthStatus: this.healthMonitor.status(validationStatus === "failed" ? "fail" : "pass", config.enabled),
      validationStatus,
      totalBudgets: this.store.countBudgets(),
      totalVariances: this.store.countFindings(),
      lastApprovalStatus: lastApprovalStatus ?? this.engineRecord?.lastApprovalStatus ?? this.store.getLatestApprovalStatus() ?? null,
      lastBusinessId: lastBusinessId ?? this.store.getLatestBusinessId(),
      lastReportId: this.store.getLatestReport()?.reportId ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
    });
  }

  private report(
    action: BpwRunReport["action"],
    budgets: BudgetRecord[],
    budget: BudgetRecord | null,
    variances: VarianceFinding[],
    recommendations: BudgetAdjustmentRecommendation[],
    validationOrDecision: BpwValidationReport | BpwValidationReport["decision"],
    started: number,
    notes: string[] = [],
    latestReport: BudgetPlanningReport | null = null,
    extraErrors: string[] = [],
    extraWarnings: string[] = [],
  ): BpwRunReport {
    const validation: BpwValidationReport =
      typeof validationOrDecision === "string"
        ? this.validator.finalize(validationOrDecision, extraErrors, extraWarnings, started)
        : validationOrDecision;
    const engineRecord = this.getEngineRecord()!;
    return {
      bpwRunReportId: `bpw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog: this.getCatalog(),
      budgets,
      budget,
      variances,
      recommendations,
      latestReport: latestReport ?? this.store.getLatestReport(),
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BPW_METADATA_VERSION,
      notes,
    };
  }
}

function mergeIssuesAsWarnings(validation: BpwValidationReport, issues: string[]): BpwValidationReport {
  const warnings = Array.from(new Set([...validation.warnings, ...issues]));
  const decision = validation.decision === "fail" ? "fail" : warnings.length ? "partial" : validation.decision;
  return { ...validation, warnings, decision };
}

function cloneCatalog(catalog: BudgetPlanningWorkerCatalog): BudgetPlanningWorkerCatalog {
  return {
    ...catalog,
    budgetCategories: [...catalog.budgetCategories],
    budgetPeriods: [...catalog.budgetPeriods],
    approvalStatuses: [...catalog.approvalStatuses],
    varianceSignals: [...catalog.varianceSignals],
    currencies: [...catalog.currencies],
    budgets: catalog.budgets.map((b) => ({ ...b, businessOrProject: { ...b.businessOrProject } })),
    variances: catalog.variances.map((v) => ({ ...v, sourceRefs: [...v.sourceRefs] })),
    recommendations: catalog.recommendations.map((r) => ({ ...r, evidenceRefs: [...r.evidenceRefs] })),
    reports: catalog.reports.map((r) => ({ ...r })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
