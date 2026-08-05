import type { GrandKingAcceptanceGateConfiguration } from "./configuration.js";
import type { GrandKingAcceptanceGateDependencies } from "./integrations.js";
import { GrandKingAcceptanceGateManager } from "./grand-king-acceptance-gate-manager.js";
import type { GkagtInput, GrandKingAcceptanceReport, EngineStatus } from "./types.js";

export class GrandKingAcceptanceGateController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: GrandKingAcceptanceGateManager,
    private readonly config: GrandKingAcceptanceGateConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: GrandKingAcceptanceGateDependencies = {}) {
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

  getLatestReport(): GrandKingAcceptanceReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  collectExecutiveAcceptancePack() {
    this.status = "collecting_pack";
    const result = this.manager.collectExecutiveAcceptancePack();
    this.status = "active";
    return result;
  }

  verifyPrerequisiteCertifications() {
    this.status = "verifying_prerequisites";
    const result = this.manager.verifyPrerequisiteCertifications();
    this.status = "active";
    return result;
  }

  presentProductionReadiness() {
    this.status = "presenting_readiness";
    const result = this.manager.presentProductionReadiness();
    this.status = "awaiting_decision";
    return result;
  }

  recordGrandKingDecision(input: GkagtInput = {}) {
    this.status = "recording_decision";
    const result = this.manager.recordGrandKingDecision(input, this.config);
    this.status = result.validation.decision === "fail" ? "failed" : "active";
    return result;
  }

  preventDeploymentWithoutApproval() {
    return this.manager.preventDeploymentWithoutApproval();
  }

  getDeploymentAuthorisationStatus() {
    return this.manager.getDeploymentAuthorisationStatus();
  }

  generateDeploymentAuthorisation(input: GkagtInput = {}) {
    this.status = "generating_authorisation";
    const result = this.manager.generateDeploymentAuthorisation(input, this.config);
    this.status = "active";
    return result;
  }

  requestReReview(input: GkagtInput = {}) {
    return this.manager.requestReReview(input);
  }

  async produceGrandKingAcceptanceReport(input: GkagtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceGrandKingAcceptanceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async auditAcceptance(input: GkagtInput = {}) {
    return this.produceGrandKingAcceptanceReport(input);
  }

  async submitReport(input: GkagtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: GkagtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1111ConsumableContract() {
    return this.manager.getQ1111ConsumableContract();
  }

  getQ1201ConsumableContract() {
    return this.manager.getQ1201ConsumableContract();
  }

  getApprovalHistory(limit = 100) {
    return this.manager.getApprovalHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
