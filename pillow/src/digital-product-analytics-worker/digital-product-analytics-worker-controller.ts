import type { DigitalProductAnalyticsWorkerConfiguration } from "./configuration.js";
import type { DigitalProductAnalyticsWorkerDependencies } from "./integrations.js";
import { DigitalProductAnalyticsManager } from "./digital-product-analytics-manager.js";
import type {
  EngineStatus,
  DigitalProductAnalyticsWorkerInput,
  DigitalProductAnalyticsWorkerRunReport,
} from "./types.js";

export class DigitalProductAnalyticsWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: DigitalProductAnalyticsWorkerRunReport | null = null;

  constructor(
    private readonly manager: DigitalProductAnalyticsManager,
    private readonly config: DigitalProductAnalyticsWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: DigitalProductAnalyticsWorkerDependencies = {}) {
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
      integrationTargets: [...this.config.integrationTargets],
      supportedAnalyticsTypes: [...this.config.supportedAnalyticsTypes],
      reportingLine: [...this.config.reportingLine],
      seedAnalyticsReports: this.config.seedAnalyticsReports.map((report) => ({
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
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  trackProductSales(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "tracking_sales";
    return this.finish(this.manager.trackProductSales(input, this.config));
  }

  trackRevenueAndProfitMetrics(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "tracking_revenue_profit";
    return this.finish(this.manager.trackRevenueAndProfitMetrics(input, this.config));
  }

  trackConversionRates(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "tracking_conversion";
    return this.finish(this.manager.trackConversionRates(input, this.config));
  }

  trackRefundRates(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "tracking_refunds";
    return this.finish(this.manager.trackRefundRates(input, this.config));
  }

  analyseCustomerFeedback(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "analysing_feedback";
    return this.finish(this.manager.analyseCustomerFeedback(input, this.config));
  }

  detectProductPerformanceTrends(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "detecting_trends";
    return this.finish(this.manager.detectProductPerformanceTrends(input, this.config));
  }

  detectUnderperformingProducts(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "detecting_underperformance";
    return this.finish(this.manager.detectUnderperformingProducts(input, this.config));
  }

  recommendImprovementOpportunities(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "recommending_improvements";
    return this.finish(this.manager.recommendImprovementOpportunities(input, this.config));
  }

  generateExecutivePerformanceSummaries(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "generating_executive_summary";
    return this.finish(this.manager.generateExecutivePerformanceSummaries(input, this.config));
  }

  produceDigitalProductAnalyticsReport(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceDigitalProductAnalyticsReport(input, this.config));
  }

  submitReport(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: DigitalProductAnalyticsWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DigitalProductAnalyticsWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
