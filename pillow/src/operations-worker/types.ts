import type { BookingReport } from "../booking-worker/types.js";
import type { LeadGenerationReport } from "../lead-generation-worker/types.js";
import type { OperationsWorkerConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STAGES,
  OPERATIONAL_STATES,
  OPSW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type OperationsWorkerCapability = (typeof OPSW_CAPABILITIES)[number];
/** Operational stage vocabulary is extensible — known values plus any custom string. */
export type OperationalStage = (typeof OPERATIONAL_STAGES)[number] | string;

export type { BookingReport, LeadGenerationReport };

/** Deterministic fixture mirroring an approved BookingReport shape for tests / offline design. */
export type ApprovedBookingFixture = {
  bookingId?: string;
  businessProjectId?: string;
  bookingStatus?: string;
  serviceType?: string;
  city?: string;
  area?: string;
  country?: string | null;
  confirmedAt?: string;
  customerReference?: string;
  assignedWorker?: string | null;
};

/** Deterministic fixture mirroring a LeadGenerationReport shape for tests / offline context. */
export type LeadGenerationFixture = {
  reportId?: string;
  businessProjectId?: string;
  funnelId?: string;
  leadSource?: string;
  confidenceScore?: number;
};

/** Resolved and confirmed booking context threaded through workflow design calls. */
export type BookingContext = {
  bookingId: string;
  businessProjectId: string;
  serviceType: string;
  city: string;
  area: string;
  country: string | null;
  confirmedAt: string;
  bookingStatus: string;
  source: "fixtureBooking" | "bookingReport" | "bookingWorker" | "none";
  resolvedAt: string;
};

export type OperationalStageDefinition = {
  stageId: string;
  workflowId: string;
  stage: OperationalStage;
  sequence: number;
  name: string;
  description: string;
  dependencies: string[];
  status: "planned";
  notes: string[];
};

export type ServiceDeliveryWorkflow = {
  workflowId: string;
  businessProjectId: string;
  bookingId: string;
  serviceType: string;
  city: string;
  area: string;
  country: string | null;
  stages: OperationalStageDefinition[];
  createdAt: string;
  updatedAt: string;
  status: "draft" | "designed" | "archived";
  designOnly: true;
  notes: string[];
};

export type TechnicianAssignmentStep = {
  stepId: string;
  sequence: number;
  description: string;
};

export type TechnicianAssignmentWorkflow = {
  assignmentWorkflowId: string;
  workflowId: string;
  bookingId: string;
  serviceType: string;
  assignmentCriteria: string[];
  candidateRoles: string[];
  steps: TechnicianAssignmentStep[];
  fallbackStrategy: string;
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type FulfilmentChecklistItem = {
  itemId: string;
  sequence: number;
  stage: OperationalStage;
  description: string;
  required: boolean;
};

export type FulfilmentChecklist = {
  checklistId: string;
  workflowId: string;
  bookingId: string;
  items: FulfilmentChecklistItem[];
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type QaCheckpoint = {
  checkpointId: string;
  sequence: number;
  stage: OperationalStage;
  criterion: string;
  required: boolean;
};

export type QaCheckpoints = {
  qaCheckpointsId: string;
  workflowId: string;
  bookingId: string;
  checkpoints: QaCheckpoint[];
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type EscalationRule = {
  ruleId: string;
  sequence: number;
  triggerStage: OperationalStage;
  triggerCondition: string;
  escalateTo: string;
};

export type EscalationWorkflow = {
  escalationWorkflowId: string;
  workflowId: string;
  bookingId: string;
  rules: EscalationRule[];
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type CompletionStep = {
  stepId: string;
  sequence: number;
  stage: OperationalStage;
  description: string;
};

export type CompletionWorkflow = {
  completionWorkflowId: string;
  workflowId: string;
  bookingId: string;
  steps: CompletionStep[];
  signOffRequired: boolean;
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type FollowUpStep = {
  stepId: string;
  sequence: number;
  description: string;
  timingOffsetDays: number;
};

export type FollowUpWorkflow = {
  followUpWorkflowId: string;
  workflowId: string;
  bookingId: string;
  steps: FollowUpStep[];
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type CancellationStep = {
  stepId: string;
  sequence: number;
  description: string;
};

export type CancellationWorkflow = {
  cancellationWorkflowId: string;
  workflowId: string;
  bookingId: string;
  steps: CancellationStep[];
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type ExceptionStep = {
  stepId: string;
  sequence: number;
  description: string;
};

export type ExceptionManagement = {
  exceptionManagementId: string;
  workflowId: string;
  bookingId: string;
  handledExceptionTypes: string[];
  steps: ExceptionStep[];
  createdAt: string;
  designOnly: true;
  notes: string[];
};

export type OperationsWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OperationsReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  workflowId: string;
  serviceType: string;
  operationalStages: OperationalStageDefinition[];
  assignmentWorkflow: TechnicianAssignmentWorkflow | null;
  fulfilmentChecklist: FulfilmentChecklist | null;
  qaCheckpoints: QaCheckpoints | null;
  escalationWorkflow: EscalationWorkflow | null;
  completionWorkflow: CompletionWorkflow | null;
  followUpWorkflow: FollowUpWorkflow | null;
  cancellationWorkflow?: CancellationWorkflow | null;
  exceptionManagement: ExceptionManagement | null;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  sourceBookingId: string;
  sourceLeadGenReportId: string | null;
  validation: OperationsWorkerValidationReport;
  runTimestamp: string;
  consumableByQ710: true;
  neverFabricateOperationalEvidence: true;
  neverPerformCustomerServices: true;
  neverReplaceBookingWorker: true;
  neverReplaceCrmWorker: true;
  neverReplaceLeadGenerationWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ710OrLater: true;
  preserveCompleteOperationalTraceability: true;
  preserveWorkflowAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
};

export type OpsInput = {
  reportId?: string | null;
  workflowId?: string | null;
  businessProjectId?: string | null;
  bookingId?: string | null;
  serviceType?: string | null;
  city?: string | null;
  area?: string | null;
  country?: string | null;
  bookingReport?: BookingReport | null;
  fixtureBooking?: ApprovedBookingFixture | null;
  leadGenerationReport?: LeadGenerationReport | null;
  fixtureLeadGeneration?: LeadGenerationFixture | null;
  additionalStages?: string[] | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  performCustomerServices?: boolean;
  replaceBookingWorker?: boolean;
  replaceCrmWorker?: boolean;
  replaceLeadGenerationWorker?: boolean;
  fabricateOperationalEvidence?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ710OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type OperationsWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-OPSW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: OperationsWorkerCapability[];
  totalReports: number;
  totalWorkflows: number;
  lastWorkflowId: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type OperationsWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: OperationsReport[];
  workflows: ServiceDeliveryWorkflow[];
  assignmentWorkflows: TechnicianAssignmentWorkflow[];
  checklists: FulfilmentChecklist[];
  qaCheckpoints: QaCheckpoints[];
  escalationWorkflows: EscalationWorkflow[];
  completionWorkflows: CompletionWorkflow[];
  followUpWorkflows: FollowUpWorkflow[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateOperationalEvidence: true;
  neverPerformCustomerServices: true;
  neverReplaceBookingWorker: true;
  neverReplaceCrmWorker: true;
  neverReplaceLeadGenerationWorker: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ710OrLater: true;
  consumableByQ710: true;
};

export type OperationsWorkerRunReport = {
  opswRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consume_approved_booking"
    | "generate_service_delivery_workflow"
    | "define_operational_stages"
    | "define_technician_assignment_workflow"
    | "define_fulfilment_checklist"
    | "define_qa_checkpoints"
    | "define_escalation_workflow"
    | "define_completion_workflow"
    | "define_follow_up_workflow"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: OperationsWorkerEngineRecord;
  catalog: OperationsWorkerCatalog | null;
  reports: OperationsReport[];
  workflows: ServiceDeliveryWorkflow[];
  latestReport: OperationsReport | null;
  latestWorkflow: ServiceDeliveryWorkflow | null;
  latestAssignmentWorkflow: TechnicianAssignmentWorkflow | null;
  latestChecklist: FulfilmentChecklist | null;
  latestQaCheckpoints: QaCheckpoints | null;
  latestEscalationWorkflow: EscalationWorkflow | null;
  latestCompletionWorkflow: CompletionWorkflow | null;
  latestFollowUpWorkflow: FollowUpWorkflow | null;
  latestBookingContext: BookingContext | null;
  integrations: IntegrationHandshake[];
  validation: OperationsWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OperationsWorkerState = {
  engineVersion: "PILLOW-OPSW-001";
  missionId: "Q7-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: OperationsWorkerConfiguration;
  latestReport: OperationsWorkerRunReport | null;
  engineRecord: OperationsWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalWorkflows: number;
    lastReportId: string | null;
    lastWorkflowId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type OperationsWorkerCockpitSnapshot = {
  missionId: "Q7-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalWorkflows: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateOperationalEvidence: true;
  neverPerformCustomerServices: true;
  neverReplaceBookingWorker: true;
  neverReplaceCrmWorker: true;
  neverReplaceLeadGenerationWorker: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ710OrLater: true;
  consumableByQ710: true;
};

/** Stable subset contract for Q7-10 downstream consumers. */
export type Q710ConsumableContract = {
  contractVersion: "OPSW-Q710-v1";
  consumableByQ710: true;
  fields: readonly string[];
  types: {
    OperationsReport: "OperationsReport";
    ServiceDeliveryWorkflow: "ServiceDeliveryWorkflow";
    TechnicianAssignmentWorkflow: "TechnicianAssignmentWorkflow";
    FulfilmentChecklist: "FulfilmentChecklist";
    QaCheckpoints: "QaCheckpoints";
    EscalationWorkflow: "EscalationWorkflow";
    CompletionWorkflow: "CompletionWorkflow";
    FollowUpWorkflow: "FollowUpWorkflow";
  };
  notes: string[];
  neverFabricateOperationalEvidence: true;
  neverPerformCustomerServices: true;
  neverReplaceBookingWorker: true;
  neverReplaceCrmWorker: true;
  neverReplaceLeadGenerationWorker: true;
};
