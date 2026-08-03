import type { ResponsibilityMatrixConfiguration } from "./configuration.js";
import { ResponsibilityMatrixCore } from "./responsibility-matrix-core.js";
import type {
  EngineStatus,
  ResponsibilityMatrixInput,
  ResponsibilityMatrixRunReport,
} from "./types.js";

export class ResponsibilityMatrixController {
  private status: EngineStatus = "idle";
  private latestReport: ResponsibilityMatrixRunReport | null = null;

  constructor(
    private readonly manager: ResponsibilityMatrixCore,
    private readonly config: ResponsibilityMatrixConfiguration,
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
      responsibilityRules: [...this.config.responsibilityRules],
      seedResponsibilities: this.config.seedResponsibilities.map((r) => ({
        ...r,
        supportingWorkers: [...r.supportingWorkers],
        requiredInputs: [...r.requiredInputs],
        expectedOutputs: [...r.expectedOutputs],
        dependencies: [...r.dependencies],
        requiredApprovals: [...r.requiredApprovals],
        successCriteria: [...r.successCriteria],
        failureConditions: [...r.failureConditions],
        escalationPath: [...r.escalationPath],
        qualityRequirements: [...r.qualityRequirements],
        completionCriteria: [...r.completionCriteria],
      })),
      seedBindings: this.config.seedBindings.map((b) => ({
        ...b,
        responsibilityIds: [...b.responsibilityIds],
        ownerMap: { ...b.ownerMap },
        rulesApplied: [...b.rulesApplied],
        rulesSatisfied: [...b.rulesSatisfied],
        rulesFailed: [...b.rulesFailed],
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

  defineMatrix(input: ResponsibilityMatrixInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.defineMatrix(input, this.config));
  }

  registerResponsibility(input: ResponsibilityMatrixInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerResponsibility(input, this.config));
  }

  deriveOwnership(input: ResponsibilityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.deriveOwnership(input, this.config));
  }

  validateOwnership(input: ResponsibilityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateOwnership(input, this.config));
  }

  validateInputsOutputs(input: ResponsibilityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateInputsOutputs(input, this.config));
  }

  validateDependencies(input: ResponsibilityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateDependencies(input, this.config));
  }

  validateApprovals(input: ResponsibilityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateApprovals(input, this.config));
  }

  produceMatrix(input: ResponsibilityMatrixInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.produceMatrix(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ResponsibilityMatrixInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ResponsibilityMatrixRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
