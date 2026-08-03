import type { OperationsWorkerConfiguration } from "./configuration.js";
import type { OperationsWorkerDependencies } from "./integrations.js";
import { OperationsManager } from "./operations-manager.js";
import type { EngineStatus, OperationsWorkerRunReport, OpsInput } from "./types.js";

export class OperationsWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: OperationsWorkerRunReport | null = null;

  constructor(
    private readonly manager: OperationsManager,
    private readonly config: OperationsWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: OperationsWorkerDependencies = {}) {
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

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  consumeApprovedBooking(input: OpsInput = {}) {
    this.status = "consuming_booking";
    return this.finish(this.manager.consumeApprovedBooking(input, this.config));
  }

  generateServiceDeliveryWorkflow(input: OpsInput = {}) {
    this.status = "designing_workflow";
    return this.finish(this.manager.generateServiceDeliveryWorkflow(input, this.config));
  }

  defineOperationalStages(input: OpsInput = {}) {
    this.status = "defining_stages";
    return this.finish(this.manager.defineOperationalStages(input, this.config));
  }

  defineTechnicianAssignmentWorkflow(input: OpsInput = {}) {
    this.status = "assigning_technician";
    return this.finish(this.manager.defineTechnicianAssignmentWorkflow(input, this.config));
  }

  defineFulfilmentChecklist(input: OpsInput = {}) {
    this.status = "building_checklist";
    return this.finish(this.manager.defineFulfilmentChecklist(input, this.config));
  }

  defineQaCheckpoints(input: OpsInput = {}) {
    this.status = "defining_qa_checkpoints";
    return this.finish(this.manager.defineQaCheckpoints(input, this.config));
  }

  defineEscalationWorkflow(input: OpsInput = {}) {
    this.status = "defining_escalation";
    return this.finish(this.manager.defineEscalationWorkflow(input, this.config));
  }

  defineCompletionWorkflow(input: OpsInput = {}) {
    this.status = "defining_completion";
    return this.finish(this.manager.defineCompletionWorkflow(input, this.config));
  }

  defineFollowUpWorkflow(input: OpsInput = {}) {
    this.status = "defining_follow_up";
    return this.finish(this.manager.defineFollowUpWorkflow(input, this.config));
  }

  produceReport(input: OpsInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceOperationsReport(input: OpsInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: OpsInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: OpsInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: OperationsWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
