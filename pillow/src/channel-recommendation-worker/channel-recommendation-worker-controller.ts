import type { ChannelRecommendationWorkerConfiguration } from "./configuration.js";
import type { ChannelRecommendationWorkerDependencies } from "./integrations.js";
import { RecommendationManager } from "./recommendation-manager.js";
import type {
  EngineStatus,
  ChannelRecommendationWorkerInput,
  ChannelRecommendationWorkerRunReport,
} from "./types.js";

export class ChannelRecommendationWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ChannelRecommendationWorkerRunReport | null = null;

  constructor(
    private readonly manager: RecommendationManager,
    private readonly config: ChannelRecommendationWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ChannelRecommendationWorkerDependencies = {}) {
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
      recommendationDecisions: [...this.config.recommendationDecisions],
      reportingLine: [...this.config.reportingLine],
      seedRecommendationReports: this.config.seedRecommendationReports.map((report) => ({
        ...report,
        proposedChannel: { ...report.proposedChannel },
        targetAudience: {
          ...report.targetAudience,
          audienceSegments: [...report.targetAudience.audienceSegments],
          geographyHints: [...report.targetAudience.geographyHints],
        },
        audiencePotential: {
          ...report.audiencePotential,
          evidenceRefs: [...report.audiencePotential.evidenceRefs],
        },
        revenuePotential: {
          ...report.revenuePotential,
          evidenceRefs: [...report.revenuePotential.evidenceRefs],
        },
        productionFeasibility: {
          ...report.productionFeasibility,
          evidenceRefs: [...report.productionFeasibility.evidenceRefs],
        },
        competitionAssessment: {
          ...report.competitionAssessment,
          evidenceRefs: [...report.competitionAssessment.evidenceRefs],
        },
        strategicFit: {
          ...report.strategicFit,
          evidenceRefs: [...report.strategicFit.evidenceRefs],
        },
        contentSustainability: {
          ...report.contentSustainability,
          evidenceRefs: [...report.contentSustainability.evidenceRefs],
        },
        riskAssessment: {
          ...report.riskAssessment,
          factors: [...report.riskAssessment.factors],
        },
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
        rankedOpportunities: (report.rankedOpportunities ?? []).map((o) => ({ ...o })),
        sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
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

  receiveTrendResearch(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveTrendResearch(input, this.config));
  }

  receiveMediaAnalytics(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveMediaAnalytics(input, this.config));
  }

  receiveMediaLearningOutputs(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveMediaLearningOutputs(input, this.config));
  }

  analyseAudiencePotential(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseAudiencePotential(input, this.config));
  }

  analyseRevenuePotential(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseRevenuePotential(input, this.config));
  }

  analyseProductionFeasibility(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseProductionFeasibility(input, this.config));
  }

  analyseCompetition(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseCompetition(input, this.config));
  }

  analyseStrategicFit(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseStrategicFit(input, this.config));
  }

  analyseExpectedContentSustainability(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(
      this.manager.analyseExpectedContentSustainability(input, this.config),
    );
  }

  rankChannelOpportunities(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "ranking";
    return this.finish(this.manager.rankChannelOpportunities(input, this.config));
  }

  recommendProceedMonitorOrReject(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendProceedMonitorOrReject(input, this.config));
  }

  produceChannelRecommendationReport(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceChannelRecommendationReport(input, this.config));
  }

  submitReport(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ChannelRecommendationWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ChannelRecommendationWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
