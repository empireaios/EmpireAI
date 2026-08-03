import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProductListingWorkerConfiguration,
  type ProductListingWorkerConfiguration,
} from "./configuration.js";
import type { ProductListingWorkerDependencies } from "./integrations.js";
import { ProductListingWorkerController } from "./product-listing-worker-controller.js";
import { resetPlwLogsForTesting } from "./plw-logging.js";
import { PRODUCT_LISTING_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetListingSequenceForTesting } from "./listing-builder.js";
import { ListingManager } from "./listing-manager.js";
import type {
  ProductListingWorkerCockpitSnapshot,
  ProductListingWorkerInput,
  ProductListingWorkerState,
} from "./types.js";

export interface ProductListingWorkerOptions {
  configuration?: Partial<ProductListingWorkerConfiguration>;
  dependencies?: ProductListingWorkerDependencies;
}

/** Authoritative Q3-08 Product Listing Worker — preparation only. */
export class ProductListingWorker {
  private initializedAt: string | null = null;
  private readonly controller: ProductListingWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ProductListingWorkerOptions = {},
  ) {
    const manager = new ListingManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ProductListingWorkerController(
      manager,
      buildProductListingWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PRODUCT_LISTING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Product Listing Worker")) {
      throw new Error(
        `${PRODUCT_LISTING_WORKER_SYSTEM_PATH} missing — Q3-08 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ProductListingWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ProductListingWorkerState {
    if (!this.initializedAt) {
      throw new Error("Product Listing Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PLW-001",
      missionId: "Q3-08",
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
        totalListings: engineRecord?.totalListings ?? 0,
        lastListingId: engineRecord?.lastListingId ?? null,
        lastListingValidationStatus: engineRecord?.lastListingValidationStatus ?? null,
        lastMarketplace: engineRecord?.lastMarketplace ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Preparation-only: does not publish listings, modify supplier information, modify pricing, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectProductListingWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedProductInformation(input: ProductListingWorkerInput = {}) {
    return this.controller.receiveProductInformation(input);
  }

  receiveApprovedProductImages(input: ProductListingWorkerInput = {}) {
    return this.controller.receiveProductImages(input);
  }

  generateProductTitles(input: ProductListingWorkerInput = {}) {
    return this.controller.generateTitles(input);
  }

  generateProductDescriptions(input: ProductListingWorkerInput = {}) {
    return this.controller.generateDescriptions(input);
  }

  generateProductBulletPoints(input: ProductListingWorkerInput = {}) {
    return this.controller.generateBulletPoints(input);
  }

  generateProductAttributes(input: ProductListingWorkerInput = {}) {
    return this.controller.generateAttributes(input);
  }

  generateProductVariants(input: ProductListingWorkerInput = {}) {
    return this.controller.generateVariants(input);
  }

  generateMarketplaceSeoFields(input: ProductListingWorkerInput = {}) {
    return this.controller.generateSeoFields(input);
  }

  validateRequiredListingFields(input: ProductListingWorkerInput = {}) {
    return this.controller.validateListingFields(input);
  }

  produceMarketplaceListingPackage(input: ProductListingWorkerInput = {}) {
    return this.controller.produceListingPackage(input);
  }

  produceProductListingReport(input: ProductListingWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: ProductListingWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listProductListingReports() {
    return this.controller.list();
  }

  validateProductListingWorker(input: ProductListingWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getListings() {
    return this.controller.getManager().getListings();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestListingId() {
    return this.controller.getManager().getLatestListingId();
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
        `Listings: ${state.health.totalListings}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProductListingWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-08",
      status: state.status,
      healthStatus: state.health.status,
      totalListings: state.health.totalListings,
      latestListingId: this.getLatestListingId(),
      lastListingValidationStatus: state.health.lastListingValidationStatus,
      lastMarketplace: state.health.lastMarketplace,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverPublishListings: true,
      neverModifySupplierInformation: true,
      neverModifyPricing: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createProductListingWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ProductListingWorkerOptions,
) {
  return new ProductListingWorker(bootstrap, options);
}

export function resetProductListingWorkerForTesting() {
  resetPlwLogsForTesting();
  resetListingSequenceForTesting();
}
