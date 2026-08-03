import type { WorkforceOperatingSystemConfiguration } from "./configuration.js";
import { WorkforceOperatingSystemCore } from "./workforce-operating-system-core.js";
import type {
  EngineStatus,
  WorkforceOperatingSystemInput,
  WorkforceOperatingSystemRunReport,
} from "./types.js";

export class WorkforceOperatingSystemController {
  private status: EngineStatus = "idle";
  private latestReport: WorkforceOperatingSystemRunReport | null = null;

  constructor(
    private readonly manager: WorkforceOperatingSystemCore,
    private readonly config: WorkforceOperatingSystemConfiguration,
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
      services: [...this.config.services],
      seedDepartments: this.config.seedDepartments.map((d) => ({ ...d })),
      seedFactories: this.config.seedFactories.map((f) => ({ ...f })),
      seedWorkers: this.config.seedWorkers.map((w) => ({ ...w })),
      seedMissions: this.config.seedMissions.map((m) => ({ ...m })),
      seedRecords: this.config.seedRecords.map((r) => ({
        ...r,
        activeDepartments: [...r.activeDepartments],
        activeFactories: [...r.activeFactories],
        activeWorkers: [...r.activeWorkers],
        activeMissions: [...r.activeMissions],
        runtimeEvents: r.runtimeEvents.map((e) => ({ ...e })),
        openSessions: [...r.openSessions],
        servicesInvoked: [...r.servicesInvoked],
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

  startRuntime(input: WorkforceOperatingSystemInput = {}) {
    this.status = "starting";
    return this.finish(this.manager.startRuntime(input, this.config));
  }

  registerDepartment(input: WorkforceOperatingSystemInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerDepartment(input, this.config));
  }

  registerFactory(input: WorkforceOperatingSystemInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerFactory(input, this.config));
  }

  registerWorker(input: WorkforceOperatingSystemInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  manageSession(input: WorkforceOperatingSystemInput = {}) {
    this.status = "active";
    return this.finish(this.manager.manageSession(input, this.config));
  }

  coordinateCommunication(input: WorkforceOperatingSystemInput = {}) {
    this.status = "active";
    return this.finish(this.manager.coordinateCommunication(input, this.config));
  }

  discoverWorkers(input: WorkforceOperatingSystemInput = {}) {
    this.status = "active";
    return this.finish(this.manager.discoverWorkers(input, this.config));
  }

  synchronizeState(input: WorkforceOperatingSystemInput = {}) {
    this.status = "synchronizing";
    return this.finish(this.manager.synchronizeState(input, this.config));
  }

  monitorHealth(input: WorkforceOperatingSystemInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorHealth(input, this.config));
  }

  recoverRuntime(input: WorkforceOperatingSystemInput = {}) {
    this.status = "recovering";
    return this.finish(this.manager.recoverRuntime(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkforceOperatingSystemInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkforceOperatingSystemRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
