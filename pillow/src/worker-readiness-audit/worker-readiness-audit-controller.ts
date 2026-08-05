import type { WorkerReadinessAuditConfiguration } from "./configuration.js";
import type { WorkerReadinessAuditDependencies } from "./integrations.js";
import { WorkerReadinessAuditManager } from "./readiness-audit-manager.js";
import type { EngineStatus, WrartInput, WorkerReadinessAuditReport } from "./types.js";

export class WorkerReadinessAuditController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: WorkerReadinessAuditManager,
    private readonly config: WorkerReadinessAuditConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: WorkerReadinessAuditDependencies = {}) {
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

  getLatestReport(): WorkerReadinessAuditReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  async discoverWorkers() {
    this.status = "discovering_workers";
    const result = this.manager.discoverWorkers(this.config);
    this.status = "active";
    return result;
  }

  async verifyRegistration() {
    this.status = "verifying_registration";
    const result = await this.manager.verifyRegistration(this.config);
    this.status = "active";
    return result;
  }

  async verifyReachability() {
    this.status = "verifying_reachability";
    const result = await this.manager.verifyReachability(this.config);
    this.status = "active";
    return result;
  }

  async verifyConfiguration() {
    this.status = "verifying_configuration";
    const result = await this.manager.verifyConfiguration(this.config);
    this.status = "active";
    return result;
  }

  async verifyGovernance() {
    this.status = "verifying_governance";
    const result = await this.manager.verifyGovernance(this.config);
    this.status = "active";
    return result;
  }

  async verifyPermissions() {
    this.status = "verifying_permissions";
    const result = await this.manager.verifyPermissions(this.config);
    this.status = "active";
    return result;
  }

  async verifyRuntimeConnectivity() {
    this.status = "verifying_runtime_connectivity";
    const result = await this.manager.verifyRuntimeConnectivity(this.config);
    this.status = "active";
    return result;
  }

  async verifyOperationalCapability() {
    this.status = "verifying_operational_capability";
    const result = await this.manager.verifyOperationalCapability(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    const result = this.manager.verifyIntegrations();
    return result;
  }

  async classifyReadiness() {
    this.status = "classifying_readiness";
    const result = await this.manager.buildAssessments(this.config);
    this.status = "active";
    return result;
  }

  async produceReadinessFindings(input: WrartInput = {}) {
    this.status = "classifying_readiness";
    const result = await this.manager.produceReadinessFindings(input, this.config);
    this.status = "active";
    return result;
  }

  async produceReport(input: WrartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: WrartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: WrartInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1103ConsumableContract() {
    return this.manager.getQ1103ConsumableContract();
  }

  getReadinessMatrix() {
    return this.manager.getReadinessMatrix();
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
