import type { ApprovalRouterConfiguration } from "./configuration.js";
import { ApprovalRouterManager } from "./approval-router-manager.js";
import type {
  ApprovalRouterInput,
  ApprovalRouterRunReport,
  EngineStatus,
  ExecutionGateInput,
  RecordExternalOutcomeInput,
} from "./types.js";

export class ApprovalRouterController {
  private status: EngineStatus = "idle";
  private latestReport: ApprovalRouterRunReport | null = null;

  constructor(
    private readonly manager: ApprovalRouterManager,
    private readonly config: ApprovalRouterConfiguration,
  ) {}

  initialize() {
    this.status = "active";
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
      policyRules: this.config.policyRules.map((r) => ({
        ...r,
        matchPatterns: [...r.matchPatterns],
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

  evaluateRequest(input: ApprovalRouterInput) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateRequest(input, this.config));
  }

  routeRequest(input: ApprovalRouterInput) {
    this.status = "routing";
    return this.finish(this.manager.routeRequest(input, this.config));
  }

  generateApprovalRequest(input: ApprovalRouterInput) {
    this.status = "routing";
    return this.finish(this.manager.generateApprovalRequest(input, this.config));
  }

  listPendingQueue() {
    this.status = "tracking";
    return this.finish(this.manager.listPendingQueue(this.config));
  }

  listRequests() {
    this.status = "tracking";
    return this.finish(this.manager.listRequests(this.config));
  }

  recordExternalOutcome(input: RecordExternalOutcomeInput) {
    this.status = "tracking";
    return this.finish(this.manager.recordExternalOutcome(input, this.config));
  }

  checkExecutionGate(input: ExecutionGateInput) {
    this.status = "tracking";
    return this.finish(this.manager.checkExecutionGate(input, this.config));
  }

  validateApprovals() {
    this.status = "active";
    return this.finish(this.manager.validateApprovals(this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ApprovalRouterRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
