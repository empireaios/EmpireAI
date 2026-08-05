import type { ExecutiveAcceptancePackConfiguration } from "./configuration.js";
import type { ExecutiveAcceptancePackDependencies } from "./integrations.js";
import { ExecutiveAcceptancePackManager } from "./executive-acceptance-pack-manager.js";
import type { EaprtInput, ExecutiveAcceptancePackReport, EngineStatus } from "./types.js";

export class ExecutiveAcceptancePackController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: ExecutiveAcceptancePackManager,
    private readonly config: ExecutiveAcceptancePackConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ExecutiveAcceptancePackDependencies = {}) {
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

  getLatestReport(): ExecutiveAcceptancePackReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  collectCertificationReports() {
    this.status = "collecting_certifications";
    const result = this.manager.collectCertificationReports(this.config);
    this.status = "active";
    return result;
  }

  collectAuditReports() {
    this.status = "collecting_audits";
    const result = this.manager.collectAuditReports(this.config);
    this.status = "active";
    return result;
  }

  collectProductionReadinessEvidence() {
    this.status = "collecting_readiness_evidence";
    const result = this.manager.collectProductionReadinessEvidence(this.config);
    this.status = "active";
    return result;
  }

  generateExecutiveSummary(input: EaprtInput = {}) {
    this.status = "generating_executive_summary";
    const certificationSummary = this.manager.collectCertificationReports(this.config);
    const auditSummary = this.manager.collectAuditReports(this.config);
    const productionReadinessSummary = this.manager.collectProductionReadinessEvidence(this.config);
    const q1109ContractConsumed = this.manager.attemptQ1109ContractHandshake();
    const result = this.manager.generateExecutiveSummary(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      "withhold",
      q1109ContractConsumed,
    );
    this.status = "active";
    return result;
  }

  generateOutstandingIssueSummary(input: EaprtInput = {}) {
    const certificationSummary = this.manager.collectCertificationReports(this.config);
    const auditSummary = this.manager.collectAuditReports(this.config);
    const productionReadinessSummary = this.manager.collectProductionReadinessEvidence(this.config);
    const q1109ContractConsumed = this.manager.attemptQ1109ContractHandshake();
    return this.manager.generateOutstandingIssueSummary(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    );
  }

  generateDeploymentRecommendation(input: EaprtInput = {}) {
    const issues = this.generateOutstandingIssueSummary(input);
    return this.manager.generateDeploymentRecommendation("withhold", issues);
  }

  classifyProductionReadiness() {
    this.status = "classifying_readiness";
    const certificationSummary = this.manager.collectCertificationReports(this.config);
    const auditSummary = this.manager.collectAuditReports(this.config);
    const productionReadinessSummary = this.manager.collectProductionReadinessEvidence(this.config);
    const q1109ContractConsumed = this.manager.attemptQ1109ContractHandshake();
    const result = this.manager.classifyProductionReadiness(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    );
    this.status = "active";
    return result;
  }

  produceExecutiveChecklist() {
    const certificationSummary = this.manager.collectCertificationReports(this.config);
    const auditSummary = this.manager.collectAuditReports(this.config);
    const productionReadinessSummary = this.manager.collectProductionReadinessEvidence(this.config);
    const q1109ContractConsumed = this.manager.attemptQ1109ContractHandshake();
    return this.manager.produceExecutiveChecklist(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    );
  }

  async produceReport(input: EaprtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async assemblePack(input: EaprtInput = {}) {
    return this.produceReport(input);
  }

  async submitReport(input: EaprtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: EaprtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1110ConsumableContract() {
    return this.manager.getQ1110ConsumableContract();
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
