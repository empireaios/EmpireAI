import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProductDiscoveryWorkerConfiguration,
  type ProductDiscoveryWorkerConfiguration,
} from "./configuration.js";
import type { ProductDiscoveryWorkerDependencies } from "./integrations.js";
import { ProductDiscoveryWorkerController } from "./product-discovery-worker-controller.js";
import { resetPdwLogsForTesting } from "./pdw-logging.js";
import { PRODUCT_DISCOVERY_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetDiscoverySequenceForTesting } from "./discovery-builder.js";
import { DiscoveryManager } from "./discovery-manager.js";
import type {
  ProductDiscoveryWorkerCockpitSnapshot,
  ProductDiscoveryWorkerInput,
  ProductDiscoveryWorkerState,
} from "./types.js";

export interface ProductDiscoveryWorkerOptions {
  configuration?: Partial<ProductDiscoveryWorkerConfiguration>;
  dependencies?: ProductDiscoveryWorkerDependencies;
}

/** Authoritative Q3-02 Product Discovery Worker — discovery only. */
export class ProductDiscoveryWorker {
  private initializedAt: string | null = null;
  private readonly controller: ProductDiscoveryWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ProductDiscoveryWorkerOptions = {},
  ) {
    const manager = new DiscoveryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ProductDiscoveryWorkerController(
      manager,
      buildProductDiscoveryWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PRODUCT_DISCOVERY_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Product Discovery Worker")) {
      throw new Error(
        `${PRODUCT_DISCOVERY_WORKER_SYSTEM_PATH} missing — Q3-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ProductDiscoveryWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ProductDiscoveryWorkerState {
    if (!this.initializedAt) {
      throw new Error("Product Discovery Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PDW-001",
      missionId: "Q3-02",
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
        totalDiscoveries: engineRecord?.totalDiscoveries ?? 0,
        lastDiscoveryId: engineRecord?.lastDiscoveryId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Discovery-only: does not evaluate/rank products, select suppliers, build listings, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectProductDiscoveryWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  discoverFromMarketplaces(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.discoverMarketplaces(input);
  }

  discoverFromSuppliers(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.discoverSuppliers(input);
  }

  discoverFromSearchTrends(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.discoverSearchTrends(input);
  }

  discoverFromCustomerDemand(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.discoverCustomerDemand(input);
  }

  discoverSeasonalOpportunities(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.discoverSeasonal(input);
  }

  detectEmergingTrends(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.detectEmergingTrends(input);
  }

  detectDecliningProducts(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.detectDecliningProducts(input);
  }

  categorizeDiscoveredProducts(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.categorizeProducts(input);
  }

  produceProductDiscoveryReport(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listProductDiscoveryReports() {
    return this.controller.list();
  }

  validateProductDiscoveryWorker(input: ProductDiscoveryWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getDiscoveries() {
    return this.controller.getManager().getDiscoveries();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestDiscoveryId() {
    return this.controller.getManager().getLatestDiscoveryId();
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
        `Discoveries: ${state.health.totalDiscoveries}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProductDiscoveryWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-02",
      status: state.status,
      healthStatus: state.health.status,
      totalDiscoveries: state.health.totalDiscoveries,
      latestDiscoveryId: this.getLatestDiscoveryId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverEvaluateProducts: true,
      neverRankProducts: true,
      neverSelectSuppliers: true,
      neverBuildListings: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createProductDiscoveryWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ProductDiscoveryWorkerOptions,
) {
  return new ProductDiscoveryWorker(bootstrap, options);
}

export function resetProductDiscoveryWorkerForTesting() {
  resetPdwLogsForTesting();
  resetDiscoverySequenceForTesting();
}
