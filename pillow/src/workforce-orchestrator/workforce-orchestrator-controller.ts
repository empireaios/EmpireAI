import type { WorkforceOrchestratorConfiguration } from "./configuration.js";
import { WorkforceOrchestratorManager } from "./workforce-orchestrator-manager.js";
import type {
  EngineStatus,
  WorkforceOrchestratorInput,
  WorkforceOrchestratorRunReport,
} from "./types.js";

export class WorkforceOrchestratorController {
  private status: EngineStatus = "idle";
  private latestReport: WorkforceOrchestratorRunReport | null = null;

  constructor(
    private readonly manager: WorkforceOrchestratorManager,
    private readonly config: WorkforceOrchestratorConfiguration,
  ) {}

  initialize() {
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
      registeredWorkers: this.config.registeredWorkers.map((w) => ({
        ...w,
        capabilities: [...w.capabilities],
      })),
      workerStates: [...this.config.workerStates],
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveIntent(input: WorkforceOrchestratorInput) {
    this.status = "discovering";
    return this.finish(this.manager.receiveIntent(input, this.config));
  }

  discoverWorkers(input: WorkforceOrchestratorInput) {
    this.status = "discovering";
    return this.finish(this.manager.discoverWorkers(input, this.config));
  }

  selectWorkers(input: WorkforceOrchestratorInput) {
    this.status = "selecting";
    return this.finish(this.manager.selectWorkers(input, this.config));
  }

  buildGroups(input: WorkforceOrchestratorInput) {
    this.status = "selecting";
    return this.finish(this.manager.buildGroups(input, this.config));
  }

  coordinate(input: WorkforceOrchestratorInput) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinate(input, this.config));
  }

  monitor(input: WorkforceOrchestratorInput) {
    this.status = "monitoring";
    return this.finish(this.manager.monitor(input, this.config));
  }

  handleFailure(input: WorkforceOrchestratorInput) {
    this.status = "monitoring";
    return this.finish(this.manager.handleFailure(input, this.config));
  }

  handleTimeout(input: WorkforceOrchestratorInput) {
    this.status = "monitoring";
    return this.finish(this.manager.handleTimeout(input, this.config));
  }

  handleEscalation(input: WorkforceOrchestratorInput) {
    this.status = "monitoring";
    return this.finish(this.manager.handleEscalation(input, this.config));
  }

  produceRecord(input: WorkforceOrchestratorInput) {
    this.status = "coordinating";
    return this.finish(this.manager.produceRecord(input, this.config));
  }

  validateOrchestrations(input: WorkforceOrchestratorInput = { executiveRequest: "" }) {
    this.status = "active";
    return this.finish(this.manager.validateOrchestrations(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkforceOrchestratorRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
