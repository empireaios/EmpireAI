import type { OperationsWorkerConfiguration } from "./configuration.js";
import { OPERATIONS_REPORT_VERSION, OPERATIONS_WORKER_IDENTITY, OPSW_METADATA_VERSION } from "./paths.js";
import type {
  CompletionWorkflow,
  EscalationWorkflow,
  ExceptionManagement,
  FollowUpWorkflow,
  FulfilmentChecklist,
  IntegrationHandshake,
  OperationalStage,
  OperationalStageDefinition,
  OperationsReport,
  OperationsWorkerCatalog,
  OperationsWorkerValidationReport,
  QaCheckpoints,
  ServiceDeliveryWorkflow,
  TechnicianAssignmentWorkflow,
} from "./types.js";

let workflowSeq = 0;
let stageSeq = 0;
let assignmentSeq = 0;
let checklistSeq = 0;
let qaSeq = 0;
let escalationSeq = 0;
let completionSeq = 0;
let followUpSeq = 0;
let cancellationSeq = 0;
let exceptionSeq = 0;
let reportSeq = 0;
let runSeq = 0;
let engineSeq = 0;

export function resetOpsSequenceForTesting() {
  workflowSeq = 0;
  stageSeq = 0;
  assignmentSeq = 0;
  checklistSeq = 0;
  qaSeq = 0;
  escalationSeq = 0;
  completionSeq = 0;
  followUpSeq = 0;
  cancellationSeq = 0;
  exceptionSeq = 0;
  reportSeq = 0;
  runSeq = 0;
  engineSeq = 0;
}

export function nextWorkflowId() {
  workflowSeq += 1;
  return `opsw-wf-${String(workflowSeq).padStart(4, "0")}`;
}

export function nextStageId() {
  stageSeq += 1;
  return `opsw-stage-${String(stageSeq).padStart(4, "0")}`;
}

export function nextAssignmentWorkflowId() {
  assignmentSeq += 1;
  return `opsw-assign-${String(assignmentSeq).padStart(4, "0")}`;
}

export function nextChecklistId() {
  checklistSeq += 1;
  return `opsw-checklist-${String(checklistSeq).padStart(4, "0")}`;
}

export function nextQaCheckpointsId() {
  qaSeq += 1;
  return `opsw-qa-${String(qaSeq).padStart(4, "0")}`;
}

export function nextEscalationWorkflowId() {
  escalationSeq += 1;
  return `opsw-escalation-${String(escalationSeq).padStart(4, "0")}`;
}

export function nextCompletionWorkflowId() {
  completionSeq += 1;
  return `opsw-completion-${String(completionSeq).padStart(4, "0")}`;
}

export function nextFollowUpWorkflowId() {
  followUpSeq += 1;
  return `opsw-followup-${String(followUpSeq).padStart(4, "0")}`;
}

export function nextCancellationWorkflowId() {
  cancellationSeq += 1;
  return `opsw-cancel-${String(cancellationSeq).padStart(4, "0")}`;
}

export function nextExceptionManagementId() {
  exceptionSeq += 1;
  return `opsw-exception-${String(exceptionSeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `opsw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextRunReportId() {
  runSeq += 1;
  return `opsw-run-${String(runSeq).padStart(4, "0")}`;
}

export function nextEngineRecordId() {
  engineSeq += 1;
  return `opsw-eng-${String(engineSeq).padStart(4, "0")}`;
}

/** Operational stage vocabulary is extensible — normalize casing/whitespace only. */
export function normalizeStage(value: string | null | undefined): OperationalStage {
  const v = (value ?? "exception").trim().toLowerCase().replace(/\s+/g, "_");
  return v || "exception";
}

export class WorkflowBuilder {
  buildCatalog(
    config: OperationsWorkerConfiguration,
    reports: OperationsReport[],
    workflows: ServiceDeliveryWorkflow[],
    assignmentWorkflows: TechnicianAssignmentWorkflow[],
    checklists: FulfilmentChecklist[],
    qaCheckpointsList: QaCheckpoints[],
    escalationWorkflows: EscalationWorkflow[],
    completionWorkflows: CompletionWorkflow[],
    followUpWorkflows: FollowUpWorkflow[],
    integrations: IntegrationHandshake[],
  ): OperationsWorkerCatalog {
    return {
      reportVersion: OPERATIONS_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      workflows: workflows.map((w) => ({ ...w })),
      assignmentWorkflows: assignmentWorkflows.map((w) => ({ ...w })),
      checklists: checklists.map((c) => ({ ...c })),
      qaCheckpoints: qaCheckpointsList.map((q) => ({ ...q })),
      escalationWorkflows: escalationWorkflows.map((e) => ({ ...e })),
      completionWorkflows: completionWorkflows.map((c) => ({ ...c })),
      followUpWorkflows: followUpWorkflows.map((f) => ({ ...f })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: OPSW_METADATA_VERSION,
      executiveAuthority: "pillow",
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

  buildReport(params: {
    workflow: ServiceDeliveryWorkflow;
    stages: OperationalStageDefinition[];
    assignmentWorkflow: TechnicianAssignmentWorkflow | null;
    fulfilmentChecklist: FulfilmentChecklist | null;
    qaCheckpoints: QaCheckpoints | null;
    escalationWorkflow: EscalationWorkflow | null;
    completionWorkflow: CompletionWorkflow | null;
    followUpWorkflow: FollowUpWorkflow | null;
    exceptionManagement: ExceptionManagement | null;
    sourceLeadGenReportId: string | null;
    auditStatus: OperationsReport["auditStatus"];
    outstandingIssues: string[];
    confidenceScore: number;
    validation: OperationsWorkerValidationReport;
    config: OperationsWorkerConfiguration;
    reportId?: string;
  }): OperationsReport {
    const now = new Date().toISOString();
    return {
      reportId: params.reportId ?? nextReportId(),
      timestamp: now,
      businessProjectId: params.workflow.businessProjectId,
      workflowId: params.workflow.workflowId,
      serviceType: params.workflow.serviceType,
      operationalStages: params.stages.map((s) => ({
        ...s,
        dependencies: [...s.dependencies],
        notes: [...s.notes],
      })),
      assignmentWorkflow: params.assignmentWorkflow ? { ...params.assignmentWorkflow } : null,
      fulfilmentChecklist: params.fulfilmentChecklist ? { ...params.fulfilmentChecklist } : null,
      qaCheckpoints: params.qaCheckpoints ? { ...params.qaCheckpoints } : null,
      escalationWorkflow: params.escalationWorkflow ? { ...params.escalationWorkflow } : null,
      completionWorkflow: params.completionWorkflow ? { ...params.completionWorkflow } : null,
      followUpWorkflow: params.followUpWorkflow ? { ...params.followUpWorkflow } : null,
      cancellationWorkflow: null,
      exceptionManagement: params.exceptionManagement ? { ...params.exceptionManagement } : null,
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: OPSW_METADATA_VERSION,
      reportVersion: OPERATIONS_REPORT_VERSION,
      workerId: params.config.workerId || OPERATIONS_WORKER_IDENTITY.workerId,
      sourceBookingId: params.workflow.bookingId,
      sourceLeadGenReportId: params.sourceLeadGenReportId,
      validation: { ...params.validation },
      runTimestamp: now,
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
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-09:operations:${params.workflow.workflowId}`,
        `source_booking:${params.workflow.bookingId}`,
        ...(params.sourceLeadGenReportId
          ? [`source_leadgen:${params.sourceLeadGenReportId}`]
          : []),
        ...params.stages.map((s) => `stage:${s.stageId}`),
      ],
    };
  }
}
