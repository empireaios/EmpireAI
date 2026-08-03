import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildVoiceWorkerConfiguration,
  type VoiceWorkerConfiguration,
} from "./configuration.js";
import type { VoiceWorkerDependencies } from "./integrations.js";
import { VOICE_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  VoiceWorkerCockpitSnapshot,
  VoiceWorkerInput,
  VoiceWorkerState,
} from "./types.js";
import { resetVoiceSequenceForTesting } from "./voice-builder.js";
import { VoiceManager } from "./voice-manager.js";
import { VoiceWorkerController } from "./voice-worker-controller.js";
import { resetVowLogsForTesting } from "./vow-logging.js";

export interface VoiceWorkerOptions {
  configuration?: Partial<VoiceWorkerConfiguration>;
  dependencies?: VoiceWorkerDependencies;
}

/** Authoritative Q4-10 Voice Worker — narration-ready voiceovers. */
export class VoiceWorker {
  private initializedAt: string | null = null;
  private readonly controller: VoiceWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: VoiceWorkerOptions = {},
  ) {
    const manager = new VoiceManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new VoiceWorkerController(
      manager,
      buildVoiceWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      VOICE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Voice Worker")) {
      throw new Error(`${VOICE_WORKER_SYSTEM_PATH} missing — Q4-10 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: VoiceWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): VoiceWorkerState {
    if (!this.initializedAt) {
      throw new Error("Voice Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-VOW-001",
      missionId: "Q4-10",
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
        totalVoiceReports: engineRecord?.totalVoiceReports ?? 0,
        lastVoiceReportId: engineRecord?.lastVoiceReportId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastVoiceProfile: engineRecord?.lastVoiceProfile ?? null,
        lastLanguage: engineRecord?.lastLanguage ?? null,
        lastVariantCount: engineRecord?.lastVariantCount ?? null,
        notes: [
          "Voice-only: does not rewrite scripts, assemble videos, publish media, override Pillow or Grand King, or implement Q4-11 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedScripts(input: VoiceWorkerInput = {}) {
    return this.controller.receiveApprovedScripts(input);
  }

  prepareNarrationSegments(input: VoiceWorkerInput = {}) {
    return this.controller.prepareNarrationSegments(input);
  }

  configureVoiceGenerationSettings(input: VoiceWorkerInput = {}) {
    return this.controller.configureVoiceGenerationSettings(input);
  }

  supportMultipleVoiceProfiles(input: VoiceWorkerInput = {}) {
    return this.controller.supportMultipleVoiceProfiles(input);
  }

  supportMultipleLanguages(input: VoiceWorkerInput = {}) {
    return this.controller.supportMultipleLanguages(input);
  }

  controlPacingAndPronunciation(input: VoiceWorkerInput = {}) {
    return this.controller.controlPacingAndPronunciation(input);
  }

  generateVoiceoverAssets(input: VoiceWorkerInput = {}) {
    return this.controller.generateVoiceoverAssets(input);
  }

  validateVoiceQuality(input: VoiceWorkerInput = {}) {
    return this.controller.validateVoiceQuality(input);
  }

  generateAlternateVoiceVersions(input: VoiceWorkerInput = {}) {
    return this.controller.generateAlternateVoiceVersions(input);
  }

  produceVoiceReport(input: VoiceWorkerInput = {}) {
    return this.controller.produceVoiceReport(input);
  }

  submitReport(input: VoiceWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: VoiceWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getVoiceReports() {
    return this.controller.getManager().getVoiceReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestVoiceReportId() {
    return this.controller.getManager().getLatestVoiceReportId();
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
        `Voice reports: ${state.health.totalVoiceReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): VoiceWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-10",
      status: state.status,
      healthStatus: state.health.status,
      totalVoiceReports: state.health.totalVoiceReports,
      latestVoiceReportId: this.getLatestVoiceReportId(),
      lastScriptId: state.health.lastScriptId,
      lastVoiceProfile: state.health.lastVoiceProfile,
      lastLanguage: state.health.lastLanguage,
      lastVariantCount: state.health.lastVariantCount,
      workerId: state.configuration.workerId,
      neverRewriteScripts: true,
      neverAssembleVideos: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createVoiceWorker(
  bootstrap: EmpireBootstrapContext,
  options?: VoiceWorkerOptions,
) {
  return new VoiceWorker(bootstrap, options);
}

export function resetVoiceWorkerForTesting() {
  resetVowLogsForTesting();
  resetVoiceSequenceForTesting();
}
