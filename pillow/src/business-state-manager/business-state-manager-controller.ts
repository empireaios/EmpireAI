import type { BusinessStateManagerConfiguration } from "./configuration.js";
import { BusinessStateManagerCore } from "./business-state-manager-core.js";
import type {
  EngineStatus,
  QueryBusinessStateInput,
  RegisterBusinessInput,
  BusinessStateManagerRunReport,
  UpdateBusinessStateInput,
} from "./types.js";

export class BusinessStateManagerController {
  private status: EngineStatus = "idle";
  private latestReport: BusinessStateManagerRunReport | null = null;

  constructor(
    private readonly manager: BusinessStateManagerCore,
    private readonly config: BusinessStateManagerConfiguration,
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
    return { ...this.config };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  registerBusiness(input: RegisterBusinessInput) {
    this.status = "updating";
    return this.finish(this.manager.registerBusiness(input, this.config));
  }

  updateBusinessState(input: UpdateBusinessStateInput) {
    this.status = "updating";
    return this.finish(this.manager.updateBusinessState(input, this.config));
  }

  updateHealth(input: UpdateBusinessStateInput) {
    this.status = "updating";
    return this.finish(this.manager.updateHealth(input, this.config));
  }

  updateProgress(input: UpdateBusinessStateInput) {
    this.status = "updating";
    return this.finish(this.manager.updateProgress(input, this.config));
  }

  queryBusinessState(input: QueryBusinessStateInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.queryBusinessState(input, this.config));
  }

  listBusinesses() {
    this.status = "querying";
    return this.finish(this.manager.listBusinesses(this.config));
  }

  validateConsistency() {
    this.status = "active";
    return this.finish(this.manager.validateConsistency(this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: BusinessStateManagerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
