import type { PillowCommandAuditConfiguration } from "./configuration.js";
import type { PillowCommandAuditDependencies } from "./integrations.js";
import { PillowCommandAuditManager } from "./pillow-command-audit-manager.js";
import type { EngineStatus, PcartInput, PillowCommandAuditReport } from "./types.js";

export class PillowCommandAuditController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: PillowCommandAuditManager,
    private readonly config: PillowCommandAuditConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: PillowCommandAuditDependencies = {}) {
    this.manager.bindIntegrations(deps);
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
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedReports: this.config.seedReports.map((report) => ({ ...report })),
    };
  }

  getLatestReport(): PillowCommandAuditReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  discoverWorkers() {
    this.status = "discovering_workers";
    const result = this.manager.discoverWorkers(this.config);
    this.status = "active";
    return result;
  }

  verifyAssignment() {
    this.status = "verifying_assignment";
    const result = this.manager.verifyAssignment(this.config);
    this.status = "active";
    return result;
  }

  verifyCommandDispatch() {
    this.status = "verifying_command_dispatch";
    const result = this.manager.verifyCommandDispatch(this.config);
    this.status = "active";
    return result;
  }

  verifyCommunication() {
    this.status = "verifying_communication";
    const result = this.manager.verifyCommunication(this.config);
    this.status = "active";
    return result;
  }

  verifySupervision() {
    this.status = "verifying_supervision";
    const result = this.manager.verifySupervision(this.config);
    this.status = "active";
    return result;
  }

  verifyGovernance() {
    this.status = "verifying_governance";
    const result = this.manager.verifyGovernance(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    return this.manager.verifyIntegrations();
  }

  classifyCommandReadiness() {
    this.status = "classifying_command_readiness";
    const result = this.manager.buildAssessments(this.config);
    this.status = "active";
    return result;
  }

  produceCommandReadinessFindings(input: PcartInput = {}) {
    this.status = "classifying_command_readiness";
    const result = this.manager.produceCommandReadinessFindings(input, this.config);
    this.status = "active";
    return result;
  }

  produceReport(input: PcartInput = {}) {
    this.status = "reporting";
    const report = this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  submitReport(input: PcartInput = {}) {
    this.status = "reporting";
    const report = this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: PcartInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1104ConsumableContract() {
    return this.manager.getQ1104ConsumableContract();
  }

  getCommandMatrix() {
    return this.manager.getCommandMatrix();
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
