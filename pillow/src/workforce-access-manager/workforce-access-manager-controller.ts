import type { WorkforceAccessManagerConfiguration } from "./configuration.js";
import { WorkforceAccessManagerCore } from "./workforce-access-manager-core.js";
import type {
  EngineStatus,
  WorkforceAccessManagerInput,
  WorkforceAccessManagerRunReport,
} from "./types.js";

export class WorkforceAccessManagerController {
  private status: EngineStatus = "idle";
  private latestReport: WorkforceAccessManagerRunReport | null = null;

  constructor(
    private readonly manager: WorkforceAccessManagerCore,
    private readonly config: WorkforceAccessManagerConfiguration,
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
      supportedActions: [...this.config.supportedActions],
      workerDirectory: this.config.workerDirectory.map((w) => ({
        ...w,
        capabilities: [...w.capabilities],
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

  locate(input: WorkforceAccessManagerInput) {
    this.status = "locating";
    return this.finish(this.manager.locate(input, this.config));
  }

  invoke(input: WorkforceAccessManagerInput) {
    this.status = "invoking";
    return this.finish(this.manager.invoke(input, this.config));
  }

  suspend(input: WorkforceAccessManagerInput) {
    this.status = "controlling";
    return this.finish(this.manager.suspend(input, this.config));
  }

  resume(input: WorkforceAccessManagerInput) {
    this.status = "controlling";
    return this.finish(this.manager.resume(input, this.config));
  }

  pause(input: WorkforceAccessManagerInput) {
    this.status = "controlling";
    return this.finish(this.manager.pause(input, this.config));
  }

  continueAccess(input: WorkforceAccessManagerInput) {
    this.status = "controlling";
    return this.finish(this.manager.continueAccess(input, this.config));
  }

  reassign(input: WorkforceAccessManagerInput) {
    this.status = "controlling";
    return this.finish(this.manager.reassign(input, this.config));
  }

  inspect(input: WorkforceAccessManagerInput) {
    this.status = "inspecting";
    return this.finish(this.manager.inspect(input, this.config));
  }

  restart(input: WorkforceAccessManagerInput) {
    this.status = "controlling";
    return this.finish(this.manager.restart(input, this.config));
  }

  stop(input: WorkforceAccessManagerInput) {
    this.status = "controlling";
    return this.finish(this.manager.stop(input, this.config));
  }

  listAccess() {
    this.status = "inspecting";
    return this.finish(this.manager.listAccess(this.config));
  }

  validateAccess(input: WorkforceAccessManagerInput = { executiveRequest: "" }) {
    this.status = "active";
    return this.finish(this.manager.validateAccess(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkforceAccessManagerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
