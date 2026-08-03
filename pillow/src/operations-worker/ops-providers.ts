import {
  nextAssignmentWorkflowId,
  nextChecklistId,
  nextCompletionWorkflowId,
  nextEscalationWorkflowId,
  nextExceptionManagementId,
  nextFollowUpWorkflowId,
  nextQaCheckpointsId,
  nextStageId,
  nextWorkflowId,
  normalizeStage,
} from "./workflow-builder.js";
import type {
  ApprovedBookingFixture,
  BookingContext,
  BookingReport,
  CompletionWorkflow,
  EscalationWorkflow,
  ExceptionManagement,
  FollowUpWorkflow,
  FulfilmentChecklist,
  OperationalStageDefinition,
  OpsInput,
  QaCheckpoints,
  ServiceDeliveryWorkflow,
  TechnicianAssignmentWorkflow,
} from "./types.js";

const DEFAULT_STAGE_SEQUENCE = [
  "job_preparation",
  "technician_assignment",
  "dispatch",
  "arrival",
  "service_execution",
  "quality_inspection",
  "customer_sign_off",
  "completion",
  "follow_up",
] as const;

const STAGE_DESCRIPTIONS: Record<string, string> = {
  job_preparation:
    "Prepare the job brief, required materials list, and confirm scope from the approved booking.",
  technician_assignment:
    "Design the criteria and steps for assigning a qualified technician to the job.",
  dispatch: "Define dispatch notification and travel-window structure ahead of arrival.",
  arrival: "Define on-site arrival check-in and customer verification steps.",
  service_execution:
    "Define the structural sequence of service execution steps for the booked service type.",
  quality_inspection: "Define quality inspection checkpoints against the fulfilment checklist.",
  customer_sign_off: "Define customer sign-off collection steps confirming work is accepted.",
  completion: "Define closure steps that mark the booking lifecycle as operationally complete.",
  follow_up: "Define post-service follow-up touchpoints and satisfaction check timing.",
  escalation: "Define escalation triggers and routing for issues raised during delivery.",
  cancellation:
    "Define cancellation handling steps if the booking is withdrawn before completion.",
  exception: "Define handling steps for exceptions outside the standard delivery path.",
};

