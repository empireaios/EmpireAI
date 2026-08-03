import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildOpportunityScannerConfiguration,
  type OpportunityScannerConfiguration,
} from "./configuration.js";
import { OpportunityScannerController } from "./opportunity-scanner-controller.js";
import { OpportunityScannerManager } from "./opportunity-scanner-manager.js";
import { resetOscLogsForTesting } from "./osc-logging.js";
import { OPPORTUNITY_SCANNER_SYSTEM_PATH } from "./paths.js";
import type {
  OpportunityScannerCockpitSnapshot,
  OpportunityScannerInput,
  OpportunityScannerState,
} from "./types.js";

export interface OpportunityScannerOptions {
  configuration?: Partial<OpportunityScannerConfiguration>;
}

export class OpportunityScanner {
  private initializedAt: string | null = null;
  private readonly controller: OpportunityScannerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: OpportunityScannerOptions = {},
  ) {
    this.controller = new OpportunityScannerController(
      new OpportunityScannerManager(),
      buildOpportunityScannerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(OPPORTUNITY_SCANNER_SYSTEM_PATH);
    if (!doc?.includes("Opportunity Scanner")) {
      throw new Error(`${OPPORTUNITY_SCANNER_SYSTEM_PATH} missing — Q0-02 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): OpportunityScannerState {
    if (!this.initializedAt) throw new Error("Opportunity Scanner not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const total = this.getOpportunities().length;
    const pending = this.getPendingReview().length;
    return {
      engineVersion: "PILLOW-OSC-001",
      missionId: "Q0-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalOpportunities: total,
        pendingReviewCount: pending,
        notes: [
          "Discovery only: does not execute, approve, assign workers, or create businesses.",
        ],
      },
    };
  }

  connectOpportunityScanner(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  configureDomains(input: OpportunityScannerInput = {}) {
    return this.controller.configureDomains(input);
  }

  scanBusinessOpportunities(input: OpportunityScannerInput = {}) {
    return this.controller.scanBusiness(input);
  }

  scanOperationalOpportunities(input: OpportunityScannerInput = {}) {
    return this.controller.scanOperational(input);
  }

  scanAllOpportunities(input: OpportunityScannerInput = {}) {
    return this.controller.scanAll(input);
  }

  scoreOpportunities(input: OpportunityScannerInput = {}) {
    return this.controller.scoreOpportunities(input);
  }

  markOpportunitiesForReview(input: OpportunityScannerInput = {}) {
    return this.controller.markForReview(input);
  }

  validateOpportunities(input: OpportunityScannerInput = {}) {
    return this.controller.validateOpportunities(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getOpportunities() {
    return this.controller.getManager().getOpportunities();
  }

  getPendingReview() {
    return this.controller.getManager().getPendingReview();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
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
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Opportunities: ${state.health.totalOpportunities}`,
        `Pending review: ${state.health.pendingReviewCount}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OpportunityScannerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-02",
      status: state.status,
      healthStatus: state.health.status,
      totalOpportunities: state.health.totalOpportunities,
      pendingReviewCount: state.health.pendingReviewCount,
      configuredDomains: this.controller.getManager().getConfiguredDomains(),
      neverExecuteOpportunities: true,
      neverApproveOpportunities: true,
      neverAssignWorkers: true,
      neverCreateBusinesses: true,
    };
  }
}

export function createOpportunityScanner(
  bootstrap: EmpireBootstrapContext,
  options?: OpportunityScannerOptions,
) {
  return new OpportunityScanner(bootstrap, options);
}

export function resetOpportunityScannerForTesting() {
  resetOscLogsForTesting();
}
