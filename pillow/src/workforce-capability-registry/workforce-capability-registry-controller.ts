import type { WorkforceCapabilityRegistryConfiguration } from "./configuration.js";
import { WorkforceCapabilityRegistryManager } from "./workforce-capability-registry-manager.js";
import type {
  EngineStatus,
  LookupInput,
  RegisterCatalogInput,
  RegisterWorkerInput,
  UpdateWorkerStatusInput,
  WorkforceCapabilityRegistryInput,
  WorkforceCapabilityRegistryRunReport,
} from "./types.js";

export class WorkforceCapabilityRegistryController {
  private status: EngineStatus = "idle";
  private latestReport: WorkforceCapabilityRegistryRunReport | null = null;

  constructor(
    private readonly manager: WorkforceCapabilityRegistryManager,
    private readonly config: WorkforceCapabilityRegistryConfiguration,
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
      seedWorkers: this.config.seedWorkers.map((w) => ({
        ...w,
        capabilityList: [...(w.capabilityList ?? [])],
        skillList: [...(w.skillList ?? [])],
        approvedTools: [...(w.approvedTools ?? [])],
        dependencies: [...(w.dependencies ?? [])],
      })),
      seedDepartments: this.config.seedDepartments.map((d) => ({ ...d })),
      seedCapabilities: this.config.seedCapabilities.map((c) => ({ ...c })),
      seedTools: this.config.seedTools.map((t) => ({ ...t })),
      seedSkills: this.config.seedSkills.map((s) => ({ ...s })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  registerWorker(input: RegisterWorkerInput) {
    this.status = "registering";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  registerDepartment(input: RegisterCatalogInput) {
    this.status = "registering";
    return this.finish(this.manager.registerDepartment(input, this.config));
  }

  registerCapability(input: RegisterCatalogInput) {
    this.status = "registering";
    return this.finish(this.manager.registerCapability(input, this.config));
  }

  registerTool(input: RegisterCatalogInput) {
    this.status = "registering";
    return this.finish(this.manager.registerTool(input, this.config));
  }

  registerSkill(input: RegisterCatalogInput) {
    this.status = "registering";
    return this.finish(this.manager.registerSkill(input, this.config));
  }

  updateStatus(input: UpdateWorkerStatusInput) {
    this.status = "updating";
    return this.finish(this.manager.updateStatus(input, this.config));
  }

  lookup(input: LookupInput) {
    this.status = "querying";
    return this.finish(this.manager.lookup(input, this.config));
  }

  listRecords() {
    this.status = "querying";
    return this.finish(this.manager.listRecords(this.config));
  }

  validateRegistry(input: WorkforceCapabilityRegistryInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validateRegistry(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkforceCapabilityRegistryRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