function stageName(stage: string): string {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stageDescription(stage: string): string {
  return (
    STAGE_DESCRIPTIONS[stage] ??
    `Define structural handling for the ${stageName(stage).toLowerCase()} stage.`
  );
}

export function provideBookingContextFromFixture(
  fixture: ApprovedBookingFixture,
): BookingContext {
  const now = new Date().toISOString();
  return {
    bookingId: fixture.bookingId?.trim() || "bkw-booking-unknown",
    businessProjectId: fixture.businessProjectId?.trim() || "lbfc-prj-unknown",
    serviceType: fixture.serviceType?.trim() || "general_service",
    city: fixture.city?.trim() || "unknown",
    area: fixture.area?.trim() || "unknown",
    country: fixture.country?.trim() || null,
    confirmedAt: fixture.confirmedAt?.trim() || now,
    bookingStatus: (fixture.bookingStatus ?? "unknown").trim().toLowerCase(),
    source: "fixtureBooking",
    resolvedAt: now,
  };
}

export function provideBookingContextFromReport(report: BookingReport): BookingContext {
  const now = new Date().toISOString();
  return {
    bookingId: report.bookingId,
    businessProjectId: report.businessProjectId,
    serviceType: report.serviceSelected,
    city: "unknown",
    area: report.serviceArea,
    country: null,
    confirmedAt: report.timestamp,
    bookingStatus: (report.bookingStatus ?? "unknown").trim().toLowerCase(),
    source: "bookingReport",
    resolvedAt: now,
  };
}

export function provideBookingContextFromInjected(
  raw: Record<string, unknown>,
): BookingContext {
  const now = new Date().toISOString();
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;
  return {
    bookingId: str(raw.bookingId, "bkw-booking-unknown"),
    businessProjectId: str(raw.businessProjectId, "lbfc-prj-unknown"),
    serviceType: str(raw.serviceSelected ?? raw.serviceType, "general_service"),
    city: str(raw.city, "unknown"),
    area: str(raw.serviceArea ?? raw.area, "unknown"),
    country: typeof raw.country === "string" && raw.country.trim() ? raw.country.trim() : null,
    confirmedAt: str(raw.confirmedAt ?? raw.timestamp, now),
    bookingStatus: str(raw.bookingStatus, "unknown").toLowerCase(),
    source: "bookingWorker",
    resolvedAt: now,
  };
}

export function provideOperationalStages(
  workflowId: string,
  additionalStages: string[] = [],
): OperationalStageDefinition[] {
  const stages: OperationalStageDefinition[] = [];
  let previousStageId: string | null = null;
  let sequence = 1;
  for (const stage of DEFAULT_STAGE_SEQUENCE) {
    const stageId = nextStageId();
    stages.push({
      stageId,
      workflowId,
      stage,
      sequence,
      name: stageName(stage),
      description: stageDescription(stage),
      dependencies: previousStageId ? [previousStageId] : [],
      status: "planned",
      notes: [],
    });
    previousStageId = stageId;
    sequence += 1;
  }
  for (const raw of additionalStages) {
    const stage = normalizeStage(raw);
    if ((DEFAULT_STAGE_SEQUENCE as readonly string[]).includes(stage)) continue;
    stages.push({
      stageId: nextStageId(),
      workflowId,
      stage,
      sequence,
      name: stageName(stage),
      description: stageDescription(stage),
      dependencies: [],
      status: "planned",
      notes: ["Structural branch stage — not part of the main end-to-end sequence"],
    });
    sequence += 1;
  }
  return stages;
}

export function provideServiceDeliveryWorkflow(
  input: OpsInput,
  context: BookingContext,
  workflowId?: string,
): { workflow: ServiceDeliveryWorkflow; stages: OperationalStageDefinition[] } {
  const now = new Date().toISOString();
  const id = workflowId ?? nextWorkflowId();
  const stages = provideOperationalStages(id, input.additionalStages ?? []);
  const workflow: ServiceDeliveryWorkflow = {
    workflowId: id,
    businessProjectId: context.businessProjectId,
    bookingId: context.bookingId,
    serviceType: input.serviceType?.trim() || context.serviceType,
    city: input.city?.trim() || context.city,
    area: input.area?.trim() || context.area,
    country: input.country?.trim() || context.country,
    stages,
    createdAt: now,
    updatedAt: now,
    status: "designed",
    designOnly: true,
    notes: [
      "Structural service delivery workflow design derived from an approved booking.",
      "Never records that a job was actually performed; design only.",
    ],
  };
  return { workflow, stages };
}

export function provideTechnicianAssignmentWorkflow(
  workflow: ServiceDeliveryWorkflow,
): TechnicianAssignmentWorkflow {
  const now = new Date().toISOString();
  return {
    assignmentWorkflowId: nextAssignmentWorkflowId(),
    workflowId: workflow.workflowId,
    bookingId: workflow.bookingId,
    serviceType: workflow.serviceType,
    assignmentCriteria: [
      "skill_match_for_service_type",
      "geographic_proximity_to_service_area",
      "availability_within_scheduled_window",
      "workload_balance_across_technicians",
    ],
    candidateRoles: [`role-technician-${workflow.serviceType}`, "role-technician-general"],
    steps: [
      { stepId: `${workflow.workflowId}-assign-1`, sequence: 1, description: "Identify eligible technicians matching required skills and service area." },
      { stepId: `${workflow.workflowId}-assign-2`, sequence: 2, description: "Rank eligible technicians by availability and workload balance." },
      { stepId: `${workflow.workflowId}-assign-3`, sequence: 3, description: "Propose top-ranked technician for dispatch confirmation." },
      { stepId: `${workflow.workflowId}-assign-4`, sequence: 4, description: "Apply fallback strategy if no technician is available within window." },
    ],
    fallbackStrategy: "Escalate to supervisor queue for manual assignment when no eligible technician is available.",
    createdAt: now,
    designOnly: true,
    notes: ["Design only — never performs the actual assignment or dispatch."],
  };
}

export function provideFulfilmentChecklist(
  workflow: ServiceDeliveryWorkflow,
): FulfilmentChecklist {
  const now = new Date().toISOString();
  const items: Array<{ stage: string; description: string; required: boolean }> = [
    { stage: "job_preparation", description: "Confirm booking scope and required materials list.", required: true },
    { stage: "dispatch", description: "Confirm technician dispatch notification sent structurally.", required: true },
    { stage: "arrival", description: "Confirm on-site arrival check-in recorded.", required: true },
    { stage: "service_execution", description: "Confirm each service execution step is completed in sequence.", required: true },
    { stage: "quality_inspection", description: "Confirm quality inspection checkpoints are reviewed.", required: true },
    { stage: "customer_sign_off", description: "Confirm customer sign-off is collected before completion.", required: true },
  ];
  return {
    checklistId: nextChecklistId(),
    workflowId: workflow.workflowId,
    bookingId: workflow.bookingId,
    items: items.map((item, index) => ({
      itemId: `${workflow.workflowId}-item-${index + 1}`,
      sequence: index + 1,
      stage: item.stage,
      description: item.description,
      required: item.required,
    })),
    createdAt: now,
    designOnly: true,
    notes: ["Structural fulfilment checklist — completion of items is never fabricated."],
  };
}

export function provideQaCheckpoints(workflow: ServiceDeliveryWorkflow): QaCheckpoints {
  const now = new Date().toISOString();
  const checkpoints: Array<{ stage: string; criterion: string; required: boolean }> = [
    { stage: "service_execution", criterion: "Service execution follows the approved sequence for the booked service type.", required: true },
    { stage: "quality_inspection", criterion: "Workmanship meets the documented quality standard for the service category.", required: true },
    { stage: "quality_inspection", criterion: "No outstanding defects remain unresolved before sign-off.", required: true },
    { stage: "customer_sign_off", criterion: "Customer sign-off confirms acceptance of delivered work.", required: true },
  ];
  return {
    qaCheckpointsId: nextQaCheckpointsId(),
    workflowId: workflow.workflowId,
    bookingId: workflow.bookingId,
    checkpoints: checkpoints.map((cp, index) => ({
      checkpointId: `${workflow.workflowId}-qa-${index + 1}`,
      sequence: index + 1,
      stage: cp.stage,
      criterion: cp.criterion,
      required: cp.required,
    })),
    createdAt: now,
    designOnly: true,
    notes: ["Structural QA checkpoint design — never asserts an inspection outcome occurred."],
  };
}

export function provideEscalationWorkflow(workflow: ServiceDeliveryWorkflow): EscalationWorkflow {
  const now = new Date().toISOString();
  const rules: Array<{ triggerStage: string; triggerCondition: string; escalateTo: string }> = [
    { triggerStage: "dispatch", triggerCondition: "No technician accepted assignment within the dispatch window.", escalateTo: "supervisor_queue" },
    { triggerStage: "arrival", triggerCondition: "Technician fails to arrive within the scheduled arrival window.", escalateTo: "supervisor_queue" },
    { triggerStage: "service_execution", triggerCondition: "Blocking issue reported during service execution.", escalateTo: "operations_supervisor" },
    { triggerStage: "quality_inspection", triggerCondition: "Quality inspection identifies a defect requiring rework.", escalateTo: "operations_supervisor" },
    { triggerStage: "exception", triggerCondition: "Exception outside the standard delivery path is recorded.", escalateTo: "grand_king_advisory" },
  ];
  return {
    escalationWorkflowId: nextEscalationWorkflowId(),
    workflowId: workflow.workflowId,
    bookingId: workflow.bookingId,
    rules: rules.map((rule, index) => ({
      ruleId: `${workflow.workflowId}-esc-${index + 1}`,
      sequence: index + 1,
      triggerStage: rule.triggerStage,
      triggerCondition: rule.triggerCondition,
      escalateTo: rule.escalateTo,
    })),
    createdAt: now,
    designOnly: true,
    notes: ["Structural escalation routing design — never executes an escalation itself."],
  };
}

export function provideCompletionWorkflow(workflow: ServiceDeliveryWorkflow): CompletionWorkflow {
  const now = new Date().toISOString();
  const steps: Array<{ stage: string; description: string }> = [
    { stage: "customer_sign_off", description: "Verify customer sign-off is recorded for the completed work." },
    { stage: "completion", description: "Verify all required fulfilment checklist items are marked resolved." },
    { stage: "completion", description: "Close the booking lifecycle as operationally complete (not a service-performance claim)." },
  ];
  return {
    completionWorkflowId: nextCompletionWorkflowId(),
    workflowId: workflow.workflowId,
    bookingId: workflow.bookingId,
    steps: steps.map((step, index) => ({
      stepId: `${workflow.workflowId}-complete-${index + 1}`,
      sequence: index + 1,
      stage: step.stage,
      description: step.description,
    })),
    signOffRequired: true,
    createdAt: now,
    designOnly: true,
    notes: ["Design only — completion status is a lifecycle marker, never a fabricated performance claim."],
  };
}

export function provideFollowUpWorkflow(workflow: ServiceDeliveryWorkflow): FollowUpWorkflow {
  const now = new Date().toISOString();
  const steps: Array<{ description: string; timingOffsetDays: number }> = [
    { description: "Send structural satisfaction check-in touchpoint.", timingOffsetDays: 1 },
    { description: "Review for repeat-service or referral opportunity signal.", timingOffsetDays: 7 },
    { description: "Archive follow-up outcome into workflow audit history.", timingOffsetDays: 14 },
  ];
  return {
    followUpWorkflowId: nextFollowUpWorkflowId(),
    workflowId: workflow.workflowId,
    bookingId: workflow.bookingId,
    steps: steps.map((step, index) => ({
      stepId: `${workflow.workflowId}-followup-${index + 1}`,
      sequence: index + 1,
      description: step.description,
      timingOffsetDays: step.timingOffsetDays,
    })),
    createdAt: now,
    designOnly: true,
    notes: ["Structural follow-up touchpoint design — never claims a follow-up was actually sent."],
  };
}

export function provideExceptionManagement(workflow: ServiceDeliveryWorkflow): ExceptionManagement {
  const now = new Date().toISOString();
  const steps: string[] = [
    "Detect deviation from the designed operational stage sequence.",
    "Classify the exception against known handled exception types.",
    "Route the exception to the escalation workflow for resolution.",
    "Record the exception outcome in the workflow audit history.",
  ];
  return {
    exceptionManagementId: nextExceptionManagementId(),
    workflowId: workflow.workflowId,
    bookingId: workflow.bookingId,
    handledExceptionTypes: [
      "technician_unavailable",
      "customer_unreachable",
      "access_denied_on_site",
      "safety_concern_identified",
      "material_shortage",
    ],
    steps: steps.map((description, index) => ({
      stepId: `${workflow.workflowId}-exception-${index + 1}`,
      sequence: index + 1,
      description,
    })),
    createdAt: now,
    designOnly: true,
    notes: ["Structural exception-handling design — never asserts an exception actually occurred."],
  };
}
