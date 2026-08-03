import type { CommerceAnalyticsWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type CommerceAnalyticsWorkerDependencies,
} from "./integrations.js";
import { appendCawLog } from "./caw-logging.js";
import {
  CAW_CAPABILITIES,
  CAW_METADATA_VERSION,
  COMMERCE_ANALYTICS_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { AnalyticsBuilder } from "./analytics-builder.js";
import { AnalyticsStore } from "./analytics-store.js";
import {
  AnalyticsValidator,
  HealthMonitor,
  RecoveryManager,
} from "./analytics-validator.js";
import type {
  AnalyticsContextInput,
  CommerceAnalyticsReport,
  CommerceAnalyticsWorkerCatalog,
  CommerceAnalyticsWorkerEngineRecord,
  CommerceAnalyticsWorkerInput,
  CommerceAnalyticsWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class AnalyticsManager {
  private engineRecord: CommerceAnalyticsWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: CommerceAnalyticsWorkerCatalog | null = null;
  private readonly store = new AnalyticsStore();
  private readonly builder = new AnalyticsBuilder();
  private readonly validator = new AnalyticsValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingContext: CommerceAnalyticsWorkerInput = {};
  private pendingAnalyticsContext: AnalyticsContextInput | null = null;

  bindIntegrations(deps: CommerceAnalyticsWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CommerceAnalyticsWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
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

  connect(
    _input: Record<string, unknown>,
    config: CommerceAnalyticsWorkerConfiguration,
  ): CommerceAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendCawLog({
      event: "connect",
      details: `Commerce Analytics Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `caw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Commerce Analytics Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CAW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveContext(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ): CommerceAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_context", input, config, started);
    }
    const enriched = this.integrations.enrichFromCommerceWorkers(input);
    const pulled = this.integrations.pullAnalyticsContext(enriched);
    const analyticsContext =
      pulled.analyticsContext ?? this.builder.resolveContext(enriched);
    if (
      !analyticsContext.productId?.trim() &&
      !analyticsContext.businessId?.trim() &&
      !analyticsContext.businessMissionId?.trim()
    ) {
      return this.disabled(
        "receive_context",
        config,
        "No analytics context received — provide analyticsContext / productId or businessId, or bind commerce workers",
      );
    }
    this.pendingAnalyticsContext = analyticsContext;
    this.pendingContext = enriched;
    const validation = this.validator.finalize(
      "pass",
      [],
      [
        `Received analytics context for ${analyticsContext.productId ?? analyticsContext.businessId}`,
      ],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendCawLog({
      event: "receive_context",
      details: `product=${analyticsContext.productId ?? analyticsContext.businessId}`,
    });
    return this.report(
      "receive_context",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  trackProductPerformance(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("track_product_performance", input, config);
  }

  trackSalesPerformance(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("track_sales_performance", input, config);
  }

  trackConversionRates(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("track_conversion_rates", input, config);
  }

  trackGrossAndNetProfit(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("track_gross_and_net_profit", input, config);
  }

  trackCustomerIssues(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("track_customer_issues", input, config);
  }

  trackRefundRates(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("track_refund_rates", input, config);
  }

  trackSupplierPerformance(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("track_supplier_performance", input, config);
  }

  detectDecliningProducts(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("detect_declining_products", input, config);
  }

  detectHighPerformingProducts(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("detect_high_performing_products", input, config);
  }

  identifyOptimizationOpportunities(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("identify_optimization_opportunities", input, config);
  }

  produceReport(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalytics("produce_report", input, config);
  }

  submitFindings(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_findings", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_findings",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let reports = this.store.list();
    if (input.analyticsReportId) {
      const one = this.store.get(input.analyticsReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runAnalytics("produce_report", input, config);
      reports = generated.analyticsReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.analyticsReportId, submission.executiveReportId!) ??
          r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
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
    appendCawLog({
      event: "submit_findings",
      details: `reports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: CommerceAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
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

  validate(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
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

  diagnostics(config: CommerceAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Commerce Analytics Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendCawLog({
      event: "diagnostics",
      details: `analyticsReports=${this.store.count()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runAnalytics(
    action: CommerceAnalyticsWorkerRunReport["action"],
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
  ): CommerceAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.analyticsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Commerce Analytics Worker is disabled"
          : "Analytics rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromCommerceWorkers({
      ...this.pendingContext,
      ...input,
      analyticsContext: {
        ...(this.pendingAnalyticsContext ?? {}),
        ...(input.analyticsContext ?? {}),
      },
    });
    const pulled = this.integrations.pullAnalyticsContext(enriched);
    const analyticsContext =
      pulled.analyticsContext ?? this.builder.resolveContext(enriched);
    if (
      !analyticsContext.productId?.trim() &&
      !analyticsContext.businessId?.trim() &&
      !analyticsContext.businessMissionId?.trim()
    ) {
      return this.disabled(
        action,
        config,
        "Analytics requires productId or businessId (analyticsContext / commerce worker enrichment)",
      );
    }
    this.pendingAnalyticsContext = analyticsContext;
    this.pendingContext = enriched;

    const report = this.builder.buildReport(
      enriched,
      config,
      analyticsContext,
      pulled.enrichment,
    );
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReports(
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
    appendCawLog({
      event: action,
      details: `report=${report.analyticsReportId} product=${report.productId} classification=${report.productPerformanceClassification} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: CommerceAnalyticsWorkerRunReport["action"],
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: CommerceAnalyticsWorkerRunReport["action"],
    config: CommerceAnalyticsWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: CommerceAnalyticsWorkerInput) {
    return (
      input.modifyProducts === true ||
      input.modifyPricing === true ||
      input.modifySuppliers === true ||
      input.executeOptimizations === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ314OrLater === true ||
      input.modifyOperationalData === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: CommerceAnalyticsWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: CommerceAnalyticsReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `caw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COMMERCE_ANALYTICS_WORKER_ID,
      engineVersion: "PILLOW-CAW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...CAW_CAPABILITIES],
      totalAnalyticsReports: this.store.count(),
      lastAnalyticsReportId: report?.analyticsReportId ?? this.store.getLatestAnalyticsReportId(),
      lastProductPerformanceClassification:
        report?.productPerformanceClassification ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      lastOpportunityCount: report?.improvementOpportunities.length ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: CAW_METADATA_VERSION,
    };
  }

  private report(
    action: CommerceAnalyticsWorkerRunReport["action"],
    catalog: CommerceAnalyticsWorkerCatalog | null,
    analyticsReports: CommerceAnalyticsReport[],
    latestAnalyticsReport: CommerceAnalyticsReport | null,
    validation: CommerceAnalyticsWorkerRunReport["validation"],
    started: number,
  ): CommerceAnalyticsWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      analyticsRunReportId: `caw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      analyticsReports,
      latestAnalyticsReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CAW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: CommerceAnalyticsWorkerCatalog,
): CommerceAnalyticsWorkerCatalog {
  return {
    ...catalog,
    analyticsReports: catalog.analyticsReports.map((report) => ({
      ...report,
      salesMetrics: {
        ...report.salesMetrics,
        unitsSold: { ...report.salesMetrics.unitsSold },
        revenue: { ...report.salesMetrics.revenue },
        averageOrderValue: { ...report.salesMetrics.averageOrderValue },
      },
      conversionMetrics: {
        sessions: { ...report.conversionMetrics.sessions },
        orders: { ...report.conversionMetrics.orders },
        conversionRate: { ...report.conversionMetrics.conversionRate },
      },
      profitMetrics: {
        grossProfit: { ...report.profitMetrics.grossProfit },
        netProfit: { ...report.profitMetrics.netProfit },
        grossMarginPercent: { ...report.profitMetrics.grossMarginPercent },
        netMarginPercent: { ...report.profitMetrics.netMarginPercent },
      },
      customerIssueMetrics: {
        ...report.customerIssueMetrics,
        issueCount: { ...report.customerIssueMetrics.issueCount },
        issueRate: { ...report.customerIssueMetrics.issueRate },
        topIssueTypes: [...report.customerIssueMetrics.topIssueTypes],
      },
      refundMetrics: {
        refundCount: { ...report.refundMetrics.refundCount },
        refundRate: { ...report.refundMetrics.refundRate },
        refundAmount: { ...report.refundMetrics.refundAmount },
      },
      supplierPerformance: {
        ...report.supplierPerformance,
        onTimeRate: { ...report.supplierPerformance.onTimeRate },
        fulfilmentFailureRate: { ...report.supplierPerformance.fulfilmentFailureRate },
        stockAvailabilityScore: {
          ...report.supplierPerformance.stockAvailabilityScore,
        },
        overallScore: { ...report.supplierPerformance.overallScore },
      },
      significantChanges: report.significantChanges.map((c) => ({ ...c })),
      improvementOpportunities: report.improvementOpportunities.map((o) => ({ ...o })),
      executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),
      orderReportIds: [...report.orderReportIds],
      refundCaseIds: [...report.refundCaseIds],
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
