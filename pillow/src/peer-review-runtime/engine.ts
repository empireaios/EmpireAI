import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPeerReviewRuntimeConfiguration,
  type PeerReviewRuntimeConfiguration,
} from "./configuration.js";
import { PeerReviewRuntimeController } from "./peer-review-runtime-controller.js";
import { PeerReviewRuntimeCore } from "./peer-review-runtime-core.js";
import { resetPrrLogsForTesting } from "./prr-logging.js";
import { resetReviewSequenceForTesting } from "./peer-review-store.js";
import { PEER_REVIEW_RUNTIME_SYSTEM_PATH } from "./paths.js";
import type {
  PeerReviewRuntimeCockpitSnapshot,
  PeerReviewRuntimeInput,
  PeerReviewRuntimeState,
} from "./types.js";

export interface PeerReviewRuntimeOptions {
  configuration?: Partial<PeerReviewRuntimeConfiguration>;
}

/** Authoritative Q0-21 Peer Review Runtime — validate/coordinate only. */
export class PeerReviewRuntime {
  private initializedAt: string | null = null;
  private readonly controller: PeerReviewRuntimeController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PeerReviewRuntimeOptions = {},
  ) {
    this.controller = new PeerReviewRuntimeController(
      new PeerReviewRuntimeCore(),
      buildPeerReviewRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PEER_REVIEW_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Peer Review Runtime")) {
      throw new Error(`${PEER_REVIEW_RUNTIME_SYSTEM_PATH} missing — Q0-21 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): PeerReviewRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Peer Review Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PRR-001",
      missionId: "Q0-21",
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
        totalReviewRecords: this.getRecords().length,
        lastOutcome: engineRecord?.lastOutcome ?? null,
        notes: [
          "Validate only: does not replace workers, rewrite completed work, override Pillow, override Grand King, or execute business tasks.",
        ],
      },
    };
  }

  connectPeerReviewRuntime(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitWork(input: PeerReviewRuntimeInput = {}) {
    return this.controller.submitWork(input);
  }

  determineReviewRequired(input: PeerReviewRuntimeInput = {}) {
    return this.controller.determineRequired(input);
  }

  selectReviewers(input: PeerReviewRuntimeInput = {}) {
    return this.controller.selectReviewers(input);
  }

  deliverToReviewers(input: PeerReviewRuntimeInput = {}) {
    return this.controller.deliverToReviewers(input);
  }

  collectReviews(input: PeerReviewRuntimeInput = {}) {
    return this.controller.collectReviews(input);
  }

  compareReviews(input: PeerReviewRuntimeInput = {}) {
    return this.controller.compareReviews(input);
  }

  requestRevision(input: PeerReviewRuntimeInput = {}) {
    return this.controller.requestRevision(input);
  }

  escalateToPillow(input: PeerReviewRuntimeInput = {}) {
    return this.controller.escalate(input);
  }

  review(input: PeerReviewRuntimeInput = {}) {
    return this.controller.review(input);
  }

  listReviews() {
    return this.controller.list();
  }

  validatePeerReviewRuntime(input: PeerReviewRuntimeInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
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
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Review records: ${state.health.totalReviewRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PeerReviewRuntimeCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-21",
      status: state.status,
      healthStatus: state.health.status,
      totalReviewRecords: state.health.totalReviewRecords,
      latestReviewId: this.getLatestRecord()?.reviewId ?? null,
      lastOutcome: state.health.lastOutcome,
      neverReplaceWorkers: true,
      neverRewriteCompletedWork: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverExecuteBusinessTasks: true,
    };
  }
}

export function createPeerReviewRuntime(
  bootstrap: EmpireBootstrapContext,
  options?: PeerReviewRuntimeOptions,
) {
  return new PeerReviewRuntime(bootstrap, options);
}

export function resetPeerReviewRuntimeForTesting() {
  resetPrrLogsForTesting();
  resetReviewSequenceForTesting();
}
