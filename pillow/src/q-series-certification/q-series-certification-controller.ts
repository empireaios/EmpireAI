import type { QSeriesCertificationConfiguration } from "./configuration.js";
import type { QSeriesCertificationDependencies } from "./integrations.js";
import { QSeriesCertificationManager } from "./q-series-certification-manager.js";
import type { EngineStatus, QscrtInput, QSeriesCertificationReport } from "./types.js";

export class QSeriesCertificationController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: QSeriesCertificationManager,
    private readonly config: QSeriesCertificationConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: QSeriesCertificationDependencies = {}) {
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

  getLatestReport(): QSeriesCertificationReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  discoverFactories() {
    this.status = "discovering";
    const result = this.manager.discoverFactories();
    this.status = "active";
    return result;
  }

  verifyWorkers() {
    this.status = "verifying";
    const result = this.manager.verifyWorkers();
    this.status = "active";
    return result;
  }

  verifyRuntimes() {
    this.status = "verifying";
    const result = this.manager.verifyRuntimes();
    this.status = "active";
    return result;
  }

  verifyCrossFactoryOrchestration() {
    this.status = "verifying";
    const result = this.manager.verifyCrossFactoryOrchestration();
    this.status = "active";
    return result;
  }

  verifyGovernanceCompliance() {
    this.status = "verifying";
    const result = this.manager.verifyGovernanceCompliance();
    this.status = "active";
    return result;
  }

  verifyProductionReadiness() {
    this.status = "verifying";
    const result = this.manager.verifyProductionReadiness();
    this.status = "active";
    return result;
  }

  aggregateCertificationEvidence() {
    this.status = "aggregating";
    const result = this.manager.aggregateCertificationEvidence();
    this.status = "active";
    return result;
  }

  classifyQSeriesReadiness(input: QscrtInput = {}) {
    this.status = "classifying";
    const result = this.manager.classifyQSeriesReadiness(input);
    this.status = "active";
    return result;
  }

  async produceQSeriesCertificationReport(input: QscrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceQSeriesCertificationReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : report.certificationDecision === "certify" ? "active" : "standby";
    return report;
  }

  async certifyQSeries(input: QscrtInput = {}) {
    return this.produceQSeriesCertificationReport(input);
  }

  async submitReport(input: QscrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: QscrtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1113ConsumableContract() {
    return this.manager.getQ1113ConsumableContract();
  }

  getCertificationHistory(limit = 100) {
    return this.manager.getCertificationHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
