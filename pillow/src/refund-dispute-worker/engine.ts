import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRefundDisputeWorkerConfiguration,
  type RefundDisputeWorkerConfiguration,
} from "./configuration.js";
import type { RefundDisputeWorkerDependencies } from "./integrations.js";
import { RefundDisputeWorkerController } from "./refund-dispute-worker-controller.js";
import { resetRdwLogsForTesting } from "./rdw-logging.js";
import { REFUND_DISPUTE_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetCaseSequenceForTesting } from "./case-builder.js";
import { CaseManager } from "./case-manager.js";
import type {
  RefundDisputeWorkerCockpitSnapshot,
  RefundDisputeWorkerInput,
  RefundDisputeWorkerState,
} from "./types.js";

export interface RefundDisputeWorkerOptions {
  configuration?: Partial<RefundDisputeWorkerConfiguration>;
  dependencies?: RefundDisputeWorkerDependencies;
}

/** Authoritative Q3-12 Refund & Dispute Worker — case workflow tracking only. */
export class RefundDisputeWorker {
  private initializedAt: string | null = null;
  private readonly controller: RefundDisputeWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: RefundDisputeWorkerOptions = {},
  ) {
    const manager = new CaseManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new RefundDisputeWorkerController(
      manager,
      buildRefundDisputeWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      REFUND_DISPUTE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Refund & Dispute Worker")) {
      throw new Error(
        `${REFUND_DISPUTE_WORKER_SYSTEM_PATH} missing — Q3-12 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: RefundDisputeWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): RefundDisputeWorkerState {
    if (!this.initializedAt) {
      throw new Error("Refund & Dispute Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RDW-001",
      missionId: "Q3-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalCases: engineRecord?.totalCases ?? 0,
        lastCaseId: engineRecord?.lastCaseId ?? null,
        lastCaseType: engineRecord?.lastCaseType ?? null,
        lastCaseStatus: engineRecord?.lastCaseStatus ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Workflow-only: does not modify financial ledgers, override marketplace policies, authorize outside Authority Matrix, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectRefundDisputeWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveRefundRequests(input: RefundDisputeWorkerInput = {}) {
    return this.controller.receiveRefundRequest(input);
  }

  receiveReturnRequests(input: RefundDisputeWorkerInput = {}) {
    return this.controller.receiveReturnRequest(input);
  }

  receiveCustomerDisputes(input: RefundDisputeWorkerInput = {}) {
    return this.controller.receiveCustomerDispute(input);
  }

  classifyCaseTypes(input: RefundDisputeWorkerInput = {}) {
    return this.controller.classifyCaseType(input);
  }

  validateRequestsAgainstPolicies(input: RefundDisputeWorkerInput = {}) {
    return this.controller.validateAgainstPolicies(input);
  }

  trackCaseStatus(input: RefundDisputeWorkerInput = {}) {
    return this.controller.trackCaseStatus(input);
  }

  coordinateWithSuppliers(input: RefundDisputeWorkerInput = {}) {
    return this.controller.coordinateWithSupplier(input);
  }

  generateCustomerCommunications(input: RefundDisputeWorkerInput = {}) {
    return this.controller.generateCustomerCommunications(input);
  }

  escalateExceptionalCases(input: RefundDisputeWorkerInput = {}) {
    return this.controller.escalateExceptionalCases(input);
  }

  recordFinalCaseOutcomes(input: RefundDisputeWorkerInput = {}) {
    return this.controller.recordFinalOutcome(input);
  }

  produceRefundDisputeReport(input: RefundDisputeWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: RefundDisputeWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listRefundDisputeReports() {
    return this.controller.list();
  }

  validateRefundDisputeWorker(input: RefundDisputeWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getCases() {
    return this.controller.getManager().getCases();
  }

  getRefundDisputeReports() {
    return this.controller.getManager().getRefundDisputeReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestCaseId() {
    return this.controller.getManager().getLatestCaseId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
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
        `Cases: ${state.health.totalCases}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RefundDisputeWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-12",
      status: state.status,
      healthStatus: state.health.status,
      totalCases: state.health.totalCases,
      latestCaseId: this.getLatestCaseId(),
      lastCaseType: state.health.lastCaseType,
      lastCaseStatus: state.health.lastCaseStatus,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverModifyFinancialLedgersDirectly: true,
      neverOverrideMarketplacePolicies: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverAuthorizeOutsideAuthorityMatrix: true,
    };
  }
}

export function createRefundDisputeWorker(
  bootstrap: EmpireBootstrapContext,
  options?: RefundDisputeWorkerOptions,
) {
  return new RefundDisputeWorker(bootstrap, options);
}

export function resetRefundDisputeWorkerForTesting() {
  resetRdwLogsForTesting();
  resetCaseSequenceForTesting();
}
