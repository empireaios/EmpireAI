import type { AffiliateCertificationConfiguration } from "./configuration.js";
import type { AffiliateCertificationDependencies } from "./integrations.js";
import { AffiliateCertificationManager } from "./certification-manager.js";
import type { EngineStatus, AfcrtInput, AffiliateCertificationReport } from "./types.js";

export class AffiliateCertificationController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: AffiliateCertificationManager,
    private readonly config: AffiliateCertificationConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: AffiliateCertificationDependencies = {}) {
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

  getLatestReport(): AffiliateCertificationReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  async auditQ8Workers(input: AfcrtInput = {}) {
    this.status = "collecting_evidence";
    const matrix = await this.manager.auditQ8Workers(input);
    this.status = "active";
    return matrix;
  }

  verifyMissions(input: AfcrtInput = {}) {
    return this.auditQ8Workers(input);
  }

  async verifyDeliverables(input: AfcrtInput = {}) {
    this.status = "collecting_evidence";
    const result = await this.manager.verifyDeliverables(input);
    this.status = "active";
    return result;
  }

  async verifyIntegrations() {
    this.status = "verifying_integrations";
    const result = await this.manager.verifyIntegrations();
    this.status = "active";
    return result;
  }

  async verifyWorkflowCompleteness(input: AfcrtInput = {}) {
    this.status = "verifying_integrations";
    const result = await this.manager.verifyWorkflowCompleteness(input);
    this.status = "active";
    return result;
  }

  async verifyProductionReadiness(input: AfcrtInput = {}) {
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

  async verifyReportingCapability() {
    this.status = "assessing_readiness";
    const result = await this.manager.verifyReportingCapability();
    this.status = "active";
    return result;
  }

  async verifyOperationalReadiness() {
    this.status = "probing_runtime";
    const result = await this.manager.verifyOperationalReadiness();
    this.status = "active";
    return result;
  }

  async produceCertificationFindings(input: AfcrtInput = {}) {
    this.status = "certifying";
    const result = await this.manager.produceCertificationFindings(input);
    this.status = "active";
    return result;
  }

  async produceReport(input: AfcrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: AfcrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: AfcrtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
