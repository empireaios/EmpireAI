import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildApprovalRouterConfiguration,
  type ApprovalRouterConfiguration,
} from "./configuration.js";
import { ApprovalRouterController } from "./approval-router-controller.js";
import { ApprovalRouterManager } from "./approval-router-manager.js";
import { resetArLogsForTesting } from "./ar-logging.js";
import { resetApprovalSequenceForTesting } from "./approval-request-builder.js";
import { APPROVAL_ROUTER_SYSTEM_PATH } from "./paths.js";
import type {
  ApprovalRouterCockpitSnapshot,
  ApprovalRouterInput,
  ApprovalRouterState,
  ExecutionGateInput,
  RecordExternalOutcomeInput,
} from "./types.js";

export interface ApprovalRouterOptions {
  configuration?: Partial<ApprovalRouterConfiguration>;
}

/** Authoritative Q0-06 Approval Router — determines approval requirements and manages workflow. */
export class ApprovalRouter {
  private initializedAt: string | null = null;
  private readonly controller: ApprovalRouterController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ApprovalRouterOptions = {},
  ) {
    this.controller = new ApprovalRouterController(
      new ApprovalRouterManager(),
      buildApprovalRouterConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(APPROVAL_ROUTER_SYSTEM_PATH);
    if (!doc?.includes("Approval Router")) {
      throw new Error(`${APPROVAL_ROUTER_SYSTEM_PATH} missing — Q0-06 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ApprovalRouterState {
    if (!this.initializedAt) throw new Error("Approval Router not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const total = this.getRequests().length;
    const pending = this.getPendingQueue().length;
    return {
      engineVersion: "PILLOW-AR-001",
      missionId: "Q0-06",
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
        totalRequests: total,
        pendingCount: pending,
        notes: [
          "Routing only: does not approve requests, execute requests, assign workers, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectApprovalRouter(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  evaluateRequest(input: ApprovalRouterInput) {
    return this.controller.evaluateRequest(input);
  }

  routeRequest(input: ApprovalRouterInput) {
    return this.controller.routeRequest(input);
  }

  generateApprovalRequest(input: ApprovalRouterInput) {
    return this.controller.generateApprovalRequest(input);
  }

  listPendingQueue() {
    return this.controller.listPendingQueue();
  }

  listRequests() {
    return this.controller.listRequests();
  }

  recordExternalOutcome(input: RecordExternalOutcomeInput) {
    return this.controller.recordExternalOutcome(input);
  }

  checkExecutionGate(input: ExecutionGateInput) {
    return this.controller.checkExecutionGate(input);
  }

  validateApprovals() {
    return this.controller.validateApprovals();
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRequests() {
    return this.controller.getManager().getRequests();
  }

  getPendingQueue() {
    return this.controller.getManager().getPendingQueue();
  }

  getLatestRequest() {
    return this.controller.getManager().getLatestRequest();
  }

  getRequest(approvalId: string) {
    return this.controller.getManager().getRequest(approvalId);
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
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
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Requests: ${state.health.totalRequests}`,
        `Pending: ${state.health.pendingCount}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ApprovalRouterCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-06",
      status: state.status,
      healthStatus: state.health.status,
      totalRequests: state.health.totalRequests,
      pendingCount: state.health.pendingCount,
      latestApprovalId: this.getLatestRequest()?.approvalId ?? null,
      neverApproveRequests: true,
      neverExecuteRequests: true,
      neverAssignWorkers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createApprovalRouter(
  bootstrap: EmpireBootstrapContext,
  options?: ApprovalRouterOptions,
) {
  return new ApprovalRouter(bootstrap, options);
}

export function resetApprovalRouterForTesting() {
  resetArLogsForTesting();
  resetApprovalSequenceForTesting();
}
