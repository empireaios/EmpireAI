import type { OperationsWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type OperationsWorkerDependencies,
} from "./integrations.js";
import { appendOpsLog } from "./ops-logging.js";
import {
  provideBookingContextFromFixture,
  provideBookingContextFromInjected,
  provideBookingContextFromReport,
  provideCompletionWorkflow,
  provideEscalationWorkflow,
  provideExceptionManagement,
  provideFollowUpWorkflow,
  provideFulfilmentChecklist,
  provideOperationalStages,
  provideQaCheckpoints,
  provideServiceDeliveryWorkflow,
  provideTechnicianAssignmentWorkflow,
} from "./ops-providers.js";
import { HealthMonitor, OpsValidator, RecoveryManager } from "./ops-validator.js";
import {
  INTEGRATION_TARGETS,
  OPERATIONS_WORKER_ID,
  OPSW_CAPABILITIES,
  OPSW_METADATA_VERSION,
} from "./paths.js";
import { nextEngineRecordId, nextRunReportId, WorkflowBuilder } from "./workflow-builder.js";
import { WorkflowStore } from "./workflow-store.js";
import type {
  BookingContext,
  CompletionWorkflow,
  EscalationWorkflow,
  FollowUpWorkflow,
  FulfilmentChecklist,
  IntegrationHandshake,
  OperationalState,
  OperationsReport,
  OperationsWorkerCatalog,
  OperationsWorkerEngineRecord,
  OperationsWorkerRunReport,
  OpsInput,
  QaCheckpoints,
  ServiceDeliveryWorkflow,
  TechnicianAssignmentWorkflow,
} from "./types.js";

type ReportParams = {
  action: OperationsWorkerRunReport["action"];
  catalog: OperationsWorkerCatalog | null;
  reports?: OperationsReport[];
  workflows?: ServiceDeliveryWorkflow[];
  latestReport?: OperationsReport | null;
  latestWorkflow?: ServiceDeliveryWorkflow | null;
  latestAssignmentWorkflow?: TechnicianAssignmentWorkflow | null;
  latestChecklist?: FulfilmentChecklist | null;
  latestQaCheckpoints?: QaCheckpoints | null;
  latestEscalationWorkflow?: EscalationWorkflow | null;
  latestCompletionWorkflow?: CompletionWorkflow | null;
  latestFollowUpWorkflow?: FollowUpWorkflow | null;
  latestBookingContext?: BookingContext | null;
  validation: OperationsWorkerRunReport["validation"];
  started: number;
};

