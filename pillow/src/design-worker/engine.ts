import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDesignWorkerConfiguration,
  type DesignWorkerConfiguration,
} from "./configuration.js";
import type { DesignWorkerDependencies } from "./integrations.js";
import { DesignWorkerController } from "./design-worker-controller.js";
import { resetDwLogsForTesting } from "./dw-logging.js";
import { DESIGN_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetDesignSequenceForTesting } from "./design-builder.js";
import { DesignManager } from "./design-manager.js";
import type {
  DesignWorkerCockpitSnapshot,
  DesignWorkerInput,
  DesignWorkerState,
} from "./types.js";

export interface DesignWorkerOptions {
  configuration?: Partial<DesignWorkerConfiguration>;
  dependencies?: DesignWorkerDependencies;
}

/** Authoritative Q5-07 Design Worker — visual design assets only (structural signals). */
export class DesignWorker {
  private initializedAt: string | null = null;
  private readonly controller: DesignWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DesignWorkerOptions = {},
  ) {
    const manager = new DesignManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new DesignWorkerController(
      manager,
      buildDesignWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      DESIGN_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Design Worker")) {
      throw new Error(
        `${DESIGN_WORKER_SYSTEM_PATH} missing — Q5-07 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: DesignWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): DesignWorkerState {
    if (!this.initializedAt) {
      throw new Error("Design Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-DW-001",
      missionId: "Q5-07",
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
        totalDesignReports: engineRecord?.totalDesignReports ?? 0,
        lastDesignReportId: engineRecord?.lastDesignReportId ?? null,
        lastProductType: engineRecord?.lastProductType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Design-only: does not build sales pages, process payments, deliver products, publish assets/products directly, override Pillow or Grand King, or implement Q5-08 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedDigitalProductInformation(input: DesignWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductInformation(input);
  }

  /** Alias for factory consistency — same as receiveApprovedDigitalProductInformation. */
  receiveApprovedDigitalProductResearch(input: DesignWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductInformation(input);
  }

  generateEbookCovers(input: DesignWorkerInput = {}) {
    return this.controller.generateEbookCovers(input);
  }

  generateCourseCovers(input: DesignWorkerInput = {}) {
    return this.controller.generateCourseCovers(input);
  }

  generateProductBrandingAssets(input: DesignWorkerInput = {}) {
    return this.controller.generateProductBrandingAssets(input);
  }

  generatePromotionalGraphics(input: DesignWorkerInput = {}) {
    return this.controller.generatePromotionalGraphics(input);
  }

  generateRealisticProductMockups(input: DesignWorkerInput = {}) {
    return this.controller.generateRealisticProductMockups(input);
  }

  generatePreviewImages(input: DesignWorkerInput = {}) {
    return this.controller.generatePreviewImages(input);
  }

  maintainVisualBrandingConsistency(input: DesignWorkerInput = {}) {
    return this.controller.maintainVisualBrandingConsistency(input);
  }

  prepareExportReadyDesignAssets(input: DesignWorkerInput = {}) {
    return this.controller.prepareExportReadyDesignAssets(input);
  }

  produceDesignWorkerReport(input: DesignWorkerInput = {}) {
    return this.controller.produceDesignWorkerReport(input);
  }

  submitReport(input: DesignWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: DesignWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getDesignReports() {
    return this.controller.getManager().getDesignReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestDesignReportId() {
    return this.controller.getManager().getLatestDesignReportId();
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
        `Design reports: ${state.health.totalDesignReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DesignWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-07",
      status: state.status,
      healthStatus: state.health.status,
      totalDesignReports: state.health.totalDesignReports,
      latestDesignReportId: this.getLatestDesignReportId(),
      lastProductType: state.health.lastProductType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishAssetsDirectly: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createDesignWorker(
  bootstrap: EmpireBootstrapContext,
  options?: DesignWorkerOptions,
) {
  return new DesignWorker(bootstrap, options);
}

export function resetDesignWorkerForTesting() {
  resetDwLogsForTesting();
  resetDesignSequenceForTesting();
}
