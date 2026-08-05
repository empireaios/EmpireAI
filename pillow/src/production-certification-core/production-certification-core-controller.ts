import type { ProductionCertificationCoreConfiguration } from "./configuration.js";
import type { ProductionCertificationCoreDependencies } from "./integrations.js";
import { ProductionCertificationCoreManager } from "./certification-manager.js";
import type { EngineStatus, PccrtInput, ProductionCertificationReport } from "./types.js";

export class ProductionCertificationCoreController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: ProductionCertificationCoreManager,
    private readonly config: ProductionCertificationCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ProductionCertificationCoreDependencies = {}) {
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

  getLatestReport(): ProductionCertificationReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  registerProgrammeCatalog() {
    this.status = "registering_programmes";
    const programmes = this.manager.registerProgrammeCatalog();
    this.status = "active";
    return programmes;
  }

  async discoverFactories() {
    this.status = "discovering_factories";
    const result = this.manager.discoverFactories(this.config);
    this.status = "active";
    return result;
  }

  async discoverWorkers() {
    this.status = "discovering_workers";
    const result = this.manager.discoverWorkers(this.config);
    this.status = "active";
    return result;
  }

  async discoverRuntimes() {
    this.status = "discovering_runtimes";
    const result = await this.manager.discoverRuntimes();
    this.status = "active";
    return result;
  }

  async aggregateCertificationEvidence(input: PccrtInput = {}) {
    this.status = "collecting_evidence";
    const result = await this.manager.aggregateCertificationEvidence(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    this.status = "assessing_readiness";
    const result = this.manager.verifyIntegrations();
    this.status = "active";
    return result;
  }

  verifyGovernanceCompliance() {
    this.status = "assessing_readiness";
    const result = this.manager.evaluateGovernance(this.config);
    this.status = "active";
    return result;
  }

  verifyReporting() {
    this.status = "assessing_readiness";
    const result = this.manager.evaluateReporting();
    this.status = "active";
    return result;
  }

  async produceCertificationFindings(input: PccrtInput = {}) {
    this.status = "certifying";
    const result = await this.manager.produceCertificationFindings(input, this.config);
    this.status = "active";
    return result;
  }

  async produceReport(input: PccrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: PccrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: PccrtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1102ConsumableContract() {
    return this.manager.getQ1102ConsumableContract();
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
