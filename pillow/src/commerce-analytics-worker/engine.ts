import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCommerceAnalyticsWorkerConfiguration,
  type CommerceAnalyticsWorkerConfiguration,
} from "./configuration.js";
import type { CommerceAnalyticsWorkerDependencies } from "./integrations.js";
import { CommerceAnalyticsWorkerController } from "./commerce-analytics-worker-controller.js";
import { resetCawLogsForTesting } from "./caw-logging.js";
import { COMMERCE_ANALYTICS_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetAnalyticsSequenceForTesting } from "./analytics-builder.js";
import { AnalyticsManager } from "./analytics-manager.js";
import type {
  CommerceAnalyticsWorkerCockpitSnapshot,
  CommerceAnalyticsWorkerInput,
  CommerceAnalyticsWorkerState,
} from "./types.js";

export interface CommerceAnalyticsWorkerOptions {
  configuration?: Partial<CommerceAnalyticsWorkerConfiguration>;
  dependencies?: CommerceAnalyticsWorkerDependencies;
}

/** Authoritative Q3-13 Commerce Analytics Worker — intelligence/analysis only. */
export class CommerceAnalyticsWorker {
  private initializedAt: string | null = null;
  private readonly controller: CommerceAnalyticsWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CommerceAnalyticsWorkerOptions = {},
  ) {
    const manager = new AnalyticsManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CommerceAnalyticsWorkerController(
      manager,
      buildCommerceAnalyticsWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      COMMERCE_ANALYTICS_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Commerce Analytics Worker")) {
      throw new Error(
        `${COMMERCE_ANALYTICS_WORKER_SYSTEM_PATH} missing — Q3-13 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CommerceAnalyticsWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CommerceAnalyticsWorkerState {
    if (!this.initializedAt) {
      throw new Error("Commerce Analytics Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CAW-001",
      missionId: "Q3-13",
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
        lastProductPerformanceClassification:
          engineRecord?.lastProductPerformanceClassification ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        lastOpportunityCount: engineRecord?.lastOpportunityCount ?? null,
        notes: [
          "Analysis-only: does not modify products, pricing, suppliers, operational data, execute optimizations, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectCommerceAnalyticsWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  trackProductPerformance(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.trackProductPerformance(input);
  }

  trackSalesPerformance(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.trackSalesPerformance(input);
  }

  trackConversionRates(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.trackConversionRates(input);
  }

  trackGrossAndNetProfit(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.trackGrossAndNetProfit(input);
  }

  trackCustomerIssues(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.trackCustomerIssues(input);
  }

  trackRefundRates(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.trackRefundRates(input);
  }

  trackSupplierPerformance(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.trackSupplierPerformance(input);
  }

  detectDecliningProducts(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.detectDecliningProducts(input);
  }

  detectHighPerformingProducts(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.detectHighPerformingProducts(input);
  }

  identifyOptimizationOpportunities(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.identifyOptimizationOpportunities(input);
  }

  produceCommerceAnalyticsReport(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listCommerceAnalyticsReports() {
    return this.controller.list();
  }

  validateCommerceAnalyticsWorker(input: CommerceAnalyticsWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
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

  getCockpitSnapshot(): CommerceAnalyticsWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-13",
      status: state.status,
      healthStatus: state.health.status,
      totalAnalyticsReports: state.health.totalAnalyticsReports,
      latestAnalyticsReportId: this.getLatestAnalyticsReportId(),
      lastProductPerformanceClassification:
        state.health.lastProductPerformanceClassification,
      lastConfidenceScore: state.health.lastConfidenceScore,
      lastOpportunityCount: state.health.lastOpportunityCount,
      workerId: state.configuration.workerId,
      neverModifyProducts: true,
      neverModifyPricing: true,
      neverModifySuppliers: true,
      neverExecuteOptimizations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverModifyOperationalData: true,
    };
  }
}

export function createCommerceAnalyticsWorker(
  bootstrap: EmpireBootstrapContext,
  options?: CommerceAnalyticsWorkerOptions,
) {
  return new CommerceAnalyticsWorker(bootstrap, options);
}

export function resetCommerceAnalyticsWorkerForTesting() {
  resetCawLogsForTesting();
  resetAnalyticsSequenceForTesting();
}
