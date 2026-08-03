import type { MediaAnalyticsWorkerConfiguration } from "./configuration.js";
import type { MediaAnalyticsWorkerDependencies } from "./integrations.js";
import { AnalyticsManager } from "./analytics-manager.js";
import type {
  EngineStatus,
  MediaAnalyticsWorkerInput,
  MediaAnalyticsWorkerRunReport,
} from "./types.js";

export class MediaAnalyticsWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: MediaAnalyticsWorkerRunReport | null = null;

  constructor(
    private readonly manager: AnalyticsManager,
    private readonly config: MediaAnalyticsWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MediaAnalyticsWorkerDependencies = {}) {
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
      supportedPlatforms: [...this.config.supportedPlatforms],
      metricSources: [...this.config.metricSources],
      reportingLine: [...this.config.reportingLine],
      seedAnalyticsReports: this.config.seedAnalyticsReports.map((report) => ({
        ...report,
        views: { ...report.views },
        impressions: { ...report.impressions },
        clickThroughRate: { ...report.clickThroughRate },
        watchTime: { ...report.watchTime },
        retentionMetrics: { ...report.retentionMetrics },
        subscriberImpact: { ...report.subscriberImpact },
        engagementMetrics: { ...report.engagementMetrics },
        revenueMetrics: { ...report.revenueMetrics },
        performancePatterns: report.performancePatterns.map((p) => ({
          ...p,
          evidenceRefs: [...p.evidenceRefs],
        })),
        comparisons: report.comparisons.map((c) => ({
          ...c,
          metricsCompared: [...c.metricsCompared],
        })),
        metricTraceabilityRefs: [...report.metricTraceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
        historicalSnapshotIds: [...report.historicalSnapshotIds],
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

  receivePlatformMetrics(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receivePlatformMetrics(input, this.config));
  }

  trackViews(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackViews(input, this.config));
  }

  trackImpressions(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackImpressions(input, this.config));
  }

  trackClickThroughRate(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackClickThroughRate(input, this.config));
  }

  trackWatchTime(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackWatchTime(input, this.config));
  }

  trackAudienceRetention(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackAudienceRetention(input, this.config));
  }

  trackSubscriberGrowth(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackSubscriberGrowth(input, this.config));
  }

  trackEngagementMetrics(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackEngagementMetrics(input, this.config));
  }

  trackRevenueWhereAvailable(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackRevenueWhereAvailable(input, this.config));
  }

  detectPerformancePatterns(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "analyzing";
    return this.finish(this.manager.detectPerformancePatterns(input, this.config));
  }

  compareVideosFormatsTopicsHooksChannels(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "comparing";
    return this.finish(
      this.manager.compareVideosFormatsTopicsHooksChannels(input, this.config),
    );
  }

  produceMediaAnalyticsReport(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceMediaAnalyticsReport(input, this.config));
  }

  submitReport(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MediaAnalyticsWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MediaAnalyticsWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
