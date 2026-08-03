import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPricingWorkerConfiguration,
  type PricingWorkerConfiguration,
} from "./configuration.js";
import type { PricingWorkerDependencies } from "./integrations.js";
import { PricingWorkerController } from "./pricing-worker-controller.js";
import { resetPrwLogsForTesting } from "./prw-logging.js";
import { PRICING_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetPricingSequenceForTesting } from "./pricing-builder.js";
import { PricingManager } from "./pricing-manager.js";
import type {
  PricingWorkerCockpitSnapshot,
  PricingWorkerInput,
  PricingWorkerState,
} from "./types.js";

export interface PricingWorkerOptions {
  configuration?: Partial<PricingWorkerConfiguration>;
  dependencies?: PricingWorkerDependencies;
}

/** Authoritative Q3-09 Pricing Worker — recommendation only. */
export class PricingWorker {
  private initializedAt: string | null = null;
  private readonly controller: PricingWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PricingWorkerOptions = {},
  ) {
    const manager = new PricingManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new PricingWorkerController(
      manager,
      buildPricingWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PRICING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Pricing Worker")) {
      throw new Error(`${PRICING_WORKER_SYSTEM_PATH} missing — Q3-09 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: PricingWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): PricingWorkerState {
    if (!this.initializedAt) {
      throw new Error("Pricing Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PRW-001",
      missionId: "Q3-09",
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
        totalPricingReports: engineRecord?.totalPricingReports ?? 0,
        lastPricingId: engineRecord?.lastPricingId ?? null,
        lastRecommendedPrice: engineRecord?.lastRecommendedPrice ?? null,
        lastTargetMargin: engineRecord?.lastTargetMargin ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Recommendation-only: does not publish listings/pricing, modify supplier costs, execute promotions, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectPricingWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedProducts(input: PricingWorkerInput = {}) {
    return this.controller.receiveApprovedProducts(input);
  }

  receiveSupplierCostInformation(input: PricingWorkerInput = {}) {
    return this.controller.receiveSupplierCosts(input);
  }

  calculateTotalLandedCost(input: PricingWorkerInput = {}) {
    return this.controller.calculateLandedCost(input);
  }

  calculateMarketplaceFees(input: PricingWorkerInput = {}) {
    return this.controller.calculateMarketplaceFees(input);
  }

  calculatePaymentProcessingFees(input: PricingWorkerInput = {}) {
    return this.controller.calculatePaymentFees(input);
  }

  calculateAdvertisingCostAssumptions(input: PricingWorkerInput = {}) {
    return this.controller.calculateAdvertising(input);
  }

  calculateShippingCost(input: PricingWorkerInput = {}) {
    return this.controller.calculateShipping(input);
  }

  calculateTargetMargin(input: PricingWorkerInput = {}) {
    return this.controller.calculateTargetMargin(input);
  }

  calculateTargetProfit(input: PricingWorkerInput = {}) {
    return this.controller.calculateTargetProfit(input);
  }

  compareAgainstCompetitorPricing(input: PricingWorkerInput = {}) {
    return this.controller.compareCompetitors(input);
  }

  recommendSellingPrice(input: PricingWorkerInput = {}) {
    return this.controller.recommendSellingPrice(input);
  }

  producePricingReport(input: PricingWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: PricingWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listPricingReports() {
    return this.controller.list();
  }

  validatePricingWorker(input: PricingWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getPricingReports() {
    return this.controller.getManager().getPricingReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestPricingId() {
    return this.controller.getManager().getLatestPricingId();
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
        `Pricing reports: ${state.health.totalPricingReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PricingWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-09",
      status: state.status,
      healthStatus: state.health.status,
      totalPricingReports: state.health.totalPricingReports,
      latestPricingId: this.getLatestPricingId(),
      lastRecommendedPrice: state.health.lastRecommendedPrice,
      lastTargetMargin: state.health.lastTargetMargin,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverPublishListings: true,
      neverModifySupplierCosts: true,
      neverExecutePromotions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverPublishPricingAutomatically: true,
    };
  }
}

export function createPricingWorker(
  bootstrap: EmpireBootstrapContext,
  options?: PricingWorkerOptions,
) {
  return new PricingWorker(bootstrap, options);
}

export function resetPricingWorkerForTesting() {
  resetPrwLogsForTesting();
  resetPricingSequenceForTesting();
}
