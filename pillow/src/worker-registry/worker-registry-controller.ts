import type { WorkerRegistryConfiguration } from "./configuration.js";
import { WorkerRegistryCore } from "./worker-registry-core.js";
import type {
  EngineStatus,
  WorkerRegistryInput,
  WorkerRegistryRunReport,
} from "./types.js";

export class WorkerRegistryController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerRegistryRunReport | null = null;

  constructor(
    private readonly manager: WorkerRegistryCore,
    private readonly config: WorkerRegistryConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
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
      workerStates: [...this.config.workerStates],
      registryRules: [...this.config.registryRules],
      seedWorkers: this.config.seedWorkers.map((w) => ({
        ...w,
        reportingLine: [...w.reportingLine],
        skillProfile: [...w.skillProfile],
        approvedTools: [...w.approvedTools],
        versionHistory: w.versionHistory.map((v) => ({ ...v })),
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

  registerWorker(input: WorkerRegistryInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  getWorker(input: WorkerRegistryInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.getWorker(input, this.config));
  }

  queryByDepartment(input: WorkerRegistryInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.queryByDepartment(input, this.config));
  }

  queryByRole(input: WorkerRegistryInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.queryByRole(input, this.config));
  }

  queryByFactory(input: WorkerRegistryInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.queryByFactory(input, this.config));
  }

  validateReportingLine(input: WorkerRegistryInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateReportingLine(input, this.config));
  }

  updateStatus(input: WorkerRegistryInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.updateStatus(input, this.config));
  }

  produceRegistry(input: WorkerRegistryInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produceRegistry(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerRegistryInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerRegistryRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
