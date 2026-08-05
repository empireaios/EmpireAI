import type { QSeriesCompletionConfiguration } from "./configuration.js";
import type { QSeriesCompletionDependencies } from "./integrations.js";
import { QSeriesCompletionManager } from "./q-series-completion-manager.js";
import type { EngineStatus, QscptInput, QSeriesCompletionReport } from "./types.js";

export class QSeriesCompletionController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: QSeriesCompletionManager,
    private readonly config: QSeriesCompletionConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: QSeriesCompletionDependencies = {}) {
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

  getLatestReport(): QSeriesCompletionReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  verifyMissionCompletion() {
    this.status = "verifying";
    const result = this.manager.verifyMissionCompletion();
    this.status = "active";
    return result;
  }

  verifyWorkforceCapabilities() {
    this.status = "verifying";
    const result = this.manager.verifyWorkforceCapabilities();
    this.status = "active";
    return result;
  }

  verifyRuntimeIntegration() {
    this.status = "verifying";
    const result = this.manager.verifyRuntimeIntegration();
    this.status = "active";
    return result;
  }

  verifyGovernanceCompliance() {
    this.status = "verifying";
    const result = this.manager.verifyGovernanceCompliance();
    this.status = "active";
    return result;
  }

  verifyCertificationCompletion() {
    this.status = "verifying";
    const result = this.manager.verifyCertificationCompletion();
    this.status = "active";
    return result;
  }

  verifyProductionReadiness() {
    this.status = "verifying";
    const result = this.manager.verifyProductionReadiness();
    this.status = "active";
    return result;
  }

  aggregateFinalCompletionEvidence() {
    this.status = "aggregating";
    const result = this.manager.aggregateFinalCompletionEvidence();
    this.status = "active";
    return result;
  }

  produceFinalCompletionDecision(input: QscptInput = {}) {
    this.status = "deciding";
    const result = this.manager.produceFinalCompletionDecision(input);
    this.status = "active";
    return result;
  }

  async produceQSeriesCompletionReport(input: QscptInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceQSeriesCompletionReport(input, this.config);
    this.status =
      report.validation.decision === "fail"
        ? "failed"
        : report.finalCompletionDecision === "complete"
          ? "active"
          : "standby";
    return report;
  }

  async completeQSeries(input: QscptInput = {}) {
    return this.produceQSeriesCompletionReport(input);
  }

  async submitReport(input: QscptInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: QscptInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1201ConsumableContract() {
    return this.manager.getQ1201ConsumableContract();
  }

  getCompletionHistory(limit = 100) {
    return this.manager.getCompletionHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
