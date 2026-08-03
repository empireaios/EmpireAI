import type { EnterprisePlatformFactoryCoreConfiguration } from "./configuration.js";
import type { EnterprisePlatformFactoryCoreDependencies } from "./integrations.js";
import { EnterprisePlatformFactoryManager } from "./factory-manager.js";
import type {
  EnterprisePlatformFactoryCoreInput,
  EnterprisePlatformFactoryCoreRunReport,
  EngineStatus,
} from "./types.js";

export class EnterprisePlatformFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: EnterprisePlatformFactoryCoreRunReport | null = null;

  constructor(
    private readonly manager: EnterprisePlatformFactoryManager,
    private readonly config: EnterprisePlatformFactoryCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: EnterprisePlatformFactoryCoreDependencies = {}) {
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
      platformTypes: [...this.config.platformTypes],
      pipelineTypes: [...this.config.pipelineTypes],
      pipelineStages: [...this.config.pipelineStages],
      lifecycleStages: [...this.config.lifecycleStages],
      missionStatuses: [...this.config.missionStatuses],
      approvalStatuses: [...this.config.approvalStatuses],
      testingStatuses: [...this.config.testingStatuses],
      deploymentStatuses: [...this.config.deploymentStatuses],
      productionStatuses: [...this.config.productionStatuses],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedMissions: this.config.seedMissions.map((mission) => ({
        ...mission,
        platformPortfolio: [...mission.platformPortfolio],
        activePlatforms: [...mission.activePlatforms],
        assignedWorkers: [...mission.assignedWorkers],
        assignedWorkerRoles: [...mission.assignedWorkerRoles],
        activeDependencies: [...mission.activeDependencies],
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

  createEnterprisePlatformMission(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "creating";
    return this.finish(this.manager.createEnterprisePlatformMission(input, this.config));
  }

  registerSoftwarePlatform(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerSoftwarePlatform(input, this.config));
  }

  coordinateSoftwareDevelopmentLifecycle(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(
      this.manager.coordinateSoftwareDevelopmentLifecycle(input, this.config),
    );
  }

  coordinateArchitectureDecisions(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateArchitectureDecisions(input, this.config));
  }

  coordinateImplementationWorkers(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateImplementationWorkers(input, this.config));
  }

  coordinateTestingWorkflows(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateTestingWorkflows(input, this.config));
  }

  coordinateDeploymentWorkflows(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateDeploymentWorkflows(input, this.config));
  }

  coordinateProductionOperations(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateProductionOperations(input, this.config));
  }

  trackPlatformLifecycle(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackPlatformLifecycle(input, this.config));
  }

  manageLifecycle(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.manageLifecycle(input, this.config));
  }

  coordinateWorkers(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateWorkers(input, this.config));
  }

  coordinateApproval(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.coordinateApproval(input, this.config));
  }

  produceReport(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceEnterprisePlatformFactoryReport(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceEnterprisePlatformFactoryReport(input, this.config));
  }

  submitReport(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: EnterprisePlatformFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: EnterprisePlatformFactoryCoreRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
