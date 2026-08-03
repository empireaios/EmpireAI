import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDigitalProductAnalyticsWorkerConfiguration,
  type DigitalProductAnalyticsWorkerConfiguration,
} from "./configuration.js";
import type { DigitalProductAnalyticsWorkerDependencies } from "./integrations.js";
import { DigitalProductAnalyticsWorkerController } from "./digital-product-analytics-worker-controller.js";
import { resetDpaLogsForTesting } from "./dpa-logging.js";
import { DIGITAL_PRODUCT_ANALYTICS_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetAnalyticsSequenceForTesting } from "./digital-product-analytics-builder.js";
import { DigitalProductAnalyticsManager } from "./digital-product-analytics-manager.js";
import type {
  DigitalProductAnalyticsWorkerCockpitSnapshot,
  DigitalProductAnalyticsWorkerInput,
  DigitalProductAnalyticsWorkerState,
} from "./types.js";

export interface DigitalProductAnalyticsWorkerOptions {
  configuration?: Partial<DigitalProductAnalyticsWorkerConfiguration>;
  dependencies?: DigitalProductAnalyticsWorkerDependencies;
}

/** Authoritative Q5-11 Digital Product Analytics Worker — analytics (structural signals). */
export class DigitalProductAnalyticsWorker {
  private initializedAt: string | null = null;
  private readonly controller: DigitalProductAnalyticsWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DigitalProductAnalyticsWorkerOptions = {},
  ) {
    const manager = new DigitalProductAnalyticsManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new DigitalProductAnalyticsWorkerController(
      manager,
      buildDigitalProductAnalyticsWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      DIGITAL_PRODUCT_ANALYTICS_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Digital Product Analytics Worker")) {
      throw new Error(
        `${DIGITAL_PRODUCT_ANALYTICS_WORKER_SYSTEM_PATH} missing — Q5-11 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: DigitalProductAnalyticsWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): DigitalProductAnalyticsWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Digital Product Analytics Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-DPA-001",
      missionId: "Q5-11",
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
        totalAnalyticsReports: engineRecord?.totalAnalyticsReports ?? 0,
        lastAnalyticsReportId: engineRecord?.lastAnalyticsReportId ?? null,
        lastAnalyticsType: engineRecord?.lastAnalyticsType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Digital Product Analytics Worker measures digital product performance only: does not edit products, process payments, deliver products, fabricate metrics, override Pillow or Grand King, or implement Q5-12 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  trackProductSales(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.trackProductSales(input);
  }

  trackRevenueAndProfitMetrics(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.trackRevenueAndProfitMetrics(input);
  }

  trackConversionRates(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.trackConversionRates(input);
  }

  trackRefundRates(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.trackRefundRates(input);
  }

  analyseCustomerFeedback(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.analyseCustomerFeedback(input);
  }

  detectProductPerformanceTrends(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.detectProductPerformanceTrends(input);
  }

  detectUnderperformingProducts(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.detectUnderperformingProducts(input);
  }

  recommendImprovementOpportunities(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.recommendImprovementOpportunities(input);
  }

  generateExecutivePerformanceSummaries(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.generateExecutivePerformanceSummaries(input);
  }

  produceDigitalProductAnalyticsReport(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.produceDigitalProductAnalyticsReport(input);
  }

  submitReport(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: DigitalProductAnalyticsWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getAnalyticsReports() {
    return this.controller.getManager().getAnalyticsReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestAnalyticsReportId() {
    return this.controller.getManager().getLatestAnalyticsReportId();
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
        `Analytics reports: ${state.health.totalAnalyticsReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DigitalProductAnalyticsWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-11",
      status: state.status,
      healthStatus: state.health.status,
      totalAnalyticsReports: state.health.totalAnalyticsReports,
      latestAnalyticsReportId: this.getLatestAnalyticsReportId(),
      lastAnalyticsType: state.health.lastAnalyticsType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverEditProducts: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ512OrLater: true,
      neverFabricateMetrics: true,
    };
  }
}

export function createDigitalProductAnalyticsWorker(
  bootstrap: EmpireBootstrapContext,
  options?: DigitalProductAnalyticsWorkerOptions,
) {
  return new DigitalProductAnalyticsWorker(bootstrap, options);
}

export function resetDigitalProductAnalyticsWorkerForTesting() {
  resetDpaLogsForTesting();
  resetAnalyticsSequenceForTesting();
}
