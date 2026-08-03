import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { ComparisonSiteWorkerController } from "./comparison-site-worker-controller.js";
import {
  buildComparisonSiteWorkerConfiguration,
  type ComparisonSiteWorkerConfiguration,
} from "./configuration.js";
import type { ComparisonSiteWorkerDependencies } from "./integrations.js";
import { resetCswLogsForTesting } from "./csw-logging.js";
import { ComparisonManager } from "./comparison-manager.js";
import { resetCswSequenceForTesting } from "./comparison-store.js";
import { COMPARISON_SITE_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  ComparisonSiteWorkerCockpitSnapshot,
  ComparisonSiteWorkerState,
  CswInput,
  Q804ConsumableContract,
} from "./types.js";

export interface ComparisonSiteWorkerOptions {
  configuration?: Partial<ComparisonSiteWorkerConfiguration>;
  dependencies?: ComparisonSiteWorkerDependencies;
}

/** Authoritative Q8-03 Comparison Site Worker — evidence-based comparison assets only. */
export class ComparisonSiteWorker {
  private initializedAt: string | null = null;
  private readonly controller: ComparisonSiteWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ComparisonSiteWorkerOptions = {},
  ) {
    const manager = new ComparisonManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ComparisonSiteWorkerController(
      manager,
      buildComparisonSiteWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      COMPARISON_SITE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Comparison Site Worker")) {
      throw new Error(
        `${COMPARISON_SITE_WORKER_SYSTEM_PATH} missing — Q8-03 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ComparisonSiteWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ComparisonSiteWorkerState {
    if (!this.initializedAt) {
      throw new Error("Comparison Site Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getStore().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CSW-001",
      missionId: "Q8-03",
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
        totalPages: engineRecord.totalPages,
        lastReportId: engineRecord.lastReportId,
        lastConfidenceScore: engineRecord.lastConfidenceScore,
        notes: [
          "Comparison Site Worker creates comparison/ranking/buyer-guide assets from opportunity evidence only: does not publish websites, fabricate rankings, replace Review Content Worker, override Pillow or Grand King, or implement Q8-04 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAffiliateOpportunityReport(input: CswInput = {}) {
    return this.controller.consumeAffiliateOpportunityReport(input);
  }

  generateComparisonPage(input: CswInput = {}) {
    return this.controller.generateComparisonPage(input);
  }

  generateRankingPage(input: CswInput = {}) {
    return this.controller.generateRankingPage(input);
  }

  generateBuyerGuide(input: CswInput = {}) {
    return this.controller.generateBuyerGuide(input);
  }

  generateComparisonTables(input: CswInput = {}) {
    return this.controller.generateComparisonTables(input);
  }

  documentMethodology(input: CswInput = {}) {
    return this.controller.documentMethodology(input);
  }

  produceComparisonSiteReport(input: CswInput = {}) {
    return this.controller.produceComparisonSiteReport(input);
  }

  produceReport(input: CswInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: CswInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getStore().listReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getStore().getAuditTrail();
  }

  validate(input: CswInput = {}) {
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
        `Comparison site reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ComparisonSiteWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-03",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalPages: state.health.totalPages,
      latestReportId: state.health.lastReportId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateRankingsOrProductInformation: true,
      neverPublishWebsites: true,
      neverManipulateRankingsWithoutEvidence: true,
      neverReplaceReviewContentWorker: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ804OrLater: true,
      consumableByQ804: true,
    };
  }

  getQ804ConsumableContract(): Q804ConsumableContract {
    return this.controller.getManager().getQ804ConsumableContract();
  }
}

export function createComparisonSiteWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ComparisonSiteWorkerOptions,
) {
  return new ComparisonSiteWorker(bootstrap, options);
}

export function resetComparisonSiteWorkerForTesting() {
  resetCswLogsForTesting();
  resetCswSequenceForTesting();
}
