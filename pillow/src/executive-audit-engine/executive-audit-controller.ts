import type { ExecutiveAuditEngineConfiguration } from "./configuration.js";
import { ExecutiveAuditManager } from "./executive-audit-manager.js";
import type {
  EngineStatus,
  ExecutiveAuditInput,
  ExecutiveAuditRunReport,
} from "./types.js";

export class ExecutiveAuditController {
  private status: EngineStatus = "idle";
  private latestReport: ExecutiveAuditRunReport | null = null;

  constructor(
    private readonly manager: ExecutiveAuditManager,
    private readonly config: ExecutiveAuditEngineConfiguration,
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
      auditTypes: [...this.config.auditTypes],
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  auditExecutiveDecision(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditExecutiveDecision(input, this.config));
  }

  auditMissionOutput(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditMissionOutput(input, this.config));
  }

  auditWorkforceAction(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditWorkforceAction(input, this.config));
  }

  auditGovernance(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditGovernance(input, this.config));
  }

  auditApproval(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditApproval(input, this.config));
  }

  auditBusinessState(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditBusinessState(input, this.config));
  }

  auditExecutionMemory(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditExecutionMemory(input, this.config));
  }

  auditDecisionRecommendations(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditDecisionRecommendations(input, this.config));
  }

  auditRecommendationQuality(input: ExecutiveAuditInput) {
    this.status = "inspecting";
    return this.finish(this.manager.auditRecommendationQuality(input, this.config));
  }

  runAudit(input: ExecutiveAuditInput) {
    this.status = "reporting";
    return this.finish(this.manager.runAudit(input, this.config));
  }

  validateAudits(input: ExecutiveAuditInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateAudits(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ExecutiveAuditRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
