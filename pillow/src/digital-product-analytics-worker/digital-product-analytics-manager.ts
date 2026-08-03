import type { DigitalProductAnalyticsWorkerConfiguration } from "./configuration.js";
import { DigitalProductAnalyticsBuilder } from "./digital-product-analytics-builder.js";
import { DigitalProductAnalyticsStore } from "./digital-product-analytics-store.js";
import {
  DigitalProductAnalyticsValidator,
  HealthMonitor,
  RecoveryManager,
} from "./digital-product-analytics-validator.js";
import {
  IntegrationCoordinator,
  type DigitalProductAnalyticsWorkerDependencies,
} from "./integrations.js";
import { appendDpaLog } from "./dpa-logging.js";
import {
  DPA_CAPABILITIES,
  DPA_METADATA_VERSION,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  AnalyticsContext,
  DigitalProductAnalyticsReport,
  DigitalProductAnalyticsWorkerCatalog,
  DigitalProductAnalyticsWorkerEngineRecord,
  DigitalProductAnalyticsWorkerInput,
  DigitalProductAnalyticsWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class DigitalProductAnalyticsManager {
  private engineRecord: DigitalProductAnalyticsWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: DigitalProductAnalyticsWorkerCatalog | null = null;
  private readonly store = new DigitalProductAnalyticsStore();
  private readonly builder = new DigitalProductAnalyticsBuilder();
  private readonly validator = new DigitalProductAnalyticsValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: AnalyticsContext = {};

  bindIntegrations(deps: DigitalProductAnalyticsWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: DigitalProductAnalyticsWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedAnalyticsReports);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
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

  getAnalyticsReports() {
    return this.store.list();
  }

  getLatestAnalyticsReportId() {
    return this.store.getLatestAnalyticsReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return {
      ...this.context,
      feedbackThemes: [...(this.context.feedbackThemes ?? [])],
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ): DigitalProductAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendDpaLog({
      event: "connect",
      details: `Digital Product Analytics Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `dpa-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Digital Product Analytics Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: DPA_METADATA_VERSION,
      },
      started,
    );
  }

  trackProductSales(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("track_product_sales", input, config, (report) => {
      const sales = this.builder.trackProductSales(input, config, this.context);
      return {
        ...report,
        salesMetrics: sales.salesMetrics,
        analyticsSteps: [...report.analyticsSteps, ...sales.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-sales-${Date.now()}`,
            topic: report.productTitle,
            decision: sales.salesMetrics.measured
              ? `Tracked ${sales.salesMetrics.unitsSold} units sold`
              : "Sales metrics unavailable — insufficient measured input",
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  trackRevenueAndProfitMetrics(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("track_revenue_and_profit_metrics", input, config, (report) => {
      const revenue = this.builder.trackRevenueAndProfitMetrics(
        input,
        config,
        this.context,
        report.salesMetrics,
      );
      return {
        ...report,
        revenueMetrics: revenue.revenueMetrics,
        profitMetrics: revenue.profitMetrics,
        analyticsSteps: [...report.analyticsSteps, ...revenue.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-revenue-${Date.now()}`,
            topic: report.productTitle,
            decision: revenue.revenueMetrics.measured
              ? `Gross revenue ${revenue.revenueMetrics.grossRevenue} ${revenue.revenueMetrics.currency}`
              : "Revenue metrics unavailable",
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  trackConversionRates(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("track_conversion_rates", input, config, (report) => {
      const conversion = this.builder.trackConversionRates(input);
      return {
        ...report,
        conversionMetrics: conversion.conversionMetrics,
        analyticsSteps: [...report.analyticsSteps, ...conversion.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-conversion-${Date.now()}`,
            topic: report.productTitle,
            decision: conversion.conversionMetrics.measured
              ? `Conversion rate ${conversion.conversionMetrics.conversionRatePercent}%`
              : "Conversion metrics unavailable",
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  trackRefundRates(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("track_refund_rates", input, config, (report) => {
      const refunds = this.builder.trackRefundRates(input, config, this.context);
      return {
        ...report,
        refundMetrics: refunds.refundMetrics,
        analyticsSteps: [...report.analyticsSteps, ...refunds.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-refunds-${Date.now()}`,
            topic: report.productTitle,
            decision: refunds.refundMetrics.measured
              ? `Refund rate ${refunds.refundMetrics.refundRatePercent}%`
              : "Refund metrics unavailable",
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  analyseCustomerFeedback(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("analyse_customer_feedback", input, config, (report) => {
      const feedback = this.builder.analyseCustomerFeedback(input, this.context);
      return {
        ...report,
        customerFeedbackSummary: feedback.customerFeedbackSummary,
        analyticsSteps: [...report.analyticsSteps, ...feedback.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-feedback-${Date.now()}`,
            topic: report.productTitle,
            decision: `Feedback sentiment ${feedback.customerFeedbackSummary.sentiment}; ${feedback.customerFeedbackSummary.themes.length} themes`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  detectProductPerformanceTrends(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("detect_product_performance_trends", input, config, (report) => {
      const trends = this.builder.detectProductPerformanceTrends(
        report.salesMetrics,
        report.revenueMetrics,
        report.conversionMetrics,
      );
      return {
        ...report,
        trendsDetected: trends.trendsDetected,
        analyticsSteps: [...report.analyticsSteps, ...trends.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-trends-${Date.now()}`,
            topic: report.productTitle,
            decision: trends.summary,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  detectUnderperformingProducts(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("detect_underperforming_products", input, config, (report) => {
      const underperform = this.builder.detectUnderperformingProducts(
        report.salesMetrics,
        report.conversionMetrics,
        report.refundMetrics,
      );
      return {
        ...report,
        underperformingDetected: underperform.underperformingDetected,
        analyticsSteps: [...report.analyticsSteps, ...underperform.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-underperform-${Date.now()}`,
            topic: report.productTitle,
            decision: underperform.summary,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  recommendImprovementOpportunities(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage("recommend_improvement_opportunities", input, config, (report) => {
      const recs = this.builder.recommendImprovementOpportunities(report);
      return {
        ...report,
        improvementRecommendations: recs.recommendations,
        analyticsSteps: [...report.analyticsSteps, ...recs.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `dpa-dec-recs-${Date.now()}`,
            topic: report.productTitle,
            decision: `Generated ${recs.recommendations.length} improvement recommendation(s)`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generateExecutivePerformanceSummaries(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_executive_performance_summaries",
      input,
      config,
      (report) => {
        const exec = this.builder.generateExecutivePerformanceSummaries(report);
        return {
          ...report,
          executiveSummary: exec.executiveSummary,
          analyticsSteps: [...report.analyticsSteps, ...exec.steps],
          preservedDecisions: [
            ...report.preservedDecisions,
            {
              decisionId: `dpa-dec-executive-${Date.now()}`,
              topic: report.productTitle,
              decision: exec.executiveSummary.slice(0, 200),
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  produceDigitalProductAnalyticsReport(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ) {
    return this.runFullBuild("produce_digital_product_analytics_report", input, config);
  }

  submitReport(input: DigitalProductAnalyticsWorkerInput, config: DigitalProductAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.analyticsReportId) {
      const one = this.store.get(input.analyticsReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullBuild("produce_digital_product_analytics_report", input, config);
      reports = generated.analyticsReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.analyticsReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAnalyticsReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendDpaLog({
      event: "submit_report",
      details: `reports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: DigitalProductAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAnalyticsReports(
      reports.length ? reports : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), reports, latest, validation, started);
  }

  validate(input: DigitalProductAnalyticsWorkerInput, config: DigitalProductAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAnalyticsReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), reports, latest, validation, started);
  }

  diagnostics(config: DigitalProductAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Digital Product Analytics Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendDpaLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runContentStage(
    action: DigitalProductAnalyticsWorkerRunReport["action"],
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
    mutate: (report: DigitalProductAnalyticsReport) => DigitalProductAnalyticsReport,
    allowIncomplete = true,
  ): DigitalProductAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.analyticsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Digital Product Analytics Worker is disabled"
          : "Analytics rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromProductContext(input);
    const { enrichment } = this.integrations.pullProductContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingReport(enriched, config);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No analytics report available — product context required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: DigitalProductAnalyticsReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAnalyticsReports(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      allowIncomplete ? { allowIncompleteReport: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendDpaLog({
      event: action,
      details: `analytics=${updated.analyticsReportId} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: DigitalProductAnalyticsWorkerRunReport["action"],
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ): DigitalProductAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.analyticsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Digital Product Analytics Worker is disabled"
          : "Analytics rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromProductContext(input);
    const { enrichment } = this.integrations.pullProductContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const report = this.builder.buildDigitalProductAnalyticsReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAnalyticsReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendDpaLog({
      event: action,
      details: `analytics=${report.analyticsReportId} type=${report.analyticsType} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private ensureWorkingReport(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
  ): DigitalProductAnalyticsReport | null {
    if (input.analyticsReportId) {
      const existing = this.store.get(input.analyticsReportId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const created = this.builder.createAnalyticsShell(input, config, this.context);
    this.store.save(created, "bootstrap_analytics");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: DigitalProductAnalyticsWorkerRunReport["action"],
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateAnalyticsReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: DigitalProductAnalyticsWorkerRunReport["action"],
    config: DigitalProductAnalyticsWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: DigitalProductAnalyticsWorkerInput) {
    return (
      input.editProducts === true ||
      input.modifyProducts === true ||
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ512OrLater === true ||
      input.fabricateMetrics === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: DigitalProductAnalyticsWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: DigitalProductAnalyticsReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `dpa-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DIGITAL_PRODUCT_ANALYTICS_WORKER_ID,
      engineVersion: "PILLOW-DPA-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...DPA_CAPABILITIES],
      totalAnalyticsReports: this.store.count(),
      lastAnalyticsReportId: report?.analyticsReportId ?? this.store.getLatestAnalyticsReportId(),
      lastAnalyticsType: report?.analyticsType ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: DPA_METADATA_VERSION,
    };
  }

  private report(
    action: DigitalProductAnalyticsWorkerRunReport["action"],
    catalog: DigitalProductAnalyticsWorkerCatalog | null,
    reports: DigitalProductAnalyticsReport[],
    latestAnalyticsReport: DigitalProductAnalyticsReport | null,
    validation: DigitalProductAnalyticsWorkerRunReport["validation"],
    started: number,
  ): DigitalProductAnalyticsWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      analyticsRunReportId: `dpa-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      analyticsReports: reports,
      latestAnalyticsReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: DPA_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: DigitalProductAnalyticsWorkerCatalog): DigitalProductAnalyticsWorkerCatalog {
  return {
    ...catalog,
    analyticsReports: catalog.analyticsReports.map((report) => ({
      ...report,
      analyticsSteps: report.analyticsSteps.map((s) => ({ ...s })),
      supportedAnalyticsTypes: [...report.supportedAnalyticsTypes],
      improvementRecommendations: report.improvementRecommendations.map((r) => ({
        ...r,
        isRecommendation: true as const,
      })),
      selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
      customerFeedbackSummary: {
        ...report.customerFeedbackSummary,
        themes: [...report.customerFeedbackSummary.themes],
      },
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
