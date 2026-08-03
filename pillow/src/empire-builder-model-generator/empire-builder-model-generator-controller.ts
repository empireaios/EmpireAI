import type { EmpireBuilderModelGeneratorConfiguration } from "./configuration.js";
import { EmpireBuilderModelGeneratorManager } from "./model-manager.js";
import type {
  EngineStatus,
  EmpireBuilderModelGeneratorInput,
  EmpireBuilderModelGeneratorRunReport,
} from "./types.js";

export class EmpireBuilderModelGeneratorController {
  private status: EngineStatus = "idle";
  private latestReport: EmpireBuilderModelGeneratorRunReport | null = null;

  constructor(
    private readonly manager: EmpireBuilderModelGeneratorManager,
    private readonly config: EmpireBuilderModelGeneratorConfiguration,
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
      businessModelTypes: [...this.config.businessModelTypes],
      seedModels: this.config.seedModels.map((model) => ({
        ...model,
        productsServices: [...model.productsServices],
        customerSegments: [...model.customerSegments],
        requiredCapabilities: [...model.requiredCapabilities],
        requiredIntegrations: [...model.requiredIntegrations],
        businessAssumptions: [...model.businessAssumptions],
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

  receiveIntent(input: EmpireBuilderModelGeneratorInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveIntent(input, this.config));
  }

  generateModel(input: EmpireBuilderModelGeneratorInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateModel(input, this.config));
  }

  produce(input: EmpireBuilderModelGeneratorInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: EmpireBuilderModelGeneratorInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: EmpireBuilderModelGeneratorRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
