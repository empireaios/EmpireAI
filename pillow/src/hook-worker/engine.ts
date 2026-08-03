import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildHookWorkerConfiguration,
  type HookWorkerConfiguration,
} from "./configuration.js";
import type { HookWorkerDependencies } from "./integrations.js";
import { HookWorkerController } from "./hook-worker-controller.js";
import { resetHkwLogsForTesting } from "./hkw-logging.js";
import { HOOK_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetHookSequenceForTesting } from "./hook-builder.js";
import { HookManager } from "./hook-manager.js";
import type {
  HookWorkerCockpitSnapshot,
  HookWorkerInput,
  HookWorkerState,
} from "./types.js";

export interface HookWorkerOptions {
  configuration?: Partial<HookWorkerConfiguration>;
  dependencies?: HookWorkerDependencies;
}

/** Authoritative Q4-06 Hook Worker — hook optimization only. */
export class HookWorker {
  private initializedAt: string | null = null;
  private readonly controller: HookWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: HookWorkerOptions = {},
  ) {
    const manager = new HookManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new HookWorkerController(
      manager,
      buildHookWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      HOOK_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Hook Worker")) {
      throw new Error(
        `${HOOK_WORKER_SYSTEM_PATH} missing — Q4-06 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: HookWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): HookWorkerState {
    if (!this.initializedAt) {
      throw new Error("Hook Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-HKW-001",
      missionId: "Q4-06",
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
        totalHookReports: engineRecord?.totalHookReports ?? 0,
        lastHookReportId: engineRecord?.lastHookReportId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastContentFormat: engineRecord?.lastContentFormat ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Hook-only: does not rewrite complete scripts, generate thumbnails/videos, publish content, override Pillow or Grand King, or implement Q4-07 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedScript(input: HookWorkerInput = {}) {
    return this.controller.receiveApprovedScript(input);
  }

  generateOpeningHooks(input: HookWorkerInput = {}) {
    return this.controller.generateOpeningHooks(input);
  }

  generateCuriosityGaps(input: HookWorkerInput = {}) {
    return this.controller.generateCuriosityGaps(input);
  }

  generateRetentionLoops(input: HookWorkerInput = {}) {
    return this.controller.generateRetentionLoops(input);
  }

  generateContinuationMoments(input: HookWorkerInput = {}) {
    return this.controller.generateContinuationMoments(input);
  }

  improvePacingRecommendations(input: HookWorkerInput = {}) {
    return this.controller.improvePacingRecommendations(input);
  }

  improveAudienceEngagement(input: HookWorkerInput = {}) {
    return this.controller.improveAudienceEngagement(input);
  }

  generateMultipleHookAlternatives(input: HookWorkerInput = {}) {
    return this.controller.generateMultipleHookAlternatives(input);
  }

  selfReviewHookEffectiveness(input: HookWorkerInput = {}) {
    return this.controller.selfReviewHookEffectiveness(input);
  }

  produceHookReport(input: HookWorkerInput = {}) {
    return this.controller.produceHookReport(input);
  }

  submitReport(input: HookWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: HookWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getHookReports() {
    return this.controller.getManager().getHookReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestHookReportId() {
    return this.controller.getManager().getLatestHookReportId();
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
        `Hook reports: ${state.health.totalHookReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): HookWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-06",
      status: state.status,
      healthStatus: state.health.status,
      totalHookReports: state.health.totalHookReports,
      latestHookReportId: this.getLatestHookReportId(),
      lastScriptId: state.health.lastScriptId,
      lastContentFormat: state.health.lastContentFormat,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverRewriteCompleteScript: true,
      neverGenerateThumbnails: true,
      neverGenerateVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createHookWorker(
  bootstrap: EmpireBootstrapContext,
  options?: HookWorkerOptions,
) {
  return new HookWorker(bootstrap, options);
}

export function resetHookWorkerForTesting() {
  resetHkwLogsForTesting();
  resetHookSequenceForTesting();
}
