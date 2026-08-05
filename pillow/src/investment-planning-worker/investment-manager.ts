import type { InvestmentPlanningWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type InvestmentPlanningWorkerDependencies } from "./integrations.js";
import {
  buildCapitalAllocationRecommendations,
  buildCatalog,
  buildEngineRecord,
  buildEvaluatedOpportunity,
  buildInvestmentPlanningReport,
  buildQ909ConsumableContract,
  buildRiskAssessmentSummaryFromEvaluated,
} from "./investment-builder.js";
import { rankOpportunities, computeConfidenceScore } from "./investment-scorer.js";
import { InvestmentStore } from "./investment-store.js";
import { appendIpwLog } from "./ipw-logging.js";
import { IpwValidator } from "./investment-validator.js";
import type {
  EvaluatedOpportunity,
  InvestmentOpportunityInput,
  IpwInput,
  IpwRunReport,
  Q909ConsumableContract,
} from "./types.js";

export class InvestmentPlanningWorkerManager {
  private readonly store = new InvestmentStore();
  private readonly integrations = new IntegrationCoordinator();
  private readonly validator = new IpwValidator();
  private connected = false;

  bindIntegrations(deps: InvestmentPlanningWorkerDependencies = {}) {
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

  getQ909ConsumableContract(config: InvestmentPlanningWorkerConfiguration): Q909ConsumableContract {
    return buildQ909ConsumableContract(config);
  }

  connect(config: InvestmentPlanningWorkerConfiguration, _input: IpwInput = {}): IpwRunReport {
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
      details: "Investment Planning Worker connected",
    };
  }

  consumeAccounting(_config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const entries = this.integrations.fetchAccountingEntries();
    this.store.appendAudit("consume_accounting", `entries=${entries.length}`);
    appendIpwLog({ event: "consume_accounting", details: `entries=${entries.length}` });
    return {
      action: "consume_accounting",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      planningPeriod: input.planningPeriod ?? null,
      details: `Consumed ${entries.length} accounting entr(y/ies) for traceability`,
    };
  }

  consumeCashflow(_config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const reports = this.integrations.fetchCashflowReports();
    this.store.appendAudit("consume_cashflow", `reports=${reports.length}`);
    return {
      action: "consume_cashflow",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      planningPeriod: input.planningPeriod ?? null,
      details: `Consumed ${reports.length} cashflow report(s) for measured capital context`,
    };
  }

  consumeProfitability(_config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const reports = this.integrations.fetchProfitabilityReports();
    this.store.appendAudit("consume_profitability", `reports=${reports.length}`);
    return {
      action: "consume_profitability",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      planningPeriod: input.planningPeriod ?? null,
      details: `Consumed ${reports.length} profitability report(s) for traceability`,
    };
  }

  consumeForecasting(_config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const reports = this.integrations.fetchForecastingReports();
    this.store.appendAudit("consume_forecasting", `reports=${reports.length}`);
    return {
      action: "consume_forecasting",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      planningPeriod: input.planningPeriod ?? null,
      details: `Consumed ${reports.length} forecasting report(s) for contextual traceability`,
    };
  }

  consumeTaxSupport(_config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const reports = this.integrations.fetchTaxSupportReports();
    this.store.appendAudit("consume_tax_support", `reports=${reports.length}`);
    return {
      action: "consume_tax_support",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      planningPeriod: input.planningPeriod ?? null,
      details: `Consumed ${reports.length} tax-support report(s) for traceability`,
    };
  }

  consumeBudget(_config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const reports = this.integrations.fetchBudgetReports();
    this.store.appendAudit("consume_budget", `reports=${reports.length}`);
    return {
      action: "consume_budget",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      planningPeriod: input.planningPeriod ?? null,
      details: `Consumed ${reports.length} budget report(s) for traceability`,
    };
  }

