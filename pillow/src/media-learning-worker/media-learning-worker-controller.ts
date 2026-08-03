import type { MediaLearningWorkerConfiguration } from "./configuration.js";
import type { MediaLearningWorkerDependencies } from "./integrations.js";
import { LearningManager } from "./learning-manager.js";
import type {
  EngineStatus,
  MediaLearningWorkerInput,
  MediaLearningWorkerRunReport,
} from "./types.js";

export class MediaLearningWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: MediaLearningWorkerRunReport | null = null;

  constructor(
    private readonly manager: LearningManager,
    private readonly config: MediaLearningWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MediaLearningWorkerDependencies = {}) {
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
      learningOutcomeKinds: [...this.config.learningOutcomeKinds],
      patternDimensions: [...this.config.patternDimensions],
      reportingLine: [...this.config.reportingLine],
      seedLearningReports: this.config.seedLearningReports.map((report) => ({
        ...report,
        mediaIdsAnalysed: [...report.mediaIdsAnalysed],
        successfulPatterns: report.successfulPatterns.map((p) => ({
          ...p,
          evidenceRefs: [...p.evidenceRefs],
        })),
        failedPatterns: report.failedPatterns.map((p) => ({
          ...p,
          evidenceRefs: [...p.evidenceRefs],
        })),
        topicInsights: report.topicInsights.map((i) => ({
          ...i,
          measuredSignals: [...i.measuredSignals],
          assumptions: [...i.assumptions],
        })),
        hookInsights: report.hookInsights.map((i) => ({
          ...i,
          measuredSignals: [...i.measuredSignals],
          assumptions: [...i.assumptions],
        })),
        thumbnailInsights: report.thumbnailInsights.map((i) => ({
          ...i,
          measuredSignals: [...i.measuredSignals],
          assumptions: [...i.assumptions],
        })),
        retentionInsights: report.retentionInsights.map((i) => ({
          ...i,
          measuredSignals: [...i.measuredSignals],
          assumptions: [...i.assumptions],
        })),
        publishingInsights: report.publishingInsights.map((i) => ({
          ...i,
          measuredSignals: [...i.measuredSignals],
          assumptions: [...i.assumptions],
        })),
        recommendedImprovements: report.recommendedImprovements.map((r) => ({ ...r })),
        playbookRecommendationUpdates: report.playbookRecommendationUpdates.map((u) => ({
          ...u,
          neverOverwroteHistoricalLearning: true as const,
        })),
        analyticsReportIds: [...report.analyticsReportIds],
        learningTraceabilityRefs: [...report.learningTraceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
        historicalLearningRecordIds: [...report.historicalLearningRecordIds],
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

  receiveMediaAnalyticsReports(input: MediaLearningWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveMediaAnalyticsReports(input, this.config));
  }

  identifySuccessfulContentPatterns(input: MediaLearningWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.identifySuccessfulContentPatterns(input, this.config));
  }

  identifyUnsuccessfulContentPatterns(input: MediaLearningWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.identifyUnsuccessfulContentPatterns(input, this.config));
  }

  analyseTopicPerformance(input: MediaLearningWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseTopicPerformance(input, this.config));
  }

  analyseHookPerformance(input: MediaLearningWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseHookPerformance(input, this.config));
  }

  analyseThumbnailPerformance(input: MediaLearningWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseThumbnailPerformance(input, this.config));
  }

  analysePacingAndRetention(input: MediaLearningWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analysePacingAndRetention(input, this.config));
  }

  analysePublishingTiming(input: MediaLearningWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analysePublishingTiming(input, this.config));
  }

  generateReusableLearningInsights(input: MediaLearningWorkerInput = {}) {
    this.status = "learning";
    return this.finish(this.manager.generateReusableLearningInsights(input, this.config));
  }

  updateMediaPlaybookRecommendations(input: MediaLearningWorkerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.updateMediaPlaybookRecommendations(input, this.config));
  }

  produceMediaLearningReport(input: MediaLearningWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceMediaLearningReport(input, this.config));
  }

  submitReport(input: MediaLearningWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MediaLearningWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MediaLearningWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