export class OperationsManager {
  private engineRecord: OperationsWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: OperationsWorkerCatalog | null = null;
  private readonly store = new WorkflowStore();
  private readonly builder = new WorkflowBuilder();
  private readonly validator = new OpsValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: OperationsWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: OperationsWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.refreshCatalog(config);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getWorkflows() {
    return this.store.listWorkflows();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getLatestWorkflowId() {
    return this.store.getLatestWorkflowId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.refreshCatalog(config);
    this.ensureRecord("connected", config);
    appendOpsLog({
      event: "connect",
      details: `Operations Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report({
      action: "connect",
      catalog: this.getCatalog(),
      validation: this.validator.finalize("pass", [], [], started),
      started,
    });
  }

  consumeApprovedBooking(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.operationsRulesEnabled) {
      return this.disabled(
        "consume_approved_booking",
        config,
        !config.enabled ? "Operations Worker is disabled" : "Operations rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("consume_approved_booking", input, config, started);
    }
    const resolved = this.resolveBookingSource(input);
    if (!resolved) {
      return this.failSimple(
        "consume_approved_booking",
        config,
        started,
        "Operations Worker requires an approved booking (fixtureBooking, bookingReport, or bookingId with a bound Booking Worker)",
      );
    }
    if (resolved.bookingStatus !== "confirmed") {
      return this.failSimple(
        "consume_approved_booking",
        config,
        started,
        `Operations Worker requires bookingStatus="confirmed"; received status="${resolved.bookingStatus}"`,
      );
    }
    const saved = this.store.setLatestBookingContext(resolved);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendOpsLog({
      event: "consume_approved_booking",
      details: `booking=${saved.bookingId} status=${saved.bookingStatus}`,
    });
    return this.report({
      action: "consume_approved_booking",
      catalog: this.getCatalog(),
      latestBookingContext: saved,
      validation,
      started,
    });
  }

  generateServiceDeliveryWorkflow(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.operationsRulesEnabled) {
      return this.disabled(
        "generate_service_delivery_workflow",
        config,
        !config.enabled ? "Operations Worker is disabled" : "Operations rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("generate_service_delivery_workflow", input, config, started);
    }
    const context = this.resolveBookingSource(input) ?? this.store.getLatestBookingContext();
    if (!context) {
      return this.failSimple(
        "generate_service_delivery_workflow",
        config,
        started,
        "Operations Worker requires a confirmed booking context (call consumeApprovedBooking first, or supply fixtureBooking/bookingReport/bookingId)",
      );
    }
    if (context.bookingStatus !== "confirmed") {
      return this.failSimple(
        "generate_service_delivery_workflow",
        config,
        started,
        `Operations Worker requires bookingStatus="confirmed"; received status="${context.bookingStatus}"`,
      );
    }
    this.store.setLatestBookingContext(context);
    const { workflow } = provideServiceDeliveryWorkflow(input, context);
    const saved = this.store.saveWorkflow(workflow, "generate_service_delivery_workflow");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendOpsLog({
      event: "generate_service_delivery_workflow",
      details: `workflow=${saved.workflowId} booking=${saved.bookingId} stages=${saved.stages.length}`,
    });
    return this.report({
      action: "generate_service_delivery_workflow",
      catalog: this.getCatalog(),
      workflows: [saved],
      latestWorkflow: saved,
      latestBookingContext: context,
      validation,
      started,
    });
  }

  defineOperationalStages(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("define_operational_stages", input, config, started);
    }
    const workflow = this.requireWorkflow(input);
    if (!workflow) {
      return this.failSimple(
        "define_operational_stages",
        config,
        started,
        "Operations Worker requires an existing service delivery workflow to define operational stages",
      );
    }
    const stages = provideOperationalStages(workflow.workflowId, input.additionalStages ?? []);
    const saved = this.store.saveWorkflow(
      { ...workflow, stages, updatedAt: new Date().toISOString() },
      "define_operational_stages",
    );
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendOpsLog({
      event: "define_operational_stages",
      details: `workflow=${saved.workflowId} stages=${saved.stages.length}`,
    });
    return this.report({
      action: "define_operational_stages",
      catalog: this.getCatalog(),
      workflows: [saved],
      latestWorkflow: saved,
      validation,
      started,
    });
  }

  defineTechnicianAssignmentWorkflow(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("define_technician_assignment_workflow", input, config, started);
    }
    const workflow = this.requireWorkflow(input);
    if (!workflow) {
      return this.failSimple(
        "define_technician_assignment_workflow",
        config,
        started,
        "Operations Worker requires an existing service delivery workflow to define a technician assignment workflow",
      );
    }
    const assignment = provideTechnicianAssignmentWorkflow(workflow);
    const saved = this.store.saveAssignmentWorkflow(assignment);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendOpsLog({
      event: "define_technician_assignment_workflow",
      details: `workflow=${workflow.workflowId} assignment=${saved.assignmentWorkflowId}`,
    });
    return this.report({
      action: "define_technician_assignment_workflow",
      catalog: this.getCatalog(),
      latestWorkflow: workflow,
      latestAssignmentWorkflow: saved,
      validation,
      started,
    });
  }

  defineFulfilmentChecklist(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("define_fulfilment_checklist", input, config, started);
    }
    const workflow = this.requireWorkflow(input);
    if (!workflow) {
      return this.failSimple(
        "define_fulfilment_checklist",
        config,
        started,
        "Operations Worker requires an existing service delivery workflow to define a fulfilment checklist",
      );
    }
    const checklist = provideFulfilmentChecklist(workflow);
    const saved = this.store.saveChecklist(checklist);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendOpsLog({
      event: "define_fulfilment_checklist",
      details: `workflow=${workflow.workflowId} checklist=${saved.checklistId}`,
    });
    return this.report({
      action: "define_fulfilment_checklist",
      catalog: this.getCatalog(),
      latestWorkflow: workflow,
      latestChecklist: saved,
      validation,
      started,
    });
  }

  defineQaCheckpoints(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("define_qa_checkpoints", input, config, started);
    }
    const workflow = this.requireWorkflow(input);
    if (!workflow) {
      return this.failSimple(
        "define_qa_checkpoints",
        config,
        started,
        "Operations Worker requires an existing service delivery workflow to define QA checkpoints",
      );
    }
    const qa = provideQaCheckpoints(workflow);
    const saved = this.store.saveQaCheckpoints(qa);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendOpsLog({
      event: "define_qa_checkpoints",
      details: `workflow=${workflow.workflowId} qa=${saved.qaCheckpointsId}`,
    });
    return this.report({
      action: "define_qa_checkpoints",
      catalog: this.getCatalog(),
      latestWorkflow: workflow,
      latestQaCheckpoints: saved,
      validation,
      started,
    });
  }

  defineEscalationWorkflow(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("define_escalation_workflow", input, config, started);
    }
    const workflow = this.requireWorkflow(input);
    if (!workflow) {
      return this.failSimple(
        "define_escalation_workflow",
        config,
        started,
        "Operations Worker requires an existing service delivery workflow to define an escalation workflow",
      );
    }
    const escalation = provideEscalationWorkflow(workflow);
    const saved = this.store.saveEscalationWorkflow(escalation);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendOpsLog({
      event: "define_escalation_workflow",
      details: `workflow=${workflow.workflowId} escalation=${saved.escalationWorkflowId}`,
    });
    return this.report({
      action: "define_escalation_workflow",
      catalog: this.getCatalog(),
      latestWorkflow: workflow,
      latestEscalationWorkflow: saved,
      validation,
      started,
    });
  }

  defineCompletionWorkflow(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("define_completion_workflow", input, config, started);
    }
    const workflow = this.requireWorkflow(input);
    if (!workflow) {
      return this.failSimple(
        "define_completion_workflow",
        config,
        started,
        "Operations Worker requires an existing service delivery workflow to define a completion workflow",
      );
    }
    const completion = provideCompletionWorkflow(workflow);
    const saved = this.store.saveCompletionWorkflow(completion);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendOpsLog({
      event: "define_completion_workflow",
      details: `workflow=${workflow.workflowId} completion=${saved.completionWorkflowId}`,
    });
    return this.report({
      action: "define_completion_workflow",
      catalog: this.getCatalog(),
      latestWorkflow: workflow,
      latestCompletionWorkflow: saved,
      validation,
      started,
    });
  }

  defineFollowUpWorkflow(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("define_follow_up_workflow", input, config, started);
    }
    const workflow = this.requireWorkflow(input);
    if (!workflow) {
      return this.failSimple(
        "define_follow_up_workflow",
        config,
        started,
        "Operations Worker requires an existing service delivery workflow to define a follow-up workflow",
      );
    }
    const followUp = provideFollowUpWorkflow(workflow);
    const saved = this.store.saveFollowUpWorkflow(followUp);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendOpsLog({
      event: "define_follow_up_workflow",
      details: `workflow=${workflow.workflowId} followUp=${saved.followUpWorkflowId}`,
    });
    return this.report({
      action: "define_follow_up_workflow",
      catalog: this.getCatalog(),
      latestWorkflow: workflow,
      latestFollowUpWorkflow: saved,
      validation,
      started,
    });
  }

  produceReport(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.operationsRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled ? "Operations Worker is disabled" : "Operations rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    let workflow = this.requireWorkflow(input);
    if (!workflow) {
      const generated = this.generateServiceDeliveryWorkflow(input, config);
      if (generated.validation.decision === "fail") return generated;
      workflow = generated.latestWorkflow;
    }
    if (!workflow) {
      return this.failSimple(
        "produce_report",
        config,
        started,
        "Operations Worker requires a service delivery workflow to produce an operations report",
      );
    }

    let assignmentWorkflow = this.store.getAssignmentWorkflow(workflow.workflowId);
    if (!assignmentWorkflow) {
      assignmentWorkflow = this.store.saveAssignmentWorkflow(
        provideTechnicianAssignmentWorkflow(workflow),
      );
    }
    let fulfilmentChecklist = this.store.getChecklist(workflow.workflowId);
    if (!fulfilmentChecklist) {
      fulfilmentChecklist = this.store.saveChecklist(provideFulfilmentChecklist(workflow));
    }
    let qaCheckpoints = this.store.getQaCheckpoints(workflow.workflowId);
    if (!qaCheckpoints) {
      qaCheckpoints = this.store.saveQaCheckpoints(provideQaCheckpoints(workflow));
    }
    let escalationWorkflow = this.store.getEscalationWorkflow(workflow.workflowId);
    if (!escalationWorkflow) {
      escalationWorkflow = this.store.saveEscalationWorkflow(provideEscalationWorkflow(workflow));
    }
    let completionWorkflow = this.store.getCompletionWorkflow(workflow.workflowId);
    if (!completionWorkflow) {
      completionWorkflow = this.store.saveCompletionWorkflow(provideCompletionWorkflow(workflow));
    }
    let followUpWorkflow = this.store.getFollowUpWorkflow(workflow.workflowId);
    if (!followUpWorkflow) {
      followUpWorkflow = this.store.saveFollowUpWorkflow(provideFollowUpWorkflow(workflow));
    }
    let exceptionManagement = this.store.getExceptionManagement(workflow.workflowId);
    if (!exceptionManagement) {
      exceptionManagement = this.store.saveExceptionManagement(
        provideExceptionManagement(workflow),
      );
    }

    const components = [
      workflow.stages.length > 0,
      !!assignmentWorkflow,
      !!fulfilmentChecklist,
      !!qaCheckpoints,
      !!escalationWorkflow,
      !!completionWorkflow,
      !!followUpWorkflow,
    ];
    const completedCount = components.filter(Boolean).length;
    const outstanding: string[] = [];
    if (!workflow.stages.length) outstanding.push("No operational stages defined for this workflow");
    if (!assignmentWorkflow) outstanding.push("No technician assignment workflow defined");
    if (!fulfilmentChecklist) outstanding.push("No fulfilment checklist defined");
    if (!qaCheckpoints) outstanding.push("No QA checkpoints defined");
    if (!escalationWorkflow) outstanding.push("No escalation workflow defined");
    if (!completionWorkflow) outstanding.push("No completion workflow defined");
    if (!followUpWorkflow) outstanding.push("No follow-up workflow defined");

    const sourceLeadGenReportId = this.resolveSourceLeadGenReportId(input, workflow.businessProjectId);
    if (!sourceLeadGenReportId) {
      outstanding.push("No source Lead Generation report linked");
    }

    const confidenceScore = Math.min(0.95, Math.round((0.25 + completedCount * 0.1) * 100) / 100);
    const auditStatus: OperationsReport["auditStatus"] = !workflow.stages.length
      ? "draft"
      : completedCount < components.length
        ? "stages_defined"
        : "ready_for_q710";

    const validationBase = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );

    const reportDoc = this.builder.buildReport({
      workflow,
      stages: workflow.stages,
      assignmentWorkflow,
      fulfilmentChecklist,
      qaCheckpoints,
      escalationWorkflow,
      completionWorkflow,
      followUpWorkflow,
      exceptionManagement,
      sourceLeadGenReportId,
      auditStatus,
      outstandingIssues: outstanding,
      confidenceScore,
      validation: validationBase,
      config,
      reportId: input.reportId?.trim() || undefined,
    });

    const saved = this.store.saveReport(reportDoc, "produce_report");
    this.refreshCatalog(config);
    const validation = this.validator.validateReports([saved], { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      saved,
    );
    appendOpsLog({
      event: "produce_report",
      details: `report=${saved.reportId} workflow=${saved.workflowId} stages=${saved.operationalStages.length}`,
    });
    return this.report({
      action: "produce_report",
      catalog: this.getCatalog(),
      reports: [saved],
      workflows: [workflow],
      latestReport: saved,
      latestWorkflow: workflow,
      latestAssignmentWorkflow: assignmentWorkflow,
      latestChecklist: fulfilmentChecklist,
      latestQaCheckpoints: qaCheckpoints,
      latestEscalationWorkflow: escalationWorkflow,
      latestCompletionWorkflow: completionWorkflow,
      latestFollowUpWorkflow: followUpWorkflow,
      validation,
      started,
    });
  }

  submitReport(
    input: OpsInput,
    config: OperationsWorkerConfiguration,
  ): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    let reportDoc =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ??
      (this.store.getLatestReportId() ? this.store.getReport(this.store.getLatestReportId()!) : null);
    if (!reportDoc) {
      const produced = this.produceReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) {
        return produced;
      }
      reportDoc = produced.latestReport;
    }
    const submission = this.integrations.submitReport(reportDoc);
    const updated: OperationsReport = {
      ...reportDoc,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
      auditStatus: submission.submitted ? "submitted" : reportDoc.auditStatus,
    };
    const saved = this.store.saveReport(updated, "submit_report");
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      submission.submitted ? "pass" : "partial",
      [],
      submission.submitted ? [] : [submission.details],
      started,
    );
    this.ensureRecord("active", config, "passed", saved);
    return this.report({
      action: "submit_report",
      catalog: this.getCatalog(),
      reports: [saved],
      latestReport: saved,
      validation,
      started,
    });
  }

  list(config: OperationsWorkerConfiguration): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    return this.report({
      action: "list",
      catalog: this.getCatalog(),
      reports: this.store.listReports(),
      workflows: this.store.listWorkflows(),
      latestReport: this.store.getLatestReportId()
        ? this.store.getReport(this.store.getLatestReportId()!)
        : null,
      latestWorkflow: this.store.getLatestWorkflowId()
        ? this.store.getWorkflow(this.store.getLatestWorkflowId()!)
        : null,
      latestBookingContext: this.store.getLatestBookingContext(),
      validation: this.validator.finalize("pass", [], [], started),
      started,
    });
  }

  validate(input: OpsInput, config: OperationsWorkerConfiguration): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.listReports();
    const validation = this.validator.validateReports(reports, input, started, {
      allowIncompleteReport: reports.length === 0,
    });
    return this.report({
      action: "validate",
      catalog: this.getCatalog(),
      reports,
      workflows: this.store.listWorkflows(),
      latestReport: reports[reports.length - 1] ?? null,
      validation,
      started,
    });
  }

  diagnostics(config: OperationsWorkerConfiguration): OperationsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "partial",
      [],
      config.enabled ? [] : ["Operations Worker disabled"],
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report({
      action: "diagnostics",
      catalog: this.getCatalog(),
      reports: this.store.listReports(),
      workflows: this.store.listWorkflows(),
      validation,
      started,
    });
  }

  private resolveBookingSource(input: OpsInput): BookingContext | null {
    if (input.fixtureBooking) return provideBookingContextFromFixture(input.fixtureBooking);
    if (input.bookingReport) return provideBookingContextFromReport(input.bookingReport);
    if (input.bookingId?.trim()) {
      const found = this.integrations.findBookingById(input.bookingId.trim());
      if (found) return provideBookingContextFromInjected(found);
    }
    return null;
  }

  private resolveSourceLeadGenReportId(
    input: OpsInput,
    businessProjectId: string,
  ): string | null {
    if (input.leadGenerationReport?.reportId) return input.leadGenerationReport.reportId;
    if (input.fixtureLeadGeneration?.reportId) return input.fixtureLeadGeneration.reportId;
    const resolved = this.integrations.resolveLatestLeadGenerationReport(businessProjectId);
    return resolved?.reportId ?? null;
  }

  private requireWorkflow(input: OpsInput): ServiceDeliveryWorkflow | null {
    const workflowId = input.workflowId?.trim() || this.store.getLatestWorkflowId();
    return workflowId ? this.store.getWorkflow(workflowId) : null;
  }

  private refreshCatalog(config: OperationsWorkerConfiguration) {
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listWorkflows(),
      this.store.listAssignmentWorkflows(),
      this.store.listChecklists(),
      this.store.listQaCheckpoints(),
      this.store.listEscalationWorkflows(),
      this.store.listCompletionWorkflows(),
      this.store.listFollowUpWorkflows(),
      this.handshakes,
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: OperationsWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: OperationsReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? nextEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: OPERATIONS_WORKER_ID,
      engineVersion: "PILLOW-OPSW-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...OPSW_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalWorkflows: this.store.workflowCount(),
      lastWorkflowId: this.store.getLatestWorkflowId(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: OPSW_METADATA_VERSION,
    };
  }

  private boundaryFail(
    action: OperationsWorkerRunReport["action"],
    input: OpsInput,
    config: OperationsWorkerConfiguration,
    started: number,
  ) {
    const errors = this.validator.collectBoundaryErrors(input);
    const boundaryOnly = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendOpsLog({
      event: action,
      details: `boundary_reject=${errors.join(";")}`,
    });
    return this.report({
      action,
      catalog: this.getCatalog(),
      validation: boundaryOnly,
      started,
    });
  }

  private failSimple(
    action: OperationsWorkerRunReport["action"],
    config: OperationsWorkerConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report({
      action,
      catalog: this.getCatalog(),
      validation,
      started,
    });
  }

  private disabled(
    action: OperationsWorkerRunReport["action"],
    config: OperationsWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.ensureRecord("failed", config, "failed");
    return this.report({
      action,
      catalog: this.getCatalog(),
      validation,
      started,
    });
  }

  private report(params: ReportParams): OperationsWorkerRunReport {
    return {
      opswRunReportId: nextRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: params.action,
      engineRecord: this.getEngineRecord()!,
      catalog: params.catalog,
      reports: params.reports ?? [],
      workflows: params.workflows ?? [],
      latestReport: params.latestReport ?? null,
      latestWorkflow: params.latestWorkflow ?? null,
      latestAssignmentWorkflow: params.latestAssignmentWorkflow ?? null,
      latestChecklist: params.latestChecklist ?? null,
      latestQaCheckpoints: params.latestQaCheckpoints ?? null,
      latestEscalationWorkflow: params.latestEscalationWorkflow ?? null,
      latestCompletionWorkflow: params.latestCompletionWorkflow ?? null,
      latestFollowUpWorkflow: params.latestFollowUpWorkflow ?? null,
      latestBookingContext: params.latestBookingContext ?? null,
      integrations: this.getIntegrations(),
      validation: params.validation,
      durationMs: Date.now() - params.started,
      metadataVersion: OPSW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: OperationsWorkerCatalog): OperationsWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    workflows: catalog.workflows.map((w) => ({ ...w })),
    assignmentWorkflows: catalog.assignmentWorkflows.map((w) => ({ ...w })),
    checklists: catalog.checklists.map((c) => ({ ...c })),
    qaCheckpoints: catalog.qaCheckpoints.map((q) => ({ ...q })),
    escalationWorkflows: catalog.escalationWorkflows.map((e) => ({ ...e })),
    completionWorkflows: catalog.completionWorkflows.map((c) => ({ ...c })),
    followUpWorkflows: catalog.followUpWorkflows.map((f) => ({ ...f })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    neverFabricateOperationalEvidence: true,
    neverPerformCustomerServices: true,
    neverReplaceBookingWorker: true,
    neverReplaceCrmWorker: true,
    neverReplaceLeadGenerationWorker: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ710OrLater: true,
    consumableByQ710: true,
  };
}
