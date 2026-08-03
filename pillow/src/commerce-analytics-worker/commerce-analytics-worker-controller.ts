import type { CommerceAnalyticsWorkerConfiguration } from "./configuration.js";
import type { CommerceAnalyticsWorkerDependencies } from "./integrations.js";
import { AnalyticsManager } from "./analytics-manager.js";
import type {
  EngineStatus,
  CommerceAnalyticsWorkerInput,
  CommerceAnalyticsWorkerRunReport,
} from "./types.js";

export class CommerceAnalyticsWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: CommerceAnalyticsWorkerRunReport | null = null;

  constructor(
    private readonly manager: AnalyticsManager,
    private readonly config: CommerceAnalyticsWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CommerceAnalyticsWorkerDependencies = {}) {
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
      reportingLine: [...this.config.reportingLine],
      seedReports: this.config.seedReports.map((report) => ({
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
          fulfilmentFailureRate: {
            ...report.supplierPerformance.fulfilmentFailureRate,
          },
          stockAvailabilityScore: {
            ...report.supplierPerformance.stockAvailabilityScore,
          },
          overallScore: { ...report.supplierPerformance.overallScore },
        },
        significantChanges: report.significantChanges.map((c) => ({ ...c })),
        improvementOpportunities: report.improvementOpportunities.map((o) => ({
          ...o,
        })),
        executiveRecommendations: report.executiveRecommendations.map((r) => ({
          ...r,
        })),
        orderReportIds: [...report.orderReportIds],
        refundCaseIds: [...report.refundCaseIds],
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
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

  receiveContext(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.receiveContext(input, this.config));
  }

  trackProductPerformance(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackProductPerformance(input, this.config));
  }

  trackSalesPerformance(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackSalesPerformance(input, this.config));
  }

  trackConversionRates(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackConversionRates(input, this.config));
  }

  trackGrossAndNetProfit(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackGrossAndNetProfit(input, this.config));
  }

  trackCustomerIssues(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackCustomerIssues(input, this.config));
  }

  trackRefundRates(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackRefundRates(input, this.config));
  }

  trackSupplierPerformance(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackSupplierPerformance(input, this.config));
  }

  detectDecliningProducts(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectDecliningProducts(input, this.config));
  }

  detectHighPerformingProducts(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectHighPerformingProducts(input, this.config));
  }

  identifyOptimizationOpportunities(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "identifying";
    return this.finish(
      this.manager.identifyOptimizationOpportunities(input, this.config),
    );
  }

  produceReport(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CommerceAnalyticsWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CommerceAnalyticsWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
