import type { LocalBusinessFactoryCoreConfiguration } from "./configuration.js";
import type { LocalBusinessFactoryCoreDependencies } from "./integrations.js";
import { LocalBusinessFactoryManager } from "./factory-manager.js";
import type {
  EngineStatus,
  LocalBusinessFactoryCoreInput,
  LocalBusinessFactoryCoreRunReport,
} from "./types.js";

export class LocalBusinessFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: LocalBusinessFactoryCoreRunReport | null = null;

  constructor(
    private readonly manager: LocalBusinessFactoryManager,
    private readonly config: LocalBusinessFactoryCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: LocalBusinessFactoryCoreDependencies = {}) {
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
      businessCategories: [...this.config.businessCategories],
      lifecycleStages: [...this.config.lifecycleStages],
      missionStatuses: [...this.config.missionStatuses],
      approvalStatuses: [...this.config.approvalStatuses],
      launchReadinessStatuses: [...this.config.launchReadinessStatuses],
      customerAcquisitionStatuses: [...this.config.customerAcquisitionStatuses],
      operationalStatuses: [...this.config.operationalStatuses],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedProjects: this.config.seedProjects.map((project) => ({
        ...project,
        assignedWorkers: [...project.assignedWorkers],
        assignedWorkerRoles: [...project.assignedWorkerRoles],
        outstandingIssues: [...project.outstandingIssues],
        preservedDecisions: [...project.preservedDecisions],
        traceabilityRefs: [...project.traceabilityRefs],
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

  registerLocalBusinessProject(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerLocalBusinessProject(input, this.config));
  }

  coordinateLifecycle(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateLifecycle(input, this.config));
  }

  trackProjectProgress(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackProjectProgress(input, this.config));
  }

  coordinateWorkers(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateWorkers(input, this.config));
  }

  assignWorkers(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.assignWorkers(input, this.config));
  }

  coordinateApproval(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.coordinateApproval(input, this.config));
  }

  coordinateLaunchReadiness(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateLaunchReadiness(input, this.config));
  }

  coordinateCustomerAcquisition(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateCustomerAcquisition(input, this.config));
  }

  coordinateFulfilment(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateFulfilment(input, this.config));
  }

  coordinateOngoingOperations(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateOngoingOperations(input, this.config));
  }

  produceReport(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceLocalBusinessFactoryReport(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceLocalBusinessFactoryReport(input, this.config));
  }

  submitReport(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: LocalBusinessFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: LocalBusinessFactoryCoreRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
