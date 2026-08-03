import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPromptProductWorkerConfiguration,
  type PromptProductWorkerConfiguration,
} from "./configuration.js";
import type { PromptProductWorkerDependencies } from "./integrations.js";
import { PromptProductWorkerController } from "./prompt-product-worker-controller.js";
import { resetPpwLogsForTesting } from "./ppw-logging.js";
import { PROMPT_PRODUCT_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetPromptSequenceForTesting } from "./prompt-builder.js";
import { PromptManager } from "./prompt-manager.js";
import type {
  PromptProductWorkerCockpitSnapshot,
  PromptProductWorkerInput,
  PromptProductWorkerState,
} from "./types.js";

export interface PromptProductWorkerOptions {
  configuration?: Partial<PromptProductWorkerConfiguration>;
  dependencies?: PromptProductWorkerDependencies;
}

/** Authoritative Q5-04 Prompt Product Worker — prompt product creation only. */
export class PromptProductWorker {
  private initializedAt: string | null = null;
  private readonly controller: PromptProductWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PromptProductWorkerOptions = {},
  ) {
    const manager = new PromptManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new PromptProductWorkerController(
      manager,
      buildPromptProductWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PROMPT_PRODUCT_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Prompt Product Worker")) {
      throw new Error(
        `${PROMPT_PRODUCT_WORKER_SYSTEM_PATH} missing — Q5-04 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: PromptProductWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): PromptProductWorkerState {
    if (!this.initializedAt) {
      throw new Error("Prompt Product Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PPW-001",
      missionId: "Q5-04",
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
        totalPromptProducts: engineRecord?.totalPromptProducts ?? 0,
        lastPromptProductId: engineRecord?.lastPromptProductId ?? null,
        lastProductType: engineRecord?.lastProductType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Prompt-product-only: does not build sales pages, process customer payments, deliver products, publish products directly, override Pillow or Grand King, or implement Q5-05 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedDigitalProductResearch(input: PromptProductWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductResearch(input);
  }

  designPromptArchitecture(input: PromptProductWorkerInput = {}) {
    return this.controller.designPromptArchitecture(input);
  }

  createPromptLibraries(input: PromptProductWorkerInput = {}) {
    return this.controller.createPromptLibraries(input);
  }

  createReusablePromptTemplates(input: PromptProductWorkerInput = {}) {
    return this.controller.createReusablePromptTemplates(input);
  }

  createAiWorkflowProducts(input: PromptProductWorkerInput = {}) {
    return this.controller.createAiWorkflowProducts(input);
  }

  organizePromptsIntoStructuredPacks(input: PromptProductWorkerInput = {}) {
    return this.controller.organizePromptsIntoStructuredPacks(input);
  }

  generateUserInstructions(input: PromptProductWorkerInput = {}) {
    return this.controller.generateUserInstructions(input);
  }

  validatePromptConsistency(input: PromptProductWorkerInput = {}) {
    return this.controller.validatePromptConsistency(input);
  }

  packageExportReadyPromptProducts(input: PromptProductWorkerInput = {}) {
    return this.controller.packageExportReadyPromptProducts(input);
  }

  producePromptProductReport(input: PromptProductWorkerInput = {}) {
    return this.controller.producePromptProductReport(input);
  }

  submitReport(input: PromptProductWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: PromptProductWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getPromptProducts() {
    return this.controller.getManager().getPromptProducts();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestPromptProductId() {
    return this.controller.getManager().getLatestPromptProductId();
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
        `Prompt products: ${state.health.totalPromptProducts}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PromptProductWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-04",
      status: state.status,
      healthStatus: state.health.status,
      totalPromptProducts: state.health.totalPromptProducts,
      latestPromptProductId: this.getLatestPromptProductId(),
      lastProductType: state.health.lastProductType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverBuildSalesPages: true,
      neverProcessCustomerPayments: true,
      neverDeliverProducts: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createPromptProductWorker(
  bootstrap: EmpireBootstrapContext,
  options?: PromptProductWorkerOptions,
) {
  return new PromptProductWorker(bootstrap, options);
}

export function resetPromptProductWorkerForTesting() {
  resetPpwLogsForTesting();
  resetPromptSequenceForTesting();
}
