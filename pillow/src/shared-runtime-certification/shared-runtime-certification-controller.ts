import type { SharedRuntimeCertificationConfiguration } from "./configuration.js";
import type { SharedRuntimeCertificationDependencies } from "./integrations.js";
import { SharedRuntimeCertificationManager } from "./certification-manager.js";
import type { EngineStatus, SrcrtInput, SharedRuntimeCertificationReport } from "./types.js";

export class SharedRuntimeCertificationController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: SharedRuntimeCertificationManager,
    private readonly config: SharedRuntimeCertificationConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SharedRuntimeCertificationDependencies = {}) {
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

  getLatestReport(): SharedRuntimeCertificationReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  async collectEvidence() {
    this.status = "collecting_evidence";
    const evidence = this.manager.collectEvidence();
    this.status = "active";
    return evidence;
  }

  async probeRuntime() {
    this.status = "probing_runtime";
    const probes = await this.manager.probeWorkers();
    this.status = "active";
    return probes;
  }

  async auditQ10Runtimes(input: SrcrtInput = {}) {
    this.status = "collecting_evidence";
    const matrix = await this.manager.auditQ10Runtimes(input);
    this.status = "active";
    return matrix;
  }

  async verifyIntegrations() {
    this.status = "verifying_integrations";
    const result = await this.manager.verifyIntegrations();
    this.status = "active";
    return result;
  }

  async assessReadiness(input: SrcrtInput = {}) {
    this.status = "assessing_readiness";
    const result = await this.manager.verifyProductionReadiness(input);
    this.status = "active";
    return result;
  }

  verifyGovernanceCompliance() {
    this.status = "assessing_readiness";
    const result = this.manager.verifyGovernanceCompliance();
    this.status = "active";
    return result;
  }

  async verifyMonitoring() {
    this.status = "assessing_readiness";
    const result = await this.manager.verifyMonitoring();
    this.status = "active";
    return result;
  }

  async verifyRecovery() {
    this.status = "assessing_readiness";
    const result = await this.manager.verifyRecovery();
    this.status = "active";
    return result;
  }

  async verifyAuditability() {
    this.status = "assessing_readiness";
    const result = await this.manager.verifyAuditability();
    this.status = "active";
    return result;
  }

  async verifyReporting() {
    this.status = "assessing_readiness";
    const result = await this.manager.verifyReporting();
    this.status = "active";
    return result;
  }

  async produceCertificationFindings(input: SrcrtInput = {}) {
    this.status = "certifying";
    const result = await this.manager.produceCertificationFindings(input);
    this.status = "active";
    return result;
  }

  async produceReport(input: SrcrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: SrcrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: SrcrtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1101ConsumableContract() {
    return this.manager.getQ1101ConsumableContract();
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