  evaluateOpportunities(
    config: InvestmentPlanningWorkerConfiguration,
    input: IpwInput = {},
    action: IpwRunReport["action"] = "evaluate_opportunities",
  ): IpwRunReport {
    const future = this.validator.rejectFutureMissions(
      typeof (input as { missionId?: string }).missionId === "string"
        ? (input as { missionId?: string }).missionId
        : null,
    );
    if (future.decision === "fail") {
      return {
        action,
        validation: future,
        runTimestamp: new Date().toISOString(),
        details: future.errors.join("; "),
      };
    }
    const validation = this.validator.validateInput(input);
    if (validation.decision === "fail") {
      return {
        action,
        validation,
        runTimestamp: new Date().toISOString(),
        capitalBusinessId: input.capitalBusinessId ?? null,
        planningPeriod: input.planningPeriod ?? null,
        details: validation.errors.join("; "),
      };
    }
    const businessId =
      this.integrations.resolveCapitalBusinessId(input.capitalBusinessId) ?? input.capitalBusinessId!.trim();
    const planningPeriod = input.planningPeriod!.trim();
    const currency = (input.currency ?? config.defaultCurrency).trim();
    const capitalCtx = this.integrations.resolveMeasuredAvailableCapital(
      currency,
      input.availableCapitalMinor,
    );
    const opportunities = input.opportunities ?? [];
    for (const opp of opportunities) {
      const ov = this.validator.validateOpportunity(opp);
      if (ov.decision === "fail") {
        return {
          action,
          validation: ov,
          runTimestamp: new Date().toISOString(),
          capitalBusinessId: businessId,
          planningPeriod,
          details: ov.errors.join("; "),
        };
      }
    }
    const evaluated: EvaluatedOpportunity[] = opportunities.map((opp) =>
      buildEvaluatedOpportunity(opp, config, capitalCtx.minor),
    );
    for (const item of evaluated) this.store.addEvaluated(item);
    this.refreshEngineRecord(config, "active", "healthy", "passed", businessId, planningPeriod);
    this.store.appendAudit(action, `evaluated=${evaluated.length}`);
    return {
      action,
      validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: businessId,
      planningPeriod,
      evaluatedOpportunities: evaluated,
      details: `Evaluated ${evaluated.length} caller-supplied opportunit(y/ies)`,
    };
  }

  rankOpportunities(config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const evaluated = this.evaluateOpportunities(config, input, "rank_opportunities");
    if (evaluated.validation.decision === "fail" || !evaluated.evaluatedOpportunities) return evaluated;
    const ranked = rankOpportunities(evaluated.evaluatedOpportunities);
    this.store.setRankings(ranked);
    return {
      action: "rank_opportunities",
      validation: evaluated.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: evaluated.capitalBusinessId,
      planningPeriod: evaluated.planningPeriod,
      evaluatedOpportunities: evaluated.evaluatedOpportunities,
      rankedOpportunities: ranked,
      details: `Ranked ${ranked.length} opportunit(y/ies) deterministically`,
    };
  }

  compareAlternatives(config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const ranked = this.rankOpportunities(config, input);
    if (ranked.validation.decision === "fail") return { ...ranked, action: "compare_alternatives" };
    return {
      ...ranked,
      action: "compare_alternatives",
      details: `Compared ${ranked.rankedOpportunities?.length ?? 0} alternative(s) by score`,
    };
  }

  assessRisks(config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const evaluated = this.evaluateOpportunities(config, input, "assess_risks");
    if (evaluated.validation.decision === "fail" || !evaluated.evaluatedOpportunities) return evaluated;
    const riskAssessment = buildRiskAssessmentSummaryFromEvaluated(evaluated.evaluatedOpportunities);
    return {
      action: "assess_risks",
      validation: evaluated.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: evaluated.capitalBusinessId,
      planningPeriod: evaluated.planningPeriod,
      evaluatedOpportunities: evaluated.evaluatedOpportunities,
      riskAssessment,
      details: `Risk assessment: ${riskAssessment.elevatedRiskCount} elevated-risk opportunit(y/ies)`,
    };
  }

