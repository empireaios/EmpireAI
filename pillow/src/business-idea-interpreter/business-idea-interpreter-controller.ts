import type { BusinessIdeaInterpreterConfiguration } from "./configuration.js";
import { BusinessIdeaInterpreterManager } from "./interpreter-manager.js";
import type {
  BusinessIdeaInterpreterInput,
  BusinessIdeaInterpreterRunReport,
  EngineStatus,
} from "./types.js";

export class BusinessIdeaInterpreterController {
  private status: EngineStatus = "idle";
  private latestReport: BusinessIdeaInterpreterRunReport | null = null;

  constructor(
    private readonly manager: BusinessIdeaInterpreterManager,
    private readonly config: BusinessIdeaInterpreterConfiguration,
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
      missingInformationFields: [...this.config.missingInformationFields],
      seedIntents: this.config.seedIntents.map((intent) => ({
        ...intent,
        constraints: [...intent.constraints],
        missingInformation: [...intent.missingInformation],
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

  acceptCommand(input: BusinessIdeaInterpreterInput = {}) {
    this.status = "accepting";
    return this.finish(this.manager.acceptCommand(input, this.config));
  }

  interpret(input: BusinessIdeaInterpreterInput = {}) {
    this.status = "interpreting";
    return this.finish(this.manager.interpret(input, this.config));
  }

  produce(input: BusinessIdeaInterpreterInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: BusinessIdeaInterpreterInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: BusinessIdeaInterpreterRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
