import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildOperationsWorkerConfiguration,
  type OperationsWorkerConfiguration,
} from "./configuration.js";
import type { OperationsWorkerDependencies } from "./integrations.js";
import { OperationsManager } from "./operations-manager.js";
import { OperationsWorkerController } from "./operations-worker-controller.js";
import { resetOpsLogsForTesting } from "./ops-logging.js";
import { OPERATIONS_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetOpsSequenceForTesting } from "./workflow-builder.js";
import type {
  OperationsWorkerCockpitSnapshot,
  OperationsWorkerState,
  OpsInput,
  Q710ConsumableContract,
} from "./types.js";

export interface OperationsWorkerOptions {
  configuration?: Partial<OperationsWorkerConfiguration>;
  dependencies?: OperationsWorkerDependencies;
}

/** Authoritative Q7-09 Operations Worker — structural service delivery workflow design only. */
export class OperationsWorker {
  private initializedAt: string | null = null;
  private readonly controller: OperationsWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: OperationsWorkerOptions = {},
  ) {
    const manager = new OperationsManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new OperationsWorkerController(
      manager,
      buildOperationsWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      OPERATIONS_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Operations Worker")) {
      throw new Error(`${OPERATIONS_WORKER_SYSTEM_PATH} missing — Q7-09 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: OperationsWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): OperationsWorkerState {
    if (!this.initializedAt) {
      throw new Error("Operations Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-OPSW-001",
      missionId: "Q7-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        totalWorkflows: engineRecord?.totalWorkflows ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastWorkflowId: engineRecord?.lastWorkflowId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Operations Worker designs structural service delivery workflows from approved bookings only: it never performs customer services, replaces the Booking/CRM/Lead Generation Workers, fabricates operational evidence, overrides approved architecture, overrides Pillow or Grand King, or implements Q7-10 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeApprovedBooking(input: OpsInput = {}) {
    return this.controller.consumeApprovedBooking(input);
  }

  generateServiceDeliveryWorkflow(input: OpsInput = {}) {
    return this.controller.generateServiceDeliveryWorkflow(input);
  }

  defineOperationalStages(input: OpsInput = {}) {
    return this.controller.defineOperationalStages(input);
  }

  defineTechnicianAssignmentWorkflow(input: OpsInput = {}) {
    return this.controller.defineTechnicianAssignmentWorkflow(input);
  }

  defineFulfilmentChecklist(input: OpsInput = {}) {
    return this.controller.defineFulfilmentChecklist(input);
  }

  defineQaCheckpoints(input: OpsInput = {}) {
    return this.controller.defineQaCheckpoints(input);
  }

  defineEscalationWorkflow(input: OpsInput = {}) {
    return this.controller.defineEscalationWorkflow(input);
  }

  defineCompletionWorkflow(input: OpsInput = {}) {
    return this.controller.defineCompletionWorkflow(input);
  }

  defineFollowUpWorkflow(input: OpsInput = {}) {
    return this.controller.defineFollowUpWorkflow(input);
  }

  produceOperationsReport(input: OpsInput = {}) {
    return this.controller.produceOperationsReport(input);
  }

  produceReport(input: OpsInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: OpsInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getWorkflows() {
    return this.controller.getManager().getWorkflows();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  validate(input: OpsInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReportId() {
    return this.controller.getManager().getLatestReportId();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Operations reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OperationsWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-09",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalWorkflows: state.health.totalWorkflows,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateOperationalEvidence: true,
      neverPerformCustomerServices: true,
      neverReplaceBookingWorker: true,
      neverReplaceCrmWorker: true,
      neverReplaceLeadGenerationWorker: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ710OrLater: true,
      consumableByQ710: true,
    };
  }

  getQ710ConsumableContract(): Q710ConsumableContract {
    return {
      contractVersion: "OPSW-Q710-v1",
      consumableByQ710: true,
      fields: [
        "reportId",
        "businessProjectId",
        "workflowId",
        "serviceType",
        "operationalStages",
        "assignmentWorkflow",
        "fulfilmentChecklist",
        "qaCheckpoints",
        "escalationWorkflow",
        "completionWorkflow",
        "followUpWorkflow",
        "exceptionManagement",
        "sourceBookingId",
        "sourceLeadGenReportId",
        "outstandingIssues",
        "confidenceScore",
        "traceabilityRefs",
      ] as const,
      types: {
        OperationsReport: "OperationsReport",
        ServiceDeliveryWorkflow: "ServiceDeliveryWorkflow",
        TechnicianAssignmentWorkflow: "TechnicianAssignmentWorkflow",
        FulfilmentChecklist: "FulfilmentChecklist",
        QaCheckpoints: "QaCheckpoints",
        EscalationWorkflow: "EscalationWorkflow",
        CompletionWorkflow: "CompletionWorkflow",
        FollowUpWorkflow: "FollowUpWorkflow",
      },
      notes: [
        "Q7-10 may consume structural service delivery workflow and design packages only.",
        "Workflows are structural designs derived from approved booking fixtures — never fabricated execution evidence.",
        "Ops never performs customer services, replaces Booking/CRM/Lead Generation Workers, or overrides Pillow/Grand King.",
      ],
      neverFabricateOperationalEvidence: true,
      neverPerformCustomerServices: true,
      neverReplaceBookingWorker: true,
      neverReplaceCrmWorker: true,
      neverReplaceLeadGenerationWorker: true,
    };
  }
}

export function createOperationsWorker(
  bootstrap: EmpireBootstrapContext,
  options?: OperationsWorkerOptions,
) {
  return new OperationsWorker(bootstrap, options);
}

export function resetOperationsWorkerForTesting() {
  resetOpsLogsForTesting();
  resetOpsSequenceForTesting();
}
