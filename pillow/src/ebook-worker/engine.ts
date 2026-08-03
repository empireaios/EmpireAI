import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEbookWorkerConfiguration,
  type EbookWorkerConfiguration,
} from "./configuration.js";
import type { EbookWorkerDependencies } from "./integrations.js";
import { EbookWorkerController } from "./ebook-worker-controller.js";
import { resetEbwLogsForTesting } from "./ebw-logging.js";
import { EBOOK_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetEbookSequenceForTesting } from "./ebook-builder.js";
import { EbookManager } from "./ebook-manager.js";
import type {
  EbookWorkerCockpitSnapshot,
  EbookWorkerInput,
  EbookWorkerState,
} from "./types.js";

export interface EbookWorkerOptions {
  configuration?: Partial<EbookWorkerConfiguration>;
  dependencies?: EbookWorkerDependencies;
}

/** Authoritative Q5-03 Ebook Worker — written digital product creation only. */
export class EbookWorker {
  private initializedAt: string | null = null;
  private readonly controller: EbookWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EbookWorkerOptions = {},
  ) {
    const manager = new EbookManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new EbookWorkerController(
      manager,
      buildEbookWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EBOOK_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Ebook Worker")) {
      throw new Error(
        `${EBOOK_WORKER_SYSTEM_PATH} missing — Q5-03 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: EbookWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): EbookWorkerState {
    if (!this.initializedAt) {
      throw new Error("Ebook Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-EBW-001",
      missionId: "Q5-03",
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
        totalEbooks: engineRecord?.totalEbooks ?? 0,
        lastEbookId: engineRecord?.lastEbookId ?? null,
        lastProductType: engineRecord?.lastProductType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Ebook-only: does not build sales pages, process payments, deliver products to customers, publish products directly, override Pillow or Grand King, or implement Q5-04 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedDigitalProductResearch(input: EbookWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductResearch(input);
  }

  createProductOutline(input: EbookWorkerInput = {}) {
    return this.controller.createProductOutline(input);
  }

  createChapterStructure(input: EbookWorkerInput = {}) {
    return this.controller.createChapterStructure(input);
  }

  generateCompleteWrittenContent(input: EbookWorkerInput = {}) {
    return this.controller.generateCompleteWrittenContent(input);
  }

  generateTablesChecklistsAndSummaries(input: EbookWorkerInput = {}) {
    return this.controller.generateTablesChecklistsAndSummaries(input);
  }

  generateReferencesAndAppendices(input: EbookWorkerInput = {}) {
    return this.controller.generateReferencesAndAppendices(input);
  }

  applyConsistentFormatting(input: EbookWorkerInput = {}) {
    return this.controller.applyConsistentFormatting(input);
  }

  performSelfReview(input: EbookWorkerInput = {}) {
    return this.controller.performSelfReview(input);
  }

  selfReviewEbook(input: EbookWorkerInput = {}) {
    return this.controller.selfReviewEbook(input);
  }

  prepareExportReadyEbookAssets(input: EbookWorkerInput = {}) {
    return this.controller.prepareExportReadyEbookAssets(input);
  }

  produceEbookReport(input: EbookWorkerInput = {}) {
    return this.controller.produceEbookReport(input);
  }

  submitReport(input: EbookWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: EbookWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getEbooks() {
    return this.controller.getManager().getEbooks();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestEbookId() {
    return this.controller.getManager().getLatestEbookId();
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
        `Ebooks: ${state.health.totalEbooks}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EbookWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-03",
      status: state.status,
      healthStatus: state.health.status,
      totalEbooks: state.health.totalEbooks,
      latestEbookId: this.getLatestEbookId(),
      lastProductType: state.health.lastProductType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProductsToCustomers: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createEbookWorker(
  bootstrap: EmpireBootstrapContext,
  options?: EbookWorkerOptions,
) {
  return new EbookWorker(bootstrap, options);
}

export function resetEbookWorkerForTesting() {
  resetEbwLogsForTesting();
  resetEbookSequenceForTesting();
}
