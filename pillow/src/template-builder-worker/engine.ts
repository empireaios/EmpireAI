import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildTemplateBuilderWorkerConfiguration,
  type TemplateBuilderWorkerConfiguration,
} from "./configuration.js";
import type { TemplateBuilderWorkerDependencies } from "./integrations.js";
import { TemplateBuilderWorkerController } from "./template-builder-worker-controller.js";
import { resetTbwLogsForTesting } from "./tbw-logging.js";
import { TEMPLATE_BUILDER_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetTemplateSequenceForTesting } from "./template-builder.js";
import { TemplateManager } from "./template-manager.js";
import type {
  TemplateBuilderWorkerCockpitSnapshot,
  TemplateBuilderWorkerInput,
  TemplateBuilderWorkerState,
} from "./types.js";

export interface TemplateBuilderWorkerOptions {
  configuration?: Partial<TemplateBuilderWorkerConfiguration>;
  dependencies?: TemplateBuilderWorkerDependencies;
}

/** Authoritative Q5-06 Template Builder Worker — reusable template products only. */
export class TemplateBuilderWorker {
  private initializedAt: string | null = null;
  private readonly controller: TemplateBuilderWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: TemplateBuilderWorkerOptions = {},
  ) {
    const manager = new TemplateManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new TemplateBuilderWorkerController(
      manager,
      buildTemplateBuilderWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      TEMPLATE_BUILDER_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Template Builder Worker")) {
      throw new Error(
        `${TEMPLATE_BUILDER_WORKER_SYSTEM_PATH} missing — Q5-06 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: TemplateBuilderWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): TemplateBuilderWorkerState {
    if (!this.initializedAt) {
      throw new Error("Template Builder Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-TBW-001",
      missionId: "Q5-06",
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
        totalTemplateProducts: engineRecord?.totalTemplateProducts ?? 0,
        lastTemplateProductId: engineRecord?.lastTemplateProductId ?? null,
        lastProductType: engineRecord?.lastProductType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Template-only: does not build sales pages, process payments, deliver products to customers, publish products directly, override Pillow or Grand King, or implement Q5-07 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedDigitalProductResearch(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductResearch(input);
  }

  generateReusableTemplates(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.generateReusableTemplates(input);
  }

  generatePlanners(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.generatePlanners(input);
  }

  generateSpreadsheets(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.generateSpreadsheets(input);
  }

  generateContractsAndDocumentTemplates(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.generateContractsAndDocumentTemplates(input);
  }

  generateBusinessFormsAndChecklists(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.generateBusinessFormsAndChecklists(input);
  }

  generateReusablePromptLibraries(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.generateReusablePromptLibraries(input);
  }

  validateUsabilityAndCompleteness(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.validateUsabilityAndCompleteness(input);
  }

  prepareExportReadyTemplatePackages(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.prepareExportReadyTemplatePackages(input);
  }

  produceTemplateBuilderReport(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.produceTemplateBuilderReport(input);
  }

  submitReport(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: TemplateBuilderWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getTemplateProducts() {
    return this.controller.getManager().getTemplateProducts();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestTemplateProductId() {
    return this.controller.getManager().getLatestTemplateProductId();
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
        `Template products: ${state.health.totalTemplateProducts}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TemplateBuilderWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-06",
      status: state.status,
      healthStatus: state.health.status,
      totalTemplateProducts: state.health.totalTemplateProducts,
      latestTemplateProductId: this.getLatestTemplateProductId(),
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

export function createTemplateBuilderWorker(
  bootstrap: EmpireBootstrapContext,
  options?: TemplateBuilderWorkerOptions,
) {
  return new TemplateBuilderWorker(bootstrap, options);
}

export function resetTemplateBuilderWorkerForTesting() {
  resetTbwLogsForTesting();
  resetTemplateSequenceForTesting();
}
