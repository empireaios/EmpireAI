import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProductEvaluationWorkerConfiguration,
  type ProductEvaluationWorkerConfiguration,
} from "./configuration.js";
import type { ProductEvaluationWorkerDependencies } from "./integrations.js";
import { ProductEvaluationWorkerController } from "./product-evaluation-worker-controller.js";
import { resetPewLogsForTesting } from "./pew-logging.js";
import { PRODUCT_EVALUATION_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetEvaluationSequenceForTesting } from "./evaluation-builder.js";
import { EvaluationManager } from "./evaluation-manager.js";
import type {
  ProductEvaluationWorkerCockpitSnapshot,
  ProductEvaluationWorkerInput,
  ProductEvaluationWorkerState,
} from "./types.js";

export interface ProductEvaluationWorkerOptions {
  configuration?: Partial<ProductEvaluationWorkerConfiguration>;
  dependencies?: ProductEvaluationWorkerDependencies;
}

/** Authoritative Q3-03 Product Evaluation Worker — evaluation only. */
export class ProductEvaluationWorker {
  private initializedAt: string | null = null;
  private readonly controller: ProductEvaluationWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ProductEvaluationWorkerOptions = {},
  ) {
    const manager = new EvaluationManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ProductEvaluationWorkerController(
      manager,
      buildProductEvaluationWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PRODUCT_EVALUATION_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Product Evaluation Worker")) {
      throw new Error(
        `${PRODUCT_EVALUATION_WORKER_SYSTEM_PATH} missing — Q3-03 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ProductEvaluationWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ProductEvaluationWorkerState {
    if (!this.initializedAt) {
      throw new Error("Product Evaluation Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PEW-001",
      missionId: "Q3-03",
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
          "Evaluation-only: does not discover products, select suppliers, create listings, purchase inventory, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectProductEvaluationWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveDiscoveredProducts(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.receiveDiscoveredProducts(input);
  }

  scoreMargin(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.scoreMargin(input);
  }

  scoreDemand(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.scoreDemand(input);
  }

  scoreCompetition(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.scoreCompetition(input);
  }

  scoreShipping(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.scoreShipping(input);
  }

  scoreRisk(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.scoreRisk(input);
  }

  scoreReviews(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.scoreReviews(input);
  }

  scoreCreativePotential(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.scoreCreativePotential(input);
  }

  generateOverallScore(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.generateOverallScore(input);
  }

  recommendAction(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.recommend(input);
  }

  produceProductEvaluationReport(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: ProductEvaluationWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listProductEvaluationReports() {
    return this.controller.list();
  }

  validateProductEvaluationWorker(input: ProductEvaluationWorkerInput = {}) {
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

  getCockpitSnapshot(): ProductEvaluationWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-03",
      status: state.status,
      healthStatus: state.health.status,
      totalEvaluations: state.health.totalEvaluations,
      latestEvaluationId: this.getLatestEvaluationId(),
      lastOverallScore: state.health.lastOverallScore,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverDiscoverProducts: true,
      neverSelectSuppliers: true,
      neverCreateListings: true,
      neverPurchaseInventory: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createProductEvaluationWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ProductEvaluationWorkerOptions,
) {
  return new ProductEvaluationWorker(bootstrap, options);
}

export function resetProductEvaluationWorkerForTesting() {
  resetPewLogsForTesting();
  resetEvaluationSequenceForTesting();
}
