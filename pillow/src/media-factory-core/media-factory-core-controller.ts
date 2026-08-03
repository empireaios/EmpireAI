import type { MediaFactoryCoreConfiguration } from "./configuration.js";
import type { MediaFactoryCoreDependencies } from "./integrations.js";
import { MediaFactoryManager } from "./factory-manager.js";
import type {
  EngineStatus,
  MediaFactoryCoreInput,
  MediaFactoryCoreRunReport,
} from "./types.js";

export class MediaFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: MediaFactoryCoreRunReport | null = null;

  constructor(
    private readonly manager: MediaFactoryManager,
    private readonly config: MediaFactoryCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MediaFactoryCoreDependencies = {}) {
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
      channelTypes: [...this.config.channelTypes],
      pipelineTypes: [...this.config.pipelineTypes],
      contentStages: [...this.config.contentStages],
      missionStatuses: [...this.config.missionStatuses],
      approvalStatuses: [...this.config.approvalStatuses],
      publishingStatuses: [...this.config.publishingStatuses],
      learningStatuses: [...this.config.learningStatuses],
      productionStatuses: [...this.config.productionStatuses],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedMissions: this.config.seedMissions.map((mission) => ({
        ...mission,
        assignedWorkers: [...mission.assignedWorkers],
        assignedWorkerRoles: [...mission.assignedWorkerRoles],
        preservedDecisions: [...mission.preservedDecisions],
        traceabilityRefs: [...mission.traceabilityRefs],
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

  createMediaBusinessMission(input: MediaFactoryCoreInput = {}) {
    this.status = "creating";
    return this.finish(this.manager.createMediaBusinessMission(input, this.config));
  }

  registerChannel(input: MediaFactoryCoreInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerChannel(input, this.config));
  }

  registerPipeline(input: MediaFactoryCoreInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerPipeline(input, this.config));
  }

  manageLifecycle(input: MediaFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.manageLifecycle(input, this.config));
  }

  coordinateWorkers(input: MediaFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateWorkers(input, this.config));
  }

  coordinateApproval(input: MediaFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.coordinateApproval(input, this.config));
  }

  coordinatePublishing(input: MediaFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinatePublishing(input, this.config));
  }

  coordinateAnalytics(input: MediaFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateAnalytics(input, this.config));
  }

  coordinateLearning(input: MediaFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateLearning(input, this.config));
  }

  trackProduction(input: MediaFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackProduction(input, this.config));
  }

  trackPublishing(input: MediaFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackPublishing(input, this.config));
  }

  produceReport(input: MediaFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: MediaFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MediaFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MediaFactoryCoreRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
