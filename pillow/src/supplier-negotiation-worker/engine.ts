import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSupplierNegotiationWorkerConfiguration,
  type SupplierNegotiationWorkerConfiguration,
} from "./configuration.js";
import type { SupplierNegotiationWorkerDependencies } from "./integrations.js";
import { SupplierNegotiationWorkerController } from "./supplier-negotiation-worker-controller.js";
import { resetSnwLogsForTesting } from "./snw-logging.js";
import { SUPPLIER_NEGOTIATION_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetNegotiationSequenceForTesting } from "./negotiation-builder.js";
import { NegotiationManager } from "./negotiation-manager.js";
import type {
  SupplierNegotiationWorkerCockpitSnapshot,
  SupplierNegotiationWorkerInput,
  SupplierNegotiationWorkerState,
} from "./types.js";

export interface SupplierNegotiationWorkerOptions {
  configuration?: Partial<SupplierNegotiationWorkerConfiguration>;
  dependencies?: SupplierNegotiationWorkerDependencies;
}

/** Authoritative Q3-06 Supplier Negotiation Worker — preparation only. */
export class SupplierNegotiationWorker {
  private initializedAt: string | null = null;
  private readonly controller: SupplierNegotiationWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SupplierNegotiationWorkerOptions = {},
  ) {
    const manager = new NegotiationManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new SupplierNegotiationWorkerController(
      manager,
      buildSupplierNegotiationWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SUPPLIER_NEGOTIATION_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Supplier Negotiation Worker")) {
      throw new Error(
        `${SUPPLIER_NEGOTIATION_WORKER_SYSTEM_PATH} missing — Q3-06 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SupplierNegotiationWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): SupplierNegotiationWorkerState {
    if (!this.initializedAt) {
      throw new Error("Supplier Negotiation Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SNW-001",
      missionId: "Q3-06",
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
        totalNegotiations: engineRecord?.totalNegotiations ?? 0,
        lastNegotiationId: engineRecord?.lastNegotiationId ?? null,
        lastPreferredSupplierId: engineRecord?.lastPreferredSupplierId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Preparation-only: does not contact suppliers, commit agreements, place orders, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectSupplierNegotiationWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveSupplierEvaluationReports(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.receiveEvaluationReports(input);
  }

  compareSuppliers(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.compareSuppliers(input);
  }

  identifyNegotiationOpportunities(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.identifyOpportunities(input);
  }

  prepareMoqQuestions(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.prepareMoqQuestions(input);
  }

  preparePricingQuestions(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.preparePricingQuestions(input);
  }

  prepareShippingTerms(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.prepareShippingTerms(input);
  }

  prepareFulfilmentQuestions(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.prepareFulfilmentQuestions(input);
  }

  prepareRefundQuestions(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.prepareRefundQuestions(input);
  }

  prepareDraftNegotiationMessage(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.prepareDraftMessage(input);
  }

  recommendPreferredSupplier(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.recommendPreferred(input);
  }

  produceSupplierNegotiationReport(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listSupplierNegotiationReports() {
    return this.controller.list();
  }

  validateSupplierNegotiationWorker(input: SupplierNegotiationWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getNegotiations() {
    return this.controller.getManager().getNegotiations();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestNegotiationId() {
    return this.controller.getManager().getLatestNegotiationId();
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
        `Negotiations: ${state.health.totalNegotiations}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierNegotiationWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-06",
      status: state.status,
      healthStatus: state.health.status,
      totalNegotiations: state.health.totalNegotiations,
      latestNegotiationId: this.getLatestNegotiationId(),
      lastPreferredSupplierId: state.health.lastPreferredSupplierId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverContactSuppliers: true,
      neverCommitAgreements: true,
      neverPlaceOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createSupplierNegotiationWorker(
  bootstrap: EmpireBootstrapContext,
  options?: SupplierNegotiationWorkerOptions,
) {
  return new SupplierNegotiationWorker(bootstrap, options);
}

export function resetSupplierNegotiationWorkerForTesting() {
  resetSnwLogsForTesting();
  resetNegotiationSequenceForTesting();
}
