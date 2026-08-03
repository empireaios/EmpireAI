import type { CapitalFactoryCoreConfiguration } from "./configuration.js";
import type { CapitalFactoryCoreDependencies } from "./integrations.js";
import { CapitalFactoryManager } from "./factory-manager.js";
import type { CapfcInput, CapitalFactoryCoreRunReport, EngineStatus } from "./types.js";

export class CapitalFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: CapitalFactoryCoreRunReport | null = null;

  constructor(
    private readonly manager: CapitalFactoryManager,
    private readonly config: CapitalFactoryCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CapitalFactoryCoreDependencies = {}) {
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
      capitalCategories: [...this.config.capitalCategories],
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

  registerCapitalProject(input: CapfcInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerCapitalProject(input, this.config));
  }

  coordinateLifecycle(input: CapfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateLifecycle(input, this.config));
  }

  trackProjectStatus(input: CapfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackProjectStatus(input, this.config));
  }

  trackProjectProgress(input: CapfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackProjectProgress(input, this.config));
  }

  coordinateWorkers(input: CapfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateWorkers(input, this.config));
  }

  assignWorkers(input: CapfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.assignWorkers(input, this.config));
  }

  manageWorkerDependencies(input: CapfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.manageWorkerDependencies(input, this.config));
  }

  maintainBusinessMetadata(input: CapfcInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.maintainBusinessMetadata(input, this.config));
  }

  monitorFactoryReadiness() {
    this.status = "validating";
    return this.finish(this.manager.monitorFactoryReadiness(this.config));
  }

  produceExecutiveSummary(input: CapfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceExecutiveSummary(input, this.config));
  }

  produceReport(input: CapfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceCapitalFactoryReport(input: CapfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceCapitalFactoryReport(input, this.config));
  }

  submitReport(input: CapfcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CapfcInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getQ902ConsumableContract() {
    return this.manager.getQ902ConsumableContract(this.config);
  }

  private finish(report: CapitalFactoryCoreRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
