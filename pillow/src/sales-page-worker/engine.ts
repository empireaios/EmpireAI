import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSalesPageWorkerConfiguration,
  type SalesPageWorkerConfiguration,
} from "./configuration.js";
import type { SalesPageWorkerDependencies } from "./integrations.js";
import { SalesPageWorkerController } from "./sales-page-worker-controller.js";
import { resetSpwLogsForTesting } from "./spw-logging.js";
import { SALES_PAGE_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetSalesPageSequenceForTesting } from "./sales-page-builder.js";
import { SalesPageManager } from "./sales-page-manager.js";
import type {
  SalesPageWorkerCockpitSnapshot,
  SalesPageWorkerInput,
  SalesPageWorkerState,
} from "./types.js";

export interface SalesPageWorkerOptions {
  configuration?: Partial<SalesPageWorkerConfiguration>;
  dependencies?: SalesPageWorkerDependencies;
}

/** Authoritative Q5-08 Sales Page Worker — sales copy + structure (structural signals). */
export class SalesPageWorker {
  private initializedAt: string | null = null;
  private readonly controller: SalesPageWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SalesPageWorkerOptions = {},
  ) {
    const manager = new SalesPageManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new SalesPageWorkerController(
      manager,
      buildSalesPageWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SALES_PAGE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Sales Page Worker")) {
      throw new Error(
        `${SALES_PAGE_WORKER_SYSTEM_PATH} missing — Q5-08 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SalesPageWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): SalesPageWorkerState {
    if (!this.initializedAt) {
      throw new Error("Sales Page Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SPW-001",
      missionId: "Q5-08",
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
        totalSalesPages: engineRecord?.totalSalesPages ?? 0,
        lastSalesPageId: engineRecord?.lastSalesPageId ?? null,
        lastPageType: engineRecord?.lastPageType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Sales Page Worker creates sales page copy/structure only: does not process payments, deliver products, publish websites/pages, fabricate testimonials, override Pillow or Grand King, or implement Q5-09 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedDigitalProductInformation(input: SalesPageWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductInformation(input);
  }

  /** Alias for factory consistency — same as receiveApprovedDigitalProductInformation. */
  receiveApprovedDigitalProductResearch(input: SalesPageWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductInformation(input);
  }

  generateCompleteLandingPageStructure(input: SalesPageWorkerInput = {}) {
    return this.controller.generateCompleteLandingPageStructure(input);
  }

  generateCompellingHeadlines(input: SalesPageWorkerInput = {}) {
    return this.controller.generateCompellingHeadlines(input);
  }

  generateBenefitDrivenCopy(input: SalesPageWorkerInput = {}) {
    return this.controller.generateBenefitDrivenCopy(input);
  }

  generateFeatureSections(input: SalesPageWorkerInput = {}) {
    return this.controller.generateFeatureSections(input);
  }

  generatePricingPresentation(input: SalesPageWorkerInput = {}) {
    return this.controller.generatePricingPresentation(input);
  }

  generateTestimonialsOrPlaceholders(input: SalesPageWorkerInput = {}) {
    return this.controller.generateTestimonialsOrPlaceholders(input);
  }

  generateFaqSections(input: SalesPageWorkerInput = {}) {
    return this.controller.generateFaqSections(input);
  }

  generateCallToActionSections(input: SalesPageWorkerInput = {}) {
    return this.controller.generateCallToActionSections(input);
  }

  generateGuaranteeSections(input: SalesPageWorkerInput = {}) {
    return this.controller.generateGuaranteeSections(input);
  }

  optimizePageStructureForReadabilityAndConversion(input: SalesPageWorkerInput = {}) {
    return this.controller.optimizePageStructureForReadabilityAndConversion(input);
  }

  produceSalesPageReport(input: SalesPageWorkerInput = {}) {
    return this.controller.produceSalesPageReport(input);
  }

  submitReport(input: SalesPageWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: SalesPageWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getSalesPages() {
    return this.controller.getManager().getSalesPages();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestSalesPageId() {
    return this.controller.getManager().getLatestSalesPageId();
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
        `Sales pages: ${state.health.totalSalesPages}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SalesPageWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-08",
      status: state.status,
      healthStatus: state.health.status,
      totalSalesPages: state.health.totalSalesPages,
      latestSalesPageId: this.getLatestSalesPageId(),
      lastPageType: state.health.lastPageType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishWebsites: true,
      neverPublishPagesDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateTestimonials: true,
    };
  }
}

export function createSalesPageWorker(
  bootstrap: EmpireBootstrapContext,
  options?: SalesPageWorkerOptions,
) {
  return new SalesPageWorker(bootstrap, options);
}

export function resetSalesPageWorkerForTesting() {
  resetSpwLogsForTesting();
  resetSalesPageSequenceForTesting();
}
