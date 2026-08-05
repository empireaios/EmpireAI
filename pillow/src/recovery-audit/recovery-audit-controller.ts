import type { RecoveryAuditConfiguration } from "./configuration.js";
import type { RecoveryAuditDependencies } from "./integrations.js";
import { RecoveryAuditManager } from "./recovery-audit-manager.js";
import type { RecartInput, RecoveryAuditReport, EngineStatus } from "./types.js";

export class RecoveryAuditController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: RecoveryAuditManager,
    private readonly config: RecoveryAuditConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: RecoveryAuditDependencies = {}) {
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

  getLatestReport(): RecoveryAuditReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  discoverRecoveryComponents() {
    this.status = "discovering_recovery_components";
    const result = this.manager.discoverRecoveryComponents(this.config);
    this.status = "active";
    return result;
  }

  verifyFailureDetection() {
    this.status = "verifying_failure_detection";
    const result = this.manager.verifyFailureDetection(this.config);
    this.status = "active";
    return result;
  }

  verifyAutomaticRecovery() {
    this.status = "verifying_automatic_recovery";
    const result = this.manager.verifyAutomaticRecovery(this.config);
    this.status = "active";
    return result;
  }

  verifyManualRecovery() {
    this.status = "verifying_manual_recovery";
    const result = this.manager.verifyManualRecovery(this.config);
    this.status = "active";
    return result;
  }

  verifyRollbackCapability() {
    this.status = "verifying_rollback_capability";
    const result = this.manager.verifyRollbackCapability(this.config);
    this.status = "active";
    return result;
  }

  verifyWorkflowRestart() {
    this.status = "verifying_workflow_restart";
    const result = this.manager.verifyWorkflowRestart(this.config);
    this.status = "active";
    return result;
  }

  verifyCheckpointRestoration() {
    this.status = "verifying_checkpoint_restoration";
    const result = this.manager.verifyCheckpointRestoration(this.config);
    this.status = "active";
    return result;
  }

  verifyRecoveryEscalation() {
    this.status = "verifying_recovery_escalation";
    const result = this.manager.verifyRecoveryEscalation(this.config);
    this.status = "active";
    return result;
  }

  verifyEnterpriseResilience() {
    this.status = "verifying_enterprise_resilience";
    const result = this.manager.verifyEnterpriseResilience(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    return this.manager.verifyIntegrations();
  }

  classifyRecoveryReadiness() {
    this.status = "classifying_recovery_readiness";
    const result = this.manager.classifyRecoveryReadiness(this.config);
    this.status = "active";
    return result;
  }

  produceRecoveryReadinessFindings(input: RecartInput = {}) {
    this.status = "classifying_recovery_readiness";
    const result = this.manager.produceRecoveryReadinessFindings(input, this.config);
    this.status = "active";
    return result;
  }

  async produceReport(input: RecartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: RecartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: RecartInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1108ConsumableContract() {
    return this.manager.getQ1108ConsumableContract();
  }

  getRecoveryMatrix() {
    return this.manager.getRecoveryMatrix();
  }

  getRecoveryHistory(limit = 100) {
    return this.manager.getRecoveryHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
