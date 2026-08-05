import type { FinancialReadinessAuditConfiguration } from "./configuration.js";
import type { FinancialReadinessAuditDependencies } from "./integrations.js";
import { FinancialReadinessAuditManager } from "./financial-readiness-audit-manager.js";
import type { FinartInput, FinancialReadinessAuditReport, EngineStatus } from "./types.js";

export class FinancialReadinessAuditController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: FinancialReadinessAuditManager,
    private readonly config: FinancialReadinessAuditConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: FinancialReadinessAuditDependencies = {}) {
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

  getLatestReport(): FinancialReadinessAuditReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  discoverFinancialComponents() {
    this.status = "discovering_financial_components";
    const result = this.manager.discoverFinancialComponents(this.config);
    this.status = "active";
    return result;
  }

  verifyPaymentWorkflows() {
    this.status = "verifying_payment_workflows";
    const result = this.manager.verifyPaymentWorkflows(this.config);
    this.status = "active";
    return result;
  }

  verifyRevenueRecording() {
    this.status = "verifying_revenue_recording";
    const result = this.manager.verifyRevenueRecording(this.config);
    this.status = "active";
    return result;
  }

  verifyExpenseTracking() {
    this.status = "verifying_expense_tracking";
    const result = this.manager.verifyExpenseTracking(this.config);
    this.status = "active";
    return result;
  }

  verifyAccountingRecords() {
    this.status = "verifying_accounting_records";
    const result = this.manager.verifyAccountingRecords(this.config);
    this.status = "active";
    return result;
  }

  verifyFinancialReporting() {
    this.status = "verifying_financial_reporting";
    const result = this.manager.verifyFinancialReporting(this.config);
    this.status = "active";
    return result;
  }

  verifyCostControls() {
    this.status = "verifying_cost_controls";
    const result = this.manager.verifyCostControls(this.config);
    this.status = "active";
    return result;
  }

  verifyFinancialGovernance() {
    this.status = "verifying_financial_governance";
    const result = this.manager.verifyFinancialGovernance(this.config);
    this.status = "active";
    return result;
  }

  verifyAuditTraceability() {
    this.status = "verifying_audit_traceability";
    const result = this.manager.verifyAuditTraceability(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    return this.manager.verifyIntegrations();
  }

  classifyFinancialReadiness() {
    this.status = "classifying_financial_readiness";
    const result = this.manager.classifyFinancialReadiness(this.config);
    this.status = "active";
    return result;
  }

  produceFinancialReadinessFindings(input: FinartInput = {}) {
    this.status = "classifying_financial_readiness";
    const result = this.manager.produceFinancialReadinessFindings(input, this.config);
    this.status = "active";
    return result;
  }

  async produceReport(input: FinartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: FinartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: FinartInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1109ConsumableContract() {
    return this.manager.getQ1109ConsumableContract();
  }

  getFinancialMatrix() {
    return this.manager.getFinancialMatrix();
  }

  getFinancialHistory(limit = 100) {
    return this.manager.getFinancialHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
