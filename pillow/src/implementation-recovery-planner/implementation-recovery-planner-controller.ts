import type { ImplementationRecoveryPlannerConfiguration } from "./configuration.js";
import type { ImplementationRecoveryPlannerDependencies } from "./integrations.js";
import { ImplementationRecoveryPlannerManager } from "./implementation-recovery-planner-manager.js";
import type { IrplnInput } from "./types.js";

export class ImplementationRecoveryPlannerController {
  private status: import("./types.js").EngineStatus = "idle";

  constructor(
    private readonly manager: ImplementationRecoveryPlannerManager,
    private readonly config: ImplementationRecoveryPlannerConfiguration,
  ) {}

  initialize() {
    this.status = "standby";
  }

  bindIntegrations(deps: ImplementationRecoveryPlannerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getConfiguration() {
    return this.config;
  }

  getStatus() {
    return this.status;
  }

  getLatestReport() {
    return this.manager.getLatestReport();
  }

  getLatestPlan() {
    return this.manager.getLatestPlan();
  }

  getLatestRecoverySpecification() {
    return this.manager.getLatestRecoverySpecification();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "connected";
    return handshakes;
  }

  detectInterruptedOrIncompleteMission(input: IrplnInput = {}) {
    this.status = "active";
    return this.manager.detectInterruptedOrIncompleteMission(input);
  }

  analyseCurrentRepositoryState(input: IrplnInput = {}) {
    this.status = "analysing";
    const snapshot = this.manager.analyseCurrentRepositoryState(input, this.config);
    this.status = "active";
    return snapshot;
  }

  compareAgainstApprovedSpecification(input: IrplnInput = {}) {
    this.status = "analysing";
    const result = this.manager.compareAgainstApprovedSpecification(input);
    this.status = "active";
    return result;
  }

  detectCompletedWork() {
    return this.manager.detectCompletedWork();
  }

  detectPartialWork() {
    return this.manager.detectPartialWork();
  }

  detectMissingImplementation() {
    return this.manager.detectMissingImplementation();
  }

  detectConflictingImplementation() {
    return this.manager.detectConflictingImplementation();
  }

  generateRecoveryStrategy() {
    this.status = "planning";
    const strategy = this.manager.generateRecoveryStrategy();
    this.status = "active";
    return strategy;
  }

  generateRecoveryPlan(input: IrplnInput = {}) {
    this.status = "planning";
    const plan = this.manager.generateRecoveryPlan(input);
    this.status = plan ? "active" : "blocked";
    return plan;
  }

  generateRecoverySpecification(input: IrplnInput = {}) {
    this.status = "planning";
    const spec = this.manager.generateRecoverySpecification(input);
    this.status = spec ? "active" : "blocked";
    return spec;
  }

  produceRecoveryReport(input: IrplnInput = {}) {
    this.status = "reporting";
    return this.manager.produceRecoveryReport(input, this.config).then((report) => {
      this.status = report.validation.decision === "failed" ? "failed" : "active";
      return report;
    });
  }

  submitReport(input: IrplnInput = {}) {
    return this.manager.submitReport(input, this.config);
  }

  validate(input: IrplnInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = result.decision === "failed" ? "failed" : "active";
    return result;
  }

  runDiagnostics() {
    return this.manager.diagnostics(this.config);
  }

  getQ1306ConsumableContract() {
    return this.manager.getQ1306ConsumableContract();
  }

  list() {
    return this.manager.getReports();
  }

  getRecoveryHistory() {
    return this.manager.getRecoveryHistory();
  }
}
