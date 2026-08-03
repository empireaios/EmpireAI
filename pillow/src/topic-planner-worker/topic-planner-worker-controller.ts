import type { TopicPlannerWorkerConfiguration } from "./configuration.js";
import type { TopicPlannerWorkerDependencies } from "./integrations.js";
import { PlanManager } from "./plan-manager.js";
import type {
  EngineStatus,
  TopicPlannerWorkerInput,
  TopicPlannerWorkerRunReport,
} from "./types.js";

export class TopicPlannerWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: TopicPlannerWorkerRunReport | null = null;

  constructor(
    private readonly manager: PlanManager,
    private readonly config: TopicPlannerWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: TopicPlannerWorkerDependencies = {}) {
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
      seedPlans: this.config.seedPlans.map((plan) => ({
        ...plan,
        selectedTopics: plan.selectedTopics.map((t) => ({ ...t })),
        rankedTopics: plan.rankedTopics.map((t) => ({ ...t })),
        trendReportIds: [...plan.trendReportIds],
        traceabilityRefs: [...plan.traceabilityRefs],
        preservedDecisions: plan.preservedDecisions.map((d) => ({ ...d })),
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

  receiveEditorialStrategy(input: TopicPlannerWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveEditorialStrategy(input, this.config));
  }

  receiveTrendResearchReports(input: TopicPlannerWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveTrendResearchReports(input, this.config));
  }

  analyseChannelObjectives(input: TopicPlannerWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseChannelObjectives(input, this.config));
  }

  prioritizeContentOpportunities(input: TopicPlannerWorkerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.prioritizeContentOpportunities(input, this.config));
  }

  selectDailyPublishingTopics(input: TopicPlannerWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.selectDailyPublishingTopics(input, this.config));
  }

  balanceEvergreenAndTrending(input: TopicPlannerWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.balanceEvergreenAndTrending(input, this.config));
  }

  preventDuplicateTopics(input: TopicPlannerWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.preventDuplicateTopics(input, this.config));
  }

  maintainPublishingCadence(input: TopicPlannerWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.maintainPublishingCadence(input, this.config));
  }

  rankTopicsByStrategicPriority(input: TopicPlannerWorkerInput = {}) {
    this.status = "ranking";
    return this.finish(this.manager.rankTopicsByStrategicPriority(input, this.config));
  }

  produceTopicPlan(input: TopicPlannerWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceTopicPlan(input, this.config));
  }

  submitPlan(input: TopicPlannerWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitPlan(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: TopicPlannerWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: TopicPlannerWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
