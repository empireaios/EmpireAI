import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { AnalyticsWorkerController } from "./analytics-worker-controller.js";
import {
  buildAnalyticsWorkerConfiguration,
  type AnalyticsWorkerConfiguration,
} from "./configuration.js";
import type { AnalyticsWorkerDependencies } from "./integrations.js";
import { resetAnwLogsForTesting } from "./anw-logging.js";
import { AnalyticsManager } from "./analytics-manager.js";
import { resetAnwSequenceForTesting } from "./analytics-store.js";
import { ANALYTICS_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyticsWorkerCockpitSnapshot,
  AnalyticsWorkerState,
  AnwInput,
  Q808ConsumableContract,
} from "./types.js";

export interface AnalyticsWorkerOptions {
  configuration?: Partial<AnalyticsWorkerConfiguration>;
  dependencies?: AnalyticsWorkerDependencies;
}

/** Authoritative Q8-07 Analytics Worker — evidence-based performance measurement only. */
export class AnalyticsWorker {
  private initializedAt: string | null = null;
  private readonly controller: AnalyticsWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AnalyticsWorkerOptions = {},
  ) {
    const manager = new AnalyticsManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new AnalyticsWorkerController(
      manager,
      buildAnalyticsWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ANALYTICS_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Analytics Worker")) {
      throw new Error(
        `${ANALYTICS_WORKER_SYSTEM_PATH} missing — Q8-07 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: AnalyticsWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): AnalyticsWorkerState {
    if (!this.initializedAt) {
      throw new Error("Analytics Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getStore().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ANW-001",
      missionId: "Q8-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord.healthStatus ?? "standby",
        healthScore: engineRecord.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord.totalReports,
        totalHistoryEntries: engineRecord.totalHistoryEntries,
        lastReportId: engineRecord.lastReportId,
        lastConfidenceScore: engineRecord.lastConfidenceScore,
        notes: [
          "Analytics Worker measures affiliate clicks/conversions/commissions/SEO/funnel performance from evidenced metrics only: does not modify campaigns, manipulate analytics, fabricate results, replace Compliance Worker, override Pillow or Grand King, or implement Q8-08 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  collectPerformanceMetrics(input: AnwInput = {}) {
    return this.controller.collectPerformanceMetrics(input);
  }

  trackClicks(input: AnwInput = {}) {
    return this.controller.trackClicks(input);
  }

  trackConversions(input: AnwInput = {}) {
    return this.controller.trackConversions(input);
  }

  trackCommissions(input: AnwInput = {}) {
    return this.controller.trackCommissions(input);
  }

  measureSeoPerformance(input: AnwInput = {}) {
    return this.controller.measureSeoPerformance(input);
  }

  analyseFunnelPerformance(input: AnwInput = {}) {
    return this.controller.analyseFunnelPerformance(input);
  }

  detectTrends(input: AnwInput = {}) {
    return this.controller.detectTrends(input);
  }

  recommendOptimisations(input: AnwInput = {}) {
    return this.controller.recommendOptimisations(input);
  }

  produceAnalyticsReport(input: AnwInput = {}) {
    return this.controller.produceAnalyticsReport(input);
  }

  produceReport(input: AnwInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: AnwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getStore().listReports();
  }

  getHistory() {
    return this.controller.getManager().getStore().getHistory();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getStore().getAuditTrail();
  }

  validate(input: AnwInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
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
        `Analytics reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AnalyticsWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-07",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalHistoryEntries: state.health.totalHistoryEntries,
      latestReportId: state.health.lastReportId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateAnalyticsOrPerformanceResults: true,
      neverModifyCampaignsAutomatically: true,
      neverManipulateAnalytics: true,
      neverReplaceAffiliateComplianceWorker: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ808OrLater: true,
      consumableByQ808: true,
    };
  }

  getQ808ConsumableContract(): Q808ConsumableContract {
    return this.controller.getManager().getQ808ConsumableContract();
  }
}

export function createAnalyticsWorker(
  bootstrap: EmpireBootstrapContext,
  options?: AnalyticsWorkerOptions,
) {
  return new AnalyticsWorker(bootstrap, options);
}

export function resetAnalyticsWorkerForTesting() {
  resetAnwLogsForTesting();
  resetAnwSequenceForTesting();
}
