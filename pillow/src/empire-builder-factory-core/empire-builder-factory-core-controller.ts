import type { EmpireBuilderFactoryCoreConfiguration } from "./configuration.js";
import { EmpireBuilderFactoryManager } from "./factory-manager.js";
import type {
  EngineStatus,
  EmpireBuilderFactoryInput,
  EmpireBuilderFactoryRunReport,
} from "./types.js";

export class EmpireBuilderFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: EmpireBuilderFactoryRunReport | null = null;

  constructor(
    private readonly manager: EmpireBuilderFactoryManager,
    private readonly config: EmpireBuilderFactoryCoreConfiguration,
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
      businessTypes: [...this.config.businessTypes],
      missionStatuses: [...this.config.missionStatuses],
      approvalStatuses: [...this.config.approvalStatuses],
      requiredNextSteps: [...this.config.requiredNextSteps],
      seedMissions: this.config.seedMissions.map((m) => ({ ...m })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  acceptCommand(input: EmpireBuilderFactoryInput = {}) {
    this.status = "accepting";
    return this.finish(this.manager.acceptCommand(input, this.config));
  }

  createMission(input: EmpireBuilderFactoryInput = {}) {
    this.status = "creating";
    return this.finish(this.manager.createMission(input, this.config));
  }

  classifyBusinessType(input: EmpireBuilderFactoryInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.classifyBusinessType(input, this.config));
  }

  prepareMission(input: EmpireBuilderFactoryInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.prepareMission(input, this.config));
  }

  produce(input: EmpireBuilderFactoryInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: EmpireBuilderFactoryInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: EmpireBuilderFactoryRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
