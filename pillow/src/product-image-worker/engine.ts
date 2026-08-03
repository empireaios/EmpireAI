import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProductImageWorkerConfiguration,
  type ProductImageWorkerConfiguration,
} from "./configuration.js";
import type { ProductImageWorkerDependencies } from "./integrations.js";
import { ProductImageWorkerController } from "./product-image-worker-controller.js";
import { resetPiwLogsForTesting } from "./piw-logging.js";
import { PRODUCT_IMAGE_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetImageSequenceForTesting } from "./image-builder.js";
import { ImageManager } from "./image-manager.js";
import type {
  ProductImageWorkerCockpitSnapshot,
  ProductImageWorkerInput,
  ProductImageWorkerState,
} from "./types.js";

export interface ProductImageWorkerOptions {
  configuration?: Partial<ProductImageWorkerConfiguration>;
  dependencies?: ProductImageWorkerDependencies;
}

/** Authoritative Q3-07 Product Image Worker — preparation only. */
export class ProductImageWorker {
  private initializedAt: string | null = null;
  private readonly controller: ProductImageWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ProductImageWorkerOptions = {},
  ) {
    const manager = new ImageManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ProductImageWorkerController(
      manager,
      buildProductImageWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PRODUCT_IMAGE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Product Image Worker")) {
      throw new Error(
        `${PRODUCT_IMAGE_WORKER_SYSTEM_PATH} missing — Q3-07 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ProductImageWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ProductImageWorkerState {
    if (!this.initializedAt) {
      throw new Error("Product Image Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PIW-001",
      missionId: "Q3-07",
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
        totalImageReports: engineRecord?.totalImageReports ?? 0,
        lastImageReportId: engineRecord?.lastImageReportId ?? null,
        lastImageQualityStatus: engineRecord?.lastImageQualityStatus ?? null,
        lastComplianceStatus: engineRecord?.lastComplianceStatus ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Preparation-only: does not publish listings, generate advertisements, contact suppliers, overwrite originals, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectProductImageWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedSupplierImages(input: ProductImageWorkerInput = {}) {
    return this.controller.receiveApprovedImages(input);
  }

  validateImageQuality(input: ProductImageWorkerInput = {}) {
    return this.controller.validateImageQuality(input);
  }

  detectDuplicateOrUnusableImages(input: ProductImageWorkerInput = {}) {
    return this.controller.detectDuplicates(input);
  }

  organizeProductImageSets(input: ProductImageWorkerInput = {}) {
    return this.controller.organizeImageSets(input);
  }

  prepareMarketplaceCompliantImages(input: ProductImageWorkerInput = {}) {
    return this.controller.prepareCompliantImages(input);
  }

  generateStandardizedImageVariants(input: ProductImageWorkerInput = {}) {
    return this.controller.generateVariants(input);
  }

  preserveImageMetadata(input: ProductImageWorkerInput = {}) {
    return this.controller.preserveMetadata(input);
  }

  validateMarketplaceCompliance(input: ProductImageWorkerInput = {}) {
    return this.controller.validateCompliance(input);
  }

  packageProductVisualAssets(input: ProductImageWorkerInput = {}) {
    return this.controller.packageAssets(input);
  }

  produceProductImageReport(input: ProductImageWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: ProductImageWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listProductImageReports() {
    return this.controller.list();
  }

  validateProductImageWorker(input: ProductImageWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getImageReports() {
    return this.controller.getManager().getImageReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestImageReportId() {
    return this.controller.getManager().getLatestImageReportId();
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
        `Image reports: ${state.health.totalImageReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProductImageWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-07",
      status: state.status,
      healthStatus: state.health.status,
      totalImageReports: state.health.totalImageReports,
      latestImageReportId: this.getLatestImageReportId(),
      lastImageQualityStatus: state.health.lastImageQualityStatus,
      lastComplianceStatus: state.health.lastComplianceStatus,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverPublishListings: true,
      neverGenerateAdvertisements: true,
      neverContactSuppliers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverOverwriteOriginalSourceAssets: true,
    };
  }
}

export function createProductImageWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ProductImageWorkerOptions,
) {
  return new ProductImageWorker(bootstrap, options);
}

export function resetProductImageWorkerForTesting() {
  resetPiwLogsForTesting();
  resetImageSequenceForTesting();
}