  produceInvestmentPlanningReport(
    config: InvestmentPlanningWorkerConfiguration,
    input: IpwInput = {},
  ): IpwRunReport {
    const ranked = this.rankOpportunities(config, input);
    if (ranked.validation.decision === "fail" || !ranked.rankedOpportunities) return ranked;
    const businessId = ranked.capitalBusinessId!;
    const planningPeriod = ranked.planningPeriod!;
    const currency = (input.currency ?? config.defaultCurrency).trim();
    const capitalCtx = this.integrations.resolveMeasuredAvailableCapital(
      currency,
      input.availableCapitalMinor,
    );
    const recommendations = buildCapitalAllocationRecommendations(
      ranked.rankedOpportunities,
      capitalCtx.minor,
    );
    this.store.addRecommendations(recommendations);
    const riskAssessment = buildRiskAssessmentSummaryFromEvaluated(ranked.rankedOpportunities);
    const evidence = [
      ...ranked.rankedOpportunities.flatMap((o) => o.evidenceRefs),
      ...this.integrations.fetchAccountingEntries().map((e) => e.entryId),
      ...this.integrations.fetchCashflowReports().map((r) => String(r.reportId ?? "cashflow")),
      ...this.integrations.fetchBudgetReports().map((r) => String(r.reportId ?? "budget")),
      ...this.integrations.fetchProfitabilityReports().map((r) => String(r.reportId ?? "profitability")),
      ...this.integrations.fetchForecastingReports().map((r) => String(r.reportId ?? "forecast")),
      ...this.integrations.fetchTaxSupportReports().map((r) => String(r.reportId ?? "tax-support")),
    ];
    const uniqueEvidence = [...new Set(evidence)];
    const outstandingIssues = ranked.rankedOpportunities
      .filter((o) => o.recommendation === "reject" || !o.capitalFit)
      .map((o) => `${o.opportunityId}:${o.recommendation}${o.capitalFit ? "" : ":capital_mismatch"}`);
    const confidenceScore = computeConfidenceScore({
      opportunityCount: ranked.rankedOpportunities.length,
      evidenceRefCount: uniqueEvidence.length,
      measuredCapitalAvailable: capitalCtx.source !== "not_available",
      recommendationCount: recommendations.length,
    });
    const draftValidation = { decision: "pass" as const, errors: [] as string[], warnings: [] as string[] };
    const report = buildInvestmentPlanningReport({
      capitalBusinessId: businessId,
      capitalProjectId: input.capitalProjectId?.trim() || `project-${businessId}`,
      planningPeriod,
      currency,
      evaluatedOpportunities: ranked.rankedOpportunities,
      rankedOpportunities: ranked.rankedOpportunities,
      capitalAllocationRecommendations: recommendations,
      riskAssessment,
      availableCapitalMinor: capitalCtx.minor,
      availableCapitalSource: capitalCtx.source,
      supportingEvidence: uniqueEvidence,
      outstandingIssues,
      confidenceScore,
      validation: draftValidation,
      config,
    });
    const reportValidation = this.validator.validateReport(report);
    report.validation = reportValidation;
    this.store.addReport(report);
    this.refreshEngineRecord(config, "active", "healthy", reportValidation.decision === "fail" ? "failed" : "passed", businessId, planningPeriod);
    this.store.appendAudit("produce_investment_planning_report", `report=${report.reportId}`);
    return {
      action: "produce_investment_planning_report",
      validation: reportValidation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: businessId,
      planningPeriod,
      evaluatedOpportunities: ranked.rankedOpportunities,
      rankedOpportunities: ranked.rankedOpportunities,
      capitalAllocationRecommendations: recommendations,
      riskAssessment,
      investmentPlanningReport: report,
      details: `Investment Planning Report ${report.reportId} produced — recommendations only, never execution`,
    };
  }

  submitReport(config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const produced = this.produceInvestmentPlanningReport(config, input);
    if (produced.validation.decision === "fail" || !produced.investmentPlanningReport) return produced;
    const report = { ...produced.investmentPlanningReport };
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
      investmentPlanningReport: report,
      details: report.submittedThroughExecutiveReportingRuntime
        ? `Submitted via ERR: ${report.executiveReportId}`
        : "Report stored locally — ERR unavailable",
    };
  }

  list(): IpwRunReport {
    const reports = this.store.getReports();
    return {
      action: "list",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      details: `Reports=${reports.length} opportunities=${this.store.getOpportunities().length}`,
    };
  }

  validate(config: InvestmentPlanningWorkerConfiguration, input: IpwInput = {}): IpwRunReport {
    const inputValidation = this.validator.validateInput(input);
    const latest = this.store.getLatestReport();
    const reportValidation = latest ? this.validator.validateReport(latest) : { decision: "pass" as const, errors: [], warnings: [] };
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

  diagnostics(config: InvestmentPlanningWorkerConfiguration): IpwRunReport {
    return {
      action: "diagnostics",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      handshakes: this.integrations.getHandshakes(),
      details: `connected=${this.connected} reports=${this.store.getReports().length} engineEnabled=${config.enabled}`,
    };
  }

  private refreshEngineRecord(
    config: InvestmentPlanningWorkerConfiguration,
    operationalState: "connected" | "active",
    healthStatus: "healthy" | "degraded" | "failed",
    validationStatus: "passed" | "failed",
    lastBusinessId: string | null = this.store.getLatestBusinessId(),
    lastPlanningPeriod: string | null = null,
  ) {
    this.store.setEngineRecord(
      buildEngineRecord({
        operationalState,
        healthStatus,
        validationStatus,
        totalOpportunities: this.store.getOpportunities().length,
        totalReports: this.store.getReports().length,
        totalRecommendations: this.store.getRecommendations().length,
        lastBusinessId,
        lastPlanningPeriod,
        handshakes: this.integrations.getHandshakes(),
      }),
    );
    void config;
  }
}

export type { InvestmentOpportunityInput };
