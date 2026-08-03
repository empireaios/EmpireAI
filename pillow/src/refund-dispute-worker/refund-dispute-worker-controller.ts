import type { RefundDisputeWorkerConfiguration } from "./configuration.js";
import type { RefundDisputeWorkerDependencies } from "./integrations.js";
import { CaseManager } from "./case-manager.js";
import type {
  EngineStatus,
  RefundDisputeWorkerInput,
  RefundDisputeWorkerRunReport,
} from "./types.js";

export class RefundDisputeWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: RefundDisputeWorkerRunReport | null = null;

  constructor(
    private readonly manager: CaseManager,
    private readonly config: RefundDisputeWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: RefundDisputeWorkerDependencies = {}) {
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
      policies: { ...this.config.policies },
      seedCases: this.config.seedCases.map((report) => ({
        ...report,
        actionsTaken: report.actionsTaken.map((a) => ({ ...a })),
        customerCommunications: report.customerCommunications.map((c) => ({ ...c })),
        escalations: report.escalations.map((e) => ({ ...e })),
        supplierCoordination: report.supplierCoordination.map((s) => ({ ...s })),
        caseHistory: report.caseHistory.map((h) => ({ ...h })),
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
        policyEvaluation: {
          ...report.policyEvaluation,
          marketplaceRuleRefs: [...report.policyEvaluation.marketplaceRuleRefs],
        },
        resolution: { ...report.resolution },
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveRefundRequest(input: RefundDisputeWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveRefundRequest(input, this.config));
  }

  receiveReturnRequest(input: RefundDisputeWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveReturnRequest(input, this.config));
  }

  receiveCustomerDispute(input: RefundDisputeWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveCustomerDispute(input, this.config));
  }

  classifyCaseType(input: RefundDisputeWorkerInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.classifyCaseType(input, this.config));
  }

  validateAgainstPolicies(input: RefundDisputeWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateAgainstPolicies(input, this.config));
  }

  trackCaseStatus(input: RefundDisputeWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackCaseStatus(input, this.config));
  }

  coordinateWithSupplier(input: RefundDisputeWorkerInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateWithSupplier(input, this.config));
  }

  generateCustomerCommunications(input: RefundDisputeWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.generateCustomerCommunications(input, this.config));
  }

  escalateExceptionalCases(input: RefundDisputeWorkerInput = {}) {
    this.status = "escalating";
    return this.finish(this.manager.escalateExceptionalCases(input, this.config));
  }

  recordFinalOutcome(input: RefundDisputeWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.recordFinalOutcome(input, this.config));
  }

  produceReport(input: RefundDisputeWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: RefundDisputeWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: RefundDisputeWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: RefundDisputeWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
