import type { CapitalFactoryCertificationConfiguration } from "./configuration.js";
import type { CapitalFactoryCertificationDependencies } from "./integrations.js";
import { CapitalFactoryCertificationManager } from "./certification-manager.js";
import type { EngineStatus, CapcrtInput, CapitalCertificationReport } from "./types.js";

export class CapitalFactoryCertificationController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: CapitalFactoryCertificationManager,
    private readonly config: CapitalFactoryCertificationConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CapitalFactoryCertificationDependencies = {}) {
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

  getLatestReport(): CapitalCertificationReport | null {
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

  async auditQ9Workers(input: CapcrtInput = {}) {
    this.status = "collecting_evidence";
    const matrix = await this.manager.auditQ9Workers(input);
    this.status = "active";
    return matrix;
  }

  async verifyIntegrations() {
    this.status = "verifying_integrations";
    const result = await this.manager.verifyIntegrations();
    this.status = "active";
    return result;
  }

  async runEndToEndWorkflow(input: CapcrtInput = {}) {
    this.status = "verifying_integrations";
    const result = await this.manager.runEndToEndWorkflow(input);
    this.status = "active";
    return result;
  }

  async assessReadiness(input: CapcrtInput = {}) {
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

  async produceCertificationFindings(input: CapcrtInput = {}) {
    this.status = "certifying";
    const result = await this.manager.produceCertificationFindings(input);
    this.status = "active";
    return result;
  }

  async produceReport(input: CapcrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: CapcrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: CapcrtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
