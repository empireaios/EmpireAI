import type {
  BookingContext,
  CompletionWorkflow,
  EscalationWorkflow,
  ExceptionManagement,
  FollowUpWorkflow,
  FulfilmentChecklist,
  OperationsReport,
  QaCheckpoints,
  ServiceDeliveryWorkflow,
  TechnicianAssignmentWorkflow,
} from "./types.js";

/** Authoritative in-memory Ops store — workflows, sub-workflows, reports, audit. */
export class WorkflowStore {
  private workflows = new Map<string, ServiceDeliveryWorkflow>();
  private assignmentWorkflows = new Map<string, TechnicianAssignmentWorkflow>();
  private checklists = new Map<string, FulfilmentChecklist>();
  private qaCheckpointsList = new Map<string, QaCheckpoints>();
  private escalationWorkflows = new Map<string, EscalationWorkflow>();
  private completionWorkflows = new Map<string, CompletionWorkflow>();
  private followUpWorkflows = new Map<string, FollowUpWorkflow>();
  private exceptionManagements = new Map<string, ExceptionManagement>();
  private reports = new Map<string, OperationsReport>();
  private latestWorkflowId: string | null = null;
  private latestReportId: string | null = null;
  private latestBookingContext: BookingContext | null = null;
  private auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: OperationsReport[]) {
    this.workflows.clear();
    this.assignmentWorkflows.clear();
    this.checklists.clear();
    this.qaCheckpointsList.clear();
    this.escalationWorkflows.clear();
    this.completionWorkflows.clear();
    this.followUpWorkflows.clear();
    this.exceptionManagements.clear();
    this.reports.clear();
    this.latestWorkflowId = null;
    this.latestReportId = null;
    this.latestBookingContext = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.latestWorkflowId = report.workflowId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.reportId,
        action: "seed",
        details: `seeded report for project=${report.businessProjectId}`,
      });
    }
  }

  workflowCount() {
    return this.workflows.size;
  }

  reportCount() {
    return this.reports.size;
  }

  listWorkflows() {
    return [...this.workflows.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(cloneWorkflow);
  }

  listAssignmentWorkflows() {
    return [...this.assignmentWorkflows.values()].map((w) => ({ ...w }));
  }

  listChecklists() {
    return [...this.checklists.values()].map((c) => ({ ...c }));
  }

  listQaCheckpoints() {
    return [...this.qaCheckpointsList.values()].map((q) => ({ ...q }));
  }

  listEscalationWorkflows() {
    return [...this.escalationWorkflows.values()].map((e) => ({ ...e }));
  }

  listCompletionWorkflows() {
    return [...this.completionWorkflows.values()].map((c) => ({ ...c }));
  }

  listFollowUpWorkflows() {
    return [...this.followUpWorkflows.values()].map((f) => ({ ...f }));
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  getWorkflow(workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    return workflow ? cloneWorkflow(workflow) : null;
  }

  getAssignmentWorkflow(workflowId: string) {
    const found = [...this.assignmentWorkflows.values()].find((w) => w.workflowId === workflowId);
    return found ? { ...found } : null;
  }

  getChecklist(workflowId: string) {
    const found = [...this.checklists.values()].find((c) => c.workflowId === workflowId);
    return found ? { ...found } : null;
  }

  getQaCheckpoints(workflowId: string) {
    const found = [...this.qaCheckpointsList.values()].find((q) => q.workflowId === workflowId);
    return found ? { ...found } : null;
  }

  getEscalationWorkflow(workflowId: string) {
    const found = [...this.escalationWorkflows.values()].find((e) => e.workflowId === workflowId);
    return found ? { ...found } : null;
  }

  getCompletionWorkflow(workflowId: string) {
    const found = [...this.completionWorkflows.values()].find((c) => c.workflowId === workflowId);
    return found ? { ...found } : null;
  }

  getFollowUpWorkflow(workflowId: string) {
    const found = [...this.followUpWorkflows.values()].find((f) => f.workflowId === workflowId);
    return found ? { ...found } : null;
  }

  getExceptionManagement(workflowId: string) {
    const found = [...this.exceptionManagements.values()].find((e) => e.workflowId === workflowId);
    return found ? { ...found } : null;
  }

  getReport(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? cloneReport(report) : null;
  }

  getLatestWorkflowId() {
    return this.latestWorkflowId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getLatestBookingContext() {
    return this.latestBookingContext ? { ...this.latestBookingContext } : null;
  }

  setLatestBookingContext(context: BookingContext) {
    this.latestBookingContext = { ...context };
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: context.bookingId,
      action: "consume_approved_booking",
      details: `status=${context.bookingStatus} project=${context.businessProjectId}`,
    });
    return { ...context };
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveWorkflow(workflow: ServiceDeliveryWorkflow, action = "save_workflow") {
    this.workflows.set(workflow.workflowId, cloneWorkflow(workflow));
    this.latestWorkflowId = workflow.workflowId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: workflow.workflowId,
      action,
      details: `status=${workflow.status} stages=${workflow.stages.length}`,
    });
    return cloneWorkflow(workflow);
  }

  saveAssignmentWorkflow(w: TechnicianAssignmentWorkflow, action = "save_assignment_workflow") {
    this.assignmentWorkflows.set(w.assignmentWorkflowId, { ...w });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: w.assignmentWorkflowId,
      action,
      details: `workflow=${w.workflowId} steps=${w.steps.length}`,
    });
    return { ...w };
  }

  saveChecklist(c: FulfilmentChecklist, action = "save_checklist") {
    this.checklists.set(c.checklistId, { ...c });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: c.checklistId,
      action,
      details: `workflow=${c.workflowId} items=${c.items.length}`,
    });
    return { ...c };
  }

  saveQaCheckpoints(q: QaCheckpoints, action = "save_qa_checkpoints") {
    this.qaCheckpointsList.set(q.qaCheckpointsId, { ...q });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: q.qaCheckpointsId,
      action,
      details: `workflow=${q.workflowId} checkpoints=${q.checkpoints.length}`,
    });
    return { ...q };
  }

  saveEscalationWorkflow(e: EscalationWorkflow, action = "save_escalation_workflow") {
    this.escalationWorkflows.set(e.escalationWorkflowId, { ...e });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: e.escalationWorkflowId,
      action,
      details: `workflow=${e.workflowId} rules=${e.rules.length}`,
    });
    return { ...e };
  }

  saveCompletionWorkflow(c: CompletionWorkflow, action = "save_completion_workflow") {
    this.completionWorkflows.set(c.completionWorkflowId, { ...c });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: c.completionWorkflowId,
      action,
      details: `workflow=${c.workflowId} steps=${c.steps.length}`,
    });
    return { ...c };
  }

  saveFollowUpWorkflow(f: FollowUpWorkflow, action = "save_follow_up_workflow") {
    this.followUpWorkflows.set(f.followUpWorkflowId, { ...f });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: f.followUpWorkflowId,
      action,
      details: `workflow=${f.workflowId} steps=${f.steps.length}`,
    });
    return { ...f };
  }

  saveExceptionManagement(e: ExceptionManagement, action = "save_exception_management") {
    this.exceptionManagements.set(e.exceptionManagementId, { ...e });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: e.exceptionManagementId,
      action,
      details: `workflow=${e.workflowId} types=${e.handledExceptionTypes.length}`,
    });
    return { ...e };
  }

  saveReport(report: OperationsReport, action = "save_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `workflow=${report.workflowId} stages=${report.operationalStages.length}`,
    });
    return cloneReport(report);
  }
}

function cloneWorkflow(workflow: ServiceDeliveryWorkflow): ServiceDeliveryWorkflow {
  return {
    ...workflow,
    stages: workflow.stages.map((s) => ({
      ...s,
      dependencies: [...s.dependencies],
      notes: [...s.notes],
    })),
    notes: [...workflow.notes],
  };
}

function cloneReport(report: OperationsReport): OperationsReport {
  return {
    ...report,
    operationalStages: report.operationalStages.map((s) => ({
      ...s,
      dependencies: [...s.dependencies],
      notes: [...s.notes],
    })),
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    validation: { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] },
    consumableByQ710: true,
    neverFabricateOperationalEvidence: true,
    neverPerformCustomerServices: true,
    neverReplaceBookingWorker: true,
    neverReplaceCrmWorker: true,
    neverReplaceLeadGenerationWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ710OrLater: true,
    preserveCompleteOperationalTraceability: true,
    preserveWorkflowAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
