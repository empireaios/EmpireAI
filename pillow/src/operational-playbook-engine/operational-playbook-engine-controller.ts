import type { OperationalPlaybookEngineConfiguration } from "./configuration.js";
import { OperationalPlaybookEngineCore } from "./operational-playbook-engine-core.js";
import type {
  EngineStatus,
  OperationalPlaybookEngineInput,
  OperationalPlaybookEngineRunReport,
} from "./types.js";

export class OperationalPlaybookEngineController {
  private status: EngineStatus = "idle";
  private latestReport: OperationalPlaybookEngineRunReport | null = null;

  constructor(
    private readonly manager: OperationalPlaybookEngineCore,
    private readonly config: OperationalPlaybookEngineConfiguration,
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
      supportedCategories: [...this.config.supportedCategories],
      seedPlaybooks: this.config.seedPlaybooks.map((p) => ({
        ...p,
        preconditions: [...p.preconditions],
        executionSteps: p.executionSteps.map((s) => ({ ...s })),
        requiredCapabilities: [...p.requiredCapabilities],
        requiredTools: [...p.requiredTools],
        approvalRequirements: [...p.approvalRequirements],
        successCriteria: [...p.successCriteria],
        failureCriteria: [...p.failureCriteria],
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

  register(input: OperationalPlaybookEngineInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.register(input, this.config));
  }

  retrieve(input: OperationalPlaybookEngineInput = {}) {
    this.status = "active";
    return this.finish(this.manager.retrieve(input, this.config));
  }

  validatePlaybook(input: OperationalPlaybookEngineInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validatePlaybook(input, this.config));
  }

  select(input: OperationalPlaybookEngineInput = {}) {
    this.status = "selecting";
    return this.finish(this.manager.select(input, this.config));
  }

  interpret(input: OperationalPlaybookEngineInput = {}) {
    this.status = "interpreting";
    return this.finish(this.manager.interpret(input, this.config));
  }

  prepareWorkflow(input: OperationalPlaybookEngineInput = {}) {
    this.status = "interpreting";
    return this.finish(this.manager.prepareWorkflow(input, this.config));
  }

  trackProgress(input: OperationalPlaybookEngineInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackProgress(input, this.config));
  }

  listPlaybooks() {
    this.status = "active";
    return this.finish(this.manager.listPlaybooks(this.config));
  }

  listExecutions() {
    this.status = "active";
    return this.finish(this.manager.listExecutions(this.config));
  }

  validateEngine(input: OperationalPlaybookEngineInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validateEngine(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: OperationalPlaybookEngineRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
