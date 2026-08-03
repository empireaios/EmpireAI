import type { AffiliateFactoryCoreConfiguration } from "./configuration.js";
import type { AffiliateFactoryCoreDependencies } from "./integrations.js";
import { AffiliateFactoryManager } from "./factory-manager.js";
import type { AfcInput, AffiliateFactoryCoreRunReport, EngineStatus } from "./types.js";

export class AffiliateFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: AffiliateFactoryCoreRunReport | null = null;

  constructor(
    private readonly manager: AffiliateFactoryManager,
    private readonly config: AffiliateFactoryCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: AffiliateFactoryCoreDependencies = {}) {
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
      affiliateNiches: [...this.config.affiliateNiches],
      lifecycleStatuses: [...this.config.lifecycleStatuses],
      projectStatuses: [...this.config.projectStatuses],
      workerRoles: [...this.config.workerRoles],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedProjects: this.config.seedProjects.map((project) => ({
        ...project,
        workerStatusMatrix: project.workerStatusMatrix.map((e) => ({ ...e })),
        dependencyGraph: project.dependencyGraph.map((e) => ({ ...e })),
        outstandingTasks: [...project.outstandingTasks],
        risks: [...project.risks],
        metadata: { ...project.metadata },
        traceabilityRefs: [...project.traceabilityRefs],
        progressSummary: { ...project.progressSummary },
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

  registerAffiliateBusinessProject(input: AfcInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerAffiliateBusinessProject(input, this.config));
  }

  coordinateLifecycle(input: AfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateLifecycle(input, this.config));
  }

  trackProjectStatus(input: AfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackProjectStatus(input, this.config));
  }

  trackProjectProgress(input: AfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackProjectProgress(input, this.config));
  }

  coordinateWorkers(input: AfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateWorkers(input, this.config));
  }

  assignWorkers(input: AfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.assignWorkers(input, this.config));
  }

  manageWorkerDependencies(input: AfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.manageWorkerDependencies(input, this.config));
  }

  maintainBusinessMetadata(input: AfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.maintainBusinessMetadata(input, this.config));
  }

  monitorFactoryReadiness() {
    this.status = "validating";
    return this.finish(this.manager.monitorFactoryReadiness(this.config));
  }

  produceExecutiveSummary(input: AfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceExecutiveSummary(input, this.config));
  }

  produceReport(input: AfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceAffiliateFactoryReport(input: AfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceAffiliateFactoryReport(input, this.config));
  }

  submitReport(input: AfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: AfcInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getQ802ConsumableContract() {
    return this.manager.getQ802ConsumableContract(this.config);
  }

  private finish(report: AffiliateFactoryCoreRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
