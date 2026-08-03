import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSupplierEvaluationWorkerConfiguration,
  type SupplierEvaluationWorkerConfiguration,
} from "./configuration.js";
import type { SupplierEvaluationWorkerDependencies } from "./integrations.js";
import { SupplierEvaluationWorkerController } from "./supplier-evaluation-worker-controller.js";
import { resetSewLogsForTesting } from "./sew-logging.js";
import { SUPPLIER_EVALUATION_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetEvaluationSequenceForTesting } from "./evaluation-builder.js";
import { EvaluationManager } from "./evaluation-manager.js";
import type {
  SupplierEvaluationWorkerCockpitSnapshot,
  SupplierEvaluationWorkerInput,
  SupplierEvaluationWorkerState,
} from "./types.js";

export interface SupplierEvaluationWorkerOptions {
  configuration?: Partial<SupplierEvaluationWorkerConfiguration>;
  dependencies?: SupplierEvaluationWorkerDependencies;
}

/** Authoritative Q3-05 Supplier Evaluation Worker — evaluation only. */
export class SupplierEvaluationWorker {
  private initializedAt: string | null = null;
  private readonly controller: SupplierEvaluationWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SupplierEvaluationWorkerOptions = {},
  ) {
    const manager = new EvaluationManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new SupplierEvaluationWorkerController(
      manager,
      buildSupplierEvaluationWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SUPPLIER_EVALUATION_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Supplier Evaluation Worker")) {
      throw new Error(
        `${SUPPLIER_EVALUATION_WORKER_SYSTEM_PATH} missing — Q3-05 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SupplierEvaluationWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): SupplierEvaluationWorkerState {
    if (!this.initializedAt) {
      throw new Error("Supplier Evaluation Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SEW-001",
      missionId: "Q3-05",
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
        totalEvaluations: engineRecord?.totalEvaluations ?? 0,
        lastEvaluationId: engineRecord?.lastEvaluationId ?? null,
        lastOverallScore: engineRecord?.lastOverallScore ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Evaluation-only: does not discover suppliers, negotiate, place orders, modify supplier information, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectSupplierEvaluationWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveSupplierDiscoveryReports(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.receiveDiscoveryReports(input);
  }

  evaluateReliability(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.evaluateReliability(input);
  }

  evaluatePricing(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.evaluatePricing(input);
  }

  evaluateShipping(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.evaluateShipping(input);
  }

  evaluateRefundPolicy(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.evaluateRefundPolicy(input);
  }

  evaluateFulfilmentQuality(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.evaluateFulfilmentQuality(input);
  }

  evaluateCommunication(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.evaluateCommunication(input);
  }

  evaluateRisk(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.evaluateRisk(input);
  }

  generateOverallScore(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.generateOverallScore(input);
  }

  recommendAction(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.recommend(input);
  }

  produceSupplierEvaluationReport(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listSupplierEvaluationReports() {
    return this.controller.list();
  }

  validateSupplierEvaluationWorker(input: SupplierEvaluationWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getEvaluations() {
    return this.controller.getManager().getEvaluations();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestEvaluationId() {
    return this.controller.getManager().getLatestEvaluationId();
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
        `Evaluations: ${state.health.totalEvaluations}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierEvaluationWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-05",
      status: state.status,
      healthStatus: state.health.status,
      totalEvaluations: state.health.totalEvaluations,
      latestEvaluationId: this.getLatestEvaluationId(),
      lastOverallScore: state.health.lastOverallScore,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverDiscoverSuppliers: true,
      neverNegotiateSuppliers: true,
      neverPlaceSupplierOrders: true,
      neverModifySupplierInformation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createSupplierEvaluationWorker(
  bootstrap: EmpireBootstrapContext,
  options?: SupplierEvaluationWorkerOptions,
) {
  return new SupplierEvaluationWorker(bootstrap, options);
}

export function resetSupplierEvaluationWorkerForTesting() {
  resetSewLogsForTesting();
  resetEvaluationSequenceForTesting();
}
