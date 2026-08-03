import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSubtitleWorkerConfiguration,
  type SubtitleWorkerConfiguration,
} from "./configuration.js";
import type { SubtitleWorkerDependencies } from "./integrations.js";
import { SUBTITLE_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetSubtitleSequenceForTesting } from "./subtitle-builder.js";
import { SubtitleManager } from "./subtitle-manager.js";
import { SubtitleWorkerController } from "./subtitle-worker-controller.js";
import { resetStwLogsForTesting } from "./stw-logging.js";
import type {
  SubtitleWorkerCockpitSnapshot,
  SubtitleWorkerInput,
  SubtitleWorkerState,
} from "./types.js";

export interface SubtitleWorkerOptions {
  configuration?: Partial<SubtitleWorkerConfiguration>;
  dependencies?: SubtitleWorkerDependencies;
}

/** Authoritative Q4-12 Subtitle Worker — captions, transcripts, timing files. */
export class SubtitleWorker {
  private initializedAt: string | null = null;
  private readonly controller: SubtitleWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SubtitleWorkerOptions = {},
  ) {
    const manager = new SubtitleManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new SubtitleWorkerController(
      manager,
      buildSubtitleWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SUBTITLE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Subtitle Worker")) {
      throw new Error(`${SUBTITLE_WORKER_SYSTEM_PATH} missing — Q4-12 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SubtitleWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): SubtitleWorkerState {
    if (!this.initializedAt) {
      throw new Error("Subtitle Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-STW-001",
      missionId: "Q4-12",
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
        totalSubtitleReports: engineRecord?.totalSubtitleReports ?? 0,
        lastSubtitleReportId: engineRecord?.lastSubtitleReportId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastVideoId: engineRecord?.lastVideoId ?? null,
        lastLanguage: engineRecord?.lastLanguage ?? null,
        lastExportCount: engineRecord?.lastExportCount ?? null,
        notes: [
          "Subtitle-only: does not rewrite scripts, assemble videos, publish content, override Pillow or Grand King, or implement Q4-13 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedScripts(input: SubtitleWorkerInput = {}) {
    return this.controller.receiveApprovedScripts(input);
  }

  receiveApprovedVoiceAssets(input: SubtitleWorkerInput = {}) {
    return this.controller.receiveApprovedVoiceAssets(input);
  }

  generateCompleteTranscripts(input: SubtitleWorkerInput = {}) {
    return this.controller.generateCompleteTranscripts(input);
  }

  generateSynchronizedCaptions(input: SubtitleWorkerInput = {}) {
    return this.controller.generateSynchronizedCaptions(input);
  }

  generateSubtitleTiming(input: SubtitleWorkerInput = {}) {
    return this.controller.generateSubtitleTiming(input);
  }

  supportMultipleSubtitleLanguages(input: SubtitleWorkerInput = {}) {
    return this.controller.supportMultipleSubtitleLanguages(input);
  }

  validateSubtitleTimingAccuracy(input: SubtitleWorkerInput = {}) {
    return this.controller.validateSubtitleTimingAccuracy(input);
  }

  detectSynchronizationIssues(input: SubtitleWorkerInput = {}) {
    return this.controller.detectSynchronizationIssues(input);
  }

  produceExportableSubtitleFiles(input: SubtitleWorkerInput = {}) {
    return this.controller.produceExportableSubtitleFiles(input);
  }

  produceSubtitleReport(input: SubtitleWorkerInput = {}) {
    return this.controller.produceSubtitleReport(input);
  }

  submitReport(input: SubtitleWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: SubtitleWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getSubtitleReports() {
    return this.controller.getManager().getSubtitleReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestSubtitleReportId() {
    return this.controller.getManager().getLatestSubtitleReportId();
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
        `Subtitle reports: ${state.health.totalSubtitleReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SubtitleWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-12",
      status: state.status,
      healthStatus: state.health.status,
      totalSubtitleReports: state.health.totalSubtitleReports,
      latestSubtitleReportId: this.getLatestSubtitleReportId(),
      lastScriptId: state.health.lastScriptId,
      lastVideoId: state.health.lastVideoId,
      lastLanguage: state.health.lastLanguage,
      lastExportCount: state.health.lastExportCount,
      workerId: state.configuration.workerId,
      neverRewriteScripts: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createSubtitleWorker(
  bootstrap: EmpireBootstrapContext,
  options?: SubtitleWorkerOptions,
) {
  return new SubtitleWorker(bootstrap, options);
}

export function resetSubtitleWorkerForTesting() {
  resetStwLogsForTesting();
  resetSubtitleSequenceForTesting();
}
